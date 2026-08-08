/**
 * Unit tests for audioStore — covers core playback logic.
 *
 * Uses a Pinia test instance with the MockAudio element from setup.ts.
 */
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { type Audio, useAudioStore } from '@/stores/audioStore'

// Sample audio tracks for testing
const trackA: Audio = {
  _id: 'track-a',
  title: 'Raag Bhairavi',
  subTitle: 'Shri Madhusudhan Kirtan',
  url: 'https://example.com/track-a.mp3',
  fileTitle: 'raag-bhairavi'
}

const trackB: Audio = {
  _id: 'track-b',
  title: 'Raag Yaman',
  subTitle: 'Evening Bhajan',
  url: 'https://example.com/track-b.mp3',
  fileTitle: 'raag-yaman'
}

const trackC: Audio = {
  _id: 'track-c',
  title: 'Raag Desh',
  subTitle: 'Morning Bhajan',
  url: 'https://example.com/track-c.mp3',
  fileTitle: 'raag-desh'
}

describe('audioStore', () => {
  beforeEach(() => {
    // Fresh Pinia instance for every test — prevents state leakage
    setActivePinia(createPinia())
  })

  // ── Initial state ────────────────────────────────────────────────────────

  it('has correct initial state', () => {
    const store = useAudioStore()
    expect(store.queue).toEqual([])
    expect(store.currentIndex).toBe(-1)
    expect(store.currentTrack).toBeNull()
    expect(store.isPlaying).toBe(false)
    expect(store.isLoading).toBe(false)
    expect(store.shuffle).toBe(false)
    expect(store.repeat).toBe('off')
  })

  // ── playSong ─────────────────────────────────────────────────────────────

  it('playSong: sets currentIndex when track is in queue', async () => {
    const store = useAudioStore()
    store.setQueue([trackA, trackB, trackC])
    await store.playSong(trackB)
    expect(store.currentIndex).toBe(1)
    expect(store.currentTrack?._id).toBe('track-b')
  })

  it('playSong: adds track to queue if not present', async () => {
    const store = useAudioStore()
    await store.playSong(trackA)
    expect(store.queue.length).toBe(1)
    expect(store.queue[0]._id).toBe('track-a')
    expect(store.currentIndex).toBe(0)
  })

  // ── setQueue ──────────────────────────────────────────────────────────────

  it('setQueue: updates queue and preserves current index', async () => {
    const store = useAudioStore()
    await store.playSong(trackA)
    store.setQueue([trackC, trackA, trackB])
    // trackA is now at index 1
    expect(store.currentIndex).toBe(1)
  })

  it('setQueue: sets currentIndex to -1 if playing track is removed', async () => {
    const store = useAudioStore()
    await store.playSong(trackA)
    store.setQueue([trackB, trackC])
    expect(store.currentIndex).toBe(-1)
  })

  // ── seekTo ────────────────────────────────────────────────────────────────

  it('seekTo: does nothing when no audio is loaded', async () => {
    const store = useAudioStore()
    await store.seekTo(30)
    // Should not throw — just a no-op
    expect(store.currentTime).toBe(0)
  })

  it('seekTo: updates currentTime after a song is playing', async () => {
    const store = useAudioStore()
    await store.playSong(trackA)
    await store.seekTo(42)
    expect(store.currentTime).toBe(42)
  })

  // ── nextTrack / previousTrack ─────────────────────────────────────────────

  it('nextTrack: advances to the next track', async () => {
    const store = useAudioStore()
    store.setQueue([trackA, trackB, trackC])
    await store.playSong(trackA)
    await store.nextTrack()
    expect(store.currentIndex).toBe(1)
    expect(store.currentTrack?._id).toBe('track-b')
  })

  it('nextTrack: does nothing at the end of queue without repeat', async () => {
    const store = useAudioStore()
    store.setQueue([trackA, trackB])
    await store.playSong(trackB)
    await store.nextTrack()
    // Still on trackB (index 1)
    expect(store.currentIndex).toBe(1)
  })

  it('nextTrack: wraps to start when repeat=all', async () => {
    const store = useAudioStore()
    store.setQueue([trackA, trackB])
    store.repeat = 'all'
    await store.playSong(trackB)
    await store.nextTrack()
    expect(store.currentIndex).toBe(0)
    expect(store.currentTrack?._id).toBe('track-a')
  })

  it('previousTrack: goes to previous track', async () => {
    const store = useAudioStore()
    store.setQueue([trackA, trackB, trackC])
    await store.playSong(trackC)
    await store.previousTrack()
    expect(store.currentIndex).toBe(1)
    expect(store.currentTrack?._id).toBe('track-b')
  })

  // ── toggleShuffle / toggleRepeat ─────────────────────────────────────────

  it('toggleShuffle: flips shuffle state', () => {
    const store = useAudioStore()
    expect(store.shuffle).toBe(false)
    store.toggleShuffle()
    expect(store.shuffle).toBe(true)
    store.toggleShuffle()
    expect(store.shuffle).toBe(false)
  })

  it('toggleRepeat: cycles off → all → one → off', () => {
    const store = useAudioStore()
    expect(store.repeat).toBe('off')
    store.toggleRepeat()
    expect(store.repeat).toBe('all')
    store.toggleRepeat()
    expect(store.repeat).toBe('one')
    store.toggleRepeat()
    expect(store.repeat).toBe('off')
  })

  // ── stopSong ──────────────────────────────────────────────────────────────

  it('stopSong: resets all playback state', async () => {
    const store = useAudioStore()
    await store.playSong(trackA)
    await store.stopSong()
    expect(store.queue).toEqual([])
    expect(store.currentIndex).toBe(-1)
    expect(store.currentTrack).toBeNull()
    expect(store.isPlaying).toBe(false)
    expect(store.currentTime).toBe(0)
    expect(store.duration).toBe(0)
  })

  // ── updateCurrentThumbnail ────────────────────────────────────────────────

  it('updateCurrentThumbnail: updates thumbnail on the current track in queue', async () => {
    const store = useAudioStore()
    store.setQueue([trackA, trackB])
    await store.playSong(trackA)
    store.updateCurrentThumbnail('https://example.com/thumb.jpg')
    expect(store.queue[0].thumbnail).toBe('https://example.com/thumb.jpg')
  })
})
