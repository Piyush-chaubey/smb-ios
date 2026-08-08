# Audio Player Fix — Bugfix Design

## Overview

Three confirmed bugs affect the audio player on physical Android devices. This document formalizes
the bug conditions, root cause hypotheses, and fix implementation for each:

- **Bug 1 (AudioPlayer.vue)**: The `IonRange` seek bar fires `ion-change` on every pointer-move
  during a drag, flooding `store.seekTo()` and causing visible knob stuttering as the store's
  interval timer races against the drag position.
- **Bug 2 (MiniPlayer.vue)**: The `onStop()` handler calls `modalController.dismiss()` before
  `store.stopSong()`, triggering a reactive update inside the still-animating modal that causes a
  double-dismiss error and can freeze the overlay stack.
- **Bug 3 (audioStore.ts)**: `stopSong()` nullifies state before calling `clearTimeInterval()` and
  `clearNativeListener()`, leaving orphaned callbacks that can write to `currentTime`, `isPlaying`,
  or `duration` after the song has been stopped.

The fixes are minimal and targeted: no new store actions, no new components, no architectural
changes. `isScrubbing` remains a UI-only concern in `AudioPlayer.vue`.

---

## Glossary

- **Bug_Condition (C)**: The specific input or call-sequence that triggers a defect.
- **Property (P)**: The correct observable behavior that must hold for all inputs satisfying C.
- **Preservation**: Existing behaviors that must remain byte-for-byte identical after the fix.
- **isScrubbing**: A `ref<boolean>` local to `AudioPlayer.vue` that decouples `localTime` from
  `store.currentTime` during a drag gesture.
- **localTime**: A `ref<number>` in `AudioPlayer.vue` that is the single source of truth for the
  `IonRange :value` binding.
- **nativeTimeInterval**: The `setInterval` handle inside `audioStore.ts` used by
  `startNativeTimeTracking()` to advance `currentTime` on native platforms.
- **nativeCompleteListener**: The `NativeAudio.addListener('complete', …)` handle stored in
  `audioStore.ts`.
- **stopSong()**: The Pinia action in `audioStore.ts` that tears down the current track and resets
  all store state.
- **onStop()**: The click handler in `MiniPlayer.vue` that stops playback and dismisses the modal.

---

## Bug Details

### Bug 1 — Seek-bar Flooding (AudioPlayer.vue)

The bug manifests when the user drags the `IonRange` knob on Android. The `@ion-change` event
fires on every pointer-move, calling `store.seekTo()` continuously throughout the gesture. The
store's `setInterval` (running at 500 ms) simultaneously updates `store.currentTime`, which feeds
back into the range's `:value` binding and fights the user's drag position.

**Formal Specification:**

```
FUNCTION isBugCondition_SeekFlood(event, context)
  INPUT: event of type IonRangeEvent, context of type PlayerState
  OUTPUT: boolean

  RETURN event.type = "ion-change"
     AND context.isDragging = true
     AND event.source = "pointer-move"   // intermediate move, not a final commit
END FUNCTION
```

**Examples:**

- User drags knob from 0:30 to 1:00 over 2 seconds → `seekTo()` called ~60 times; knob jumps
  back toward the interval-updated position on every tick.
- User taps the bar at 1:00 without dragging → `ion-knob-move-end` fires once; `seekTo()` called
  exactly once. _(This is the correct tap-to-seek path that must be preserved.)_
- User drags quickly from start to end → native bridge flooded; audio stutters or resets.

---

### Bug 2 — Dismiss Order (MiniPlayer.vue)

The bug manifests when the user taps the close button in `MiniPlayer` while `AudioPlayer` is open.
`modalController.dismiss()` is called first, starting the dismiss animation. While the animation
runs, `store.stopSong()` sets `currentAudio` to `null`, triggering a reactive re-render inside the
still-mounted modal. Ionic then attempts a second dismiss, throwing an unhandled rejection on
Android and leaving the overlay stack in a broken state.

**Formal Specification:**

```
FUNCTION isBugCondition_DismissOrder(call_sequence)
  INPUT: call_sequence of type OperationList
  OUTPUT: boolean

  RETURN call_sequence[0] = "modalController.dismiss"
     AND call_sequence[1] = "store.stopSong"
     AND modalIsOpen = true
END FUNCTION
```

**Examples:**

