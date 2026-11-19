<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import ItineraryActions from '../components/ItineraryActions.vue'
import PlaceCard from '../components/PlaceCard.vue'
import PlaceMap from '../components/PlaceMap.vue'
import { ITINERARY_STATUS_CLASSES, ITINERARY_STATUS_LABELS } from '../constants/itineraryStatus'
import { itinerariesService } from '../services/itineraries'
import { useAuthStore } from '../stores/auth'
import { getErrorMessage, imageUrl } from '../utils/format'
import type { Itinerary } from '../types/tourism'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isPublic = route.name === 'public-itinerary-details'
const itinerary = ref<Itinerary | null>(null)
const loading = ref(true)
const error = ref('')
const backTarget = isPublic
  ? '/roteiros-publicos'
  : auth.isGuia && route.query.from === 'moderation'
    ? '/moderacao'
    : '/roteiros'
const cover = computed(() => itinerary.value?.places.find((place) => place.imageUrl)?.imageUrl)

async function loadItinerary() {
  loading.value = true
  error.value = ''
  try {
    itinerary.value = await itinerariesService.getById(String(route.params.id), isPublic)
  } catch (cause) {
    error.value = getErrorMessage(cause, 'Roteiro não encontrado ou indisponível para consulta.')
  } finally {
    loading.value = false
  }
}
async function afterChange() {
  try {
    itinerary.value = await itinerariesService.getById(String(route.params.id), isPublic)
  } catch {
    await router.push(backTarget)
  }
}
onMounted(loadItinerary)
</script>

<template>
  <div class="page-shell">
    <p v-if="loading" class="loading-state" role="status">Carregando o roteiro...</p>
    <div v-else-if="error" class="notice notice-error" role="alert">
      {{ error }}
      <div class="button-row">
        <button class="btn-secondary btn-small" @click="loadItinerary">Tentar novamente</button
        ><RouterLink :to="backTarget" class="btn-secondary btn-small"
          >Voltar aos roteiros</RouterLink
        >
      </div>
    </div>
    <template v-else-if="itinerary">
      <p v-if="route.query.saved" class="notice notice-success" role="status">
        Roteiro salvo com sucesso.
      </p>
      <section class="destination-hero">
        <img :src="imageUrl(cover)" :alt="cover ? itinerary.title : 'Paisagem do Seridó'" />
        <div class="hero-tools">
          <RouterLink :to="backTarget" class="icon-button" aria-label="Voltar aos roteiros"
            ><AppIcon name="back"
          /></RouterLink>
        </div>
        <div class="hero-content">
          <span class="status-badge" :class="ITINERARY_STATUS_CLASSES[itinerary.status]">{{
            ITINERARY_STATUS_LABELS[itinerary.status]
          }}</span>
          <h1>{{ itinerary.title }}</h1>
          <p>Por {{ itinerary.user?.name || 'Viajante' }}</p>
          <div class="button-row">
            <span
              ><AppIcon name="clock" :size="16" /> {{ itinerary.duracaoDias }}
              {{ itinerary.duracaoDias === 1 ? 'dia' : 'dias' }}</span
            ><span>· {{ itinerary.places.length }} locais para conhecer</span>
          </div>
        </div>
      </section>
      <div class="detail-layout" style="margin-top: 22px">
        <div>
          <section class="panel">
            <div class="section-heading">
              <h2><AppIcon name="compass" />Sobre este roteiro</h2>
            </div>
            <p class="prose">
              {{ itinerary.description || 'Este roteiro ainda não tem uma descrição.' }}
            </p>
            <p v-if="itinerary.status === 'REJEITADO'" class="notice notice-error">
              Roteiro rejeitado.
              {{
                itinerary.rejectionReason || 'Revise as informações antes de reenviar para análise.'
              }}
            </p>
            <p v-if="itinerary.status === 'EM_ANALISE' && !isPublic" class="notice">
              O roteiro está em análise. A edição será liberada após a decisão do guia.
            </p>
            <div v-if="!isPublic" style="margin-top: 20px">
              <ItineraryActions
                :itinerary="itinerary"
                :moderation="auth.isGuia"
                @changed="afterChange"
              />
            </div>
          </section>
          <section class="panel">
            <div class="section-heading">
              <h2><AppIcon name="pin" />Destinos deste roteiro</h2>
            </div>
            <div class="card-grid">
              <PlaceCard v-for="place in itinerary.places" :key="place.id" :place="place" />
            </div>
            <p v-if="!itinerary.places.length" class="panel-description">
              Nenhum local associado a este roteiro.
            </p>
          </section>
        </div>
        <aside class="panel detail-aside">
          <h2><AppIcon name="map" />Os destinos no mapa</h2>
          <PlaceMap :places="itinerary.places" />
          <p class="panel-description" style="margin-top: 15px">
            Veja onde ficam os locais escolhidos para a viagem.
          </p>
          <RouterLink v-if="auth.isAuthenticated" to="/roteiros/new" class="btn-primary full-width"
            ><AppIcon name="plus" :size="16" />Criar meu roteiro</RouterLink
          >
        </aside>
      </div>
    </template>
  </div>
</template>
