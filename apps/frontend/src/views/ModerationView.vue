<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import DesertDecoration from '../components/DesertDecoration.vue'
import ItineraryActions from '../components/ItineraryActions.vue'
import { ITINERARY_STATUS_CLASSES, ITINERARY_STATUS_LABELS } from '../constants/itineraryStatus'
import { itinerariesService } from '../services/itineraries'
import { getErrorMessage, imageUrl, normalizeText } from '../utils/format'
import type { Itinerary } from '../types/tourism'

const itineraries = ref<Itinerary[]>([])
const loading = ref(true)
const error = ref('')
const status = ref('EM_ANALISE')
const search = ref('')
const category = ref('')
const sort = ref('asc')
const categories = computed(() => [
  ...new Set(itineraries.value.flatMap((item) => item.places.map((place) => place.category))),
])
const filtered = computed(() =>
  itineraries.value
    .filter(
      (item) =>
        (!status.value || item.status === status.value) &&
        (!category.value || item.places.some((place) => place.category === category.value)) &&
        normalizeText(`${item.title} ${item.user?.name || ''}`).includes(
          normalizeText(search.value),
        ),
    )
    .sort((a, b) =>
      sort.value === 'asc'
        ? a.title.localeCompare(b.title, 'pt-BR')
        : b.title.localeCompare(a.title, 'pt-BR'),
    ),
)
const counts = computed(() => ({
  pending: itineraries.value.filter((item) => item.status === 'EM_ANALISE').length,
  published: itineraries.value.filter((item) => item.status === 'PUBLICADO').length,
  rejected: itineraries.value.filter((item) => item.status === 'REJEITADO').length,
}))
async function loadItineraries() {
  loading.value = true
  error.value = ''
  try {
    itineraries.value = await itinerariesService.getAll('all')
  } catch (cause) {
    error.value = getErrorMessage(cause, 'Não foi possível carregar os roteiros para revisão.')
  } finally {
    loading.value = false
  }
}
function resetFilters() {
  status.value = ''
  category.value = ''
  search.value = ''
  sort.value = 'asc'
}
onMounted(loadItineraries)
</script>

<template>
  <div class="page-shell">
    <header class="page-heading">
      <div>
        <h1 class="heading-icon"><AppIcon name="shield" :size="30" />Moderação de roteiros</h1>
        <p>Revise os roteiros enviados e ajude a criar boas experiências de viagem.</p>
      </div>
    </header>
    <div class="moderation-layout">
      <section>
        <div class="filter-row">
          <button class="filter-chip" :class="{ 'is-active': !status }" @click="status = ''">
            Todos <small>({{ itineraries.length }})</small></button
          ><button
            v-for="(label, key) in ITINERARY_STATUS_LABELS"
            :key="key"
            class="filter-chip"
            :class="{ 'is-active': status === key }"
            :aria-pressed="status === key"
            @click="status = key"
          >
            {{ label }}
          </button>
        </div>
        <p v-if="loading" class="loading-state" role="status">Carregando fila de revisão...</p>
        <div v-else-if="error" class="notice notice-error" role="alert">
          {{ error }}
          <button class="btn-secondary btn-small" @click="loadItineraries">Tentar novamente</button>
        </div>
        <div v-else-if="!filtered.length" class="empty-state">
          <AppIcon name="shield" :size="36" />
          <h2>
            {{
              status === 'EM_ANALISE'
                ? 'Nenhum roteiro aguardando revisão'
                : 'Nenhum roteiro encontrado'
            }}
          </h2>
          <p>Os roteiros que correspondem aos filtros vão aparecer aqui.</p>
          <button class="btn-secondary" @click="resetFilters">Limpar filtros</button>
        </div>
        <div v-else class="moderation-list">
          <article v-for="item in filtered" :key="item.id" class="moderation-item">
            <img
              :src="imageUrl(item.places[0]?.imageUrl)"
              :alt="item.places[0]?.name || 'Paisagem do Seridó'"
            />
            <div class="moderation-content">
              <h2>
                <RouterLink :to="{ path: `/roteiros/${item.id}`, query: { from: 'moderation' } }">{{
                  item.title
                }}</RouterLink>
              </h2>
              <span class="status-badge" :class="ITINERARY_STATUS_CLASSES[item.status]">{{
                ITINERARY_STATUS_LABELS[item.status]
              }}</span>
              <p>
                Por {{ item.user?.name || 'Viajante' }} · {{ item.duracaoDias }} dias ·
                {{ item.places.length }} locais
              </p>
              <p>{{ item.description }}</p>
            </div>
            <ItineraryActions :itinerary="item" moderation @changed="loadItineraries" />
          </article>
        </div>
      </section>
      <aside>
        <section class="panel">
          <h2>Resumo da moderação</h2>
          <div class="summary-stat">
            <span class="stat-icon"><AppIcon name="clock" /></span>
            <div>
              <strong>{{ counts.pending }}</strong
              ><small>Aguardando revisão</small>
            </div>
          </div>
          <div class="summary-stat">
            <span class="stat-icon green"><AppIcon name="check" /></span>
            <div>
              <strong>{{ counts.published }}</strong
              ><small>Publicados</small>
            </div>
          </div>
          <div class="summary-stat">
            <span class="stat-icon red"><AppIcon name="close" /></span>
            <div>
              <strong>{{ counts.rejected }}</strong
              ><small>Rejeitados</small>
            </div>
          </div>
        </section>
        <section class="panel form-stack">
          <h2>Filtros</h2>
          <div>
            <label for="moderation-search" class="field-label">Título ou autor</label
            ><input
              id="moderation-search"
              v-model="search"
              class="field-control"
              type="search"
              placeholder="Buscar na fila..."
            />
          </div>
          <div>
            <label for="moderation-category" class="field-label">Categoria dos locais</label
            ><select id="moderation-category" v-model="category" class="field-control">
              <option value="">Todas as categorias</option>
              <option v-for="item in categories" :key="item">{{ item }}</option>
            </select>
          </div>
          <div>
            <label for="moderation-sort" class="field-label">Ordenação</label
            ><select id="moderation-sort" v-model="sort" class="field-control">
              <option value="asc">Título: A a Z</option>
              <option value="desc">Título: Z a A</option>
            </select>
          </div>
          <button class="btn-primary" @click="resetFilters">Limpar filtros</button>
        </section>
        <section class="panel desert-note">
          <p>Cuidar de cada caminho<br />é valorizar o que<br />é nosso.</p>
          <DesertDecoration />
        </section>
      </aside>
    </div>
  </div>
</template>
