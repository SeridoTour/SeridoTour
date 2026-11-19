import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const usePreferencesStore = defineStore('preferences', () => {
  const showMap = ref(localStorage.getItem('seridotour:show-map') !== 'false')
  watch(showMap, (value) => localStorage.setItem('seridotour:show-map', String(value)))
  return { showMap }
})
