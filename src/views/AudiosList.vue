<template>
  <ion-page class="spotify-theme">
    <ion-header class="ion-no-border app-header">
      <ion-toolbar class="app-toolbar">
        <ion-title class="app-title">Your Library</ion-title>
        <ion-buttons slot="primary">
          <ion-button @click="toggleTheme">
            <ion-icon slot="icon-only" :icon="theme === 'dark' ? sunnyOutline : moonOutline" />
          </ion-button>
          <ion-button @click="resetAndLoad()">
            <ion-icon slot="icon-only" :icon="refreshOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- Offline Alert Banner -->
      <div v-if="isOffline" class="offline-banner">
        <span class="offline-icon">📵</span>
        <span>You're offline — showing downloaded lectures</span>
      </div>

      <div class="header-content">
        <div class="search-bar-row" v-if="activeFilter !== 'folders' && !isOffline">
          <ion-searchbar
            :value="searchText"
            placeholder="Find in library..."
            class="spotify-search"
            mode="ios"
            enterkeyhint="search"
            @ionInput="onSearchInput"
            @ionClear="onSearchClear"
          />
          <ion-button
            fill="clear"
            @click="openDatePicker"
            class="calendar-search-btn"
            title="Select Date"
          >
            <ion-icon slot="icon-only" :icon="calendarOutline" />
          </ion-button>
        </div>

        <div v-if="isDateSearch && activeFilter !== 'folders'" class="date-filter-banner">
          <span>📅 {{ formatDisplayDate(searchText) }}</span>
          <button @click="clearDateFilter" class="clear-filter-btn">✕ Clear</button>
        </div>

        <div class="filter-chips">
          <button
            class="s-chip"
            :class="{ active: activeFilter === 'all' }"
            @click="activeFilter = 'all'"
          >
            All
          </button>
          <button
            class="s-chip"
            :class="{ active: activeFilter === 'favorites' }"
            @click="activeFilter = 'favorites'"
          >
            Favorites
          </button>
          <button
            class="s-chip"
            :class="{ active: activeFilter === 'folders' }"
            @click="activeFilter = 'folders'"
          >
            Years
          </button>
          <button
            class="s-chip"
            :class="{ active: activeFilter === 'downloads' }"
            @click="activeFilter = 'downloads'"
          >
            Downloads
          </button>
        </div>

        <!-- Sticky Folder Breadcrumb -->
        <div
          v-if="activeFilter === 'folders'"
          class="folder-breadcrumb"
          style="margin-top: 12px; margin-bottom: 0"
        >
          <span @click="goBackTo(0)" class="crumb-link">📂 Library</span>
          <span v-if="folderSelectedYear" @click="goBackTo(1)" class="crumb-link">
            / {{ folderSelectedYear }}</span
          >
          <span v-if="folderSelectedMonth" class="crumb-text">
            / {{ getMonthName(folderSelectedMonth) }}</span
          >
        </div>
      </div>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content :pulling-icon="chevronDownOutline" refreshing-spinner="crescent" />
      </ion-refresher>

      <div class="spotify-container" :class="{ 'has-bar': audioStore.currentTrack }">
        <!-- Folders View -->
        <div v-if="activeFilter === 'folders'" class="folder-view-container">
          <div v-if="isFoldersLoading" class="folder-loading">
            <ion-spinner name="crescent" color="primary"></ion-spinner>
            <p>Scanning library folders...</p>
          </div>

          <div v-else>
            <!-- Year Folders Grid -->
            <div v-if="folderSelectedYear === null" class="folder-grid">
              <div
                v-for="item in folderItems"
                :key="item.id"
                class="folder-card"
                @click="selectFolderItem(item)"
              >
                <div class="folder-icon-wrap">
                  <ion-icon :icon="folderOutline" />
                </div>
                <div class="folder-info">
                  <span class="folder-label">{{ item.label }}</span>
                  <span class="folder-count">{{ item.count }} items</span>
                </div>
              </div>
            </div>

            <!-- Month Folders List -->
            <div v-else-if="folderSelectedMonth === null" class="folder-list">
              <div
                v-for="item in folderItems"
                :key="item.id"
                class="folder-list-item"
                @click="selectFolderItem(item)"
              >
                <div class="item-left">
                  <ion-icon :icon="folderOutline" class="list-folder-icon" />
                  <span class="list-folder-label">{{ item.label }}</span>
                </div>
                <span class="list-folder-count">{{ item.count }} items</span>
              </div>
            </div>

            <!-- Tracks inside Folder -->
            <div v-else class="track-list">
              <div v-if="folderSelectedTracks.length === 0" class="no-tracks">
                No audios found for this month.
              </div>
              <div
                v-for="audio in folderSelectedTracks"
                :key="audio._id"
                class="spotify-track-row"
                @click="handleFolderTrackPlay(audio)"
              >
                <div class="track-art">
                  <img
                    v-if="getThumb(audio._id) || audio.thumbnail"
                    :src="getThumb(audio._id) || audio.thumbnail"
                    loading="lazy"
                    @error="handleImageError($event, audio._id)"
                    style="object-fit: cover; width: 100%; height: 100%"
                    referrerpolicy="no-referrer"
                  />
                  <div v-else class="image-placeholder">
                    <ion-icon :icon="musicalNotes" />
                  </div>
                  <!-- Download progress overlay on thumbnail -->
                  <div
                    v-if="
                      activeDownloads[audio._id] && activeDownloads[audio._id].status !== 'error'
                    "
                    class="thumb-dl-overlay"
                  >
                    <svg class="thumb-dl-svg" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="rgba(0,0,0,0.5)"
                        stroke-width="3"
                      />
                      <path
                        :stroke-dasharray="`${activeDownloads[audio._id].progress}, 100`"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#1db954"
                        stroke-width="3"
                      />
                    </svg>
                    <span class="thumb-dl-pct">{{ activeDownloads[audio._id].progress }}%</span>
                  </div>
                </div>

                <div class="track-info">
                  <h3
                    class="track-name"
                    :class="{ 'is-playing': audioStore.currentTrack?._id === audio._id }"
                  >
                    {{ audio.subTitle }}
                  </h3>
                  <p class="track-artist">
                    <ion-icon
                      :icon="playCircle"
                      color="primary"
                      v-if="audio.isDownloaded"
                      class="mini-status-icon"
                    />
                    {{ audio.title }} • Lecture
                  </p>

                  <!-- Download Progress Bar -->
                  <div v-if="activeDownloads[audio._id]" class="download-progress-row">
                    <template v-if="activeDownloads[audio._id].status === 'error'">
                      <span class="progress-pct error-text" style="color: #ff4d4d"
                        >Download failed.</span
                      >
                    </template>
                    <template v-else>
                      <div class="progress-bar-bg">
                        <div
                          class="progress-bar-fill"
                          :style="{ width: activeDownloads[audio._id].progress + '%' }"
                        ></div>
                      </div>
                      <span class="progress-pct"
                        >Downloading... {{ activeDownloads[audio._id].progress }}%</span
                      >
                    </template>
                  </div>
                </div>

                <div class="track-actions">
                  <ion-icon
                    v-if="isFav(audio._id)"
                    :icon="heart"
                    class="small-fav-icon"
                    color="primary"
                  />
                  <ion-button fill="clear" @click.stop="openMenu($event, audio)" class="menu-btn">
                    <ion-icon slot="icon-only" :icon="ellipsisVertical" />
                  </ion-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Normal All/Favorites View -->
        <div v-else>
          <div v-if="isLoading && audios.length === 0" class="track-list">
            <div v-for="i in 10" :key="i" class="skeleton-track">
              <div class="skeleton-art"></div>
              <div class="skeleton-meta">
                <div class="line long"></div>
                <div class="line short"></div>
              </div>
            </div>
          </div>

          <div v-else class="track-list">
            <div v-if="displayAudios.length === 0" class="no-tracks">
              <span v-if="activeFilter === 'favorites'">No favorites added yet.</span>
              <span v-else-if="activeFilter === 'downloads'">No downloaded lectures yet.</span>
              <span v-else>No lectures found.</span>
            </div>
            <div
              v-for="audio in displayAudios"
              :key="audio._id"
              class="spotify-track-row"
              @click="handlePlay(audio)"
            >
              <div class="track-art">
                <img
                  v-if="getThumb(audio._id) || audio.thumbnail"
                  :src="getThumb(audio._id) || audio.thumbnail"
                  loading="lazy"
                  @error="handleImageError($event, audio._id)"
                  style="object-fit: cover; width: 100%; height: 100%"
                  referrerpolicy="no-referrer"
                />
                <div v-else class="image-placeholder">
                  <ion-icon :icon="musicalNotes" />
                </div>
                <!-- Download progress overlay on thumbnail -->
                <div
                  v-if="activeDownloads[audio._id] && activeDownloads[audio._id].status !== 'error'"
                  class="thumb-dl-overlay"
                >
                  <svg class="thumb-dl-svg" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="rgba(0,0,0,0.5)"
                      stroke-width="3"
                    />
                    <path
                      :stroke-dasharray="`${activeDownloads[audio._id].progress}, 100`"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#1db954"
                      stroke-width="3"
                    />
                  </svg>
                  <span class="thumb-dl-pct">{{ activeDownloads[audio._id].progress }}%</span>
                </div>
              </div>

              <div class="track-info">
                <h3
                  class="track-name"
                  :class="{ 'is-playing': audioStore.currentTrack?._id === audio._id }"
                >
                  {{ audio.subTitle }}
                </h3>
                <p class="track-artist">
                  <ion-icon
                    :icon="playCircle"
                    color="primary"
                    v-if="audio.isDownloaded"
                    class="mini-status-icon"
                  />
                  {{ audio.title }} • Lecture
                </p>

                <!-- Download Progress Bar -->
                <div v-if="activeDownloads[audio._id]" class="download-progress-row">
                  <template v-if="activeDownloads[audio._id].status === 'error'">
                    <span class="progress-pct error-text" style="color: #ff4d4d"
                      >Download failed.</span
                    >
                  </template>
                  <template v-else>
                    <div class="progress-bar-bg">
                      <div
                        class="progress-bar-fill"
                        :style="{ width: activeDownloads[audio._id].progress + '%' }"
                      ></div>
                    </div>
                    <span class="progress-pct"
                      >Downloading... {{ activeDownloads[audio._id].progress }}%</span
                    >
                  </template>
                </div>
              </div>

              <div class="track-actions">
                <ion-icon
                  v-if="isFav(audio._id)"
                  :icon="heart"
                  class="small-fav-icon"
                  color="primary"
                />
                <ion-button fill="clear" @click.stop="openMenu($event, audio)" class="menu-btn">
                  <ion-icon slot="icon-only" :icon="ellipsisVertical" />
                </ion-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ion-infinite-scroll
        v-if="activeFilter === 'all'"
        ref="infiniteScrollRef"
        @ionInfinite="loadData($event)"
      >
        <ion-infinite-scroll-content loadingSpinner="crescent" />
      </ion-infinite-scroll>
    </ion-content>

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
  </ion-page>
