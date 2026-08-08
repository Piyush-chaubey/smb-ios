/**
 * useErrorHandler — Centralized global error handling composable.
 *
 * Sets up window-level listeners for unhandled errors and promise rejections.
 * Shows user-friendly toast messages via the global store instead of crashing.
 *
 * Usage: Call `setupGlobalErrorHandlers(app)` once in main.ts.
 */
import { App } from 'vue'

/** Format an unknown caught value into a human-readable string */
export function formatError(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  try {
    return JSON.stringify(err)
  } catch {
    return 'An unexpected error occurred'
  }
}

/** Install Vue app-level error handler + window unhandledrejection listener */
export function setupGlobalErrorHandlers(app: App) {
  // Vue component error handler
  app.config.errorHandler = (err, _instance, info) => {
    const msg = formatError(err)
    console.error(`[Vue Error] ${info}:`, err)
    showGlobalToast(`App error: ${msg}`)
  }

  // Unhandled native JS promise rejections (outside Vue)
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      const msg = formatError(event.reason)
      console.error('[Unhandled Promise Rejection]:', event.reason)
      // Only surface network/api errors to the user; skip NoError / AbortError
      if (
        event.reason instanceof Error &&
        (event.reason.name === 'AbortError' || event.reason.name === 'NotAllowedError')
      ) {
        return
      }
      showGlobalToast(`Something went wrong: ${msg}`)
    })
  }
}

/**
 * Show a toast via the global Pinia store.
 * Uses a lazy Pinia lookup so this can be called before the app is mounted.
 */
function showGlobalToast(message: string) {
  try {
    const pinia = (
      window as { __pinia?: { _s?: Map<string, { showToast?: (m: string) => void }> } }
    ).__pinia
    const globalStore = pinia?._s?.get('global')
    if (globalStore?.showToast) {
      globalStore.showToast(message)
    }
  } catch {
    // Silently ignore if store is not available (e.g. during startup)
  }
}

/** Composable for use inside Vue components to handle errors consistently */
export function useErrorHandler() {
  function handleError(err: unknown, fallbackMsg = 'An error occurred') {
    const msg = formatError(err)
    console.error('[Error]:', err)
    showGlobalToast(msg || fallbackMsg)
    return msg
  }

  return { handleError, formatError }
}
