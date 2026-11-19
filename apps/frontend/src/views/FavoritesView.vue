<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import PlaceCard from '../components/PlaceCard.vue'
import ItineraryCard from '../components/ItineraryCard.vue'
import { placesService } from '../services/places'
import { itinerariesService } from '../services/itineraries'
import { useFavoritesStore } from '../stores/favorites'
import type { Itinerary, Place } from '../types/tourism'

const favorites = useFavoritesStore()
const places = ref<Place[]>([])
const itineraries = ref<Itinerary[]>([])
const loading = ref(true)
const error = ref('')
const selectedPlaces = computed(() =>
  places.value.filter((place) => favorites.has('places', place.id)),
)
const selectedItineraries = computed(() =>
  itineraries.value.filter((item) => favorites.has('itineraries', item.id)),
)
const savedCount = computed(
  () => favorites.favorites.places.length + favorites.favorites.itineraries.length,
)

async function loadFavorites() {
  loading.value = true
  error.value = ''
  const [placeResults, itineraryResults] = await Promise.all([
    Promise.allSettled(favorites.favorites.places.map((id) => placesService.getById(id))),
    Promise.allSettled(
      favorites.favorites.itineraries.map((id) => itinerariesService.getById(id, true)),
    ),
  ])
  places.value = placeResults.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  )
  itineraries.value = itineraryResults.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  )
  if ([...placeResults, ...itineraryResults].some((result) => result.status === 'rejected'))
    error.value =
      'Alguns favoritos não puderam ser carregados. Eles podem estar indisponíveis no momento.'
  loading.value = false
}
onMounted(loadFavorites)
</script>

<template>
  <div class="page-shell">
    <header class="page-heading">
      <div>
        <p class="eyebrow">Lugares que ficam com você</p>
        <h1>Meus favoritos</h1>
        <p>Guarde os destinos e roteiros que despertaram sua vontade de viajar.</p>
      </div>
      <RouterLink to="/" class="btn-secondary"
        ><AppIcon name="compass" :size="16" />Explorar destinos</RouterLink
      >
    </header>
    <p class="field-help" style="margin-bottom: 22px">
      Seus favoritos ficam salvos neste navegador.
    </p>
    <p v-if="loading" class="loading-state" role="status">Buscando seus favoritos...</p>
    <template v-else
      ><div v-if="error" class="notice" role="status">
        {{ error }}
        <button class="btn-secondary btn-small" @click="loadFavorites">Tentar novamente</button>
      </div>
      <div v-if="!savedCount" class="empty-state">
        <AppIcon name="heart" :size="38" />
        <h2>Seu próximo destino pode estar a um coração de distância</h2>
        <p>Toque no coração de um destino ou roteiro para encontrá-lo aqui depois.</p>
        <RouterLink to="/" class="btn-primary">Descobrir destinos</RouterLink>
      </div>
      <section v-if="selectedPlaces.length">
        <div class="section-heading">
          <h2><AppIcon name="pin" />Destinos favoritos</h2>
        </div>
        <div class="card-grid">
          <PlaceCard v-for="place in selectedPlaces" :key="place.id" :place="place" />
        </div>
      </section>
      <section v-if="selectedItineraries.length" style="margin-top: 30px">
        <div class="section-heading">
          <h2><AppIcon name="map" />Roteiros favoritos</h2>
        </div>
        <div class="card-grid">
          <ItineraryCard
            v-for="item in selectedItineraries"
            :key="item.id"
            :itinerary="item"
            is-public
          />
        </div>
      </section>
      <section
        v-if="error && savedCount && !selectedPlaces.length && !selectedItineraries.length"
        class="empty-state"
      >
        <h2>Não foi possível exibir seus favoritos</h2>
        <p>Tente novamente para consultar os destinos que você salvou.</p>
      </section></template
    >
  </div>
</template>