- User taps close while `AudioPlayer` is open → dismiss animation starts → `stopSong()` nulls
  `currentAudio` → modal re-renders → second dismiss attempt → unhandled rejection.
- User taps close while `AudioPlayer` is NOT open (modal already gone) → `modalController.dismiss()`
  throws immediately; `stopSong()` never runs. _(Edge case that must also be handled.)_

---

### Bug 3 — Missing Cleanup in stopSong (audioStore.ts)

The bug manifests whenever `stopSong()` is called. The current implementation nullifies
`currentAudio` and other state before calling `clearTimeInterval()` and `clearNativeListener()`.
The orphaned interval and listener continue running and can write to the now-reset store state.

**Formal Specification:**

```
FUNCTION isBugCondition_StopCleanup(stopSong_call)
  INPUT: stopSong_call of type StoreAction
  OUTPUT: boolean

  RETURN nativeTimeInterval ≠ null
      OR nativeCompleteListener ≠ null
      // i.e., at least one callback was not cleared before state nullification
END FUNCTION
```

**Examples:**

- `stopSong()` called while a song is playing → interval fires 500 ms later → writes to
  `currentTime` after it was reset to 0.
- `stopSong()` called, then `playSong()` called immediately → stale `complete` listener fires for
  the old track → sets `isPlaying = false` on the new track.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

- Tap-to-seek (no drag) must continue to call `store.seekTo()` exactly once and update playback.
- Play/pause toggle from both `AudioPlayer` and `MiniPlayer` must continue to work correctly.
- Closing `AudioPlayer` via the chevron-down button must continue to dismiss without affecting
  playback state.
- `playSong()` called for a new track while another is playing must continue to stop the previous
  track cleanly and start the new one.
- `togglePlay()` pause/resume cycle must continue to restart `startNativeTimeTracking()` from the
  correct elapsed position.
- Natural song completion must continue to fire the `complete` listener, set `isPlaying = false`,
  and update `currentTime` to `duration`.
- MiniPlayer play/pause button must continue to toggle playback without affecting the modal stack.
- Opening `AudioPlayer` from the MiniPlayer tap area must continue to show the correct track and
  position.

**Scope:**
All inputs that do NOT satisfy any of the three bug conditions above must be completely unaffected
by these fixes. This includes mouse/touch clicks on buttons, non-drag range interactions, and all
`togglePlay()` / `playSong()` call paths.

---

## Hypothesized Root Cause

### Bug 1 — Seek-bar Flooding

1. **Wrong event used for seek commit**: `@ion-change` fires on every intermediate pointer-move
   event during a drag, not just on release. The correct event for a single commit is
   `@ion-knob-move-end`.
2. **No drag-state guard**: Without an `isScrubbing` flag, the store's `setInterval` continues
   updating `store.currentTime` during the drag, which feeds back into the `:value` binding and
   fights the user's finger position.
3. **No local time buffer**: Without a `localTime` ref decoupled from `store.currentTime`, any
   interval tick during a drag immediately moves the knob.

### Bug 2 — Dismiss Order

1. **Inverted operation order**: `modalController.dismiss()` is awaited before `store.stopSong()`,
   so the modal is still mounted and reactive when `currentAudio` is nulled.
2. **No error guard on dismiss**: If the modal is already gone (e.g., user dismissed it via
   chevron first), `modalController.dismiss()` throws synchronously and `stopSong()` is never
   reached.

### Bug 3 — Missing Cleanup in stopSong

1. **Cleanup called too late**: `clearTimeInterval()` and `clearNativeListener()` are not the
   first operations in `stopSong()`. State is nullified first, so a racing interval tick or
   `complete` event can write to the freshly-reset state.

   > Note: Reviewing the current `audioStore.ts` source, `clearTimeInterval()` and
   > `clearNativeListener()` are already called near the top of `stopSong()` — before the platform
   > branch and before state nullification. If this ordering was introduced as a partial fix, the
   > remaining risk is the window between the `if (!currentAudio.value) return` guard and the
   > cleanup calls. The design requirement is to ensure cleanup is unconditionally the first
   > substantive operation.

---

## Correctness Properties

Property 1: Bug Condition — Single Seek on Knob Release

_For any_ drag gesture on the `IonRange` knob where `isBugCondition_SeekFlood` holds (i.e., the
user is actively dragging), the fixed `AudioPlayer.vue` SHALL call `store.seekTo()` exactly once,
only on `ion-knob-move-end`, and `localTime` SHALL track the drag position visually without
triggering any seek during the drag.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation — Tap-to-Seek Unchanged

