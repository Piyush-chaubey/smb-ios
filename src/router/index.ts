import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'

import TabsPage from '@/views/TabsPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/audios'
  },
  {
    path: '/tabs',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/audios'
      },
      {
        path: 'audios',
        component: () => import('@/views/AudiosList.vue')
      },
      {
        path: 'darshan',
        component: () => import('@/views/DailyDarshan.vue')
      },
      {
        path: 'chant',
        component: () => import('@/views/Chant.vue')
      },
      {
        path: 'updates',
        component: () => import('@/views/Updates.vue')
      },
      {
        path: 'about',
        component: () => import('@/views/About.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