</template>

<script setup lang="ts">
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import {
  calendarOutline,
  chevronDownOutline,
  downloadOutline,
  ellipsisVertical,
  folderOutline,
  heart,
  heartOutline,
  moonOutline,
  musicalNotes,
  playCircle,
  refreshOutline,
  shareSocialOutline,
  sunnyOutline
} from 'ionicons/icons'
import { computed, onUnmounted, ref, watch } from 'vue'

import { useApi } from '@/composables/api'
import { useFavorites } from '@/composables/useFavorites'
import { useTheme } from '@/composables/useTheme'
import { useThumbnails } from '@/composables/useThumbnails'
import AudioPlayer from '@/views/AudioPlayer.vue'

import { onIonViewWillEnter } from '@ionic/vue'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar,
  actionSheetController,
  modalController
} from '@ionic/vue'

import { useAudioStore } from '../stores/audioStore'

// Local `Audio` shape mirrors `src/stores/audioStore.ts` to avoid path-alias type issues
interface Audio {
  _id: string
  title: string
  subTitle: string
  url: string
  fileTitle: string
  thumbnail?: string
  isDownloaded?: boolean
}

const { getAllAudio } = useApi()
const { loadFavorites, toggleFavorite, isFavorite, isFav } = useFavorites()
const { fetchThumbnails, getThumb, thumbnails, ensureThumbnail } = useThumbnails()
const { theme, toggleTheme } = useTheme()
const audioStore = useAudioStore()

