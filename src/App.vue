<script setup lang="ts">
import { App as CapApp } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'

import { useAudioStore } from '@/stores/audioStore'
import { useGlobalStore } from '@/stores/global'

import { IonApp, IonRouterOutlet, IonToast, modalController } from '@ionic/vue'

const globalStore = useGlobalStore()
const audioStore = useAudioStore()
const { isOpen, message } = storeToRefs(globalStore)

const setOpen = (state: boolean) => {
  isOpen.value = state
}

onMounted(async () => {
  await SplashScreen.hide()

  // Handle Android Hardware Back Button at Global Level
  CapApp.addListener('backButton', async (event) => {
    const topModal = await modalController.getTop()

    if (topModal) {
      await modalController.dismiss()
    } else if (audioStore.currentTrack) {
      await audioStore.stopSong()
    } else if (!event.canGoBack) {
      CapApp.exitApp()
    }
  })
})
</script>

<template>
  <ion-app>
    <ion-router-outlet />

    <ion-toast :is-open="isOpen" :message="message" :duration="2000" @didDismiss="setOpen(false)" />
  </ion-app>
</template>
