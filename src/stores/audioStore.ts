import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface Audio {
  _id: string
  title: string
  subTitle: string
  url: string
  fileTitle: string
  thumbnail?: string
  isDownloaded?: boolean
}

// MediaError constants for better error handling
const MediaError = {
  MEDIA_ERR_ABORTED: 1,
  MEDIA_ERR_NETWORK: 2,
  MEDIA_ERR_DECODE: 3,
  MEDIA_ERR_SRC_NOT_SUPPORTED: 4
} as const

export const useAudioStore = defineStore('audio', () => {
  // Queue + selection
  const queue = ref<Audio[]>([])
  const currentIndex = ref<number>(-1)

  // Playback state
  const isPlaying = ref(false)
  const isLoading = ref(false)
  const isLoaded = ref(false)
  const loadError = ref<string | null>(null)
  const currentTime = ref(0)
  const duration = ref(0)
  const shuffle = ref(false)
  const repeat = ref<'off' | 'one' | 'all'>('off')
  const isScrubbing = ref(false)

  // Internal
  let audioEl: HTMLAudioElement | null = null
  let loadTimeoutId: ReturnType<typeof setTimeout> | null = null
  const LOAD_TIMEOUT = 30000

  const currentTrack = computed(() =>
    currentIndex.value >= 0 ? queue.value[currentIndex.value] : null
  )

  // ── URL resolver: on native, use direct URLs (no proxy needed) ──
  function resolveAudioUrl(url: string): string {
    const isNative = Capacitor.getPlatform() !== 'web'
    if (isNative) {
      // On native, use direct URL - no CORS issues
      return url
    }

    // On web, check if we need proxy for Spaces
    const SPACES_HOST = 'avd-bapuji.sfo2.digitaloceanspaces.com'
    try {
      const parsed = new URL(url)
      if (parsed.hostname === SPACES_HOST) {
        return `/spaces-proxy${parsed.pathname}${parsed.search}`
      }
    } catch {
      /* ignore */
    }
    return url
  }

  function clearLoadTimeout() {
    if (loadTimeoutId) {
      clearTimeout(loadTimeoutId)
      loadTimeoutId = null
    }
  }

  // Get or initialize the single persistent Audio element
  function getAudioElement(): HTMLAudioElement {
    if (typeof window === 'undefined') {
      throw new Error('Audio is only available in browser environments')
    }
    if (!audioEl) {
      audioEl = new window.Audio()
      audioEl.preload = 'auto'

      // On Android native, crossOrigin can cause issues - only set for web
      const isNative = Capacitor.getPlatform() !== 'web'
      if (!isNative) {
        audioEl.crossOrigin = 'anonymous'
      }

      // Synchronize play state with native events to handle system interrupts, bluetooth controls, etc.
      audioEl.onplay = () => {
        isPlaying.value = true
        updateMediaSessionState()
      }

      audioEl.onpause = () => {
        isPlaying.value = false
        updateMediaSessionState()
      }

      // Synchronize loading and buffering feedback during seeking or loading
      audioEl.onseeking = () => {
        isLoading.value = true
      }

      audioEl.onseeked = () => {
        isLoading.value = false
      }

      audioEl.onloadedmetadata = () => {
        if (audioEl) {
          duration.value = isFinite(audioEl.duration) ? audioEl.duration : 0
        }
      }

      audioEl.oncanplay = () => {
        clearLoadTimeout()
        isLoaded.value = true
        isLoading.value = false
        loadError.value = null // Clear any errors when ready
      }

      audioEl.ontimeupdate = () => {
        if (!isScrubbing.value && audioEl) {
          currentTime.value = audioEl.currentTime
          updateMediaSessionState()
        }
      }

      audioEl.onended = () => {
        isPlaying.value = false
        updateMediaSessionState()
        if (repeat.value === 'one') {
          if (audioEl) {
            audioEl.currentTime = 0
            audioEl.play().catch(() => {})
          }
        } else {
          nextTrack()
        }
      }

      audioEl.onerror = (e) => {
        clearLoadTimeout()
        isLoading.value = false
        isPlaying.value = false

        // More detailed error message
        const mediaError = audioEl?.error
        let errorMsg = 'Failed to load audio.'

        if (mediaError) {
          switch (mediaError.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              errorMsg = 'Playback aborted. Tap to retry.'
              break
            case MediaError.MEDIA_ERR_NETWORK:
              errorMsg = 'Network error. Check your connection.'
              break
            case MediaError.MEDIA_ERR_DECODE:
              errorMsg = 'Audio format not supported.'
              break
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMsg = 'Audio source unavailable.'
              break
            default:
              errorMsg = 'Playback failed. Tap to retry.'
          }
        }

        console.error('Audio error:', mediaError, e)
        loadError.value = errorMsg
      }
    }
    return audioEl
  }

  // Stops ongoing media download stream immediately
  function resetAudio() {
    if (!audioEl) return
    try {
      audioEl.pause()
      audioEl.removeAttribute('src')
      audioEl.load()
    } catch {
      /* ignore */
    }
  }

  // ── Media Session API (Android notification controls + lock screen) ──
  function setupMediaSession(track: Audio) {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.subTitle,
      artist: track.title,
      album: 'Shri Madhusudhan Bapuji',
      artwork: track.thumbnail
        ? [{ src: track.thumbnail, sizes: '512x512', type: 'image/jpeg' }]
        : []
    })
    navigator.mediaSession.setActionHandler('play', () => {
      togglePlay()
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      togglePlay()
    })
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      nextTrack()
    })
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      previousTrack()
    })
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null) seekTo(details.seekTime)
    })
  }

  function updateMediaSessionState() {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = isPlaying.value ? 'playing' : 'paused'
    if (duration.value > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration.value,
          playbackRate: 1,
          position: Math.min(currentTime.value, duration.value)
        })
      } catch {
        /* ignore */
      }
    }
  }

  // ── Core playback using HTMLAudioElement (works on Android WebView + desktop) ──
  async function prepareAudio(track: Audio) {
    // Reset/cancel any current download
    resetAudio()
    clearLoadTimeout()

    // Reset state refs
    currentTime.value = 0
    duration.value = 0
    isLoaded.value = false
    isPlaying.value = false
    loadError.value = null
    isLoading.value = true

    const el = getAudioElement()
    let audioUrl = resolveAudioUrl(track.url)

    // On native platform, check if the file is downloaded locally
    const isNativePlatform = Capacitor.getPlatform() !== 'web'
    if (isNativePlatform && track.fileTitle) {
      try {
        const filePath = `audios/${track.fileTitle}.mp3`
        let exists = false
        try {
          await Filesystem.stat({ path: filePath, directory: Directory.Data })
          exists = true
        } catch {
          /* ignore */
        }

        if (exists) {
          const fileUri = await Filesystem.getUri({
            directory: Directory.Data,
            path: filePath
          })
          audioUrl = Capacitor.convertFileSrc(fileUri.uri)
          console.log('🔊 Playing from local download:', audioUrl)
        }
      } catch (err) {
        console.warn('Failed to resolve local playback url:', err)
      }
    }

    // Set src and preload metadata
    el.src = audioUrl
    el.preload = 'metadata' // Load metadata first, then buffer on demand

    // Start loading
    try {
      el.load()
    } catch (e) {
      console.warn('Audio load() failed:', e)
    }

    // Set a shorter timeout for initial load
    loadTimeoutId = setTimeout(() => {
      if (isLoading.value && !isLoaded.value) {
        clearLoadTimeout()
        isLoading.value = false
        loadError.value = 'Loading timed out. Tap to retry.'
      }
    }, LOAD_TIMEOUT)

    // Wait for canplay event (enough data buffered to start playback)
    return new Promise<void>((resolve) => {
      const onCanPlay = async () => {
        clearLoadTimeout()
        el.removeEventListener('canplay', onCanPlay)
        el.removeEventListener('error', onError)

        try {
          await el.play()
          isLoaded.value = true
          isLoading.value = false
          setupMediaSession(track)
          updateMediaSessionState()
          resolve()
        } catch (e: unknown) {
          isLoading.value = false
          isPlaying.value = false
          if (e instanceof Error && e.name === 'NotAllowedError') {
            // Audio loaded but not playing — user must tap play
            isLoaded.value = true
            loadError.value = null
          } else {
            loadError.value = 'Playback failed. Tap to retry.'
          }
          resolve()
        }
      }

      const onError = () => {
        clearLoadTimeout()
        el.removeEventListener('canplay', onCanPlay)
        el.removeEventListener('error', onError)
        isLoading.value = false
        isPlaying.value = false
        loadError.value = 'Failed to load audio. Tap to retry.'
        resolve()
      }

      el.addEventListener('canplay', onCanPlay, { once: true })
      el.addEventListener('error', onError, { once: true })
    })
  }

  // ── Public API ──

  async function playSong(track: Audio) {
    // Same track → toggle play/pause
    if (currentTrack.value?._id === track._id) {
      await togglePlay()
      return
    }

    // Find in queue and set index — do NOT mutate queue here
    const idx = queue.value.findIndex((t) => t._id === track._id)
    if (idx === -1) {
      // Track not in queue (e.g. called directly) — add it
      queue.value = [track]
      currentIndex.value = 0
    } else {
      currentIndex.value = idx
    }

    await prepareAudio(track)
  }

  async function togglePlay() {
    const el = getAudioElement()
    if (!el || !currentTrack.value) return

    try {
      if (el.paused) {
        await el.play()
      } else {
        el.pause()
      }
    } catch {
      loadError.value = 'Playback control failed.'
    }
  }

  async function stopSong() {
    clearLoadTimeout()
    resetAudio()
    queue.value = []
    currentIndex.value = -1
    isPlaying.value = false
    isLoading.value = false
    isLoaded.value = false
    currentTime.value = 0
    duration.value = 0
    loadError.value = null
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none'
    }
  }

  async function seekTo(time: number) {
    if (!currentTrack.value) return
    const el = getAudioElement()
    const readyState = el.readyState ?? 0
    if (readyState < 1) return
    try {
      el.currentTime = time
      currentTime.value = time
      updateMediaSessionState()
    } catch (e) {
      console.warn('Seek failed:', e)
    }
  }

  // Replace the queue without affecting current playback
  function setQueue(tracks: Audio[]) {
    const playingId = currentTrack.value?._id
    queue.value = tracks
    if (playingId) {
      const idx = tracks.findIndex((t) => t._id === playingId)
      currentIndex.value = idx >= 0 ? idx : -1
    }
  }

  async function nextTrack() {
    if (queue.value.length === 0) return
    let next: number
    if (shuffle.value) {
      next = Math.floor(Math.random() * queue.value.length)
    } else {
      next = currentIndex.value + 1
      if (next >= queue.value.length) {
        if (repeat.value === 'all') next = 0
        else {
          // End of queue, stop playback
          isPlaying.value = false
          return
        }
      }
    }
    currentIndex.value = next
    const track = queue.value[next]
    if (track) {
      loadError.value = null // Clear any previous errors
      await prepareAudio(track)
    }
  }

  async function previousTrack() {
    if (queue.value.length === 0) return
    const el = getAudioElement()
    // If more than 3s in, restart current track
    if (currentTime.value > 3 && el) {
      try {
        el.currentTime = 0
        currentTime.value = 0
      } catch {
        /* ignore */
      }
      return
    }
    const prev = currentIndex.value - 1 >= 0 ? currentIndex.value - 1 : queue.value.length - 1
    currentIndex.value = prev
    const track = queue.value[prev]
    if (track) {
      loadError.value = null // Clear any previous errors
      await prepareAudio(track)
    }
  }

  function toggleShuffle() {
    shuffle.value = !shuffle.value
  }

  function toggleRepeat() {
    if (repeat.value === 'off') repeat.value = 'all'
    else if (repeat.value === 'all') repeat.value = 'one'
    else repeat.value = 'off'
  }

  function updateCurrentThumbnail(thumbnail: string) {
    if (!currentTrack.value || !thumbnail) return
    const idx = queue.value.findIndex((t) => t._id === currentTrack.value!._id)
    if (idx >= 0) {
      queue.value[idx] = { ...queue.value[idx], thumbnail }
      // Update media session artwork too
      if ('mediaSession' in navigator && navigator.mediaSession.metadata) {
        navigator.mediaSession.metadata.artwork = [
          { src: thumbnail, sizes: '512x512', type: 'image/jpeg' }
        ]
      }
    }
  }

  // Prefetch — no-op on web (browser handles buffering), kept for API compat
  async function prefetchTrack(_: Audio): Promise<void> {
    /* no-op */
  }

  return {
    queue,
    currentIndex,
    currentTrack,
    isPlaying,
    isLoading,
    isLoaded,
    loadError,
    currentTime,
    duration,
    shuffle,
    repeat,
    isScrubbing,
    playSong,
    togglePlay,
    stopSong,
    seekTo,
    prefetchTrack,
    setQueue,
    toggleShuffle,
    toggleRepeat,
    nextTrack,
    previousTrack,
    updateCurrentThumbnail
  }
})

// Cleanup on page unload — call destroyAudio directly (avoids circular re-import)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    try {
      // audioEl and clearLoadTimeout are module-scoped in each store instance;
      // we trigger cleanup via the Pinia store if already initialised
      const pinia = (window as any).__pinia
      if (pinia) {
        const stores = (pinia as any)._s
        const audioStore = stores?.get('audio')
        if (audioStore) audioStore.stopSong()
      }
    } catch {
      /* ignore */
    }
  })
}