const audios = ref<Audio[]>([])
const isLoading = ref(true)
const searchText = ref('')
const activeFilter = ref<'all' | 'favorites' | 'folders' | 'downloads'>('all')
const isOffline = ref(typeof navigator !== 'undefined' && !navigator.onLine)
let searchDebounce: ReturnType<typeof setTimeout> | null = null

const showDatePicker = ref(false)
const pickerDay = ref(new Date().getDate())
const pickerMonth = ref(new Date().getMonth() + 1)
const pickerYear = ref(new Date().getFullYear())

const yearRange = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let y = currentYear; y >= currentYear - 5; y--) {
    years.push(y)
  }
  return years
})

const isDateSearch = computed(() => {
  return /^\d{4}[-.]\d{2}[-.]\d{2}$/.test(searchText.value)
})

function openDatePicker() {
  if (isDateSearch.value) {
    const cleanDate = searchText.value.replace(/\./g, '-')
    const parts = cleanDate.split('-')
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

async function applyDateFilter() {
  const year = pickerYear.value
  const month = String(pickerMonth.value).padStart(2, '0')
  const day = String(pickerDay.value).padStart(2, '0')
  searchText.value = `${year}-${month}-${day}`
  showDatePicker.value = false
  await resetAndLoad()
}

async function clearDateFilter() {
  searchText.value = ''
  await resetAndLoad()
}

function formatDisplayDate(dateStr: string): string {
  const cleanDate = dateStr.replace(/\./g, '-')
  const date = new Date(cleanDate)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface FolderStructure {
  [year: string]: {
    [monthNum: number]: {
      monthName: string
      days: {
        [day: number]: Audio[]
      }
    }
  }
}

const allAudiosForFolders = ref<Audio[]>([])
const isFoldersLoading = ref(false)

const folderSelectedYear = ref<string | null>(null)
const folderSelectedMonth = ref<number | null>(null)

const downloadedTracks = ref<Audio[]>([])
const downloadedTracksCount = ref(0)

const activeDownloads = ref<Record<string, { progress: number; status: 'downloading' | 'error' }>>(
  {}
)
let progressListener: any = null

async function setupProgressListener() {
  if (progressListener) return
  const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()
  if (!isNative) return

  try {
    progressListener = await Filesystem.addListener('progress', (event: any) => {
      const url = event.url
      const path = event.path

      for (const audioId of Object.keys(activeDownloads.value)) {
        const trackMeta =
          allAudiosForFolders.value.find((t) => t._id === audioId) ||
          audios.value.find((t) => t._id === audioId)
        if (
          trackMeta &&
          (trackMeta.url === url ||
            url?.includes(encodeURIComponent(trackMeta.fileTitle)) ||
            path?.includes(trackMeta.fileTitle))
        ) {
          const progressPercent =
            event.contentLength > 0 ? Math.round((event.bytes / event.contentLength) * 100) : 0
          activeDownloads.value[audioId] = {
            progress: progressPercent,
            status: 'downloading'
          }
          break
        }
      }
    })
  } catch (err) {
    console.warn('Could not register progress listener:', err)
  }
}

async function loadDownloadedSongs() {
  const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()
  if (!isNative) {
    downloadedTracks.value = []
    downloadedTracksCount.value = 0
    return
  }

  try {
    let files: string[] = []
    try {
      const res = await Filesystem.readdir({
        path: 'audios',
        directory: Directory.Data
      })
      files = res.files.map((f) => f.name)
    } catch (dirErr) {
      // Folder might not exist yet, which is fine
    }

    const downloadedSet = new Set(files)
    const tracks: Audio[] = []

    for (const audio of allAudiosForFolders.value) {
      const filename = `${audio.fileTitle}.mp3`
      if (downloadedSet.has(filename)) {
        tracks.push({
          ...audio,
          isDownloaded: true
        })
      }
    }
    downloadedTracks.value = tracks
    downloadedTracksCount.value = tracks.length
  } catch (err) {
    console.error('Error loading downloaded tracks:', err)
  }
}

async function handleDownloadToggle(audio: Audio) {
  const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()
  if (!isNative) {
    // Web download logic
    try {
      const response = await fetch(audio.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${audio.subTitle || audio.fileTitle}.mp3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Web download error:', err)
    }
    return
  }

  const isDownloaded = await checkIfDownloaded(audio.fileTitle)
  if (isDownloaded) {
    // Delete local file
    try {
      await Filesystem.deleteFile({
        path: `audios/${audio.fileTitle}.mp3`,
        directory: Directory.Data
      })
      audio.isDownloaded = false
      await loadDownloadedSongs()
    } catch (err) {
      console.error('Delete error:', err)
    }
  } else {
    // Download remote file
    try {
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

      activeDownloads.value[audio._id] = { progress: 0, status: 'downloading' }
      await setupProgressListener()

      await Filesystem.downloadFile({
        url: audio.url,
        path: `audios/${audio.fileTitle}.mp3`,
        directory: Directory.Data,
        progress: true
      })

      audio.isDownloaded = true
      delete activeDownloads.value[audio._id]
      await loadDownloadedSongs()
    } catch (err) {
      console.error('Download error:', err)
      activeDownloads.value[audio._id] = { progress: 0, status: 'error' }
      setTimeout(() => {
        if (activeDownloads.value[audio._id]?.status === 'error') {
          delete activeDownloads.value[audio._id]
        }
      }, 3000)
    }
  }
}

async function loadAllForFolders(forceRescan = false) {
  if (!forceRescan && allAudiosForFolders.value.length > 0) {
    // Already have metadata — just re-scan the downloads folder for up-to-date status
    await loadDownloadedSongs()
    return
  }
  isFoldersLoading.value = true
  try {
    const data = await getAllAudio(1, 3000)
    if (data?.docs) {
      allAudiosForFolders.value = data.docs
      try {
        localStorage.setItem('all_audios_metadata', JSON.stringify(data.docs))
      } catch (cacheErr) {
        console.warn('Could not cache metadata to localStorage:', cacheErr)
      }
      await loadDownloadedSongs()
    }
  } catch (error) {
    // Network unavailable — fall back to localStorage cache
    console.warn('Offline mode: loading metadata from localStorage cache')
    try {
      const cached = localStorage.getItem('all_audios_metadata')
      if (cached) {
        allAudiosForFolders.value = JSON.parse(cached)
        await loadDownloadedSongs()
      }
    } catch (cacheErr) {
      console.error('Failed to load metadata from local offline cache:', cacheErr)
    }
  } finally {
    isFoldersLoading.value = false
  }
}

watch(activeFilter, (val) => {
  if (val === 'folders' || val === 'downloads') {
    loadAllForFolders()
  }
})

const structuredFolders = computed(() => {
  const structure: FolderStructure = {}

  allAudiosForFolders.value.forEach((doc) => {
    let parsedDate: Date | null = null

    // 1. Try parsing from title (which contains the actual discourse date)
    if (doc.title) {
      // YYYY-MM-DD or YYYY.MM.DD
      let match = doc.title.match(/^(\d{4})[-.](\d{2})[-.](\d{2})/)
      if (match) {
        parsedDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
      } else {
        // DD.MM.YYYY or DD-MM-YYYY
        match = doc.title.match(/^(\d{2})[-.](\d{2})[-.](\d{4})/)
        if (match) {
          parsedDate = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]))
        }
      }
    }

    // 2. Try parsing from fileTitle
    if (!parsedDate && doc.fileTitle) {
      // YYYY_MM_DD or YYYY-MM-DD or YYYY.MM.DD
      let match = doc.fileTitle.match(/^(\d{4})[-._](\d{2})[-._](\d{2})/)
      if (match) {
        parsedDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
      } else {
        // DD.MM.YYYY or DD-MM-YYYY or DD_MM_YYYY
        match = doc.fileTitle.match(/^(\d{2})[-._](\d{2})[-._](\d{4})/)
        if (match) {
          parsedDate = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]))
        }
      }
    }

    // 3. Fallback: Try date field (upload timestamp)
    if (!parsedDate && (doc as any).date) {
      const d = new Date((doc as any).date)
      if (!isNaN(d.getTime())) {
        parsedDate = d
      }
    }

    const year = parsedDate ? parsedDate.getFullYear().toString() : 'Unknown'
    const monthNum = parsedDate ? parsedDate.getMonth() + 1 : 0
    const monthName = parsedDate
      ? parsedDate.toLocaleString('default', { month: 'long' })
      : 'Unknown'
    const day = parsedDate ? parsedDate.getDate() : 0

    if (!structure[year]) {
      structure[year] = {}
    }
    if (!structure[year][monthNum]) {
      structure[year][monthNum] = {
        monthName,
        days: {}
      }
    }
    if (!structure[year][monthNum].days[day]) {
      structure[year][monthNum].days[day] = []
    }

    structure[year][monthNum].days[day].push(doc)
  })

  return structure
})

