<script setup lang="ts">
const paths = {
  home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  compass: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm4-16-2 8-8 2 2-8z',
  map: 'm9 3 6 3 6-3v18l-6 3-6-3-6 3V6zM9 3v18m6-15v18',
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  user: 'M20 21v-2a7 7 0 0 0-14 0v2M13 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  users:
    'M16 21v-2a6 6 0 0 0-12 0v2m16 0v-2a6 6 0 0 0-3-5M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-7a4 4 0 0 1 0 7',
  search: 'M21 21l-5-5M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  back: 'M19 12H5m6-6-6 6 6 6',
  chevron: 'm6 9 6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  close: 'm6 6 12 12M6 18 18 6',
  menu: 'M3 6h18M3 12h18M3 18h18',
  logout: 'M9 3H4v18h5m5-14 5 5-5 5m-6-5h11',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-16v6l4 2',
  leaf: 'M20 3C10 1 2 7 4 15c2 8 16 8 16-12ZM4 21 15 10',
  mountain: 'm2 20 7-15 5 9 3-5 5 11Zm4-8 3 2 3-2',
  building: 'm2 9 10-6 10 6M3 10h18M5 10v9m5-9v9m4-9v9m5-9v9M2 21h20',
  food: 'M4 3v6a3 3 0 0 0 6 0V3M7 3v18M20 3c-5 2-6 9 0 10v8m0-18v10',
  star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z',
  shield: 'm12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Zm-4 10 3 3 5-6',
  check: 'm5 12 4 4L19 6',
  edit: 'm16 3 5 5-12 12-6 1 1-6Zm-2 2 5 5',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
  upload: 'M8 17H6a5 5 0 1 1 0-10 7 7 0 0 1 13-1 5.5 5.5 0 0 1-1 11h-2m-4 4V10m-4 4 4-4 4 4',
  image: 'M3 3h18v18H3Zm0 0v14l6-6 4 4 3-3 5 5M15 8h.01',
  lock: 'M5 10h14v11H5Zm3 0V6a4 4 0 1 1 8 0v4m-4 4v3',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-9 4 2-2V7h3l2-3h4l2 3h3v3l2 2-2 2v3h-3l-2 3h-4l-2-3H5v-3z',
  mail: 'M3 5h18v14H3Zm0 0 9 8 9-8',
  share:
    'M8 12l8-7m-8 7 8 7M8 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  expand: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  target:
    'M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm0-5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0-13v4m0 14v4M1 12h4m14 0h4',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-11v6m0-10h.01',
  save: 'M3 3h15l3 3v15H3Zm4 0v7h10V3M7 21v-7h10v7',
} as const

export type IconName = keyof typeof paths
withDefaults(defineProps<{ name: IconName; size?: number }>(), { size: 20 })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="app-icon"
  >
    <path :d="paths[name]" />
  </svg>
</template>
