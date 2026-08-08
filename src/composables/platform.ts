import { useWindowSize } from '@vueuse/core'
import { computed } from 'vue'

import { isPlatform } from '@ionic/vue'

export function usePlatform() {
  const isWeb = isPlatform('desktop') || isPlatform('mobileweb')
  const isMobile = isPlatform('mobile')
  const isIOS = isPlatform('ios')
  const isAndroid = isPlatform('android')
  const { width, height } = useWindowSize()

  return {
    isWeb,
    isMobile,
    isIOS,
    isAndroid,
    width: computed(() => width.value),
    height: computed(() => height.value)
  }
}
