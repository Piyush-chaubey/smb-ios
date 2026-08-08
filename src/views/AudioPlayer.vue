<script setup lang="ts">
import { App } from '@capacitor/app'
import { Directory, Filesystem } from '@capacitor/filesystem'
import {
  Check,
  ChevronDown,
  Download,
  Heart,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward
} from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { useFavorites } from '@/composables/useFavorites'
import { useThumbnails } from '@/composables/useThumbnails'

import { IonContent, IonPage, IonRange, modalController } from '@ionic/vue'

import { useAudioStore } from '../stores/audioStore'

const store = useAudioStore()
const { toggleFavorite, isFav, loadFavorites } = useFavorites()
const { getThumb } = useThumbnails()

const isScrubbing = ref(false)
const localTime = ref(0)
const isClosing = ref(false)
let backButtonListener: any = null

const audio = computed(() => store.currentTrack)
const thumb = computed(() => {
  if (!audio.value) return null
  return audio.value.thumbnail || getThumb(audio.value._id) || null
})

const isPlaying = computed(() => store.isPlaying)
const isLoading = computed(() => store.isLoading)
const isLoaded = computed(() => store.isLoaded)
const loadError = computed(() => store.loadError)
const duration = computed(() => store.duration)
const shuffle = computed(() => store.shuffle)
const repeat = computed(() => store.repeat)
const isFavorite = computed(() => (audio.value?._id ? isFav(audio.value._id) : false))
const queue = computed(() => store.queue)
const currentIndex = computed(() => store.currentIndex)

onMounted(async () => {
  loadFavorites()
  localTime.value = store.currentTime

  backButtonListener = await App.addListener('backButton', async () => {
    if (isClosing.value) return
    isClosing.value = true
    try {
      await modalController.dismiss()
    } catch {
      /* already gone */
    }
  })
})

onBeforeUnmount(() => {
  backButtonListener?.remove()
  backButtonListener = null
})

watch(
  () => store.currentTime,
  (val: number) => {
    if (!isScrubbing.value) localTime.value = val
  }
)

