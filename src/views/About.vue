<script setup lang="ts">
// eslint-disable-next-line vue/multi-word-component-names
import {
  callOutline,
  chevronForwardOutline,
  globeOutline,
  locationOutline,
  logoFacebook,
  logoInstagram,
  logoWhatsapp,
  logoYoutube,
  mailOutline
} from 'ionicons/icons'

import { IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/vue'
</script>

<template>
  <ion-page>
    <ion-header class="ion-no-border app-header">
      <ion-toolbar class="app-toolbar">
        <ion-title class="app-title">About</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :scroll-events="true">
      <div class="page-root">
        <!-- ── Hero ─────────────────────────────────── -->
        <div class="hero">
          <div class="hero-glow" />
          <div class="avatar-wrap">
            <img
              src="https://images.pexels.com/photos/35665778/pexels-photo-35665778.jpeg"
              alt="Shri Madhusudan Bapuji"
              class="avatar"
            />
          </div>
          <h1 class="hero-name">Shri Madhusudan Bapuji</h1>
          <p class="hero-role">Spiritual Philosopher &amp; Preacher</p>
          <div class="hero-tags">
            <span class="tag">Bhagavad Gita</span>
            <span class="tag">Srimad Bhagavatam</span>
            <span class="tag">Devotion</span>
          </div>
        </div>

        <!-- ── Mantra Banner ─────────────────────────── -->
        <div class="mantra-banner">
          <p class="mantra-text">Hare Krishna Hare Krishna · Krishna Krishna Hare Hare</p>
          <p class="mantra-text">Hare Rama Hare Rama · Rama Rama Hare Hare</p>
        </div>

        <!-- ── Bio Cards ─────────────────────────────── -->
        <div class="section">
          <div class="bio-card">
            <div class="bio-icon">🕉️</div>
            <div>
              <h3 class="bio-title">Spiritual Lineage</h3>
              <p class="bio-text">
                A devoted preacher under the guidance of
                <strong>Kirtanananda Swami Srila Bhaktipada</strong>, inspiring a life of devotion,
                discipline, and inner clarity.
              </p>
            </div>
          </div>

          <div class="bio-card">
            <div class="bio-icon">🏛️</div>
            <div>
              <h3 class="bio-title">Anand Vrindavan Dham</h3>
              <p class="bio-text">
                Founder of a sacred centre for daily discourses on
                <strong>Bhagavad Gita</strong> and <strong>Srimad Bhagavatam</strong> — making
                spiritual wisdom accessible to all.
              </p>
            </div>
          </div>
        </div>

        <!-- ── Contact ───────────────────────────────── -->
        <div class="section">
          <p class="section-label">CONTACT</p>
          <div class="list-group">
            <div class="list-row no-link">
              <div class="list-icon-wrap" style="background: rgba(255, 149, 0, 0.15)">
                <ion-icon :icon="locationOutline" style="color: #ff9500" />
              </div>
              <div class="list-body">
                <span class="list-label">Address</span>
                <span class="list-value">Sant Madhusudan Ashram, Ulhasnagar</span>
              </div>
            </div>

            <div class="list-sep" />

            <a class="list-row" href="tel:+919422485242">
              <div class="list-icon-wrap" style="background: rgba(52, 199, 89, 0.15)">
                <ion-icon :icon="callOutline" style="color: #34c759" />
              </div>
              <div class="list-body">
                <span class="list-label">Phone</span>
                <span class="list-value">+91 9422485242</span>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="list-chevron" />
            </a>

            <div class="list-sep" />

            <a class="list-row" href="mailto:anandvrindavandham@gmail.com">
              <div class="list-icon-wrap" style="background: rgba(0, 122, 255, 0.15)">
                <ion-icon :icon="mailOutline" style="color: #007aff" />
              </div>
              <div class="list-body">
                <span class="list-label">Email</span>
                <span class="list-value">anandvrindavandham@gmail.com</span>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="list-chevron" />
            </a>

            <div class="list-sep" />

            <a class="list-row" href="https://piyush-chaubey.netlify.app/" target="_blank">
              <div class="list-icon-wrap" style="background: rgba(142, 142, 147, 0.15)">
                <ion-icon :icon="globeOutline" style="color: #8e8e93" />
              </div>
              <div class="list-body">
                <span class="list-label">Developer</span>
                <span class="list-value">Developed by Piyush chaubey</span>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="list-chevron" />
            </a>
          </div>
        </div>

        <!-- ── Social ────────────────────────────────── -->
        <div class="section">
          <p class="section-label">FOLLOW US</p>
          <div class="social-grid">
            <a
              href="https://www.facebook.com/ShriMadhusudanBapuji"
              target="_blank"
              class="social-card"
              style="--s-color: #1877f2"
            >
              <ion-icon :icon="logoFacebook" class="s-icon" />
              <span>Facebook</span>
            </a>
            <a
              href="https://chat.whatsapp.com/GFN2kOBx9wR0eLNZluoCX6"
              target="_blank"
              class="social-card"
              style="--s-color: #25d366"
            >
              <ion-icon :icon="logoWhatsapp" class="s-icon" />
              <span>WhatsApp</span>
            </a>
            <a
              href="https://youtube.com/@shrimadhusudanbapuji"
              target="_blank"
              class="social-card"
              style="--s-color: #ff0000"
            >
              <ion-icon :icon="logoYoutube" class="s-icon" />
              <span>YouTube</span>
            </a>
            <a
              href="https://www.instagram.com/shri_madhusudan_bapuji"
              target="_blank"
              class="social-card"
              style="--s-color: #e1306c"
            >
              <ion-icon :icon="logoInstagram" class="s-icon" />
              <span>Instagram</span>
            </a>
          </div>
        </div>

        <!-- ── Mission ───────────────────────────────── -->
        <div class="section">
          <p class="section-label">OUR MISSION</p>
          <div class="mission-card">
            <p class="mission-text">
              A dedicated platform offering devotional content and resources to enhance your
              spiritual journey — making spiritual practices accessible and meaningful to all.
            </p>
          </div>
        </div>

        <!-- ── Footer ────────────────────────────────── -->
        <div class="footer">
          <p class="copy">© 2026 Anand Vrindavan Dham</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
/* ── Reset / Base ─────────────────────────────────── */
* {
  box-sizing: border-box;
}

ion-page {
  background: var(--bg-primary);
}
ion-content {
  --background: var(--bg-primary);
}

/* ── Page root ────────────────────────────────────── */
.page-root {
  padding-bottom: 40px;
  background: var(--bg-primary);
}

/* ── Hero ─────────────────────────────────────────── */
.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px 24px 28px;
  overflow: hidden;
}

