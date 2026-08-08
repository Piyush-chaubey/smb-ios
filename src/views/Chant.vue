<script setup lang="ts">
// eslint-disable-next-line vue/multi-word-component-names
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { refreshOutline, removeOutline } from 'ionicons/icons'
import { computed, onMounted, onUnmounted, ref } from 'vue'

import { onIonViewWillEnter, onIonViewWillLeave } from '@ionic/vue'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/vue'

const BEADS_PER_ROUND = 108
const POPUP_DURATION = 2500
const STORAGE_KEYS = {
  CHANT_COUNT: 'chantCount',
  ROUNDS_COMPLETED: 'roundsCompleted',
  TOTAL_CHANTS: 'totalChants',
  LAST_RESET_DATE: 'lastResetDate'
} as const

const getItem = (key: string) => parseInt(localStorage.getItem(key) ?? '0')
const setItem = (key: string, val: number) => localStorage.setItem(key, val.toString())
const getDateItem = (key: string) => localStorage.getItem(key) ?? ''
const setDateItem = (key: string, val: string) => localStorage.setItem(key, val)

const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
  try {
    await Haptics.impact({ style })
  } catch {
    /* web fallback */
  }
}

const count = ref(getItem(STORAGE_KEYS.CHANT_COUNT))
const rounds = ref(getItem(STORAGE_KEYS.ROUNDS_COMPLETED))
const total = ref(getItem(STORAGE_KEYS.TOTAL_CHANTS))
const showBanner = ref(false)
const isAnimating = ref(false)

let midnightCheckInterval: ReturnType<typeof setInterval> | null = null

const progress = computed(() => count.value / BEADS_PER_ROUND)

// Rectangular border calculation
// Rectangle perimeter = 2 * (width + height) = 2 * (184 + 184) = 736
const RECTANGLE_PERIMETER = 736
const rectangleStrokeDash = computed(() => {
  const filledLength = progress.value * RECTANGLE_PERIMETER
  return `${filledLength} ${RECTANGLE_PERIMETER}`
})

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// Check if we need to reset total count at midnight
const checkMidnightReset = () => {
  const lastResetDate = getDateItem(STORAGE_KEYS.LAST_RESET_DATE)
  const todayDate = getTodayDate()

  if (lastResetDate !== todayDate) {
    // New day detected - reset total count
    total.value = 0
    setItem(STORAGE_KEYS.TOTAL_CHANTS, 0)
    setDateItem(STORAGE_KEYS.LAST_RESET_DATE, todayDate)
    console.log('🕐 Midnight reset: Total count reset to 0')
  }
}

// Calculate milliseconds until next midnight
const getMillisecondsUntilMidnight = () => {
  const now = new Date()
  const midnight = new Date()
  midnight.setHours(24, 0, 0, 0) // Next midnight
  return midnight.getTime() - now.getTime()
}

// Schedule midnight reset
const scheduleMidnightReset = () => {
  // Clear any existing interval
  if (midnightCheckInterval) {
    clearInterval(midnightCheckInterval)
  }

  // Check immediately on mount
  checkMidnightReset()

  // Schedule next check at midnight
  const msUntilMidnight = getMillisecondsUntilMidnight()

  setTimeout(() => {
    checkMidnightReset()
    // After first midnight, check every 60 seconds to catch if missed
    midnightCheckInterval = setInterval(checkMidnightReset, 60000)
  }, msUntilMidnight)

  console.log(
    `⏰ Next midnight reset scheduled in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`
  )
}

const save = () => {
  setItem(STORAGE_KEYS.CHANT_COUNT, count.value)
  setItem(STORAGE_KEYS.ROUNDS_COMPLETED, rounds.value)
  setItem(STORAGE_KEYS.TOTAL_CHANTS, total.value)
}

const increment = async () => {
  await triggerHaptic(ImpactStyle.Light)
  isAnimating.value = true
  setTimeout(() => (isAnimating.value = false), 150)

  count.value++
  total.value++

  if (count.value >= BEADS_PER_ROUND) {
    count.value = 0
    rounds.value++
    await triggerHaptic(ImpactStyle.Heavy)
    showBanner.value = true
    setTimeout(() => (showBanner.value = false), POPUP_DURATION)
  }
  save()
}

const decrement = async () => {
  if (count.value > 0) {
    await triggerHaptic(ImpactStyle.Light)
    count.value--
    save()
  }
}

const reset = () => {
  count.value = 0
  rounds.value = 0
  save()
}

