<script setup lang="ts">
import {
  cameraOutline,
  musicalNotesOutline,
  newspaperOutline,
  personOutline,
  sparklesOutline
} from 'ionicons/icons'

import NowPlayingBar from '@/components/NowPlayingBar.vue'

import {
  IonIcon,
  IonLabel,
  IonPage,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs
} from '@ionic/vue'
</script>

<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>

      <!-- Now Playing bar — sits above tab bar -->
      <NowPlayingBar />

      <ion-tab-bar slot="bottom" class="custom-tab-bar">
        <ion-tab-button tab="audios" href="/tabs/audios">
          <ion-icon :icon="musicalNotesOutline" />
          <ion-label>Lectures</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="chant" href="/tabs/chant">
          <ion-icon :icon="sparklesOutline" />
          <ion-label>Chant</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="darshan" href="/tabs/darshan">
          <ion-icon :icon="cameraOutline" />
          <ion-label>Darshan</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="updates" href="/tabs/updates">
          <ion-icon :icon="newspaperOutline" />
          <ion-label>Updates</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="about" href="/tabs/about">
          <ion-icon :icon="personOutline" />
          <ion-label>About</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<style scoped>
.custom-tab-bar {
  --background: var(--bg-primary);
  --border-color: var(--border-secondary);
  border-top: 1px solid var(--border-color);
  height: 65px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  z-index: 1001;
}

ion-tab-button {
  --color: var(--text-secondary);
  --color-selected: var(--accent-primary);
  font-size: 9px;
}

ion-icon {
  font-size: 22px;
  margin-bottom: 2px;
}

ion-label {
  font-weight: 600;
  letter-spacing: 0.2px;
}
</style>
