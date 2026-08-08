# Implementation Tasks

## Phase 1: Store Logic Stabilization

- [x] 1. Fix stopSong cleanup order in audioStore.ts
  - [x] 1.1 Move clearTimeInterval() to be the first call inside stopSong(), immediately after the guard
  - [x] 1.2 Move clearNativeListener() to be the second call inside stopSong(), before clearTimer()
  - [x] 1.3 Verify no state (currentAudio, isPlaying, currentTime, duration) is nullified before both cleanup calls complete
  - [x] 1.4 Confirm togglePlay() is unmodified and still calls clearTimeInterval() on pause and startNativeTimeTracking() on resume

## Phase 2: AudioPlayer UI Sync

- [x] 2. Implement isScrubbing seek-bar decoupling in AudioPlayer.vue
  - [x] 2.1 Add isScrubbing = ref(false) and localTime = ref(0) to script setup
  - [x] 2.2 Add watcher: watch(() => store.currentTime, val => { if (!isScrubbing.value) localTime.value = val })
  - [x] 2.3 Implement onRangeStart: sets isScrubbing = true
  - [x] 2.4 Implement onInput: updates localTime from drag value only (no seekTo call)
  - [x] 2.5 Implement onRangeEnd: calls store.seekTo() exactly once, then clears isScrubbing after 100ms
  - [x] 2.6 Update IonRange template: bind :value="localTime", use @ion-knob-move-start, @ion-input, @ion-knob-move-end — remove @ion-change

- [x] 3. Fix MiniPlayer onStop dismiss order in MiniPlayer.vue
  - [x] 3.1 Reorder onStop() to call await store.stopSong() before any modalController call
  - [x] 3.2 Wrap modalController.dismiss() in inner try/catch to swallow already-dismissed errors
  - [x] 3.3 Confirm stopping debounce flag is reset in finally block regardless of outcome

## Phase 3: Android Native Polish

- [x] 4. Implement hardware back-button interception in AudioPlayer.vue
  - [x] 4.1 Import App from @capacitor/app at top of script setup
  - [x] 4.2 Add isClosing = ref(false) and backButtonListener variable
  - [x] 4.3 Register App.addListener('backButton', …) in onMounted: set isClosing, call stopSong, dismiss modal, consume event
  - [x] 4.4 Remove listener in onBeforeUnmount via backButtonListener?.remove()
  - [x] 4.5 Add closing CSS class to p-body with opacity transition to suppress UI flicker

- [x] 5. Safe area and layout polish
  - [x] 5.1 Add padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px)) to .p-body in AudioPlayer.vue
  - [x] 5.2 Update MiniPlayer bottom to use var(--ion-tab-bar-height, 56px) + env(safe-area-inset-bottom, 0px) instead of hardcoded 65px
  - [x] 5.3 Update AudiosList has-mini-player padding to use CSS variables instead of magic number 140px
