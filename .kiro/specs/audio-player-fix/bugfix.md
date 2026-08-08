# Bugfix Requirements Document

## Introduction

Three confirmed bugs affect the AudioPlayer and MiniPlayer components on physical Android devices. The issues span the Pinia audio store (`audioStore.ts`), the full-screen player modal (`AudioPlayer.vue`), and the persistent mini-player bar (`MiniPlayer.vue`). Together they cause seek-bar stuttering during drag, an unresponsive close button that can freeze the overlay stack, and continued background CPU usage after a song is stopped. This document defines the bug conditions, the correct behavior that must replace them, and the existing behavior that must be preserved.

---

## Bug Analysis

### Current Behavior (Defect)

**Bug 1 — Seek-bar jumping (AudioPlayer.vue)**

1.1 WHEN the user drags the `IonRange` knob on a physical Android device THEN the system fires `ion-change` on every pointer-move event, calling `store.seekTo()` continuously throughout the drag gesture

1.2 WHEN `store.seekTo()` is called on every pointer-move THEN the system floods the native bridge with seek commands, causing `store.currentTime` (updated by the `setInterval` in `startNativeTimeTracking`) to race against the user's drag position and produce visible seek-bar jumping and stuttering

**Bug 2 — MiniPlayer close button unresponsive (MiniPlayer.vue)**

2.1 WHEN the user taps the close button in `MiniPlayer` while the `AudioPlayer` modal is open THEN the system calls `modalController.dismiss()` before `store.stopSong()`, initiating the modal dismiss animation while `currentAudio` is still non-null

2.2 WHEN `modalController.dismiss()` resolves and `store.stopSong()` subsequently sets `currentAudio` to null THEN the system triggers a reactive update inside the still-animating `AudioPlayer` modal, causing a double-dismiss attempt that throws an unhandled rejection on Android and can freeze the overlay stack, making the close button appear unresponsive

**Bug 3 — Audio buffering in background after closing (audioStore.ts)**

3.1 WHEN `stopSong()` is called THEN the system does not call `clearTimeInterval()` or `clearNativeListener()` before nullifying state, leaving the `setInterval` from `startNativeTimeTracking` and the `NativeAudio.addListener('complete')` callback running after the song is stopped

3.2 WHEN the orphaned `setInterval` and `NativeAudio` listener continue running after `stopSong()` THEN the system consumes background CPU and risks state corruption if a new song is played immediately, because the stale callbacks can write to `currentTime`, `isPlaying`, or `duration` after they have been reset

---

### Expected Behavior (Correct)

**Bug 1 — Seek-bar fix**

2.1 WHEN the user begins dragging the `IonRange` knob THEN the system SHALL set an `isScrubbing` flag to `true` and decouple `localTime` from `store.currentTime` so that the store's interval updates no longer move the knob during the drag

2.2 WHEN the user releases the `IonRange` knob (`ion-knob-move-end`) THEN the system SHALL call `store.seekTo()` exactly once with the final drag value, then clear the `isScrubbing` flag so that `localTime` resumes tracking `store.currentTime`

**Bug 2 — MiniPlayer close button fix**

2.3 WHEN the user taps the close button in `MiniPlayer` THEN the system SHALL call `store.stopSong()` first to null out `currentAudio` before any modal dismiss is attempted, ensuring the `AudioPlayer` modal has already unmounted or is no longer reactive to `currentAudio` when `modalController.dismiss()` is called

2.4 WHEN `store.stopSong()` resolves and `modalController.dismiss()` is subsequently called THEN the system SHALL complete the dismiss without throwing an unhandled rejection, and the overlay stack SHALL remain functional for future interactions

**Bug 3 — Store cleanup fix**

2.5 WHEN `stopSong()` is called THEN the system SHALL call `clearTimeInterval()` and `clearNativeListener()` as the first operations, before any state is nullified, ensuring no stale callbacks can write to store state after the stop

2.6 WHEN `stopSong()` completes THEN the system SHALL guarantee that no `setInterval` tick or `NativeAudio` completion event can mutate `currentTime`, `isPlaying`, or `duration` for the stopped song

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user taps the seek bar at a specific position without dragging THEN the system SHALL CONTINUE TO seek to that position immediately and update playback correctly

