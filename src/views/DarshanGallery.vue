<script setup lang="ts">
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { closeOutline, downloadOutline, ellipsisVertical, shareSocialOutline } from 'ionicons/icons'
import { computed, ref } from 'vue'

import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToast,
  IonToolbar,
  actionSheetController,
  modalController
} from '@ionic/vue'

const props = defineProps<{
  images: any[]
  index: number
}>()

const currentIndex = ref(props.index || 0)
const toastOpen = ref(false)
const toastMessage = ref('')
const close = () => modalController.dismiss()

const currentImage = computed(() => props.images?.[currentIndex.value] || props.images?.[0])

const showToast = (message: string) => {
  toastMessage.value = message
  toastOpen.value = true
}

const onSlideChange = (event: any) => {
  const swiper = event?.target?.swiper
  if (swiper?.activeIndex != null) {
    currentIndex.value = swiper.activeIndex
  }
}

async function openActionMenu() {
  const actionSheet = await actionSheetController.create({
    header: 'Darshan Actions',
    mode: 'ios',
    buttons: [
      {
        text: 'Share Darshan',
        icon: shareSocialOutline,
        handler: () => shareCurrentImage()
      },
      {
        text: 'Download Image',
        icon: downloadOutline,
        handler: () => downloadCurrentImage()
      },
      { text: 'Cancel', role: 'cancel' }
    ]
  })
  await actionSheet.present()
}

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

async function shareCurrentImage() {
  if (!currentImage.value?.url) return
  try {
    await Share.share({
      title: 'Daily Darshan',
      text: 'Sharing this beautiful darshan image.',
      url: currentImage.value.url
    })
  } catch (err) {
    console.error(err)
    showToast('Unable to share this image')
  }
}

async function downloadCurrentImage() {
  if (!currentImage.value?.url) return
  try {
    if (Capacitor.getPlatform() === 'web') {
      const link = document.createElement('a')
      link.href = currentImage.value.url
      link.download = `darshan-${currentImage.value.id || currentIndex.value}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showToast('Download started')
      return
    }

    const response = await fetch(currentImage.value.url)
    const blob = await response.blob()
    const base64 = await blobToBase64(blob)
    await Filesystem.writeFile({
      path: `downloads/darshan-${currentImage.value.id || currentIndex.value}.jpg`,
      data: base64.split(',')[1],
      directory: Directory.Documents,
      recursive: true
    })
    showToast('Saved to device')
  } catch (err) {
    console.error(err)
    showToast('Download failed')
  }
}
</script>

<template>
  <ion-page class="gallery-page">
    <ion-header class="ion-no-border">
      <ion-toolbar color="transparent">
        <ion-buttons slot="start">
          <ion-button @click="close" color="light">
            <ion-icon :icon="closeOutline" slot="icon-only" />
          </ion-button>
        </ion-buttons>
        <ion-title color="light" class="ion-text-center">Darshan Gallery</ion-title>
        <ion-buttons slot="primary">
          <ion-button @click="openActionMenu" color="light">
            <ion-icon :icon="ellipsisVertical" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content color="dark" :scroll-y="false">
      <swiper-container
        :initial-slide="currentIndex"
        slides-per-view="1"
        :zoom="{ maxRatio: 3 }"
        class="full-swiper"
        @slidechange="onSlideChange"
      >
        <swiper-slide v-for="(img, i) in images" :key="i">
          <div class="swiper-zoom-container">
            <img :src="img.url" class="main-img" />
          </div>
        </swiper-slide>
      </swiper-container>

      <div class="gallery-footer">Drag to slide • Pinch to zoom</div>
      <ion-toast
        :is-open="toastOpen"
        :message="toastMessage"
        :duration="2500"
        @didDismiss="toastOpen = false"
      />
    </ion-content>
  </ion-page>
</template>

<style scoped>
.gallery-page {
  --ion-background-color: #000;
}
.full-swiper {
  width: 100%;
  height: 100%;
}
.main-img {
  width: 100%;
  max-height: 85vh;
  object-fit: contain;
}
.swiper-zoom-container {
  display: flex;
  align-items: center;
  justify-content: center;
}
.gallery-footer {
  position: absolute;
  bottom: 30px;
  width: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 11px;
}
ion-toolbar {
  --background: transparent;
  position: absolute;
  top: 0;
  z-index: 10;
}
</style>
