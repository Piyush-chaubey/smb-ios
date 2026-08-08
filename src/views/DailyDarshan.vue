<script setup lang="ts">
import { calendarOutline } from 'ionicons/icons'
import { computed, ref } from 'vue'

import { useApi } from '@/composables/api'

import DarshanGallery from './DarshanGallery.vue'
import { onIonViewWillEnter } from '@ionic/vue'
import {
  IonButton,
  IonButtons,
  IonCard,
  IonContent,
  IonHeader,
  IonIcon,
  IonImg,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonPage,
  IonSkeletonText,
  IonSpinner,
  IonTitle,
  IonToolbar,
  modalController
} from '@ionic/vue'

const { getDailyDarshan } = useApi()

type DarshanPost = {
  id: string
  mainThumb: string
  displayDate: string
  fullImages: Array<{ url: string; id: string }>
  isAlbum: boolean
  albumCount: number
}

const darshanPosts = ref<DarshanPost[]>([])
const isLoading = ref(true)
const isMoreLoading = ref(false)
const loadError = ref<string | null>(null)
const nextPage = ref<string | null>(null)
const loadedAllPages = ref(false)
const selectedDate = ref<string | null>(null)
const showDatePicker = ref(false)
const pickerDay = ref(new Date().getDate())
const pickerMonth = ref(new Date().getMonth() + 1)
const pickerYear = ref(new Date().getFullYear())
const isLoadingAll = ref(false)

const yearRange = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  // Show last 5 years for better performance
  for (let y = currentYear; y >= currentYear - 5; y--) {
    years.push(y)
  }
  return years
})

const filteredPosts = computed(() => {
  if (!selectedDate.value) return darshanPosts.value

  return darshanPosts.value.filter((post) => {
    const postDate = normalizeDate(post.displayDate)
    return postDate === selectedDate.value
  })
})

function normalizeDate(displayDate: string): string {
  if (!displayDate) return ''
  // Parse "15 Jan 2024" format to ISO date YYYY-MM-DD
  const months = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec'
  ]
  const parts = displayDate.toLowerCase().split(' ')
  if (parts.length !== 3) return ''

  const day = parts[0].padStart(2, '0')
  const monthIndex = months.indexOf(parts[1].substring(0, 3))
  if (monthIndex === -1) return ''
  const month = String(monthIndex + 1).padStart(2, '0')
  const year = parts[2]

  return `${year}-${month}-${day}`
}

function clearDateFilter() {
  selectedDate.value = null
}

/* --- Logic updated to handle Infinite Scroll event --- */
async function loadData(event?: any, bypassGuard = false) {
  if (!bypassGuard && isMoreLoading.value) return
  if (darshanPosts.value.length > 0) isMoreLoading.value = true
  loadError.value = null

  try {
    const data = await getDailyDarshan(nextPage.value || undefined)

    if (data?.data) {
      const filtered = data.data.filter((item: any) => item.media_type !== 'VIDEO')

      const processed = filtered.map((post: any) => {
        const allImages =
          post.media_type === 'CAROUSEL_ALBUM' && post.children
            ? post.children.data.map((img: any) => ({ url: img.media_url, id: img.id }))
            : [{ url: post.media_url, id: post.id }]

        return {
          id: post.id,
          mainThumb: post.media_url,
          displayDate: formatDate(post.created_time, post.caption),
          fullImages: allImages,
          isAlbum: post.media_type === 'CAROUSEL_ALBUM',
          albumCount: allImages.length
        }
      })

      darshanPosts.value.push(...processed)

      // Update pagination
      if (data.paging?.next) {
        nextPage.value = data.paging.next
        loadedAllPages.value = false
      } else {
        nextPage.value = null
        loadedAllPages.value = true
      }
    } else {
      // No data returned, mark as all loaded
      nextPage.value = null
      loadedAllPages.value = true
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to load Darshan. Please try again.'
    console.error('❌ DailyDarshan Error:', err)
    loadError.value = msg
    // On error, stop trying to load more
    nextPage.value = null
    loadedAllPages.value = true
  } finally {
    isLoading.value = false
    isMoreLoading.value = false
    if (event?.target) {
      event.target.complete()
    }
  }
}

/* --- DATE HELPERS (Kept from your original) --- */
function extractDate(caption: string) {
  if (!caption) return ''
  const match = caption.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,9})\s+(\d{4})/i)
  if (!match) return ''
  const day = match[1]
  const month = match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase()
  const year = match[3]
  return `${day} ${month} ${year}`
}

