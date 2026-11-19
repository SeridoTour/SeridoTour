<script setup lang="ts">
import AppIcon from './AppIcon.vue'
defineProps<{ rating: number }>()
</script>
<template>
  <span class="stars" :aria-label="`${rating.toFixed(1)} de 5 estrelas`"
    ><AppIcon
      v-for="star in 5"
      :key="star"
      name="star"
      :size="14"
      :class="{ filled: star <= Math.round(rating) }"
  /></span>
</template>
