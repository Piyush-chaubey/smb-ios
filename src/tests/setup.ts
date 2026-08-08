/**
 * Global test setup — runs before every test file.
 *
 * Mocks browser APIs that are unavailable in jsdom:
 * - localStorage (already available in jsdom, but we ensure it's clean)
 * - window.Capacitor (native platform detection)
 * - navigator.mediaSession (Media Session API)
 * - window.Audio (HTMLAudioElement)
 */
import { afterEach, beforeEach, vi } from 'vitest'

// ── Capacitor mock ──────────────────────────────────────────────────────────
// Tests always run as "web" platform so native-only branches are skipped
;(globalThis as Record<string, unknown>).Capacitor = {
  getPlatform: () => 'web',
  isNativePlatform: () => false,
  isPluginAvailable: () => false
}

// ── MediaSession API mock ───────────────────────────────────────────────────
Object.defineProperty(navigator, 'mediaSession', {
  value: {
    metadata: null,
    playbackState: 'none' as MediaSessionPlaybackState,
    setActionHandler: vi.fn(),
    setPositionState: vi.fn()
  },
  writable: true
})

// ── HTMLAudioElement mock ───────────────────────────────────────────────────
// jsdom doesn't implement HTMLAudioElement.play()/pause() with real audio,
// so we replace it with a controllable mock.
class MockAudio {
  src = ''
  preload = ''
  currentTime = 0
  duration = 60
  paused = true
  readyState = 4
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  ontimeupdate: (() => void) | null = null
  onloadedmetadata: (() => void) | null = null
  oncanplay: (() => void) | null = null

  play = vi.fn().mockResolvedValue(undefined)
  pause = vi.fn()
  load = vi.fn()

  listeners: Record<string, Set<(...args: any[]) => void>> = {}

  addEventListener = vi.fn((event: string, callback: (...args: any[]) => void) => {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set()
    }
    this.listeners[event].add(callback)

    // Automatically trigger 'canplay' event in tests to allow prepareAudio's promise to resolve
    if (event === 'canplay') {
      setTimeout(() => callback(), 0)
    }
  })

  removeEventListener = vi.fn((event: string, callback: (...args: any[]) => void) => {
    if (this.listeners[event]) {
      this.listeners[event].delete(callback)
    }
  })
}

;(globalThis as Record<string, unknown>).Audio = MockAudio

// ── localStorage cleanup ────────────────────────────────────────────────────
beforeEach(() => {
  localStorage.clear()
})

// ── Restore all mocks after each test ─────────────────────────────────────
afterEach(() => {
  vi.restoreAllMocks()
})