function parseFacebookTimestamp(timestamp: string | undefined) {
  if (!timestamp) return null
  const normalized = timestamp.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(timestamp: string | undefined, caption: string) {
  const captionDate = extractDate(caption)
  if (captionDate) return captionDate
  const parsed = parseFacebookTimestamp(timestamp)
  return parsed
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(
        parsed
      )
    : ''
}

async function presentModal(images: any[]) {
  const modal = await modalController.create({
    component: DarshanGallery,
    componentProps: { images: images.map((img) => ({ url: img.url })), index: 0 }
  })
  return await modal.present()
}

async function openDatePicker() {
  // Initialize picker with selected date or today
  if (selectedDate.value) {
    const parts = selectedDate.value.split('-')
    pickerYear.value = parseInt(parts[0])
    pickerMonth.value = parseInt(parts[1])
    pickerDay.value = parseInt(parts[2])
  } else {
    const today = new Date()
    pickerDay.value = today.getDate()
    pickerMonth.value = today.getMonth() + 1
    pickerYear.value = today.getFullYear()
  }
  showDatePicker.value = true
}

async function loadAllPosts() {
  if (isLoadingAll.value) return
  isLoadingAll.value = true

  try {
    // Keep loading until no more pages
    let retries = 0
    const maxRetries = 50 // Safety limit

    while (nextPage.value && !loadedAllPages.value && retries < maxRetries) {
      const prevCount = darshanPosts.value.length

      // Bypass the isMoreLoading guard
      await loadData(undefined, true)

      // If we found a post matching the filter, stop loading!
      if (selectedDate.value && filteredPosts.value.length > 0) {
        break
      }

      // If no new posts were added, we're done
      if (darshanPosts.value.length === prevCount) {
        loadedAllPages.value = true
        break
      }

      retries++

      // Small delay to prevent overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    if (retries >= maxRetries) {
      console.warn('Reached max retries for loading posts')
      loadedAllPages.value = true
    }
  } catch (err) {
    console.error('Error loading all posts:', err)
    loadedAllPages.value = true
  } finally {
    isLoadingAll.value = false
  }
}

async function applyDateFilter() {
  const year = pickerYear.value
  const month = String(pickerMonth.value).padStart(2, '0')
  const day = String(pickerDay.value).padStart(2, '0')
  selectedDate.value = `${year}-${month}-${day}`
  showDatePicker.value = false

  // If we haven't loaded all posts yet, load them now
  if (!loadedAllPages.value && nextPage.value) {
    await loadAllPosts()
  }
}

function formatDisplayDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

onIonViewWillEnter(loadData)
</script>

<template>
  <ion-page>
    <ion-header class="ion-no-border app-header">
      <ion-toolbar class="app-toolbar">
        <ion-title class="app-title">Daily Darshan</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openDatePicker">
            <ion-icon slot="icon-only" :icon="calendarOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Date Filter Display -->
      <div v-if="selectedDate" class="date-filter-banner">
        <span>📅 {{ formatDisplayDate(selectedDate) }}</span>
        <button @click="clearDateFilter" class="clear-filter-btn">✕ Clear</button>
      </div>

      <!-- Floating Background Loading Indicator -->
      <div v-if="isLoadingAll && filteredPosts.length > 0" class="background-loading-badge">
        <ion-spinner name="crescent" color="primary" />
      </div>

      <!-- Date Picker Modal -->
      <div v-if="showDatePicker" class="date-picker-overlay" @click="showDatePicker = false">
        <div class="date-picker-modal" @click.stop>
          <div class="picker-header">
            <h3>Select Date</h3>
            <button @click="showDatePicker = false" class="close-x">✕</button>
          </div>

          <div class="date-selector">
            <!-- Day -->
            <div class="selector-group">
              <label>Day</label>
              <select v-model="pickerDay" class="date-select">
                <option v-for="d in 31" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>

            <!-- Month -->
            <div class="selector-group">
              <label>Month</label>
              <select v-model="pickerMonth" class="date-select">
                <option value="1">Jan</option>
                <option value="2">Feb</option>
                <option value="3">Mar</option>
                <option value="4">Apr</option>
                <option value="5">May</option>
                <option value="6">Jun</option>
                <option value="7">Jul</option>
                <option value="8">Aug</option>
                <option value="9">Sep</option>
                <option value="10">Oct</option>
                <option value="11">Nov</option>
                <option value="12">Dec</option>
              </select>
            </div>

            <!-- Year -->
            <div class="selector-group">
              <label>Year</label>
              <select v-model="pickerYear" class="date-select">
                <option v-for="y in yearRange" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
          </div>

          <div class="picker-actions">
            <button @click="applyDateFilter" class="apply-btn">✓ Apply Filter</button>
            <button @click="showDatePicker = false" class="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
      <div v-if="isLoading" class="darshan-grid-main">
        <ion-skeleton-text v-for="i in 6" :key="i" animated class="skeleton-card" />
      </div>

      <div v-else-if="loadError" class="error-state">
        <p class="error-msg">{{ loadError }}</p>
        <button class="retry-btn" @click="loadData()">🔄 Try Again</button>
      </div>

      <div v-else>
        <div v-if="!filteredPosts.length" class="no-results">
          <div v-if="isLoadingAll" class="centered-spinner-container">
            <ion-spinner name="crescent" color="primary" />
          </div>
          <template v-else>
            <p v-if="selectedDate">📅 No Darshan found for {{ formatDisplayDate(selectedDate) }}</p>
            <p v-else>No Darshan posts available.</p>
          </template>
        </div>

        <div class="darshan-grid-main">
          <div v-for="post in filteredPosts" :key="post.id" class="post-card-wrapper">
            <div v-if="post.displayDate" class="date-header">
              <h2>{{ post.displayDate }}</h2>
            </div>

            <ion-card class="darshan-card" @click="presentModal(post.fullImages)">
              <ion-img :src="post.mainThumb" class="main-img" />
              <div v-if="post.isAlbum" class="album-badge">+{{ post.albumCount }} Photos</div>
              <div class="overlay">
                <p>Click for Full Darshan</p>
              </div>
            </ion-card>
          </div>
        </div>

        <ion-infinite-scroll @ionInfinite="loadData($event)" :disabled="loadedAllPages">
          <ion-infinite-scroll-content loading-spinner="crescent" />
        </ion-infinite-scroll>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped lang="scss">
ion-page {
  background: var(--bg-primary);
}
ion-content {
  --background: var(--bg-primary);
}

.darshan-grid-main {
  display: grid;
  padding: 16px;
  gap: 20px;
  grid-template-columns: 1fr;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.post-card-wrapper {
  display: flex;
  flex-direction: column;
}

.date-header {
  padding: 10px 5px;
  small {
    color: var(--accent-primary);
    font-family: var(--font-text);
    font-size: var(--text-caption2);
    font-weight: 700;
    letter-spacing: var(--ls-caption2);
    text-transform: uppercase;
  }
  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-title3);
    font-weight: 800;
    letter-spacing: var(--ls-title3);
    color: var(--text-primary);
  }
}

