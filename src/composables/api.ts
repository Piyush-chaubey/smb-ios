import { CapacitorHttp } from '@capacitor/core'
import { z } from 'zod'

const darshanChildSchema = z.object({
  id: z.string(),
  media_url: z.string(),
  media_type: z.string()
})

const darshanMediaSchema = z.object({
  id: z.string(),
  media_type: z.string(),
  media_url: z.string(),
  caption: z.string().optional(),
  created_time: z.string().optional(),
  children: z.object({ data: z.array(darshanChildSchema) }).optional()
})

const darshanResponseSchema = z.object({
  data: z.array(darshanMediaSchema),
  paging: z.object({ next: z.string().url().optional() }).optional()
})

const audioDocSchema = z
  .object({
    _id: z.string(),
    title: z.string(),
    subTitle: z.string(),
    url: z.string().url(),
    fileTitle: z.string(),
    thumbnail: z.string().optional(),
    isDownloaded: z.boolean().optional()
  })
  .passthrough()

const audioResponseSchema = z.object({
  docs: z.array(audioDocSchema),
  total: z.number().optional()
})

export type DarshanMedia = z.infer<typeof darshanMediaSchema>
export type DarshanResponse = z.infer<typeof darshanResponseSchema>
export type AudioDoc = z.infer<typeof audioDocSchema>
export type AudioResponse = z.infer<typeof audioResponseSchema>

const getFacebookDailyDarshanUrl = (nextUrl?: string, token?: string) =>
  nextUrl ||
  `https://graph.facebook.com/v19.0/17841451565360946/media?fields=id,media_type,media_url,caption,created_time,children{media_url,media_type}&limit=6&access_token=${token}`

function toError(error: unknown) {
  if (error instanceof Error) return error
  try {
    return new Error(JSON.stringify(error))
  } catch {
    return new Error('Unknown error')
  }
}

export function useApi() {
  const baseUrl = import.meta.env.VITE_BASE_SERVER_URL || ''
  const fbToken = import.meta.env.VITE_FB_TOKEN || ''
  const allAudioUrl = `${baseUrl}/lectures/audio`

  async function getDailyDarshan(nextUrl?: string) {
    const url = getFacebookDailyDarshanUrl(nextUrl, fbToken)

    // On native platform, use CapacitorHttp which handles CORS and network security
    const isNative =
      typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()

    if (!isNative) {
      // Web platform - use fetch
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } })
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        const json = await res.json()
        const parsed = darshanResponseSchema.safeParse(json)
        if (!parsed.success)
          throw new Error(`DailyDarshan validation failed: ${parsed.error.message}`)
        return parsed.data
      } catch (error) {
        throw toError(error)
      }
    }

    // Native platform - use CapacitorHttp with extended timeouts
    try {
      const response = await CapacitorHttp.request({
        url,
        method: 'GET',
        responseType: 'json',
        readTimeout: 60000,
        connectTimeout: 30000,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'ShriMadhusudhanBapuji/1.0 (Android)'
        }
      })

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: Failed to fetch darshan`)
      }

      if (!response.data) {
        throw new Error('Empty Facebook response payload')
      }

      const parsed = darshanResponseSchema.safeParse(response.data)
      if (!parsed.success) {
        console.error('Validation error:', parsed.error)
        throw new Error(`DailyDarshan validation failed: ${parsed.error.message}`)
      }

      return parsed.data
    } catch (error) {
      console.error('❌ getDailyDarshan Native Error:', error)
      throw toError(error)
    }
  }

  async function getAllAudio(page: number, limit: number, search = '') {
    if (!baseUrl) {
      throw new Error('VITE_BASE_SERVER_URL is not configured')
    }

    const url = `${allAudioUrl}?page=${page}&limit=${limit}${
      search ? `&search=${encodeURIComponent(search)}` : ''
    }`

    const isNative =
      typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()

    try {
      const response = await CapacitorHttp.request({
        url,
        method: 'GET',
        responseType: 'json',
        readTimeout: 45000,
        connectTimeout: 30000,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'ShriMadhusudhanBapuji/1.0 (Android)'
        }
      })

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: Failed to fetch audio`)
      }

      if (!response.data) {
        throw new Error('Empty audio response payload')
      }

      const parsed = audioResponseSchema.safeParse(response.data)
      if (!parsed.success) {
        console.error('Audio validation error:', parsed.error)
        throw new Error(`Audio response validation failed: ${parsed.error.message}`)
      }

      return parsed.data
    } catch (error) {
      console.error('❌ getAllAudio Error:', error)
      const fallbackError = toError(error)

      // Fallback to fetch only on web
      if (!isNative && typeof window !== 'undefined') {
        try {
          const fallback = await fetch(url)
          if (!fallback.ok) throw new Error(`HTTP ${fallback.status}`)
          const json = await fallback.json()
          const parsed = audioResponseSchema.safeParse(json)
          if (parsed.success) {
            return parsed.data
          }
          console.warn('Fallback audio validation failed', parsed.error.message)
        } catch (fallback) {
          console.error('🎵 Audio fallback failed:', fallback)
        }
      }
      throw fallbackError
    }
  }

  return { getDailyDarshan, getAllAudio }
}
