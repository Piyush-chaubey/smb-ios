import { ref } from 'vue'

const STORAGE_KEY = 'favorites'
const favorites = ref<string[]>([])
let isInitialized = false

async function loadFavorites() {
  if (isInitialized) return
  isInitialized = true

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    favorites.value = saved ? JSON.parse(saved) : []
  } catch {
    favorites.value = []
  }
}

async function saveFavorites() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites.value))
  } catch {
    // Ignore storage write failures
  }
}

export function useFavorites() {
  void loadFavorites()

  const toggleFavorite = (audioId: string) => {
    const index = favorites.value.indexOf(audioId)
    if (index > -1) {
      favorites.value.splice(index, 1)
    } else {
      favorites.value.push(audioId)
    }
    void saveFavorites()
  }

  const isFavorite = (id: string) => favorites.value.includes(id)
  const isFav = isFavorite

  return {
    favorites,
    loadFavorites,
    toggleFavorite,
    isFavorite,
    isFav
  }
}