_For any_ input where the bug condition does NOT hold (i.e., a tap without drag, or any non-range
interaction), the fixed `AudioPlayer.vue` SHALL produce exactly the same behavior as the original
code — `store.seekTo()` is called once on tap release, playback updates correctly, and no
regression is introduced.

**Validates: Requirements 3.1, 3.2**

Property 3: Bug Condition — stopSong Precedes Dismiss

_For any_ call to `onStop()` in `MiniPlayer.vue` where `isBugCondition_DismissOrder` holds (modal
is open), the fixed `onStop()` SHALL call `store.stopSong()` first, then attempt
`modalController.dismiss()`, and SHALL NOT throw an unhandled rejection regardless of whether the
modal is already dismissed.

**Validates: Requirements 2.3, 2.4**

Property 4: Preservation — Chevron-Down Dismiss Unchanged

_For any_ input where the bug condition does NOT hold (user closes via chevron-down, not MiniPlayer
close), the fixed code SHALL produce exactly the same dismiss behavior as the original, with no
effect on playback state.

**Validates: Requirements 3.3, 3.7**

Property 5: Bug Condition — No Orphaned Callbacks After stopSong

_For any_ call to `stopSong()` where `isBugCondition_StopCleanup` holds (interval or listener
still active), the fixed `stopSong()` SHALL call `clearTimeInterval()` and `clearNativeListener()`
as its first two substantive operations, guaranteeing that `nativeTimeInterval` and
`nativeCompleteListener` are both `null` before any state is nullified.

**Validates: Requirements 2.5, 2.6**

Property 6: Preservation — togglePlay and playSong Unaffected

_For any_ input where the bug condition does NOT hold (normal `togglePlay()` or `playSong()` call
paths), the fixed `audioStore.ts` SHALL produce exactly the same behavior as the original,
preserving pause/resume, track switching, and natural completion behavior.

**Validates: Requirements 3.4, 3.5, 3.6**

---

## Fix Implementation

### Bug 1 — AudioPlayer.vue

**File**: `src/views/AudioPlayer.vue`

**Specific Changes:**

1. **Add `isScrubbing` and `localTime` refs** (if not already present):

   ```ts
   const isScrubbing = ref(false)
   const localTime = ref(0)
   ```

2. **Watcher — sync `localTime` only when not scrubbing**:

   ```ts
   watch(
     () => store.currentTime,
     (val) => {
       if (!isScrubbing.value) localTime.value = val
     }
   )
   ```

3. **`onRangeStart` — freeze `localTime` from store updates**:

   ```ts
   const onRangeStart = () => {
     isScrubbing.value = true
   }
   ```

4. **`onInput` — visual feedback only, no seekTo**:

   ```ts
   const onInput = (e: any) => {
     localTime.value = parseFloat(e.detail.value)
   }
   ```

5. **`onRangeEnd` — single seekTo, then clear flag after 100 ms**:

   ```ts
   const onRangeEnd = (e: any) => {
     const newTime = parseFloat(e.detail.value)
     store.seekTo(newTime)
     setTimeout(() => {
       isScrubbing.value = false
     }, 100)
   }
   ```

6. **Template — remove `@ion-change`, keep `@ion-knob-move-start`, `@ion-input`,
   `@ion-knob-move-end`**:
   ```html
   <ion-range
     :value="localTime"
     @ion-knob-move-start="onRangeStart"
     @ion-input="onInput"
     @ion-knob-move-end="onRangeEnd"
   />
   ```

> Note: Reviewing the current `AudioPlayer.vue` source, this implementation is already in place
> (`isDragging` is used instead of `isScrubbing`, and `store.isScrubbing` is also set). The design
> requirement is to use `isScrubbing` as a purely local ref (not store state). The store's
> `isScrubbing` ref can remain for any store-internal use, but the IonRange gating logic must be
> driven by the local ref.

---

### Bug 2 — MiniPlayer.vue

**File**: `src/components/MiniPlayer.vue`

**Function**: `onStop()`

**Specific Changes:**

1. **Call `store.stopSong()` first**:

   ```ts
   async function onStop() {
     if (stopping) return
     stopping = true
     try {
       await store.stopSong()
       try {
         await modalController.dismiss()
       } catch {
         /* modal already gone — swallow */
       }
     } finally {
       stopping = false
     }
   }
   ```