3.2 WHEN the user plays a song, pauses it, and resumes it THEN the system SHALL CONTINUE TO resume from the correct position with no seek-bar regression

3.3 WHEN the user closes the `AudioPlayer` modal using the chevron-down button (not the MiniPlayer close) THEN the system SHALL CONTINUE TO dismiss the modal without affecting playback state

3.4 WHEN `playSong()` is called for a new track while another track is already playing THEN the system SHALL CONTINUE TO stop the previous track, clean up its resources, and start the new track without interference

3.5 WHEN `togglePlay()` is called to pause and then resume a native track THEN the system SHALL CONTINUE TO pause and resume correctly, with `startNativeTimeTracking` restarting from the correct elapsed position

3.6 WHEN a song plays to its natural end on a native platform THEN the system SHALL CONTINUE TO fire the `complete` listener, set `isPlaying` to false, and update `currentTime` to `duration`

3.7 WHEN the MiniPlayer play/pause button is tapped THEN the system SHALL CONTINUE TO toggle playback state without affecting the modal stack

3.8 WHEN the `AudioPlayer` modal is opened from the MiniPlayer tap area THEN the system SHALL CONTINUE TO open the full-screen player showing the correct track and current playback position

---

## Bug Condition Pseudocode

### Bug 1 — Seek-bar Flooding

```pascal
FUNCTION isBugCondition_SeekFlood(event, context)
  INPUT: event of type IonRangeEvent, context of type PlayerState
  OUTPUT: boolean

  RETURN event.type = "ion-change"
     AND context.isDragging = true
     AND event.source = "pointer-move"   // not a final commit
END FUNCTION

// Property: Fix Checking — single seek on release
FOR ALL drag_sequence WHERE isBugCondition_SeekFlood(each_event, ctx) DO
  seekTo_call_count ← COUNT(store.seekTo calls during drag_sequence)
  ASSERT seekTo_call_count = 1           // called only on knob-move-end
  ASSERT store.currentTime NOT mutated by interval DURING drag_sequence
END FOR

// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_SeekFlood(X, ctx) DO
  ASSERT F(X) = F'(X)                   // tap-to-seek still works identically
END FOR
```

### Bug 2 — Dismiss Order

```pascal
FUNCTION isBugCondition_DismissOrder(call_sequence)
  INPUT: call_sequence of type OperationList
  OUTPUT: boolean

  RETURN call_sequence[0] = "modalController.dismiss"
     AND call_sequence[1] = "store.stopSong"
     AND modalIsOpen = true
END FUNCTION

// Property: Fix Checking — stopSong precedes dismiss
FOR ALL stop_attempts WHERE isBugCondition_DismissOrder(stop_attempts) DO
  fixed_sequence ← onStop'()
  ASSERT fixed_sequence[0] = "store.stopSong"
  ASSERT fixed_sequence[1] = "modalController.dismiss"
  ASSERT no_unhandled_rejection(fixed_sequence)
END FOR

// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_DismissOrder(X) DO
  ASSERT F(X) = F'(X)                   // close via chevron unaffected
END FOR
```

### Bug 3 — Missing Cleanup in stopSong

```pascal
FUNCTION isBugCondition_StopCleanup(stopSong_call)
  INPUT: stopSong_call of type StoreAction
  OUTPUT: boolean

  RETURN nativeTimeInterval ≠ null
      OR nativeCompleteListener ≠ null
      // i.e., cleanup was not performed before state nullification
END FUNCTION

// Property: Fix Checking — no orphaned callbacks after stop
FOR ALL stop_calls WHERE isBugCondition_StopCleanup(stop_calls) DO
  result ← stopSong'()
  ASSERT nativeTimeInterval = null      AFTER result
  ASSERT nativeCompleteListener = null  AFTER result
  ASSERT no_mutation_of(currentTime, isPlaying, duration) AFTER result
END FOR

// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_StopCleanup(X) DO
  ASSERT F(X) = F'(X)                   // playSong, togglePlay unaffected
END FOR
```
