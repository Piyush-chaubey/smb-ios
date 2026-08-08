<script setup lang="ts">
import { Pause, Play, SkipForward, X } from 'lucide-vue-next'
import { computed } from 'vue'

import { useThumbnails } from '@/composables/useThumbnails'
import { useAudioStore } from '@/stores/audioStore'
import AudioPlayer from '@/views/AudioPlayer.vue'

import { modalController } from '@ionic/vue'

const store = useAudioStore()
const { getThumb } = useThumbnails()

const track = computed(() => store.currentTrack)
const isPlaying = computed(() => store.isPlaying)
const isLoading = computed(() => store.isLoading)
const progress = computed(() => {
  if (!store.duration || store.duration <= 0) return 0
  return Math.min((store.currentTime / store.duration) * 100, 100)
})
const thumb = computed(() => {
  if (!track.value) return null
  return track.value.thumbnail || getThumb(track.value._id) || null
})

async function openPlayer() {
  const existing = await modalController.getTop()
  if (existing) return
  const modal = await modalController.create({
    component: AudioPlayer,
    cssClass: 'full-player-modal'
  })
  await modal.present()
}

function onPlayPause(e: Event) {
  e.stopPropagation()
  store.togglePlay()
}

function onNext(e: Event) {
  e.stopPropagation()
  store.nextTrack()
}

async function onStop(e: Event) {
  e.stopPropagation()
  await store.stopSong()
}
</script>

<template>
  <Transition name="bar-slide">
    <div v-if="track" class="npb" @click="openPlayer">
      <!-- Pill card -->
      <div class="npb-card">
        <!-- Left: art + info -->
        <div class="npb-left">
          <div class="npb-art-wrap">
            <img v-if="thumb" :src="thumb" class="npb-art" alt="" />
            <div v-else class="npb-art npb-art-empty">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 18V5l12-2v13" stroke="#aaa" stroke-width="1.5" stroke-linecap="round" />
                <circle cx="6" cy="18" r="3" stroke="#aaa" stroke-width="1.5" />
                <circle cx="18" cy="16" r="3" stroke="#aaa" stroke-width="1.5" />
              </svg>
            </div>
            <!-- Pulse ring when playing -->
            <div v-if="isPlaying" class="npb-pulse"></div>
          </div>

          <div class="npb-info">
            <div class="npb-title">{{ track.subTitle }}</div>
            <div class="npb-artist">{{ track.title }}</div>
            <!-- Progress bar under title -->
            <div class="npb-prog-wrap">
              <div class="npb-prog-fill" :style="{ width: progress + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- Right: controls -->
        <div class="npb-controls">
          <button class="npb-btn" @click="onPlayPause" :aria-label="isPlaying ? 'Pause' : 'Play'">
            <div v-if="isLoading" class="npb-spinner"></div>
            <component v-else :is="isPlaying ? Pause : Play" :size="20" />
          </button>
          <button class="npb-btn" @click="onNext" aria-label="Next">
            <SkipForward :size="20" />
          </button>
          <button class="npb-btn npb-close" @click="onStop" aria-label="Stop">
            <X :size="16" />
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ── Outer wrapper — sits above tab bar ── */
.npb {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(65px + env(safe-area-inset-bottom, 0px));
  z-index: 1000;
  padding: 0 12px 8px;
  pointer-events: none; /* let clicks pass through padding area */
}

/* ── Pill card — iPhone Dynamic Island / Apple Music style ── */
.npb-card {
  pointer-events: all;
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 10px 10px 10px;
  border-radius: 20px;
  /* Frosted glass with theme colors */
  background: var(--bg-overlay);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--border-secondary);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 var(--border-secondary);
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  /* Subtle press feedback */
  -webkit-transition:
    -webkit-transform 0.12s ease,
    box-shadow 0.12s ease;
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease;
}
.npb-card:active {
  -webkit-transform: scale(0.97);
  transform: scale(0.97);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

/* ── Left section ── */
.npb-left {
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;
  gap: 12px;
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  flex: 1;
  min-width: 0;
}

/* ── Album art ── */
.npb-art-wrap {
  position: relative;
  -webkit-flex-shrink: 0;
  flex-shrink: 0;
}
.npb-art {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  object-fit: cover;
  display: block;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.npb-art-empty {
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

.npb-art-empty svg path,
.npb-art-empty svg circle {
  stroke: var(--text-muted);
}

/* Pulse ring — plays when music is playing */
.npb-pulse {
  position: absolute;
  inset: -3px;
  border-radius: 15px;
  border: 2px solid var(--accent-primary);
  opacity: 0.5;
  -webkit-animation: pulse-ring 2s ease-in-out infinite;
  animation: pulse-ring 2s ease-in-out infinite;
  pointer-events: none;
}
@-webkit-keyframes pulse-ring {
  0% {
    opacity: 0.7;
    -webkit-transform: scale(1);
    transform: scale(1);
  }
  50% {
    opacity: 0.2;
    -webkit-transform: scale(1.06);
    transform: scale(1.06);
  }
  100% {
    opacity: 0.7;
    -webkit-transform: scale(1);
    transform: scale(1);
  }
}
@keyframes pulse-ring {
  0% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 0.2;
    transform: scale(1.06);
  }
  100% {
    opacity: 0.7;
    transform: scale(1);
  }
}

/* ── Track info ── */
.npb-info {
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  flex: 1;
  min-width: 0;
}
.npb-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.1px;
}
.npb-artist {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Thin progress bar under text */
.npb-prog-wrap {
  margin-top: 6px;
  height: 2px;
  background: var(--border-secondary);
  border-radius: 2px;
  overflow: hidden;
}
.npb-prog-fill {
  height: 100%;
  background: var(--accent-primary);
  border-radius: 2px;
  -webkit-transition: width 0.5s linear;
  transition: width 0.5s linear;
}

/* ── Controls ── */
.npb-controls {
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;
  gap: 2px;
  -webkit-flex-shrink: 0;
  flex-shrink: 0;
}
.npb-btn {
  width: 40px;
  height: 40px;
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  justify-content: center;
  background: var(--hover-bg);
  border: none;
  border-radius: 50%;
  color: var(--text-primary);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
  -webkit-transition:
    background 0.1s ease,
    -webkit-transform 0.1s ease;
  transition:
    background 0.1s ease,
    transform 0.1s ease;
}
.npb-btn:active {
  background: var(--border-primary);
  -webkit-transform: scale(0.9);
  transform: scale(0.9);
}
.npb-close {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  width: 32px;
  height: 32px;
}
.npb-close:active {
  background: var(--hover-bg);
  color: var(--text-primary);
}

/* Spinner */
.npb-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-secondary);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  -webkit-animation: spin 0.8s linear infinite;
  animation: spin 0.8s linear infinite;
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

/* ── Slide-up / slide-down transition ── */
.bar-slide-enter-active,
.bar-slide-leave-active {
  -webkit-transition:
    -webkit-transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.3s ease;
  transition:
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.3s ease;
}
.bar-slide-enter-from,
.bar-slide-leave-to {
  -webkit-transform: translateY(120%);
  transform: translateY(120%);
  opacity: 0;
}
</style>
