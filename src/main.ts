/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/display.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/ionic-swiper.css'

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css'

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/typography.css'
import { createPinia } from 'pinia'
import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/keyboard'
import 'swiper/css/pagination'
import 'swiper/css/scrollbar'
import 'swiper/css/zoom'
import { register } from 'swiper/element/bundle'
import { createApp } from 'vue'
import withUUID from 'vue-uuid'

import App from './App.vue'
import { IonicVue } from '@ionic/vue'

import { setupGlobalErrorHandlers } from './composables/useErrorHandler'
import router from './router'
import './theme/variables.css'

register()

const pinia = createPinia()
const app = withUUID(
  createApp(App)
    .use(IonicVue, {
      // Disable ripple on Android — causes visual glitches in WebView
      rippleEffect: false,
      mode: 'md'
    })
    .use(router)
    .use(pinia)
)

router.isReady().then(() => {
  setupGlobalErrorHandlers(app)
  app.mount('#app')
})
