# App Modernization: Spotify-Style Streaming Architecture

## Overview

This document summarizes the complete modernization of the `app-avd` codebase to implement a **Spotify-style streaming engine** with Vue 3 Composition API, Ionic Framework, Pinia state management, Capacitor native runtime, and runtime validation via Zod.

---

## 1. Architectural Changes

### Core Target Stack

- **Vue 3:** Strict `<script setup lang="ts">` (no Options API, no mixins)
- **Pinia:** Setup store functional syntax (`defineStore('id', () => { ... })`)
- **Ionic Vue & Router:** Native lifecycle hooks (`onIonViewWillEnter`, `onIonViewWillLeave`)
- **Capacitor:** `CapacitorHttp` for CORS-free network requests on Android/iOS
- **Native Playback:** `@capacitor-community/native-audio` with web fallback
- **Runtime Validation:** `zod` for all API response schemas

### Breaking Changes from Legacy Code

1. **Vue Options API → Composition API:**
   - Removed mixins and `defineComponent()` boilerplate
   - All components now use `<script setup lang="ts">` with typed props/emits

2. **Vuex → Pinia:**
   - Replaced Vuex stores with Pinia setup stores
   - Updated all call sites to use new store API signatures

3. **Browser Fetch → CapacitorHttp:**
   - All network calls now use `@capacitor/core.CapacitorHttp.request()` to bypass Android WebView CORS restrictions
   - Fallback to fetch on web platform

4. **Unvalidated JSON → Zod Schemas:**
   - Added runtime schema validation for `audio`, `darshan`, and `image` responses
   - API fails fast with clear validation errors instead of runtime crashes

5. **Generic Mount → Ionic Lifecycle:**
   - Replaced `onMounted()` with `onIonViewWillEnter()` for pages cached by the Ionic router
   - Pages initialize only when they become visible

---

## 2. File Structure & Key Changes

### Composables (`src/composables/`)

- **`api.ts`:** CapacitorHttp wrapper + zod validation; exports `getAllAudio()`, `getDailyDarshan()`
- **`platform.ts`:** Platform helpers (isWeb, isIos, isAndroid, viewport size)
- **`useFavorites.ts`:** Persistence via Capacitor Storage (with localStorage fallback); exports `isFav`, `toggleFavorite`
- **`useThumbnails.ts`:** Filesystem prefetch to `Directory.Cache`, returns local URIs; exports `ensureThumbnail(id)`
- **`date.ts`:** Utility wrappers for dayjs parsing
- **`useTheme.ts`:** Theme switching via CSS variables

### Stores (`src/stores/`)

- **`audioStore.ts`:** Spotify-style streaming engine
  - Queue-based playback with `currentTrack`, `isPlaying`, `currentTime`, `duration`
  - Native audio (`NativeAudio.preload`, `play`, `pause`, `stop`) on Android/iOS
  - Web fallback (HTMLAudioElement with crossOrigin/preload)
  - Methods: `playSong()`, `togglePlay()`, `seekTo()`, `nextTrack()`, `previousTrack()`, `prefetchTrack()`
- **`global.ts`:** Filesystem paths and cache helpers; exports Capacitor Directory refs
- **`image.ts`:** Typed image cache with zod validation; exports `addImage()`, `updateImage()`, `getImage()`

### Views (`src/views/`)

- **`TabsPage.vue`:** Tab router shell (no changes needed)
- **`AudiosList.vue`:** Audio list with prefetch; calls `ensureThumbnail()` and `audioStore.prefetchTrack()` for top 3 tracks
- **`DailyDarshan.vue`:** Infinite-scroll darshan feed with typed API responses
- **`Chant.vue`:** Mala counter with Ionic lifecycle hooks (`onIonViewWillEnter/Leave`)
- **`AudioPlayer.vue`:** Full-screen player consuming `audioStore` state (currentTrack, isPlaying, seek)
- **`DarshanGallery.vue`:** Fullscreen gallery using `swiper/element/bundle` custom elements

### Components (`src/components/`)

- **`MiniPlayer.vue`:** Floating now-playing card tied to `audioStore.currentTrack`; uses progress bar binding

### Entry (`src/`)

- **`main.ts`:** Registers Swiper custom elements, initializes Pinia + Ionic + Vue Router
- **`router/index.ts`:** Tab-based routing with Ionic lifecycle preservation

---

## 3. Spotify-Style Architecture

### Control Plane

- `api.ts` parses lightweight metadata JSON and returns `streamUrl` only
- No binary audio data flows through the HTTP layer

### Data Plane

- `audioStore.ts` feeds `streamUrl` to native audio plugin via `NativeAudio.preload({ isUrl: true })`
- Native plugin manages playback on background media thread (continues when screen locks)

### Prefetching

- Thumbnails prefetch to Filesystem cache in parallel
- Top 3 audio tracks prefetch via `audioStore.prefetchTrack()` for near-instant playback

### Cleanup

- `stopSong()` unloads native assets and destroys web audio
- `beforeunload` listener attempts cleanup on web

---

## 4. Setup & Build Instructions

### Prerequisites