const folderItems = computed(() => {
  const structure = structuredFolders.value

  // Level 1: Years
  if (folderSelectedYear.value === null) {
    const list = Object.keys(structure)
      .sort((a, b) => {
        if (a === 'Unknown') return 1
        if (b === 'Unknown') return -1
        return b.localeCompare(a)
      })
      .map((year) => {
        let count = 0
        Object.values(structure[year]).forEach((m) => {
          Object.values(m.days).forEach((tracks) => {
            count += tracks.length
          })
        })
        return {
          id: year,
          label: year,
          count,
          type: 'year'
        }
      })
    return list
  }

  const selectedYear = folderSelectedYear.value
  const yearData = structure[selectedYear] || {}

  // Level 2: Months
  if (folderSelectedMonth.value === null) {
    return Object.keys(yearData)
      .map((m) => parseInt(m))
      .sort((a, b) => b - a)
      .map((monthNum) => {
        const mData = yearData[monthNum]
        let count = 0
        Object.values(mData.days).forEach((tracks) => {
          count += tracks.length
        })
        return {
          id: monthNum.toString(),
          label: mData.monthName,
          count,
          type: 'month',
          monthNum
        }
      })
  }

  return []
})

const folderSelectedTracks = computed((): Audio[] => {
  if (folderSelectedYear.value === 'Downloads') {
    return downloadedTracks.value
  }
  const structure = structuredFolders.value
  if (folderSelectedYear.value !== null && folderSelectedMonth.value !== null) {
    const monthData = structure[folderSelectedYear.value]?.[folderSelectedMonth.value] || {
      days: {}
    }
    const tracks: Audio[] = []

    // Sort days ascending so Day 1, 2, 3... show first
    const sortedDays = Object.keys(monthData.days)
      .map((d) => parseInt(d))
      .sort((a, b) => a - b)

    sortedDays.forEach((day) => {
      const dayTracks = monthData.days[day] || []
      tracks.push(...dayTracks)
    })
    return tracks
  }
  return []
})

