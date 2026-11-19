<script setup lang="ts">
import type { Itinerary } from '../types/tourism'
import { ITINERARY_STATUS_CLASSES, ITINERARY_STATUS_LABELS } from '../constants/itineraryStatus'
import { imageUrl } from '../utils/format'
import { useFavoritesStore } from '../stores/favorites'
import AppIcon from './AppIcon.vue'

withDefaults(defineProps<{ itinerary: Itinerary; isPublic?: boolean }>(), { isPublic: false })
const favorites = useFavoritesStore()
</script>

<template>
  <article class="destination-card itinerary-card">
    <div class="card-photo">
      <img
        :src="imageUrl(itinerary.places[0]?.imageUrl)"
        :alt="itinerary.places[0]?.name || 'Paisagem do Seridó'"
        loading="lazy"
      /><span class="status-badge" :class="ITINERARY_STATUS_CLASSES[itinerary.status]">{{
        ITINERARY_STATUS_LABELS[itinerary.status]
      }}</span
      ><button
        v-if="isPublic"
        class="favorite-button"
        :class="{ 'is-favorite': favorites.has('itineraries', itinerary.id) }"
        :aria-label="`Favoritar roteiro: ${itinerary.title}`"
        :aria-pressed="favorites.has('itineraries', itinerary.id)"
        @click="favorites.toggle('itineraries', itinerary.id)"
      >
        <AppIcon name="heart" />
      </button>
    </div>
    <div class="card-body">
      <h2>
        <RouterLink :to="`${isPublic ? '/roteiros-publicos' : '/roteiros'}/${itinerary.id}`">{{
          itinerary.title
        }}</RouterLink>
      </h2>
      <p class="card-location">
        <AppIcon name="user" :size="14" />{{ itinerary.user?.name || 'Viajante' }}
      </p>
      <p class="card-description">
        {{ itinerary.description || 'Um novo caminho para descobrir o Seridó.' }}
      </p>
      <div class="card-footer">
        <span
          ><AppIcon name="clock" :size="15" />{{ itinerary.duracaoDias }}
          {{ itinerary.duracaoDias === 1 ? 'dia' : 'dias' }}</span
        ><span><AppIcon name="pin" :size="15" />{{ itinerary.places.length }} locais</span
        ><RouterLink
          class="circle-link"
          :to="`${isPublic ? '/roteiros-publicos' : '/roteiros'}/${itinerary.id}`"
          :aria-label="`Ver roteiro ${itinerary.title}`"
          ><AppIcon name="arrow" :size="17"
        /></RouterLink>
      </div>
      <p
        v-if="itinerary.rejectionReason && itinerary.status === 'REJEITADO'"
        class="notice notice-error"
      >
        {{ itinerary.rejectionReason }}
      </p>
    </div>
    <div v-if="$slots.actions" class="card-actions"><slot name="actions" /></div>
  </article>
</template>