const fmt = (s: number) => {
  if (!s || isNaN(s) || s < 0) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

const togglePlay = () => {
  if (!isLoading.value) store.togglePlay()
}

const onRangeStart = () => {
  isScrubbing.value = true
}

const onRangeEnd = (e: any) => {
  store.seekTo(parseFloat(e.detail.value))
  setTimeout(() => {
    isScrubbing.value = false
  }, 100)
}

const onInput = (e: any) => {
  localTime.value = parseFloat(e.detail.value)
}

const close = async () => {
  if (isClosing.value) return
  isClosing.value = true
  try {
    await modalController.dismiss()
  } catch {
    /* already gone */
  }
}

const stopAndClose = async () => {
  if (isClosing.value) return
  isClosing.value = true
  await store.stopSong()
  try {
    await modalController.dismiss()
  } catch {
    /* already gone */
  }
}

const toggleFav = () => {
  if (audio.value?._id) toggleFavorite(audio.value._id)
}

const playFromQueue = async (index: number) => {
  const track = queue.value[index]
  if (track) await store.playSong(track)
}

function getQueueThumb(id: string, thumbnail?: string) {
  return thumbnail || getThumb(id) || null
}

const isDownloaded = ref(false)
const isDownloading = ref(false)
const downloadProgress = ref(0)
let playerProgressListener: any = null

async function setupPlayerProgressListener() {
  if (playerProgressListener) return
  const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()
  if (!isNative) return

  try {
    playerProgressListener = await Filesystem.addListener('progress', (event: any) => {
      if (!audio.value) return
      const url = event.url
      const path = event.path
      if (
        audio.value.url === url ||
        url?.includes(encodeURIComponent(audio.value.fileTitle)) ||
        path?.includes(audio.value.fileTitle)
      ) {
        downloadProgress.value =
          event.contentLength > 0 ? Math.round((event.bytes / event.contentLength) * 100) : 0
      }
    })
  } catch (err) {
    console.warn('Could not register player progress listener:', err)
  }
}

async function checkDownloadStatus() {
  if (!audio.value) return
  isDownloaded.value = await checkIfDownloaded(audio.value.fileTitle)
}

async function checkIfDownloaded(title: string): Promise<boolean> {
  if (typeof window !== 'undefined' && !(window as any).Capacitor?.isNativePlatform?.()) {
    return false
  }
  try {
    await Filesystem.stat({ path: `audios/${title}.mp3`, directory: Directory.Data })
    return true
  } catch {
    return false
  }
}

async function toggleDownload() {
  if (!audio.value) return
  const track = audio.value

  const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()
  if (!isNative) {
    // Web download logic
    try {
      const response = await fetch(track.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${track.subTitle || track.fileTitle}.mp3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Web download error:', err)
    }
    return
  }

  if (isDownloaded.value) {
    // Delete local file
    try {
      await Filesystem.deleteFile({
        path: `audios/${track.fileTitle}.mp3`,
        directory: Directory.Data
      })
      isDownloaded.value = false
      track.isDownloaded = false
    } catch (err) {
      console.error('Delete error:', err)
    }
  } else {
    // Download remote file
    try {
      isDownloading.value = true
      downloadProgress.value = 0
      await setupPlayerProgressListener()

      // Ensure local audios directory exists
      try {
        await Filesystem.mkdir({
          path: 'audios',
          directory: Directory.Data,
          recursive: true
        })
      } catch (dirErr) {
        // Directory might already exist
      }

      await Filesystem.downloadFile({
        url: track.url,
        path: `audios/${track.fileTitle}.mp3`,
        directory: Directory.Data,
        progress: true
      })

      isDownloaded.value = true
      track.isDownloaded = true
      isDownloading.value = false
    } catch (err) {
      console.error('Download error:', err)
      isDownloading.value = false
    }
  }
}

watch(
  audio,
  () => {
    checkDownloadStatus()
  },
  { immediate: true }
)
</script>

<template>
  <ion-page class="player-page">
    <!-- Sticky header -->
    <div class="p-header">
      <button class="p-hdr-btn" @click="close">
        <ChevronDown :size="28" />
      </button>
      <span class="p-hdr-title">NOW PLAYING</span>
      <div class="p-hdr-spacer"></div>
    </div>

    <!-- Single scrollable content -->
    <ion-content :scroll-y="true" class="p-content">
      <div class="p-scroll-body" :class="{ closing: isClosing }">
        <!-- â”€â”€ Album art â”€â”€ -->
        <div class="p-art-wrap">
          <img v-if="thumb" :src="thumb" class="p-art" :class="{ playing: isPlaying }" alt="" />
          <div v-else class="p-art p-art-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M9 18V5l12-2v13" stroke="#555" stroke-width="1.5" stroke-linecap="round" />
              <circle cx="6" cy="18" r="3" stroke="#555" stroke-width="1.5" />
              <circle cx="18" cy="16" r="3" stroke="#555" stroke-width="1.5" />
            </svg>
          </div>

          <div v-if="isLoading" class="p-overlay">
            <div class="p-spinner"></div>
          </div>

          <div v-if="loadError && !isLoading" class="p-overlay p-overlay-err">
            <p class="p-overlay-text">{{ loadError }}</p>
            <button class="p-overlay-btn" @click="togglePlay">Retry</button>
            <button class="p-overlay-btn" @click="stopAndClose">Close</button>
          </div>
        </div>

        <!-- —— Track info —— -->
        <div class="p-info-row">
          <div class="p-meta">
            <div class="p-title">{{ audio?.subTitle ?? '' }}</div>
            <div class="p-artist">{{ audio?.title ?? '' }}</div>
          </div>
          <div class="p-actions">
            <button
              class="p-download-btn"
              @click="toggleDownload"
              v-if="audio"
              title="Download"
              :disabled="isDownloading"
            >
              <svg v-if="isDownloading" class="download-circle-svg" viewBox="0 0 36 36">
                <path
                  class="circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#444"
                  stroke-width="3"
                />
                <path
                  class="circle-fill"
                  :stroke-dasharray="`${downloadProgress}, 100`"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#1db954"
                  stroke-width="3"
                />
              </svg>
              <component
                v-else
                :is="isDownloaded ? Check : Download"
                :size="24"
                :color="isDownloaded ? '#1db954' : '#b3b3b3'"
              />
            </button>
            <button class="p-fav-btn" @click="toggleFav">
              <Heart
                :size="26"
                :fill="isFavorite ? '#1db954' : 'none'"
                :color="isFavorite ? '#1db954' : 'currentColor'"
              />
            </button>
          </div>
        </div>

        <!-- â”€â”€ Seek bar â”€â”€ -->
        <div class="p-seek">
          <ion-range
            :min="0"
            :max="duration || 1"
            :value="localTime"
            :disabled="!isLoaded"
            @ion-knob-move-start="onRangeStart"
            @ion-knob-move-end="onRangeEnd"
            @ion-input="onInput"
            class="p-range"
            mode="md"
          />
          <div class="p-times">
            <span>{{ fmt(localTime) }}</span>
            <span>{{ fmt(duration) }}</span>
          </div>
        </div>

        <!-- â”€â”€ Controls â”€â”€ -->
        <div class="p-controls">
          <button class="p-ctrl p-mode" :class="{ active: shuffle }" @click="store.toggleShuffle()">
            <Shuffle :size="22" />
          </button>
          <button class="p-ctrl" @click="store.previousTrack()">
            <SkipBack :size="32" />
          </button>
          <button class="p-play" :disabled="isLoading" @click="togglePlay">
            <div v-if="isLoading" class="p-spinner-sm"></div>
            <component v-else :is="isPlaying ? Pause : Play" :size="30" fill="black" />
          </button>
          <button class="p-ctrl" @click="store.nextTrack()">
            <SkipForward :size="32" />
          </button>
          <button
            class="p-ctrl p-mode"
            :class="{ active: repeat !== 'off' }"
            @click="store.toggleRepeat()"
          >
            <Repeat :size="22" />
            <span v-if="repeat === 'one'" class="p-badge">1</span>
          </button>
        </div>

        <!-- â”€â”€ UP NEXT queue â”€â”€ -->
        <div v-if="queue.length > 0" class="queue-section">
          <div class="queue-header">
            <span class="queue-header-label">UP NEXT</span>
            <span class="queue-header-count">{{ queue.length }} songs</span>
          </div>

          <div
            v-for="(track, idx) in queue"
            :key="track._id"
            class="queue-row"
            :class="{ 'queue-row--active': idx === currentIndex }"
            @click="playFromQueue(idx)"
          >
            <!-- Thumbnail -->
            <div class="queue-art">
              <img
                v-if="getQueueThumb(track._id, track.thumbnail)"
                :src="getQueueThumb(track._id, track.thumbnail)!"
                class="queue-thumb"
                alt=""
              />
              <div v-else class="queue-thumb queue-no-thumb">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 18V5l12-2v13"
                    stroke="#555"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                  <circle cx="6" cy="18" r="3" stroke="#555" stroke-width="1.5" />
                  <circle cx="18" cy="16" r="3" stroke="#555" stroke-width="1.5" />
                </svg>
              </div>
              <!-- Animated equalizer for active track -->
              <div v-if="idx === currentIndex && isPlaying" class="eq-bars">
                <span></span><span></span><span></span>
              </div>
              <!-- Pause icon overlay when active but paused -->
              <div v-else-if="idx === currentIndex && !isPlaying" class="eq-paused">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#1db954">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              </div>
            </div>

            <!-- Meta -->
            <div class="queue-meta">
              <div class="queue-title" :class="{ 'queue-title--active': idx === currentIndex }">
                {{ track.subTitle }}
              </div>
              <div class="queue-artist">{{ track.title }}</div>
            </div>

            <!-- Active indicator -->
            <div v-if="idx === currentIndex" class="queue-active-dot"></div>
          </div>
        </div>

        <!-- Bottom safe area padding -->
        <div class="p-bottom-pad"></div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.player-page {
  --background: var(--bg-primary);
  background: var(--bg-primary);
}

/* â”€â”€ Sticky header â”€â”€ */
.p-header {
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  justify-content: space-between;
  padding: 12px 12px;
  padding-top: calc(12px + env(safe-area-inset-top, 0px));
  background: var(--bg-primary);
  position: relative;
  z-index: 10;
}

.p-hdr-btn {
  width: 44px;
  height: 44px;
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-primary);
  border-radius: 50%;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
}
.p-hdr-btn:active {
  background: var(--hover-bg);
}

.p-hdr-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.p-hdr-spacer {
  width: 44px;
}

/* â”€â”€ Scrollable content â”€â”€ */
.p-content {
  --background: var(--bg-primary);
}

.p-scroll-body {
  padding: 0 24px;
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -webkit-flex-direction: column;
  flex-direction: column;
  gap: 16px;
}

/* â”€â”€ Album art â”€â”€ */
.p-art-wrap {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 100%;
  border-radius: 16px;
  overflow: hidden;
  -webkit-flex-shrink: 0;
  flex-shrink: 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  margin-top: 8px;
}

.p-art {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
  display: block;
  -webkit-transition: -webkit-transform 0.3s ease;
  transition: transform 0.3s ease;
}
.p-art.playing {
  -webkit-transform: scale(1.02);
  transform: scale(1.02);
}

.p-art-empty {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--bg-secondary);
  border-radius: 16px;
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  justify-content: center;
}

