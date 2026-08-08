/**
 * Unit tests for useFavorites composable.
 * Covers add, remove, toggle, persistence via localStorage.
 */
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

// Reset the module between tests so the module-level `favorites` ref
// and `isInitialized` flag are fresh for each test
describe('useFavorites', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    localStorage.clear()
    // Force re-import to reset module-level state
    vi.resetModules()
  })

  it('isFavorite: returns false for unknown id', async () => {
    const { useFavorites } = await import('@/composables/useFavorites')
    const { isFavorite, loadFavorites } = useFavorites()
    await loadFavorites()
    expect(isFavorite('unknown-id')).toBe(false)
  })

  it('toggleFavorite: adds an id when not present', async () => {
    const { useFavorites } = await import('@/composables/useFavorites')
    const { toggleFavorite, isFavorite, loadFavorites } = useFavorites()
    await loadFavorites()
    toggleFavorite('track-1')
    expect(isFavorite('track-1')).toBe(true)
  })

  it('toggleFavorite: removes an id when already present', async () => {
    const { useFavorites } = await import('@/composables/useFavorites')
    const { toggleFavorite, isFavorite, loadFavorites } = useFavorites()
    await loadFavorites()
    toggleFavorite('track-1')
    toggleFavorite('track-1')
    expect(isFavorite('track-1')).toBe(false)
  })

  it('persists favorites to localStorage', async () => {
    const { useFavorites } = await import('@/composables/useFavorites')
    const { toggleFavorite, loadFavorites } = useFavorites()
    await loadFavorites()
    toggleFavorite('track-persist')
    const stored = JSON.parse(localStorage.getItem('favorites') ?? '[]')
    expect(stored).toContain('track-persist')
  })

  it('loads previously saved favorites from localStorage', async () => {
    // Pre-seed localStorage before module import
    localStorage.setItem('favorites', JSON.stringify(['pre-saved-track']))
    const { useFavorites } = await import('@/composables/useFavorites')
    const { isFavorite, loadFavorites } = useFavorites()
    await loadFavorites()
    expect(isFavorite('pre-saved-track')).toBe(true)
  })

  it('handles corrupted localStorage gracefully', async () => {
    localStorage.setItem('favorites', 'NOT_VALID_JSON{{{{')
    const { useFavorites } = await import('@/composables/useFavorites')
    const { favorites, loadFavorites } = useFavorites()
    await loadFavorites()
    // Should fall back to empty array instead of throwing
    expect(favorites.value).toEqual([])
  })
})