function selectFolderItem(item: any) {
  if (item.type === 'year' || item.type === 'downloads_folder') {
    folderSelectedYear.value = item.label
  } else if (item.type === 'month') {
    folderSelectedMonth.value = item.monthNum
  }
}

function goBackTo(level: number) {
  if (level === 0) {
    folderSelectedYear.value = null
    folderSelectedMonth.value = null
  } else if (level === 1) {
    folderSelectedMonth.value = null
  }
}

function getMonthName(monthNum: number): string {
  const d = new Date()
  d.setMonth(monthNum - 1)
  return d.toLocaleString('default', { month: 'long' })
}

async function handleFolderTrackPlay(audio: Audio) {
  audioStore.loadError = null

  const freshAudio: Audio = {
    ...audio,
    thumbnail: getThumb(audio._id) || audio.thumbnail || ''
  }

  const fullQueue = folderSelectedTracks.value.map((a) => ({
    ...a,
    thumbnail: getThumb(a._id) || a.thumbnail || ''
  }))
  audioStore.setQueue(fullQueue)

  await audioStore.playSong(freshAudio)

  const existing = await modalController.getTop()
  if (!existing) {
    const modal = await modalController.create({
      component: AudioPlayer,
      cssClass: 'full-player-modal'
    })
    await modal.present()
  }
}

function onSearchInput(e: CustomEvent) {
  const val = (e.detail?.value ?? '') as string
  searchText.value = val
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => resetAndLoad(), 450)
}

function onSearchClear() {
  searchText.value = ''
  if (searchDebounce) clearTimeout(searchDebounce)
  resetAndLoad()
}

const page = ref(1)
const limit = 30
const totalAudiosCount = ref(0)
const infiniteScrollRef = ref<any>(null)

const displayAudios = computed((): Audio[] => {
  if (activeFilter.value === 'favorites') {
    return audios.value.filter((a: Audio) => isFavorite(a._id))
  }
  if (activeFilter.value === 'downloads') {
    return downloadedTracks.value
  }
  return audios.value
})