.hero-glow {
  display: none;
}

.avatar-wrap {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary), #f5a623);
  box-shadow: 0 12px 32px rgba(29, 185, 84, 0.35);
  margin-bottom: 16px;
  flex-shrink: 0;
  transition: transform var(--dur-normal) var(--ease-spring);
}

.avatar-wrap:active {
  transform: scale(0.96);
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  border: 3px solid var(--bg-primary);
}

.hero-name {
  font-family: var(--font-display);
  font-size: var(--text-title2);
  font-weight: 700;
  letter-spacing: var(--ls-title2);
  line-height: var(--lh-snug);
  color: var(--text-primary);
  margin: 0 0 6px;
  text-align: center;
}

.hero-role {
  font-family: var(--font-text);
  font-size: var(--text-footnote);
  font-weight: 400;
  letter-spacing: var(--ls-footnote);
  color: var(--text-secondary);
  margin: 0 0 16px;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.tag {
  padding: 5px 12px;
  border-radius: 100px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  font-family: var(--font-text);
  font-size: var(--text-caption1);
  font-weight: 500;
  letter-spacing: var(--ls-caption1);
  color: var(--accent-primary);
  transition:
    transform var(--dur-fast) var(--ease-out),
    background var(--dur-fast) var(--ease-out);
}

.tag:active {
  transform: scale(0.95);
  background: var(--hover-bg);
}

/* ── Mantra Banner ────────────────────────────────── */
.mantra-banner {
  margin: 0 16px 8px;
  padding: 18px 20px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(29, 185, 84, 0.12), rgba(29, 215, 96, 0.06));
  border: 1px solid rgba(29, 185, 84, 0.25);
  text-align: center;
}

