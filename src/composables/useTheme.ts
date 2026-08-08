import { computed, ref, watch } from 'vue'

export type Theme = 'dark' | 'light'

// Safe localStorage read — guarded for test/SSR environments
function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  try {
    return (localStorage.getItem('theme') as Theme) || 'dark'
  } catch {
    return 'dark'
  }
}

// Shared state — outside function so all components share the same ref
const theme = ref<Theme>(getStoredTheme())

function updateThemeVariables() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const isDark = theme.value === 'dark'

  const vars: Record<string, string> = {
    'color-scheme': isDark ? 'dark' : 'light',
    '--bg-primary': isDark ? '#121212' : '#ffffff',
    '--bg-secondary': isDark ? '#1a1a1a' : '#f8f9fa',
    '--bg-tertiary': isDark ? '#282828' : '#e9ecef',
    '--bg-card': isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    '--text-primary': isDark ? '#ffffff' : '#212529',
    '--text-secondary': isDark ? '#b3b3b3' : '#6c757d',
    '--text-muted': isDark ? '#808080' : '#adb5bd',
    '--accent-primary': '#1db954',
    '--accent-secondary': '#1ed760',
    '--border-primary': isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    '--border-secondary': isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    '--shadow-primary': isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.1)',
    '--shadow-secondary': isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.05)',
    '--hover-bg': isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    '--hover-text': '#1db954',
    '--mini-player-bg': isDark
      ? 'linear-gradient(135deg,#282828 0%,#1a1a1a 100%)'
      : 'linear-gradient(135deg,#ffffff 0%,#f0f0f0 100%)',
    '--progress-bg': isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    '--progress-active': '#1db954'
  }

  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
}

// Apply once on module load — guarded so it only runs in browser
if (typeof window !== 'undefined') {
  updateThemeVariables()
}

// Watch globally — runs once no matter how many components call useTheme()
watch(theme, updateThemeVariables)

export function useTheme() {
  const setTheme = (t: Theme) => {
    theme.value = t
    try {
      localStorage.setItem('theme', t)
    } catch {
      /* ignore in restricted environments */
    }
  }

  const toggleTheme = () => setTheme(theme.value === 'dark' ? 'light' : 'dark')

  return {
    theme,
    setTheme,
    toggleTheme,
    updateThemeVariables,
    isDark: computed(() => theme.value === 'dark'),
    isLight: computed(() => theme.value === 'light')
  }
}