.darshan-card {
  margin: 0;
  border-radius: 18px;
  overflow: hidden;
  height: 350px;
  position: relative;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition:
    transform var(--dur-normal) var(--ease-out),
    box-shadow var(--dur-normal) var(--ease-out);
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.18);
  }
  &:active {
    transform: scale(0.98);
  }
}

.album-badge {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 5px 10px;
  border-radius: 8px;
  font-family: var(--font-text);
  font-size: var(--text-caption2);
  font-weight: 700;
  letter-spacing: var(--ls-caption2);
}

.main-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay {
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 15px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  p {
    color: white;
    margin: 0;
    font-family: var(--font-text);
    font-size: var(--text-caption2);
    font-weight: 700;
    letter-spacing: var(--ls-caption2);
    text-transform: uppercase;
  }
}

.skeleton-card {
  height: 350px;
  border-radius: 18px;
}

.no-results {
  padding: 48px 16px;
  text-align: center;
  color: var(--text-secondary);
  font-family: var(--font-text);
  font-size: var(--text-subhead);
  font-weight: 600;

  p {
    margin: 0;
    font-size: 16px;
    line-height: 1.5;
  }
}

.centered-spinner-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
}

.load-more-box {
  display: flex;
  justify-content: center;
  padding: 20px 20px 50px;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 48px 24px;
  text-align: center;
}