- Node.js v20+
- npm or yarn
- Android SDK + emulator (for Android testing)
- Xcode + iOS simulator (for iOS testing)

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env.local` file (or configure via Vite):

```
VITE_BASE_SERVER_URL=https://your-api-server.com
VITE_FB_TOKEN=your_facebook_graph_token
```

### Development Server

```bash
npm run dev
```

Runs Vite dev server on `http://localhost:5173` (default).

### Build for Deployment

```bash
npm run build
```

Outputs optimized bundles to `dist/`.

### Web Fallback Testing

```bash
npm run preview
```

Runs a local preview server on the built output.

---

## 5. Device / Emulator Testing

### Android (Emulator or Device)

#### Setup

1. Ensure Android SDK is installed and ANDROID_HOME is set:

   ```bash
   echo $ANDROID_HOME  # should output Android SDK path
   ```

2. Create or start an Android emulator:
   ```bash
   emulator -list-avds  # list available emulators
   emulator -avd Pixel_6_API_35 &  # start emulator
   ```

#### Deploy to Android

```bash
npm run build
npx cap sync android
npx cap open android
```

Then:

- In Android Studio, click **Run** or press **Shift+F10**
- Or build and install APK:
  ```bash
  cd android && ./gradlew assembleDebug && npx cap copy && cd ..
  adb install -r android/app/build/outputs/apk/debug/app-debug.apk
  ```

#### Test Checklist

- [ ] App launches without crashes
- [ ] AudiosList loads and displays 10+ audio items
- [ ] Thumbnails load in parallel (should appear within 1-2 seconds)
- [ ] Clicking a track starts playback (native audio plugin feedback)
- [ ] MiniPlayer shows current track with live progress bar
- [ ] Seek/pause/play controls respond to taps
- [ ] Next/Previous controls navigate queue
- [ ] DarshanGallery opens fullscreen with swiper gestures
- [ ] Rotating device does not crash (Ionic layout recomputes)
- [ ] Closing app and relaunching preserves favorites + chant counter

### iOS (Simulator or Device)

#### Setup

1. Ensure Xcode is installed:

   ```bash
   xcode-select --install  # or `xcode-select --switch /Applications/Xcode.app/Contents/Developer`
   ```

2. Start iOS simulator:
   ```bash
   open -a Simulator  # or select via Xcode
   ```

#### Deploy to iOS

```bash
npm run build
npx cap sync ios
npx cap open ios
```

Then:

- In Xcode, select target simulator/device and click **Run** (Cmd+R)

#### Test Checklist

- Same as Android, plus:
  - [ ] Haptic feedback on Chant counter (if device has haptics)
  - [ ] Background playback continues when home button pressed
  - [ ] Pull-to-refresh on AudiosList works

### Web (Browser)

#### Launch

```bash
npm run dev
```

Open `http://localhost:5173` in Chrome, Firefox, or Safari.

#### Test Checklist

- [ ] App layout renders without layout shift
- [ ] AudiosList loads and prefetches thumbnails
- [ ] Clicking track starts HTMLAudioElement playback (web fallback)
- [ ] MiniPlayer displays and syncs time
- [ ] Seek slider works
- [ ] Favorites persist across page reload (check localStorage)
- [ ] DarshanGallery swiper works with mouse drag

---

## 6. TypeScript & Linting

### Type Check

```bash
npx tsc --noEmit
```

Should complete with no errors.

### Lint

```bash
npm run lint
```

Fix issues:

```bash
npm run lint -- --fix
```

---

## 7. Known Issues & Limitations

1. **Native Audio Duration:** Some native audio plugins don't reliably report duration until playback starts. `audioStore` handles this with approximate time tracking.

2. **Capacitor Storage:** Falls back to localStorage if `@capacitor/storage` is not installed or fails.

3. **Thumbnail Prefetch:** Prefetch runs in parallel but does not block UI. Very slow networks may see brief flashes of placeholder.

4. **Android WebView CORS:** This modernization specifically solves CORS by using CapacitorHttp. Browser-based requests may still fail on Android < 8 if not configured.

---

## 8. Future Enhancements

- [ ] Add offline queue persistence (SQLite via `@capacitor/sqlite`)
- [ ] Implement smart prefetch based on network connection type
- [ ] Add analytics via Capacitor
- [ ] Support playlist creation and management
- [ ] Integrate with native media controls (play/pause buttons)
- [ ] Add A/B testing framework for new features

---

## 9. Commit & Deployment

### Local Testing Complete?

```bash
git add -A
git commit -m "feat: modernize to Spotify-style streaming architecture

- Migrate to Vue 3 Composition API + Pinia setup stores
- Implement CapacitorHttp for CORS-free networking
- Add Zod runtime validation for all API responses
- Refactor audioStore for native/web playback with queue
- Prefetch thumbnails to Filesystem cache
- Use Ionic lifecycle hooks for page management
- Remove unused 'network' dependency
- Full TypeScript type safety
"
```

### Deploy to Production

```bash
npm run build
# Test build locally:
npm run preview
# Deploy dist/ folder to your hosting platform
```

---

## 10. Contact & Support

For issues, feature requests, or improvements, please refer to the project documentation or contact the development team.

**Modernization completed:** May 24, 2026