2. **Wrap `modalController.dismiss()` in its own try/catch** so a "no modal" error does not
   propagate and does not prevent `stopping` from being reset.

---

### Bug 3 — audioStore.ts

**File**: `src/stores/audioStore.ts`

**Function**: `stopSong()`

**Specific Changes:**

1. **Move `clearTimeInterval()` and `clearNativeListener()` to be the first two calls** inside
   `stopSong()`, immediately after the `if (!currentAudio.value) return` guard:

   ```ts
   async function stopSong() {
     if (!currentAudio.value) return
     clearTimeInterval() // ← first
     clearNativeListener() // ← second
     clearTimer()
     // … rest of platform teardown and state reset unchanged …
   }
   ```

2. **No changes to `togglePlay()`** — it already calls `clearTimeInterval()` on pause and
   `startNativeTimeTracking()` on resume correctly.

---

## Testing Strategy

### Validation Approach

Testing follows a two-phase approach: first run exploratory tests against the **unfixed** code to
surface counterexamples and confirm root cause hypotheses; then run fix-checking and preservation
tests against the **fixed** code.

---

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate each bug on unfixed code. Confirm or refute the
root cause analysis.

**Bug 1 — Test Plan**: Mount `AudioPlayer.vue` with a mock store. Simulate a drag sequence by
firing `ion-knob-move-start`, multiple `ion-input` events, and `ion-knob-move-end`. Assert that
`store.seekTo` is called more than once on unfixed code (confirming the flood).

**Bug 1 — Test Cases:**

1. **Drag sequence — seekTo call count**: Fire start + 5 input events + end → assert `seekTo`
   called > 1 on unfixed code (will fail on fixed code, confirming the fix).
2. **Interval race during drag**: Start interval ticking while drag is in progress → assert
   `localTime` is overwritten by interval on unfixed code.
3. **Tap-to-seek (no drag)**: Fire only `ion-knob-move-end` → assert `seekTo` called exactly once
   (should pass on both unfixed and fixed code — preservation baseline).

**Bug 2 — Test Plan**: Mock `modalController` and `store.stopSong`. Call `onStop()` and record
the order of operations. Assert dismiss is called before stopSong on unfixed code.

**Bug 2 — Test Cases:**

1. **Operation order — modal open**: Call `onStop()` with modal present → assert `dismiss` is
   called before `stopSong` on unfixed code.
2. **Already-dismissed modal**: Call `onStop()` when `modalController.dismiss()` throws → assert
   `stopSong` is never reached on unfixed code.

**Bug 3 — Test Plan**: Call `stopSong()` on unfixed code while `nativeTimeInterval` is set.
Wait 600 ms and assert that `currentTime` was mutated after the stop.

**Bug 3 — Test Cases:**

1. **Orphaned interval write**: Set interval, call `stopSong()`, wait 600 ms → assert
   `currentTime` was written after stop on unfixed code.
2. **Orphaned complete listener**: Set listener, call `stopSong()`, fire `complete` event →
   assert `isPlaying` was set to `false` on the new (post-stop) state on unfixed code.

**Expected Counterexamples:**

- Bug 1: `seekTo` called N > 1 times during a drag sequence.
- Bug 2: `dismiss` called before `stopSong`; `stopSong` not called when dismiss throws.
- Bug 3: `currentTime` or `isPlaying` mutated after `stopSong()` completes.

---

### Fix Checking

**Goal**: Verify that for all inputs where each bug condition holds, the fixed code produces the
expected behavior.

**Pseudocode:**

```
// Bug 1
FOR ALL drag_sequence WHERE isBugCondition_SeekFlood(each_event, ctx) DO
  result := onRangeEnd_fixed(drag_sequence)
  ASSERT seekTo_call_count(drag_sequence) = 1
  ASSERT localTime NOT overwritten by interval DURING drag_sequence
END FOR

// Bug 2
FOR ALL stop_attempt WHERE isBugCondition_DismissOrder(stop_attempt) DO
  fixed_sequence := onStop_fixed()
  ASSERT fixed_sequence[0] = "store.stopSong"
  ASSERT fixed_sequence[1] = "modalController.dismiss"
  ASSERT no_unhandled_rejection(fixed_sequence)
END FOR

// Bug 3
FOR ALL stop_call WHERE isBugCondition_StopCleanup(stop_call) DO
  stopSong_fixed()
  ASSERT nativeTimeInterval = null
  ASSERT nativeCompleteListener = null
  ASSERT no_mutation_of(currentTime, isPlaying, duration) AFTER stop
END FOR
```