async function loadData(event?: any) {
  // Skip API fetch when offline — the catch block fallback handles it
  if (isOffline.value) {
    isLoading.value = false
    if (event?.target) event.target.complete()
    return
  }
  try {
    const currentPage = event?.target ? page.value + 1 : 1
    const query = searchText.value

    // Check if the query is a date of format YYYY-MM-DD
    const dateMatch = query.match(/^(\d{4})-(\d{2})-(\d{2})$/)

    let data: any = null

    if (currentPage === 1 && dateMatch) {
      const yyyy = dateMatch[1]
      const mm = dateMatch[2]
      const dd = dateMatch[3]

      const formats = [
        `${yyyy}-${mm}-${dd}`,
        `${yyyy}.${mm}.${dd}`,
        `${dd}.${mm}.${yyyy}`,
        `${yyyy}_${mm}_${dd}`
      ]

      // Fetch all formats in parallel
      const results = await Promise.all(
        formats.map((f) => getAllAudio(1, limit, f).catch(() => null))
      )

      // Merge results, removing duplicates
      const mergedDocs: any[] = []
      const seenIds = new Set<string>()

      results.forEach((res) => {
        if (res?.docs) {
          res.docs.forEach((doc: any) => {
            if (!seenIds.has(doc._id)) {
              seenIds.add(doc._id)
              mergedDocs.push(doc)
            }
          })
        }
      })

      data = {
        docs: mergedDocs,
        total: mergedDocs.length
      }

      // Disable infinite scroll since we fetched all formats
      try {
        const el = infiniteScrollRef.value?.$el ?? infiniteScrollRef.value
        if (el) el.disabled = true
      } catch {
        /* ignore */
      }
    } else {
      // Normal search or regular page scroll
      data = await getAllAudio(currentPage, limit, query)
    }

    if (data?.docs) {
      totalAudiosCount.value = data.total || 0
      const processed = data.docs.map((doc) => ({
        ...doc,
        thumbnail: '', // Start with no thumbnail - show placeholder
        isDownloaded: false
      }))

      if (currentPage === 1) {
        audios.value = processed
      } else {
        audios.value.push(...processed)
        page.value++
      }

      // Load thumbnails in background without blocking
      setTimeout(async () => {
        // First fetch the thumbnail list
        await fetchThumbnails()

        // Scan downloaded folder once to support fast lookup
        let downloadedSet = new Set<string>()
        try {
          const isNative =
            typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()
          if (isNative) {
            const res = await Filesystem.readdir({
              path: 'audios',
              directory: Directory.Data
            })
            downloadedSet = new Set(res.files.map((f) => f.name))
          }
        } catch {
          /* ignore */
        }

        // Then load thumbnails and download status for each audio progressively
        for (let i = 0; i < processed.length; i++) {
          const audio = processed[i]
          const found = audios.value.find((a: Audio) => a._id === audio._id)
          if (!found) continue

          try {
            // Get thumbnail URL first (instant)
            const thumbUrl = getThumb(audio._id)
            if (thumbUrl) {
              found.thumbnail = thumbUrl
            }

            // Then ensure it's cached locally (async, doesn't block)
            if (i < 5) {
              ensureThumbnail(audio._id)
                .then((local) => {
                  if (local && found) {
                    found.thumbnail = local
                  }
                })
                .catch(() => {})
            }
          } catch {
            /* ignore */
          }

          // Check download status instantly using the Set!
          found.isDownloaded = downloadedSet.has(`${audio.fileTitle}.mp3`)
        }
      }, 100)
    }

    if (event?.target) {
      event.target.complete()
      if (audios.value.length >= totalAudiosCount.value) {
        event.target.disabled = true
      }
    }
  } catch (error) {
    console.error('Load Error:', error)
    // If offline and loading first page, load fallback from local cache
    const currentPage = event?.target ? page.value + 1 : 1
    if (currentPage === 1) {
      try {
        const cached = localStorage.getItem('all_audios_metadata')
        if (cached) {
          const parsed = JSON.parse(cached)
          const processed = parsed.slice(0, 100).map((doc: any) => ({
            ...doc,
            thumbnail: '',
            isDownloaded: false
          }))
          audios.value = processed

          // Scan downloaded folder once to support fast lookup offline
          let downloadedSet = new Set<string>()
          try {
            const isNative =
              typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()
            if (isNative) {
              const res = await Filesystem.readdir({
                path: 'audios',
                directory: Directory.Data
              })
              downloadedSet = new Set(res.files.map((f) => f.name))
            }
          } catch {
            /* ignore */
          }

          audios.value.forEach((found: any) => {
            found.isDownloaded = downloadedSet.has(`${found.fileTitle}.mp3`)
          })

          totalAudiosCount.value = parsed.length
        }
      } catch (cacheErr) {
        console.error('Could not load main list fallback from cache:', cacheErr)
      }
    }
  } finally {
    isLoading.value = false
  }
}

async function resetAndLoad() {
  page.value = 1
  audios.value = []
  isLoading.value = true
  // Use $el to access the native element and re-enable infinite scroll
  try {
    const el = infiniteScrollRef.value?.$el ?? infiniteScrollRef.value
    if (el) await el.complete?.()
    // Re-enable by removing disabled attribute on the native element
    if (el) el.disabled = false
  } catch {
    /* ignore */
  }
  await loadData()
}