.mantra-text {
  font-family: 'Georgia', 'Palatino Linotype', 'Times New Roman', serif;
  font-size: var(--text-subhead);
  font-weight: 700;
  font-style: italic;
  letter-spacing: 0.5px;
  line-height: var(--lh-relaxed);
  color: var(--accent-primary);
  margin: 3px 0;
}

/* ── Section wrapper ──────────────────────────────── */
.section {
  padding: 20px 16px 0;
}

.section-label {
  font-family: var(--font-text);
  font-size: var(--text-caption2);
  font-weight: 600;
  letter-spacing: var(--ls-caption2);
  color: var(--text-muted);
  margin: 0 4px 10px;
  text-transform: uppercase;
}

/* ── Bio Cards ────────────────────────────────────── */
.bio-card {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--border-secondary);
  margin-bottom: 10px;
  transition: transform var(--dur-fast) var(--ease-out);
}

.bio-card:active {
  transform: scale(0.99);
}

.bio-icon {
  font-size: 26px;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 2px;
}

.bio-title {
  font-family: var(--font-text);
  font-size: var(--text-subhead);
  font-weight: 600;
  letter-spacing: var(--ls-subhead);
  color: var(--text-primary);
  margin: 0 0 5px;
}

.bio-text {
  font-family: var(--font-text);
  font-size: var(--text-footnote);
  font-weight: 400;
  line-height: var(--lh-relaxed);
  color: var(--text-secondary);
  margin: 0;
}

.bio-text strong {
  color: var(--text-primary);
  font-weight: 600;
}

/* ── List Group (Contact) ─────────────────────────── */
.list-group {
  background: var(--bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--border-secondary);
  overflow: hidden;
}

.list-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  text-decoration: none;
  color: inherit;
  transition: background var(--dur-fast) var(--ease-out);
}

.list-row:active {
  background: var(--hover-bg);
}

.list-row.no-link {
  cursor: default;
}

.list-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
}

.list-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.list-label {
  font-family: var(--font-text);
  font-size: var(--text-caption2);
  font-weight: 500;
  letter-spacing: var(--ls-caption2);
  color: var(--text-muted);
  text-transform: uppercase;
}

.list-value {
  font-family: var(--font-text);
  font-size: var(--text-subhead);
  font-weight: 400;
  letter-spacing: var(--ls-subhead);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-chevron {
  font-size: 16px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.list-sep {
  height: 1px;
  background: var(--border-secondary);
  margin-left: 62px;
}

/* ── Social Grid ──────────────────────────────────── */
.social-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.social-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 12px;
  border-radius: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-secondary);
  text-decoration: none;
  transition:
    transform var(--dur-fast) var(--ease-spring),
    opacity var(--dur-fast) var(--ease-out);
}

.social-card:active {
  transform: scale(0.94);
  opacity: 0.8;
}

.s-icon {
  font-size: 30px;
  color: var(--s-color);
  transition: transform var(--dur-fast) var(--ease-spring);
}

.social-card span {
  font-family: var(--font-text);
  font-size: var(--text-caption1);
  font-weight: 600;
  letter-spacing: var(--ls-caption1);
  color: var(--text-secondary);
}

/* ── Mission Card ─────────────────────────────────── */
.mission-card {
  padding: 18px;
  background: var(--bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--border-secondary);
}

.mission-text {
  font-family: var(--font-text);
  font-size: var(--text-subhead);
  font-weight: 400;
  line-height: var(--lh-relaxed);
  color: var(--text-secondary);
  margin: 0;
}

/* ── Footer ───────────────────────────────────────── */
.footer {
  margin-top: 36px;
  padding: 0 16px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dev-name {
  color: var(--accent-primary);
  font-weight: 600;
}

.copy {
  font-family: var(--font-text);
  font-size: var(--text-caption1);
  font-weight: 400;
  color: var(--text-muted);
  margin: 0;
}
</style>
