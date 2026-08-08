<script setup lang="ts">
// eslint-disable-next-line vue/multi-word-component-names
import { onMounted, ref } from 'vue'

import { IonContent, IonHeader, IonPage, IonSpinner, IonTitle, IonToolbar } from '@ionic/vue'

const events = ref<any[]>([])
const loading = ref(true)

// ⚠️ SECURITY: Move API key to environment variables
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || 'AIzaSyCydaBITRUZLlP3w8ZdSgS6BRCsgn1OKms'
const calendarId = import.meta.env.VITE_GOOGLE_CALENDAR_ID || 'lovesrvc03@gmail.com'

const fetchVaishnavEvents = async () => {
  try {
    const today = new Date().toISOString()
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events` +
        `?key=${apiKey}` +
        `&timeMin=${today}` +
        `&orderBy=startTime` +
        `&singleEvents=true` +
        `&maxResults=15`
    )

    const data = await response.json()
    events.value = data.items || []
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (start: any) => {
  const date = new Date(start.date || start.dateTime)
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

onMounted(fetchVaishnavEvents)
</script>

<template>
  <ion-page>
    <ion-header class="ion-no-border app-header">
      <ion-toolbar class="app-toolbar">
        <ion-title class="app-title">Updates</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="updates-wrapper">
        <div class="section-banner">
          <h1>Upcoming Events</h1>
          <p>Important Vaishnav Tithis & Festivals</p>
        </div>

        <div v-if="loading" class="ion-text-center ion-padding mt-20">
          <ion-spinner name="crescent" color="warning"></ion-spinner>
          <p class="loading-text">Fetching Calendar...</p>
        </div>

        <div v-else class="events-list">
          <div v-if="events.length === 0" class="no-data">
            <p>No upcoming events found.</p>
          </div>

          <div v-for="event in events" :key="event.id" class="event-card">
            <div class="date-side">
              <span class="day">{{
                new Date(event.start.date || event.start.dateTime).getDate()
              }}</span>
              <span class="month">{{
                new Date(event.start.date || event.start.dateTime).toLocaleString('default', {
                  month: 'short'
                })
              }}</span>
            </div>

            <div class="info-side">
              <h3 class="event-title">{{ event.summary }}</h3>
              <div class="event-meta">
                <span class="full-date">{{ formatDate(event.start) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
ion-page {
  background: var(--bg-primary);
}
ion-content {
  --background: var(--bg-primary);
}

.updates-wrapper {
  padding: 0 16px 24px;
  background: var(--bg-primary);
  min-height: 100%;
}

.section-banner {
  padding: 20px 4px 16px;
}

.section-banner h1 {
  margin: 0 0 4px;
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: var(--text-title1);
  font-weight: 800;
  letter-spacing: var(--ls-title1);
  line-height: var(--lh-tight);
}

.section-banner p {
  color: var(--text-secondary);
  font-family: var(--font-text);
  font-size: var(--text-subhead);
  font-weight: 400;
  letter-spacing: var(--ls-subhead);
  margin: 0;
}

.event-card {
  background: var(--bg-secondary);
  margin-bottom: 12px;
  border-radius: 16px;
  display: flex;
  overflow: hidden;
  box-shadow: 0 4px 12px var(--shadow-primary);
  border: 1px solid var(--border-secondary);
  transition:
    transform var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out);
}

.event-card:active {
  transform: scale(0.98);
}

.date-side {
  background: var(--accent-primary);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 70px;
  padding: 10px;
}

.date-side .day {
  font-family: var(--font-display);
  font-size: var(--text-title2);
  font-weight: 800;
  letter-spacing: var(--ls-title2);
  line-height: 1;
}

.date-side .month {
  font-family: var(--font-text);
  font-size: var(--text-caption2);
  font-weight: 700;
  letter-spacing: var(--ls-caption2);
  text-transform: uppercase;
  margin-top: 2px;
}

.info-side {
  flex: 1;
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.event-title {
  margin: 0 0 6px;
  color: var(--text-primary);
  font-family: var(--font-text);
  font-size: var(--text-subhead);
  font-weight: 600;
  letter-spacing: var(--ls-subhead);
  line-height: var(--lh-snug);
}

.event-meta {
  display: flex;
  gap: 10px;
  align-items: center;
}

.full-date {
  color: var(--text-secondary);
  font-family: var(--font-text);
  font-size: var(--text-footnote);
  font-weight: 400;
  letter-spacing: var(--ls-footnote);
}

.no-data {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
  font-family: var(--font-text);
  font-size: var(--text-callout);
}

.loading-text {
  color: var(--text-secondary);
  font-family: var(--font-text);
  font-size: var(--text-subhead);
  margin-top: 10px;
}

.mt-20 {
  margin-top: 20px;
}
</style>