async function checkIfDownloaded(title: string): Promise<boolean> {
  // Filesystem is not available on web/desktop
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

async function handleRefresh(event: any) {
  searchText.value = ''
  await resetAndLoad()
  event.target.complete()
}

function handleImageError(event: Event, audioId: string) {
  const img = event.target as HTMLImageElement
  // Hide the broken image
  img.style.display = 'none'

  // Remove from cache so it doesn't try again
  const found = audios.value.find((a: Audio) => a._id === audioId)
  if (found) {
    found.thumbnail = '' // Clear it so placeholder shows
  }

  // Show fallback
  const parent = img.parentElement
  if (parent && !parent.querySelector('.fallback-icon')) {
    const fallbackDiv = document.createElement('div')
    fallbackDiv.className = 'image-placeholder'
    fallbackDiv.innerHTML = `
      <ion-icon name="musical-notes"></ion-icon>
    `
    fallbackDiv.style.cssText =
      'display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#1a1a1a;border-radius:8px;'
    parent.appendChild(fallbackDiv)
  }
}

async function handlePlay(audio: Audio) {
  // Clear any previous load errors before starting new track
  audioStore.loadError = null

  const freshAudio: Audio = {
    ...audio,
    thumbnail: getThumb(audio._id) || audio.thumbnail || ''
  }

  // Set the full displayed list as the queue so the player can navigate between songs
  const fullQueue = displayAudios.value.map((a) => ({
    ...a,
    thumbnail: getThumb(a._id) || a.thumbnail || ''
  }))
  audioStore.setQueue(fullQueue)

  await audioStore.playSong(freshAudio)

  // Open the full-screen player
  const existing = await modalController.getTop()
  if (!existing) {
    const modal = await modalController.create({
      component: AudioPlayer,
      cssClass: 'full-player-modal'
    })
    await modal.present()
  }
}

const openMenu = async (event: Event, audio: Audio) => {
  event.stopPropagation()
  const isDownloaded = await checkIfDownloaded(audio.fileTitle)

  const actionSheet = await actionSheetController.create({
    header: audio.subTitle,
    subHeader: audio.title,
    mode: 'ios',
    buttons: [
      {
        text: isFav(audio._id) ? 'Remove Favorite' : 'Add to Favorites',
        icon: isFav(audio._id) ? heart : heartOutline,
        handler: () => toggleFavorite(audio._id)
      },
      {
        text: isDownloaded ? 'Delete Download' : 'Download Lecture',
        icon: downloadOutline,
        handler: () => handleDownloadToggle(audio)
      },
      {
        text: 'Share Lecture',
        icon: shareSocialOutline,
        handler: () => Share.share({ title: audio.subTitle, url: audio.url })
      },
      { text: 'Cancel', role: 'cancel' }
    ]
  })
  await actionSheet.present()
}

onIonViewWillEnter(async () => {
  loadFavorites()

  // If offline, jump straight to Downloads tab and load from cache first
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
  if (isOffline) {
    activeFilter.value = 'downloads'
    // Await so downloads are populated BEFORE the view renders
    await loadAllForFolders(true)
    return
  }

  await fetchThumbnails()
  // Pre-load folders/downloads metadata (rescan local filesystem for newly downloaded files)
  loadAllForFolders(true)
  await resetAndLoad()
})

watch(
  () => thumbnails.value.length,
  (len) => {
    if (len > 0) {
      audios.value.forEach((a) => {
        if (!a.thumbnail) a.thumbnail = getThumb(a._id)
      })
    }
  }
)

onUnmounted(() => {
  if (progressListener) {
    progressListener.remove()
    progressListener = null
  }
  window.removeEventListener('offline', handleOffline)
  window.removeEventListener('online', handleOnline)
})

function handleOffline() {
  isOffline.value = true
  // Auto-switch to Downloads when device goes offline
  if (activeFilter.value === 'all') {
    activeFilter.value = 'downloads'
  }
  loadAllForFolders(true)
}

function handleOnline() {
  isOffline.value = false
  // When back online, reload data and go back to All if still on Downloads
  if (activeFilter.value === 'downloads') {
    activeFilter.value = 'all'
  }
  resetAndLoad()
}

window.addEventListener('offline', handleOffline)
window.addEventListener('online', handleOnline)
</script>

<style scoped lang="scss">
@import '@/theme/audiolist.scss';

ion-page {
  background: var(--bg-primary);
}
ion-content {
  --background: var(--bg-primary);
}

.spotify-container {
  padding-bottom: 20px;
  transition: padding-bottom var(--dur-normal) var(--ease-out);
}

/* When a song is playing, push content above the NowPlayingBar (62px) + tab bar (65px) + gap */
.spotify-container.has-bar {
  padding-bottom: calc(62px + 65px + env(safe-area-inset-bottom, 0px) + 8px) !important;
}

.track-name.is-playing {
  color: #1db954 !important;
}

.small-fav-icon {
  font-size: 18px;
  margin-right: 4px;
}

.search-bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-bottom: 14px;
}

.spotify-search {
  flex: 1;
  --background: var(--bg-secondary);
  --color: var(--text-primary);
  --placeholder-color: var(--text-secondary);
  --icon-color: var(--text-secondary);
  --clear-button-color: var(--text-secondary);
  --border-radius: 12px;
  --height: 48px;
  font-weight: 500;
  font-size: 15px;
  height: 48px;
  margin: 0;
  padding: 0;
  margin-bottom: 0 !important;
  transition: all 0.2s ease;

  &::part(searchbar-input-container) {
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: 12px;
    box-shadow: none;
    height: 48px;
  }

  &:focus-within::part(searchbar-input-container) {
    background: var(--hover-bg);
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb, 29, 185, 84), 0.1);
  }
}