.p-art-empty svg path,
.p-art-empty svg circle {
  stroke: var(--text-muted);
}

.p-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 16px;
  background: var(--bg-overlay);
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -webkit-flex-direction: column;
  flex-direction: column;
  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  justify-content: center;
  gap: 14px;
  color: var(--text-primary);
}
.p-overlay-err {
  background: rgba(140, 20, 20, 0.92);
  color: #fff;
}
.p-overlay-text {
  font-size: 14px;
  text-align: center;
  margin: 0;
  padding: 0 16px;
}
.p-overlay-btn {
  padding: 10px 24px;
  background: var(--hover-bg);
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
}
.p-overlay-btn:active {
  background: var(--border-primary);
}
.p-overlay-err .p-overlay-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
}

.p-spinner {
  width: 44px;
  height: 44px;
  border: 4px solid var(--border-secondary);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  -webkit-animation: spin 0.9s linear infinite;
  animation: spin 0.9s linear infinite;
}

/* â”€â”€ Track info â”€â”€ */
.p-info-row {
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  justify-content: space-between;
  gap: 8px;
}
.p-meta {
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.p-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.p-artist {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.p-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.p-fav-btn,
.p-download-btn {
  width: 44px;
  height: 44px;
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-secondary);
  -webkit-flex-shrink: 0;
  flex-shrink: 0;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
}
.p-fav-btn:active,
.p-download-btn:active {
  opacity: 0.7;
}

.download-circle-svg {
  width: 24px;
  height: 24px;
  transform: rotate(-90deg);
}

.circle-bg {
  stroke: rgba(255, 255, 255, 0.1);
}

.circle-fill {
  transition: stroke-dasharray 0.3s ease;
}

/* â”€â”€ Seek â”€â”€ */
.p-seek {
  width: 100%;
}
.p-range {
  --bar-height: 4px;
  --bar-background: var(--border-secondary);
  --bar-background-active: var(--accent-primary);
  --knob-size: 18px;
  --knob-background: var(--text-primary);
  padding: 0;
}
.p-times {
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 6px;
}

/* â”€â”€ Controls â”€â”€ */
.p-controls {
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  justify-content: space-between;
}
.p-ctrl {
  width: 52px;
  height: 52px;
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-primary);
  border-radius: 50%;
  position: relative;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
}
.p-ctrl:active {
  background: var(--hover-bg);
}
.p-mode {
  color: var(--text-secondary);
}
.p-mode.active {
  color: var(--accent-primary);
}

