<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import PlaceCard from '../components/PlaceCard.vue'
import PlaceMap from '../components/PlaceMap.vue'
import { placesService } from '../services/places'
import { useAuthStore } from '../stores/auth'
import { usePreferencesStore } from '../stores/preferences'
import { getErrorMessage, imageUrl, normalizeText } from '../utils/format'
import type { Place } from '../types/tourism'

const route = useRoute()
const auth = useAuthStore()
const preferences = usePreferencesStore()
const places = ref<Place[]>([])
const loading = ref(true)
const error = ref('')
const category = ref('')
const selectedId = ref('')
const page = ref(1)
const isMapOnly = computed(() => route.name === 'map')
const categories = computed(() => [...new Set(places.value.map((place) => place.category))])
const filteredPlaces = computed(() => {
  const search = normalizeText(typeof route.query.q === 'string' ? route.query.q : '')
  return places.value.filter(
    (place) =>
      (!category.value || place.category === category.value) &&
      normalizeText(`${place.name} ${place.city} ${place.description}`).includes(search),
  )
})
const totalPages = computed(() => Math.ceil(filteredPlaces.value.length / 6))
const visiblePlaces = computed(() =>
  filteredPlaces.value.slice((page.value - 1) * 6, page.value * 6),
)
const selectedPlace = computed(
  () =>
    filteredPlaces.value.find((place) => place.id === selectedId.value) || filteredPlaces.value[0],
)
watch([category, () => route.query.q], () => {
  page.value = 1
})

async function loadPlaces() {
  loading.value = true
  error.value = ''
  try {
    places.value = await placesService.getAll()
  } catch (cause) {
    error.value = getErrorMessage(cause, 'Não foi possível carregar os destinos. Tente novamente.')
  } finally {
    loading.value = false
  }
}
onMounted(loadPlaces)
</script>

<template>
  <div class="page-shell" :class="{ 'map-page': isMapOnly }">
    <header class="page-heading">
      <div>
        <p v-if="!isMapOnly" class="eyebrow">Caminhos, histórias e encontros</p>
        <h1>{{ isMapOnly ? 'Mapa do Seridó' : 'Destinos para descobrir' }}</h1>
        <p>
          {{
            isMapOnly
              ? 'Use a rodinha do mouse para aproximar ou afastar o mapa.'
              : 'Encontre sua próxima experiência no coração do Seridó.'
          }}
        </p>
      </div>
      <RouterLink v-if="auth.isGuia && !isMapOnly" to="/places/new" class="btn-primary"
        ><AppIcon name="plus" :size="17" />Cadastrar local</RouterLink
      >
      <button
        v-else-if="!isMapOnly"
        class="btn-secondary"
        :aria-pressed="preferences.showMap"
        @click="preferences.showMap = !preferences.showMap"
      >
        <AppIcon name="map" :size="17" />{{ preferences.showMap ? 'Ocultar mapa' : 'Mostrar mapa' }}
      </button>
    </header>
    <div class="filter-row" aria-label="Filtrar destinos por categoria">
      <button class="filter-chip" :class="{ 'is-active': !category }" @click="category = ''">
        <AppIcon name="plus" :size="14" />Todos
      </button>
      <button
        v-for="item in categories"
        :key="item"
        class="filter-chip"
        :class="{ 'is-active': category === item }"
        :aria-pressed="category === item"
        @click="category = item"
      >
        <AppIcon
          :name="
            item === 'Histórico'
              ? 'building'
              : item === 'Culinária'
                ? 'food'
                : item === 'Aventura'
                  ? 'mountain'
                  : 'leaf'
          "
          :size="15"
        />{{ item }}
      </button>
    </div>
    <p v-if="loading" class="loading-state" role="status">Buscando seu próximo destino...</p>
    <div v-else-if="error" class="notice notice-error" role="alert">
      {{ error }}
      <div class="button-row">
        <button class="btn-secondary btn-small" @click="loadPlaces">Tentar novamente</button>
      </div>
    </div>
    <div v-else-if="!filteredPlaces.length" class="empty-state">
      <AppIcon name="compass" :size="36" />
      <h2>Nenhum destino encontrado</h2>
      <p>
        {{
          places.length
            ? 'Experimente outra busca ou categoria.'
            : 'Novos lugares vão aparecer por aqui assim que forem cadastrados.'
        }}
      </p>
      <RouterLink v-if="route.query.q" to="/" class="btn-secondary">Limpar busca</RouterLink>
    </div>
    <div
      v-else
      class="explore-columns"
      :class="{ 'is-map-only': isMapOnly, 'no-map': !preferences.showMap && !isMapOnly }"
    >
      <section v-if="!isMapOnly" aria-label="Destinos">
        <div class="card-grid">
          <PlaceCard
            v-for="place in visiblePlaces"
            :key="place.id"
            :place="place"
            :selected="selectedId === place.id"
            @select="selectedId = $event"
          />
        </div>
        <nav v-if="totalPages > 1" class="pagination" aria-label="Páginas de destinos">
          <button class="btn-secondary btn-small" :disabled="page === 1" @click="page--">
            Anterior</button
          ><span>{{ page }} de {{ totalPages }}</span
          ><button class="btn-secondary btn-small" :disabled="page === totalPages" @click="page++">
            Próxima
          </button>
        </nav>
      </section>
      <aside
        v-if="preferences.showMap || isMapOnly"
        class="explore-map"
        aria-label="Localização dos destinos"
      >
        <div class="map-toolbar">
          <strong><AppIcon name="map" :size="16" />Mapa do Seridó</strong
          ><RouterLink v-if="!isMapOnly" to="/mapa" class="icon-button" aria-label="Ampliar mapa"
            ><AppIcon name="expand" :size="16" /></RouterLink
          ><RouterLink v-else to="/" class="btn-secondary btn-small">Ver destinos</RouterLink>
        </div>
        <PlaceMap
          :places="filteredPlaces"
          :selected-id="selectedPlace?.id"
          :scroll-wheel-zoom="isMapOnly"
          @select="selectedId = $event"
        />
        <div v-if="selectedPlace" class="map-selection">
          <img
            :src="imageUrl(selectedPlace.imageUrl)"
            :alt="selectedPlace.imageUrl ? selectedPlace.name : 'Paisagem ilustrativa do Seridó'"
          />
          <div>
            <h3>{{ selectedPlace.name }}</h3>
            <p>{{ selectedPlace.city }} · {{ selectedPlace.category }}</p>
            <p v-if="!selectedPlace.imageUrl">Imagem ilustrativa</p>
            <RouterLink :to="`/places/${selectedPlace.id}`" class="btn-primary"
              >Ver detalhes <AppIcon name="arrow" :size="13"
            /></RouterLink>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