const handleKey = (e: KeyboardEvent) => {
  if (e.key === ' ' || e.key === 'Tab') {
    e.preventDefault()
    increment()
  }
}

onMounted(() => {
  scheduleMidnightReset()
})

onUnmounted(() => {
  if (midnightCheckInterval) {
    clearInterval(midnightCheckInterval)
  }
})

onIonViewWillEnter(() => {
  window.addEventListener('keydown', handleKey)
  // Check for midnight reset when view becomes active
  checkMidnightReset()
})

onIonViewWillLeave(() => {
  window.removeEventListener('keydown', handleKey)
})
</script>

<template>
  <ion-page>
    <!-- Matches the same IonHeader pattern as other pages -->
    <ion-header class="ion-no-border app-header">
      <ion-toolbar class="app-toolbar">
        <ion-title class="app-title">Naam Jap</ion-title>
        <ion-buttons slot="primary">
          <ion-button @click="reset" title="Reset">
            <ion-icon slot="icon-only" :icon="refreshOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="screen">
        <!-- Mahamantra Section - Beautiful & Prominent -->
        <div class="mantra-container">
          <div class="mantra-title">Chant and be Happy</div>
          <div class="mantra-primary">
            Hare Krishna Hare Krishna
            <br />
            Krishna Krishna Hare Hare
          </div>

          <div class="mantra-primary">
            Hare Rama Hare Rama
            <br />
            Rama Rama Hare Hare
          </div>
        </div>

        <!-- Counter Section - 35% Rectangular with Soft Corners -->
        <div class="counter-section">
          <!-- Main Counter with Rectangular Progress Border -->
          <div class="ring-wrap" @click="increment" :class="{ pop: isAnimating }">
            <!-- Rectangular Progress Border -->
            <svg class="progress-border" viewBox="0 0 200 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color: #ffc107; stop-opacity: 1" />
                  <stop offset="100%" style="stop-color: #ff9800; stop-opacity: 1" />
                </linearGradient>
              </defs>

              <!-- Background Border -->
              <rect
                x="8"
                y="8"
                width="184"
                height="184"
                rx="24"
                ry="24"
                class="progress-track"
                fill="none"
              />

              <!-- Animated Progress Border -->
              <rect
                x="8"
                y="8"
                width="184"
                height="184"
                rx="24"
                ry="24"
                class="progress-fill"
                fill="none"
                :stroke-dasharray="rectangleStrokeDash"
                stroke-dashoffset="0"
              />
            </svg>

            <div class="ring-inner">
              <div class="count-num">{{ count }}</div>
              <div class="count-sub">of 108</div>
              <div class="tap-hint">Tap to count</div>
            </div>
          </div>

          <!-- Controls Row -->
          <div class="controls">
            <button class="ctrl-btn" @click="decrement" title="Decrease">
              <ion-icon :icon="removeOutline" />
            </button>

            <div class="stats-row">
              <div class="stat-card">
                <div class="stat-value">{{ rounds }}</div>
                <div class="stat-label">Rounds</div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-card">
                <div class="stat-value">{{ total }}</div>
                <div class="stat-label">Total</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Round Complete Banner -->
        <Transition name="banner">
          <div v-if="showBanner" class="banner">
            <span class="banner-icon">🎉</span>
            <span class="banner-text">Round Complete — Radhe Radhe</span>
            <span class="banner-icon">🙏</span>
          </div>
        </Transition>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
/* ── Page / Content ── */
ion-page {
  background: var(--bg-primary);
}
ion-content {
  --background: var(--bg-primary);
}

/* ── Screen layout ── */
.screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 20px 16px;
  padding-bottom: 150px; /* Comfort scrollable space below content for tab/player bar clearance */
  min-height: 100%;
  gap: 24px;
  box-sizing: border-box;
}

/* ── Mahamantra Container - Beautiful & Prominent ── */
.mantra-container {
  width: 100%;
  max-width: 480px;
  padding: 32px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.mantra-title {
  font-family: 'Georgia', 'Palatino Linotype', serif;
  font-size: var(--text-caption1);
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--accent-primary);
  text-transform: uppercase;
  margin-bottom: 8px;
  opacity: 0.9;
}

