<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { IonToast } from '@ionic/vue'

const props = defineProps<{
  isOpen: boolean
  message: string
}>()

const isOpen = ref<boolean>(props.isOpen)
const setOpen = (state: boolean) => {
  isOpen.value = state
}
onMounted(() => {
  console.log('mounted')
})
</script>
<template>
  <div>
    <ion-toast
      :is-open="isOpen"
      :message="message"
      :duration="5000"
      @didDismiss="setOpen(false)"
    ></ion-toast>
  </div>
</template>

<style scoped></style>