.error-msg {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

.retry-btn {
  background: var(--accent-primary);
  color: #000;
  border: none;
  border-radius: 24px;
  padding: 10px 28px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
  &:active {
    opacity: 0.8;
  }
}

.date-filter-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--accent-primary);
  color: #000;
  font-family: var(--font-text);
  font-size: 14px;
  font-weight: 600;
}

.clear-filter-btn {
  background: rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 12px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  &:active {
    opacity: 0.7;
  }
}

.date-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  padding: 20px;
}

.date-picker-modal {
  background: var(--bg-primary);
  border-radius: 24px;
  padding: 0;
  width: 100%;
  max-width: 380px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.6),
    0 0 1px var(--border-secondary);
  overflow: hidden;
  position: relative;
  z-index: 100000;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border-primary);

  h3 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 700;
    color: var(--text-primary);
  }
}

.close-x {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--hover-bg);
  border: none;
  border-radius: 50%;
  font-size: 20px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:active {
    background: var(--border-primary);
    transform: scale(0.95);
  }
}

.date-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 24px;
  background: var(--bg-primary);
}

.selector-group {
  display: flex;
  flex-direction: column;
  gap: 10px;

  label {
    font-family: var(--font-text);
    font-size: 11px;
    font-weight: 700;
    color: var(--accent-primary);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    padding-left: 4px;
  }
}

.date-select {
  width: 100%;
  padding: 14px 10px;
  border: 2px solid var(--border-primary);
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  font-family: var(--font-text);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  text-align: center;

  /* Custom dropdown arrow */
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23ffc107' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 32px;

  &:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 4px rgba(255, 193, 7, 0.2);
    background-color: var(--hover-bg);
  }

  &:active {
    transform: scale(0.98);
  }

  option {
    background: var(--bg-secondary);
    color: var(--text-primary);
    padding: 12px;
    font-size: 16px;
  }
}

.picker-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px 24px 24px;
  background: var(--bg-primary);
}

.apply-btn {
  width: 100%;
  background: var(--accent-primary);
  color: #000;
  border: none;
  border-radius: 16px;
  padding: 18px;
  font-size: 17px;
  font-weight: 700;
  font-family: var(--font-text);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow:
    0 6px 16px rgba(255, 193, 7, 0.4),
    0 0 1px rgba(255, 193, 7, 0.5);
  letter-spacing: 0.3px;

  &:active {
    transform: scale(0.97);
    box-shadow: 0 3px 8px rgba(255, 193, 7, 0.5);
  }
}

.cancel-btn {
  width: 100%;
  background: transparent;
  color: var(--text-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 14px;
  padding: 14px;
  font-size: 15px;
  font-weight: 600;
  font-family: var(--font-text);
  cursor: pointer;
  transition: all 0.2s ease;

  &:active {
    background: var(--bg-secondary);
    border-color: var(--border-secondary);
  }
}

.background-loading-badge {
  position: fixed;
  bottom: calc(65px + env(safe-area-inset-bottom, 0px) + 20px);
  left: 50%;
  transform: translateX(-50%);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
</style>