.calendar-search-btn {
  --background: var(--bg-secondary);
  --color: var(--text-primary);
  --border-radius: 12px;
  --padding-start: 0;
  --padding-end: 0;
  --height: 48px;
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  width: 48px;
  height: 48px;
  margin: 0;
  flex-shrink: 0;
  background: var(--bg-secondary);
  cursor: pointer;
  transition: all 0.2s ease;

  ion-icon {
    font-size: 22px;
    color: var(--text-secondary);
    transition: color 0.2s;
  }

  &::part(native) {
    padding: 0;
    height: 100%;
  }

  &:active {
    background: var(--hover-bg);
    transform: scale(0.95);
    border-color: var(--accent-primary);

    ion-icon {
      color: var(--accent-primary);
    }
  }
}

.offline-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(220, 38, 38, 0.12);
  border-bottom: 1px solid rgba(220, 38, 38, 0.3);
  color: #ff6b6b;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1px;
  animation: offlinePulse 2.5s ease-in-out infinite;
}

.offline-icon {
  font-size: 16px;
  flex-shrink: 0;
}

@keyframes offlinePulse {
  0%,
  100% {
    background: rgba(220, 38, 38, 0.12);
  }
  50% {
    background: rgba(220, 38, 38, 0.2);
  }
}

.date-filter-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-top: 0px;
  margin-bottom: 14px;
  background: rgba(29, 185, 84, 0.08);
  border: 1px solid rgba(29, 185, 84, 0.2);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  border-radius: 12px;
}

.clear-filter-btn {
  background: rgba(29, 185, 84, 0.15);
  color: #1db954;
  border: none;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;

  &:active {
    background: rgba(29, 185, 84, 0.3);
    transform: scale(0.95);
  }
}

.date-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  padding: 20px;
  animation: fadeIn 0.25s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.date-picker-modal {
  background: var(--bg-primary);
  border-radius: 24px;
  border: 1px solid var(--border-primary);
  padding: 0;
  width: 100%;
  max-width: 340px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8);
  overflow: hidden;
  animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scaleUp {
  from {
    transform: scale(0.9) translateY(10px);
  }
  to {
    transform: scale(1) translateY(0);
  }
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);

  h3 {
    margin: 0;
    font-size: 19px;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.3px;
  }
}

.close-x {
  background: var(--hover-bg);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;

  &:active {
    background: var(--border-primary);
    color: var(--text-primary);
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
  gap: 8px;

  label {
    font-size: 10px;
    font-weight: 700;
    color: var(--accent-primary);
    text-transform: uppercase;
    letter-spacing: 1px;
    padding-left: 2px;
  }
}

.date-select {
  width: 100%;
  padding: 14px 10px;
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  background: var(--bg-secondary);
  color: var(--text-primary);
  appearance: none;
  -webkit-appearance: none;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23b3b3b3' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 28px;

  &:focus {
    border-color: var(--accent-primary);
    background: var(--hover-bg);
    outline: none;
  }

  option {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }
}

.picker-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 24px 24px;
  background: var(--bg-primary);
}

.apply-btn {
  width: 100%;
  background: var(--accent-primary);
  color: #000;
  border: none;
  border-radius: 24px;
  padding: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(var(--accent-primary-rgb, 29, 185, 84), 0.2);

  &:active {
    opacity: 0.85;
    transform: scale(0.98);
  }
}

.cancel-btn {
  width: 100%;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 24px;
  padding: 13px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;

  &:active {
    background: var(--hover-bg);
    color: var(--text-primary);
    transform: scale(0.98);
  }
}

.folder-view-container {
  padding: 16px 0 40px;
}

.folder-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #b3b3b3;

  p {
    margin-top: 16px;
    font-size: 14px;
    font-weight: 600;
  }
}

.folder-breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding: 10px 16px;
  background: #282828;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.05);

  .crumb-link {
    color: #1db954;
    cursor: pointer;
    transition: color 0.2s;
    &:active {
      color: #1aa34a;
    }
  }
  .crumb-text {
    color: #b3b3b3;
  }
}

.folder-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (min-width: 480px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.folder-card {
  background: #282828;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:active {
    background: #333333;
    transform: scale(0.96);
  }
}

.folder-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(29, 185, 84, 0.1);
  color: #1db954;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;

  ion-icon {
    font-size: 28px;
  }
}

.folder-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.folder-label {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.folder-count {
  font-size: 11px;
  font-weight: 600;
  color: #b3b3b3;
}

.no-tracks {
  padding: 40px 20px;
  text-align: center;
  color: #b3b3b3;
  font-size: 14px;
  font-weight: 600;
}

.folder-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.folder-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #282828;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:active {
    background: #333333;
    transform: scale(0.98);
  }
}

.item-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.list-folder-icon {
  font-size: 24px;
  color: #1db954;
}

.list-folder-label {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
}

.list-folder-count {
  font-size: 12px;
  font-weight: 600;
  color: #b3b3b3;
}

.download-progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
  width: 100%;
  max-width: 250px;
}

.progress-bar-bg {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: #1db954;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-pct {
  font-size: 11px;
  font-weight: 600;
  color: #1db954;
  white-space: nowrap;
}
</style>
