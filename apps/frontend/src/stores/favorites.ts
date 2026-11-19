import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

type FavoriteKind = 'places' | 'itineraries'
interface Favorites {
  places: string[]
  itineraries: string[]
}

function readFavorites(): Favorites {
  try {
    const value = JSON.parse(localStorage.getItem('seridotour:favorites') || '{}')
    return {
      places: Array.isArray(value.places)
        ? value.places.filter((id: unknown) => typeof id === 'string')
        : [],
      itineraries: Array.isArray(value.itineraries)
        ? value.itineraries.filter((id: unknown) => typeof id === 'string')
        : [],
    }
  } catch {
    return { places: [], itineraries: [] }
  }
}

export const useFavoritesStore = defineStore('favorites', () => {
  const favorites = ref<Favorites>(readFavorites())
  const has = (kind: FavoriteKind, id: string) => favorites.value[kind].includes(id)
  function toggle(kind: FavoriteKind, id: string) {
    favorites.value[kind] = has(kind, id)
      ? favorites.value[kind].filter((value) => value !== id)
      : [...favorites.value[kind], id]
  }
  watch(favorites, (value) => localStorage.setItem('seridotour:favorites', JSON.stringify(value)), {
    deep: true,
  })
  return { favorites, has, toggle }
})
