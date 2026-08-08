<script setup lang="ts">
// eslint-disable-next-line vue/multi-word-component-names
import { onMounted, ref } from 'vue'

import { useApi } from '@/composables/api'

import {
  InfiniteScrollCustomEvent,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/vue'

const { getVideoList } = useApi()
const videoList = ref<any>([])
const isLoading = ref<boolean>(true)
let apiToken = ''
let totalData = 0

async function loadInitialData() {
  const { data, isFinished, error, isFetching } = await getVideoList(apiToken)

  if (isFinished.value) {
    if (error.value) {
      console.error(error.value)
    }
    if (data.value) {
      const { totalResults, videos, token } = data.value
      // publishedAt = result.publishedAt;

      videoList.value = videos

      totalData = totalResults
      isLoading.value = isFetching.value
      apiToken = token
    }
  }
}
async function loadData(_event: InfiniteScrollCustomEvent) {
  const { data, isFinished, error } = await getVideoList(apiToken)

  if (isFinished.value) {
    if (error.value) {
      console.error(error.value)
    }
    if (data.value) {
      // Pagination handling reserved for future implementation
    }
  }
}

function YTDurationToSeconds(duration: any) {
  let match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)

  if (match) {
    match = match.slice(1).map(function (x: any) {
      if (x != null) {
        return x.replace(/\D/, '')
      }
    })

    const hours = parseInt(match[0]) || 0
    const minutes = parseInt(match[1]) || 0
    const seconds = parseInt(match[2]) || 0

    return hours * 3600 + minutes * 60 + seconds
  }
}

// Suppress unused-vars for variables assigned by the API but not yet fully wired
void totalData

onMounted(async () => {
  videoList.value = []
  loadInitialData()
})
</script>

<template>
  <ion-page>
    <ion-header class="ion-no-border app-header">
      <ion-toolbar class="app-toolbar">
        <ion-title class="app-title">Videos</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <!-- <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Videos</ion-title>
        </ion-toolbar>
      </ion-header> -->
      <ion-list v-if="isLoading">
        <ion-item v-for="index in 20" :key="index">
          <ion-label>
            <div class="skeleton-img">
              <ion-skeleton-text animated></ion-skeleton-text>
            </div>
          </ion-label>
        </ion-item>
      </ion-list>
      <ion-list v-if="!isLoading" lines="none">
        <ion-item v-for="(video, index) in videoList" :key="index" no-padding>
          <ion-card no-padding>
            <div class="img-card">
              <img :src="video?.thumbnail" alt="thumbnail" />
              <span class="video-duration">{{ YTDurationToSeconds(video?.duration) }}</span>
            </div>
            <ion-card-content>
              <ion-label text-wrap>
                <h2 class="video-title">{{ video?.title }}</h2>
                <div class="details">
                  <p class="video-count">{{ video?.viewCount }} views</p>
                  <p class="video-published">{{ video?.publishedAt }}</p>
                </div>
              </ion-label>
            </ion-card-content>
          </ion-card>
        </ion-item>
      </ion-list>
      <ion-infinite-scroll @ionInfinite="loadData">
        <ion-infinite-scroll-content loadingSpinner="bubbles" loadingText="Loading...">
        </ion-infinite-scroll-content>
      </ion-infinite-scroll>
    </ion-content>
  </ion-page>
</template>

<style scoped lang="scss">
.skeleton-img {
  width: 100%;
  height: 150px;
}

ion-content {
  ion-list {
    ion-item {
      --ion-safe-area-right: 0;
      ion-card {
        width: 100%;
        margin: 0 !important;
        border-radius: 0;
        ion-card-content {
          padding: 10px;
          padding-bottom: 25px;

          ion-label {
            .video-title {
              color: black;
            }

            .details {
              display: flex;

              .video-published {
                font-weight: 450;
              }
              .video-count::after {
                content: '•';
                margin: 7px;
              }

              .video-count {
                font-weight: 450;
              }
            }
          }
        }

        img {
          object-fit: cover;
          width: 100%;
          height: 150px;
        }

        .img-card {
          position: relative;

          .video-duration {
            background: black;
            color: white;
            position: absolute;
            right: 8px;
            bottom: 8px;
            border-radius: 3px;
            padding: 2px;
          }
        }

        img {
          height: 150px;
          width: 100%;
        }
      }

      ion-card {
      }
    }
  }
}
</style>
