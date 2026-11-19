<script setup lang="ts">
import type { Place } from '../types/tourism'
import { useFavoritesStore } from '../stores/favorites'
import { imageUrl } from '../utils/format'
import { categoryClass } from '../constants/categories'
import AppIcon from './AppIcon.vue'

defineProps<{ place: Place; selected?: boolean }>()
defineEmits<{ select: [id: string] }>()
const favorites = useFavoritesStore()
</script>

<template>
  <article
    class="destination-card"
    :class="{ 'is-selected': selected }"
    @mouseenter="$emit('select', place.id)"
    @focusin="$emit('select', place.id)"
  >
    <div class="card-photo">
      <RouterLink :to="`/places/${place.id}`" tabindex="-1" aria-hidden="true"
        ><img
          :src="imageUrl(place.imageUrl)"
          :alt="place.name"
          loading="lazy"
          @error="($event.target as HTMLImageElement).src = '/serido-sunset.png'" /></RouterLink
      ><span class="category-badge" :class="categoryClass(place.category)"
        ><AppIcon :name="place.category === 'Histórico' ? 'building' : 'leaf'" :size="13" />{{
          place.category
        }}</span
      ><button
        class="favorite-button"
        :class="{ 'is-favorite': favorites.has('places', place.id) }"
        :aria-label="`${favorites.has('places', place.id) ? 'Remover dos' : 'Adicionar aos'} favoritos: ${place.name}`"
        :aria-pressed="favorites.has('places', place.id)"
        @click="favorites.toggle('places', place.id)"
      >
        <AppIcon name="heart" />
      </button>
    </div>
    <div class="card-body">
      <h2>
        <RouterLink :to="`/places/${place.id}`">{{ place.name }}</RouterLink>
      </h2>
      <p class="card-location"><AppIcon name="pin" :size="14" />{{ place.city }}</p>
      <p class="card-description">{{ place.description }}</p>
      <div class="card-footer">
        <span><AppIcon name="compass" :size="15" />Conheça o destino</span
        ><RouterLink
          :to="`/places/${place.id}`"
          class="circle-link"
          :aria-label="`Ver ${place.name}`"
          ><AppIcon name="arrow" :size="17"
        /></RouterLink>
      </div>
    </div>
  </article>
</template>