---

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed code
produces the same result as the original.

**Pseudocode:**

```
FOR ALL X WHERE NOT isBugCondition_SeekFlood(X, ctx) DO
  ASSERT AudioPlayer_original(X) = AudioPlayer_fixed(X)   // tap-to-seek unchanged
END FOR

FOR ALL X WHERE NOT isBugCondition_DismissOrder(X) DO
  ASSERT MiniPlayer_original(X) = MiniPlayer_fixed(X)     // chevron-down unchanged
END FOR

FOR ALL X WHERE NOT isBugCondition_StopCleanup(X) DO
  ASSERT audioStore_original(X) = audioStore_fixed(X)     // togglePlay/playSong unchanged
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because it
generates many input combinations automatically, catches edge cases that manual tests miss, and
provides strong guarantees across the full non-buggy input domain.

**Preservation Test Cases:**

1. **Tap-to-seek**: Fire only `ion-knob-move-end` (no prior `ion-knob-move-start`) → assert
   `seekTo` called once, `localTime` updated, playback position correct.
2. **Chevron-down dismiss**: Call `close()` in `AudioPlayer.vue` → assert modal dismissed,
   `store.stopSong` NOT called, playback continues.
3. **togglePlay pause/resume**: Call `togglePlay()` twice → assert `clearTimeInterval` called on
   pause, `startNativeTimeTracking` called on resume, `currentTime` advances correctly.
4. **playSong new track**: Call `playSong()` for a new track while one is playing → assert
   previous track destroyed cleanly, new track starts, no stale callbacks.
5. **Natural completion**: Fire `complete` event for the active `assetId` → assert `isPlaying`
   set to `false`, `currentTime` set to `duration`.
6. **MiniPlayer play/pause**: Call `onPlayPause()` → assert `store.togglePlay()` called, modal
   stack unaffected.

---

### Unit Tests

- Test `onRangeEnd` calls `seekTo` exactly once with the final drag value.
- Test `isScrubbing = true` prevents the `store.currentTime` watcher from updating `localTime`.
- Test `isScrubbing` is cleared after 100 ms following `onRangeEnd`.
- Test `onStop()` calls `stopSong` before `dismiss` when modal is present.
- Test `onStop()` calls `stopSong` and does not throw when modal is already dismissed.
- Test `stopSong()` sets `nativeTimeInterval = null` before any state is nullified.
- Test `stopSong()` sets `nativeCompleteListener = null` before any state is nullified.

### Property-Based Tests

- Generate random drag sequences (varying number of `ion-input` events, random values) and verify
  `seekTo` is called exactly once per drag regardless of sequence length.
- Generate random `currentTime` values emitted by the interval during a drag and verify `localTime`
  is not overwritten while `isScrubbing` is `true`.
- Generate random store states and verify `stopSong()` always leaves `nativeTimeInterval` and
  `nativeCompleteListener` as `null` after completion.
- Generate random sequences of `playSong` / `stopSong` / `togglePlay` calls and verify no stale
  callback can mutate state after `stopSong()` completes.

### Integration Tests

- Full drag gesture on a playing track: knob moves smoothly, `seekTo` fires once on release,
  playback resumes from the correct position.
- Close button tap while `AudioPlayer` is open: modal dismisses cleanly, no console errors, overlay
  stack functional for subsequent opens.
- Close button tap when `AudioPlayer` is already closed: `stopSong` still runs, no unhandled
  rejection.
- Play new track immediately after stopping: previous track's interval and listener do not
  interfere with the new track's state.
- Song plays to natural end after a seek: `complete` listener fires for the correct `assetId`,
  `isPlaying` set to `false`.

---

## Bug 4 — Hardware Back-Navigation (AudioPlayer.vue)

### New Glossary Terms

- **backButtonListener**: The `@capacitor/app` `App.addListener('backButton', …)` handle registered in `AudioPlayer.vue` on mount and removed on `onBeforeUnmount`.
- **isClosing**: A `ref<boolean>` local to `AudioPlayer.vue` that is set to `true` when a stop+dismiss sequence begins (either via back button or MiniPlayer close), preventing UI flicker during the transition.

### Bug Condition

**Current Behavior (Defect):**

4.1 WHEN the user presses the Android hardware back button or performs the back gesture while `AudioPlayer` is open THEN the system does not intercept the event, causing inconsistent behavior: sometimes the app exits, sometimes the modal closes but audio continues playing in the background with no MiniPlayer visible.

4.2 WHEN the back event is not consumed THEN the system allows Android's default navigation stack to handle it, which bypasses `store.stopSong()` entirely and leaves `nativeTimeInterval` and `nativeCompleteListener` running.

**Expected Behavior (Correct):**

4.3 WHEN the user presses the hardware back button while `AudioPlayer` is open THEN the system SHALL intercept the event using `App.addListener('backButton', …)` from `@capacitor/app`, call `store.stopSong()`, dismiss the modal, and consume the event to prevent app exit.

4.4 WHEN the user presses the hardware back button while `AudioPlayer` is NOT open THEN the system SHALL allow the default Android back behavior (navigate back or minimize app) without interference.

4.5 WHEN `AudioPlayer` is unmounted (via `onBeforeUnmount`) THEN the system SHALL call `backButtonListener.remove()` to prevent a memory leak and stale event handler.

4.6 WHEN a stop+dismiss sequence begins (back button or MiniPlayer close) THEN the system SHALL set `isClosing = true` immediately so the template can suppress reactive updates that would cause UI flicker during the dismiss animation.

**Formal Specification:**

```pascal
FUNCTION isBugCondition_BackNav(event, context)
  INPUT: event of type AndroidBackEvent, context of type AppState
  OUTPUT: boolean

  RETURN event.type = "backButton"
     AND context.audioPlayerModalIsOpen = true
     AND context.backButtonListenerRegistered = false
