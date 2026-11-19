<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import ItineraryCard from '../components/ItineraryCard.vue'
import ItineraryActions from '../components/ItineraryActions.vue'
import { ITINERARY_STATUS_LABELS } from '../constants/itineraryStatus'
import { itinerariesService } from '../services/itineraries'
import { useAuthStore } from '../stores/auth'
import { getErrorMessage, normalizeText } from '../utils/format'
import type { Itinerary } from '../types/tourism'

const route = useRoute()
const auth = useAuthStore()
const isPublic = computed(() => route.name === 'public-itineraries')
const itineraries = ref<Itinerary[]>([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const status = ref('')
const filtered = computed(() =>
  itineraries.value.filter(
    (item) =>
      (!status.value || item.status === status.value) &&
      normalizeText(`${item.title} ${item.description || ''}`).includes(
        normalizeText(search.value),
      ),
  ),
)

async function loadItineraries() {
  loading.value = true
  error.value = ''
  try {
    itineraries.value = await itinerariesService.getAll(isPublic.value ? 'public' : 'mine')
  } catch (cause) {
    error.value = getErrorMessage(cause, 'Não foi possível carregar os roteiros. Tente novamente.')
  } finally {
    loading.value = false
  }
}
onMounted(loadItineraries)
</script>

<template>
  <div class="page-shell">
    <header class="page-heading">
      <div>
        <p class="eyebrow">
          {{ isPublic ? 'Inspire-se para sua próxima viagem' : 'Seu próximo caminho começa aqui' }}
        </p>
        <h1>{{ isPublic ? 'Roteiros para descobrir o Seridó' : 'Meus roteiros' }}</h1>
        <p>
          {{
            isPublic
              ? 'Experiências revisadas pelos guias, prontas para você conhecer.'
              : 'Organize seus destinos e acompanhe cada etapa da publicação.'
          }}
        </p>
      </div>
      <RouterLink v-if="auth.isAuthenticated" to="/roteiros/new" class="btn-primary"
        ><AppIcon name="plus" :size="17" />Criar roteiro</RouterLink
      ><RouterLink v-else to="/login" class="btn-primary">Entre para criar seu roteiro</RouterLink>
    </header>
    <div class="filter-row">
      <label class="global-search" style="width: 320px; max-width: 100%"
        ><AppIcon name="search" :size="17" /><input
          v-model="search"
          type="search"
          aria-label="Buscar roteiros por título ou descrição"
          placeholder="Buscar um roteiro..." /></label
      ><template v-if="!isPublic"
        ><button class="filter-chip" :class="{ 'is-active': !status }" @click="status = ''">
          Todos</button
        ><button
          v-for="(label, key) in ITINERARY_STATUS_LABELS"
          :key="key"
          class="filter-chip"
          :class="{ 'is-active': status === key }"
          :aria-pressed="status === key"
          @click="status = key"
        >
          {{ label }}
        </button></template
      >
    </div>
    <p v-if="loading" class="loading-state" role="status">Carregando roteiros...</p>
    <div v-else-if="error" class="notice notice-error" role="alert">
      {{ error }}
      <button class="btn-secondary btn-small" @click="loadItineraries">Tentar novamente</button>
    </div>
    <div v-else-if="!filtered.length" class="empty-state">
      <AppIcon name="map" :size="38" />
      <h2>
        {{
          itineraries.length
            ? 'Nenhum roteiro encontrado'
            : isPublic
              ? 'Novos caminhos estão por vir'
              : 'Sua próxima viagem começa com uma ideia'
        }}
      </h2>
      <p>
        {{
          itineraries.length
            ? 'Tente outro título ou status.'
            : isPublic
              ? 'Os roteiros publicados pelos guias vão aparecer por aqui.'
              : 'Escolha seus destinos favoritos e crie seu primeiro roteiro.'
        }}
      </p>
      <RouterLink
        v-if="auth.isAuthenticated && !itineraries.length"
        to="/roteiros/new"
        class="btn-primary"
        >Criar meu primeiro roteiro</RouterLink
      >
    </div>
    <div v-else class="card-grid">
      <ItineraryCard v-for="item in filtered" :key="item.id" :itinerary="item" :is-public="isPublic"
        ><template v-if="!isPublic" #actions
          ><ItineraryActions :itinerary="item" @changed="loadItineraries" /></template
      ></ItineraryCard>
    </div>
  </div>
</template>