.p-play {
  width: 70px;
  height: 70px;
  background: var(--accent-primary);
  border: none;
  border-radius: 50%;
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  justify-content: center;
  color: #000000;
  box-shadow: 0 4px 16px rgba(255, 193, 7, 0.4);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
}
.p-play:active {
  opacity: 0.85;
}
.p-play:disabled {
  opacity: 0.5;
}

.p-spinner-sm {
  width: 26px;
  height: 26px;
  border: 3px solid rgba(0, 0, 0, 0.15);
  border-top-color: #000000;
  border-radius: 50%;
  -webkit-animation: spin 0.9s linear infinite;
  animation: spin 0.9s linear infinite;
}

.p-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 14px;
  height: 14px;
  background: var(--accent-primary);
  color: #000;
  font-size: 9px;
  font-weight: 900;
  border-radius: 50%;
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  justify-content: center;
}

/* â”€â”€ UP NEXT queue section â”€â”€ */
.queue-section {
  margin-top: 8px;
}

.queue-header {
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  justify-content: space-between;
  padding: 0 4px 12px;
  border-bottom: 1px solid var(--border-secondary);
  margin-bottom: 4px;
}

.queue-header-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.queue-header-count {
  font-size: 12px;
  color: var(--text-muted);
}

.queue-row {
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;
  gap: 12px;
  padding: 8px 4px;
  border-radius: 10px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
}
.queue-row:active {
  background: var(--hover-bg);
}
.queue-row--active {
  background: var(--bg-secondary);
}