END FUNCTION

// Property: Fix Checking — back button stops and dismisses
FOR ALL back_events WHERE isBugCondition_BackNav(event, ctx) DO
  result ← backButton_fixed(event)
  ASSERT store.stopSong called = true
  ASSERT modalController.dismiss called = true
  ASSERT event.consumed = true          // app does not exit
END FOR

// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_BackNav(X, ctx) DO
  ASSERT F(X) = F'(X)                   // back when modal closed = default Android behavior
END FOR
```

**Root Cause:**
No `App.addListener('backButton', …)` call exists in `AudioPlayer.vue`. The Capacitor App plugin is not imported or used anywhere in the component.

**Fix Implementation:**

```ts
// AudioPlayer.vue <script setup>
import { App } from '@capacitor/app'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const isClosing = ref(false)
let backButtonListener: any = null

onMounted(async () => {
  backButtonListener = await App.addListener('backButton', async () => {
    if (isClosing.value) return // already closing, ignore repeat events
    isClosing.value = true
    await store.stopSong()
    try {
      await modalController.dismiss()
    } catch {
      /* already gone */
    }
  })
})

onBeforeUnmount(() => {
  backButtonListener?.remove()
  backButtonListener = null
})
```

Template guard to suppress flicker:

```html
<!-- Wrap p-body content with v-if="!isClosing" or use CSS opacity transition -->
<ion-content :scroll-y="false" class="p-content">
  <div class="p-body" :class="{ closing: isClosing }">
    <!-- existing content unchanged -->
  </div>
</ion-content>
```

CSS:

```css
.p-body.closing {
  opacity: 0;
  -webkit-transition: opacity 0.15s ease;
  transition: opacity 0.15s ease;
}
```

---

## Correctness Properties (Bug 4)

Property 7: Bug Condition — Back Button Intercepted When Modal Open

_For any_ back button event where `isBugCondition_BackNav` holds, the fixed `AudioPlayer.vue` SHALL call `store.stopSong()` and `modalController.dismiss()` and consume the event, preventing app exit.

**Validates: Requirements 4.3, 4.4**

Property 8: Preservation — Back Button Default Behavior When Modal Closed

_For any_ back button event where the bug condition does NOT hold (modal not open), the fixed code SHALL not register any listener and SHALL allow default Android navigation.

**Validates: Requirements 4.4**

Property 9: Lifecycle — Listener Removed on Unmount

_For any_ `AudioPlayer` unmount, the fixed code SHALL call `backButtonListener.remove()` before the component is destroyed, leaving zero active back-button listeners.

**Validates: Requirement 4.5**