.mantra-primary {
  font-family: 'Georgia', 'Palatino Linotype', 'Times New Roman', serif;
  font-size: clamp(20px, 5vw, 28px);
  font-weight: 600;
  line-height: 1.6;
  letter-spacing: 0.5px;
  color: var(--text-primary);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.mantra-divider {
  font-size: 32px;
  color: var(--accent-primary);
  margin: 8px 0;
  opacity: 0.6;
}

/* ── Counter Section - 35% Height, 97% Width, Soft Corners ── */
.counter-section {
  width: 100%;
  max-width: 420px;
  height: auto;
  background: var(--bg-secondary);
  border: 2px solid var(--border-secondary);
  border-radius: 32px;
  padding: 28px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition:
    transform var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out);
  margin-bottom: 20px;
  box-sizing: border-box;
}

.counter-section:active {
  transform: scale(0.995);
}

/* ── Ring / Counter Container ── */
.ring-wrap {
  position: relative;
  width: 180px;
  height: 180px;
  flex-shrink: 0;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform var(--dur-fast) var(--ease-spring);
}

.ring-wrap:active,
.ring-wrap.pop {
  transform: scale(0.92);
}

.progress-border {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  filter: drop-shadow(0 4px 12px rgba(255, 193, 7, 0.2));
}

.progress-track {
  stroke: var(--border-primary);
  stroke-width: 6;
  opacity: 0.3;
}

.progress-fill {
  stroke: url(#progressGradient);
  stroke-width: 6;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: stroke-dasharray var(--dur-normal) var(--ease-out);
  animation: progressGlow 2s ease-in-out infinite;
}

@keyframes progressGlow {
  0%,
  100% {
    filter: drop-shadow(0 0 4px rgba(255, 193, 7, 0.4));
  }
  50% {
    filter: drop-shadow(0 0 8px rgba(255, 193, 7, 0.6));
  }
}

.ring-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.count-num {
  font-family: var(--font-display);
  font-size: clamp(56px, 12vw, 72px);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -2px;
  color: var(--text-primary);
  transition: transform var(--dur-fast) var(--ease-spring);
  text-shadow: 0 2px 12px rgba(255, 193, 7, 0.3);
}

.count-sub {
  font-family: var(--font-text);
  font-size: var(--text-caption1);
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.tap-hint {
  font-family: var(--font-text);
  font-size: var(--text-caption2);
  font-weight: 500;
  letter-spacing: 0.3px;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-top: 4px;
  opacity: 0.7;
}

/* ── Controls ── */
.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
  padding: 0 8px;
}

.ctrl-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--hover-bg);
  border: 2px solid var(--border-secondary);
  color: var(--text-primary);
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-spring);
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.ctrl-btn:active {
  background: var(--border-primary);
  transform: scale(0.88);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--bg-primary);
  border: 2px solid var(--border-secondary);
  border-radius: 20px;
  padding: 12px 20px;
  flex: 1;
  max-width: 280px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.stat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-family: var(--font-display);
  font-size: clamp(24px, 5vw, 32px);
  font-weight: 800;
  letter-spacing: -1px;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-family: var(--font-text);
  font-size: var(--text-caption2);
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.stat-divider {
  width: 2px;
  height: 32px;
  background: var(--border-secondary);
  opacity: 0.5;
  margin: 0 16px;
  flex-shrink: 0;
}

/* ── Banner ── */
.banner {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, var(--accent-primary) 0%, #ff9800 100%);
  border: none;
  border-radius: 100px;
  padding: 16px 32px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-text);
  font-size: var(--text-callout);
  font-weight: 700;
  color: #000;
  white-space: nowrap;
  z-index: 100;
  box-shadow:
    0 8px 24px rgba(255, 193, 7, 0.4),
    0 4px 12px rgba(255, 152, 0, 0.3);
}

.banner-icon {
  font-size: 20px;
  animation: bounce 0.6s ease-in-out infinite alternate;
}

.banner-text {
  letter-spacing: 0.3px;
}

@keyframes bounce {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-4px);
  }
}

.banner-enter-active,
.banner-leave-active {
  transition: all var(--dur-slow) var(--ease-spring);
}

.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px) scale(0.85);
}

/* ── Responsive adjustments ── */
@media (max-width: 380px) {
  .counter-section {
    padding: 20px 16px;
    gap: 16px;
  }

  .ring-wrap {
    width: 160px;
    height: 160px;
  }

  .stats-row {
    padding: 10px 16px;
  }

  .stat-divider {
    margin: 0 12px;
  }
}

@media (min-width: 768px) {
  .counter-section {
    max-width: 600px;
    height: 35vh;
  }
}
</style>
