import { CapacitorHttp } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { ref } from 'vue'

interface ThumbnailResponse {
  thumbnails: string[]
}

const THUMBNAIL_URL =
  'https://gist.githubusercontent.com/Piyush-chaubey/75a5420f8c5db0d66c66597f0b9fce4d/raw/8a860ac5d05fdfcfb517dfd1eb6ea493eee10b92/thumbnails.json'

const thumbnails = ref<string[]>([])
const isFetching = ref(false)
const localCache = ref<Record<string, string>>({})
const failedUrls = ref<Set<string>>(new Set())

function computeThumb(id: string) {
  if (!thumbnails.value || thumbnails.value.length === 0) return ''
  const hash = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return thumbnails.value[hash % thumbnails.value.length]
}

function bufferToBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf)
  const CHUNK = 8192
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

export function useThumbnails() {
  const getThumb = (id: string): string => {
    if (!id) return ''
    if (localCache.value[id]) return localCache.value[id]
    if (thumbnails.value.length === 0) return ''
    return computeThumb(id)
  }

  const fetchThumbnails = async () => {
    if (thumbnails.value.length > 0 || isFetching.value) return
    isFetching.value = true

    const isNative =
      typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()

    try {
      let data: ThumbnailResponse

      if (isNative) {
        // Use CapacitorHttp on native for better compatibility
        const response = await CapacitorHttp.request({
          url: THUMBNAIL_URL,
          method: 'GET',
          responseType: 'json',
          headers: {
            Accept: 'application/json'
          }
        })

        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}`)
        }
        data = response.data as ThumbnailResponse
      } else {
        // Use fetch on web
        const response = await fetch(THUMBNAIL_URL, {
          method: 'GET',
          headers: {
            Accept: 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        data = await response.json()
      }

      if (Array.isArray(data.thumbnails) && data.thumbnails.length > 0) {
        // Add query parameter to force fresh images and help with CORS
        thumbnails.value = data.thumbnails.map((url) => `${url}?auto=compress&cs=tinysrgb&w=400`)
        console.log('✅ Thumbnails loaded:', thumbnails.value.length)
      } else {
        console.warn('No thumbnails in response')
      }
    } catch (error) {
      console.error('Failed to fetch thumbnails:', error)
    } finally {
      isFetching.value = false
    }
  }

  async function ensureThumbnail(id: string) {
    if (!id) return ''
    // return cached local path if present
    if (localCache.value[id]) return localCache.value[id]

    // compute remote candidate
    const remote = computeThumb(id)
    if (!remote) return ''

    // If this URL has failed before, don't try again
    if (failedUrls.value.has(remote)) {
      return ''
    }

    const isNative =
      typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()

    try {
      if (isNative) {
        // Use CapacitorHttp for native - better Android compatibility
        const resp = await CapacitorHttp.request({
          url: remote,
          method: 'GET',
          responseType: 'blob',
          readTimeout: 30000,
          connectTimeout: 15000,
          headers: {
            Accept: 'image/*'
          }
        })

        if (resp.status !== 200) {
          console.warn(`Image fetch failed for ${id}: HTTP ${resp.status}`)
          failedUrls.value.add(remote)
          return ''
        }

        // Convert blob to base64
        const base64 = resp.data
        const ext = remote.split('.').pop()?.split('?')[0] || 'jpg'
        const fileName = `thumbnails/${id}.${ext}`

        try {
          // Ensure directory exists
          await Filesystem.mkdir({
            path: 'thumbnails',
            directory: Directory.Cache,
            recursive: true
          })
        } catch {
          /* directory might exist */
        }

        // Write to cache
        await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache
        })

        const uriResult = await Filesystem.getUri({
          path: fileName,
          directory: Directory.Cache
        })

        // Use Capacitor URL which works better on Android
        const localPath =
          (window as any).Capacitor?.convertFileSrc?.(uriResult.uri) || uriResult.uri
        localCache.value[id] = localPath

        try {
          const { useAudioStore } = await import('@/stores/audioStore')
          const audioStore = useAudioStore()
          if (audioStore.currentTrack && audioStore.currentTrack._id === id) {
            audioStore.updateCurrentThumbnail(localPath)
          }
        } catch {
          /* ignore */
        }

        return localPath
      } else {
        // Web platform - use fetch and convert to data URL
        const resp = await fetch(remote, {
          method: 'GET',
          headers: {
            Accept: 'image/*'
          },
          mode: 'cors',
          cache: 'default'
        })

        if (!resp.ok) {
          console.warn(`Image fetch failed for ${id}: HTTP ${resp.status}`)
          failedUrls.value.add(remote)
          return ''
        }

        const arr = await resp.arrayBuffer()
        const base64 = bufferToBase64(arr)
        const ext = remote.split('.').pop()?.split('?')[0] || 'jpg'
        const dataUrl = `data:image/${ext};base64,${base64}`
        localCache.value[id] = dataUrl

        try {
          const { useAudioStore } = await import('@/stores/audioStore')
          const audioStore = useAudioStore()
          if (audioStore.currentTrack && audioStore.currentTrack._id === id) {
            audioStore.updateCurrentThumbnail(dataUrl)
          }
        } catch {
          /* ignore */
        }

        return dataUrl
      }
    } catch (error) {
      console.warn('Thumbnail prefetch failed for', id, error)
      failedUrls.value.add(remote)
      return ''
    }
  }

  return {
    thumbnails,
    isFetching,
    fetchThumbnails,
    getThumb,
    ensureThumbnail,
    localCache
  }
}