.queue-art {
  position: relative;
  -webkit-flex-shrink: 0;
  flex-shrink: 0;
}

.queue-thumb {
  width: 46px;
  height: 46px;
  border-radius: 8px;
  object-fit: cover;
  display: block;
}

.queue-no-thumb {
  background: var(--bg-secondary);
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  justify-content: center;
}

.queue-no-thumb svg path,
.queue-no-thumb svg circle {
  stroke: var(--text-muted);
}

/* Animated equalizer bars */
.eq-bars {
  position: absolute;
  bottom: 4px;
  right: 4px;
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-box-align: flex-end;
  -webkit-align-items: flex-end;
  align-items: flex-end;
  gap: 2px;
  height: 14px;
  background: var(--bg-overlay);
  border-radius: 3px;
  padding: 2px 3px;
}
.eq-bars span {
  display: block;
  width: 3px;
  background: var(--accent-primary);
  border-radius: 2px;
  -webkit-animation: bar-bounce 0.8s ease-in-out infinite alternate;
  animation: bar-bounce 0.8s ease-in-out infinite alternate;
}
.eq-bars span:nth-child(1) {
  height: 5px;
  -webkit-animation-delay: 0s;
  animation-delay: 0s;
}
.eq-bars span:nth-child(2) {
  height: 10px;
  -webkit-animation-delay: 0.2s;
  animation-delay: 0.2s;
}
.eq-bars span:nth-child(3) {
  height: 7px;
  -webkit-animation-delay: 0.4s;
  animation-delay: 0.4s;
}

.eq-paused {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: var(--bg-overlay);
  border-radius: 3px;
  padding: 2px 3px;
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  justify-content: center;
}

.eq-paused svg {
  fill: var(--accent-primary);
}

@-webkit-keyframes bar-bounce {
  from {
    -webkit-transform: scaleY(0.3);
    transform: scaleY(0.3);
  }
  to {
    -webkit-transform: scaleY(1);
    transform: scaleY(1);
  }
}
@keyframes bar-bounce {
  from {
    transform: scaleY(0.3);
  }
  to {
    transform: scaleY(1);
  }
}

.queue-meta {
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  flex: 1;
  min-width: 0;
}
.queue-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.queue-title--active {
  color: var(--accent-primary);
  font-weight: 700;
}
.queue-artist {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.queue-active-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent-primary);
  -webkit-flex-shrink: 0;
  flex-shrink: 0;
}

/* Bottom padding for safe area */
.p-bottom-pad {
  height: calc(24px + env(safe-area-inset-bottom, 0px));
}

@-webkit-keyframes spin {
  to {
    -webkit-transform: rotate(360deg);
  }
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.p-scroll-body.closing {
  opacity: 0;
  -webkit-transition: opacity 0.15s ease;
  transition: opacity 0.15s ease;
}
</style>
