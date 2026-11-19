<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { itinerariesService } from '../services/itineraries'
import { placesService } from '../services/places'
import { useAuthStore } from '../stores/auth'
import { getErrorMessage, imageUrl, normalizeText } from '../utils/format'
import type { ItineraryInput, Place } from '../types/tourism'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const id = typeof route.params.id === 'string' ? route.params.id : undefined
const form = reactive<ItineraryInput>({ title: '', description: '', duracaoDias: 1, placeIds: [] })
const places = ref<Place[]>([])
const search = ref('')
const loading = ref(true)
const saving = ref(false)
const allowed = ref(false)
const error = ref('')
const selectedPlaces = computed(() =>
  places.value.filter((place) => form.placeIds.includes(place.id)),
)
const filteredPlaces = computed(() =>
  places.value.filter((place) =>
    normalizeText(`${place.name} ${place.city}`).includes(normalizeText(search.value)),
  ),
)

async function loadForm() {
  loading.value = true
  error.value = ''
  allowed.value = false
  try {
    places.value = await placesService.getAll()
    if (id) {
      const itinerary = await itinerariesService.getById(id)
      if (itinerary.status === 'EM_ANALISE') {
        error.value = 'Este roteiro está em análise. Aguarde a revisão para editá-lo.'
        return
      }
      if (!auth.isGuia && itinerary.userId !== auth.user?.id) {
        error.value = 'Você só pode editar seus próprios roteiros.'
        return
      }
      Object.assign(form, {
        title: itinerary.title,
        description: itinerary.description || '',
        duracaoDias: itinerary.duracaoDias,
        placeIds: itinerary.places.map((place) => place.id),
      })
      places.value = [
        ...places.value,
        ...itinerary.places.filter((place) => !places.value.some((item) => item.id === place.id)),
      ]
    }
    allowed.value = true
  } catch (cause) {
    error.value = getErrorMessage(
      cause,
      'Não foi possível carregar os dados do roteiro. Tente novamente.',
    )
  } finally {
    loading.value = false
  }
}
async function saveItinerary() {
  if (!form.placeIds.length) {
    error.value = 'Selecione pelo menos um local para compor o roteiro.'
    return
  }
  saving.value = true
  error.value = ''
  try {
    const saved = await itinerariesService.save(
      {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        duracaoDias: Number(form.duracaoDias),
      },
      id,
    )
    await router.push({ name: 'itinerary-details', params: { id: saved.id }, query: { saved: '1' } })
  } catch (cause) {
    error.value = getErrorMessage(
      cause,
      'Não foi possível salvar o roteiro. Confira os campos e tente novamente.',
    )
  } finally {
    saving.value = false
  }
}
function removePlace(placeId: string) {
  form.placeIds = form.placeIds.filter((value) => value !== placeId)
}
onMounted(loadForm)
</script>

<template>
  <div class="page-shell">
    <header class="page-heading">
      <div>
        <p class="eyebrow">Uma viagem com a sua cara</p>
        <h1>{{ id ? 'Editar roteiro' : 'Criar novo roteiro' }}</h1>
        <p>Reúna os lugares que você quer conhecer e dê forma à próxima aventura.</p>
      </div>
      <RouterLink :to="id ? `/roteiros/${id}` : '/roteiros'" class="btn-secondary"
        ><AppIcon name="back" :size="16" />Voltar</RouterLink
      >
    </header>
    <p v-if="loading" class="loading-state" role="status">Preparando seu roteiro...</p>
    <div v-if="error" class="notice notice-error" role="alert">
      {{ error
      }}<button v-if="!allowed && !loading" class="btn-secondary btn-small" @click="loadForm">
        Tentar novamente
      </button>
    </div>
    <form v-if="allowed && !loading" class="itinerary-form-layout" @submit.prevent="saveItinerary">
      <div>
        <section class="panel form-stack">
          <h2>Sobre o roteiro</h2>
          <div>
            <label for="itinerary-title" class="field-label">Título do roteiro *</label
            ><input
              id="itinerary-title"
              v-model.trim="form.title"
              class="field-control"
              required
              maxlength="160"
              placeholder="Ex.: Um fim de semana pelo Seridó"
            />
          </div>
          <div>
            <label for="itinerary-description" class="field-label">Descrição *</label
            ><textarea
              id="itinerary-description"
              v-model.trim="form.description"
              class="field-control"
              required
              placeholder="O que torna essa viagem especial?"
            />
          </div>
          <div>
            <label for="itinerary-duration" class="field-label">Duração em dias *</label
            ><input
              id="itinerary-duration"
              v-model.number="form.duracaoDias"
              class="field-control"
              style="max-width: 160px"
              type="number"
              min="1"
              step="1"
              required
            />
          </div>
        </section>
        <section class="panel">
          <div class="section-heading">
            <h2><AppIcon name="pin" />Escolha seus destinos</h2>
            <span class="muted" style="font-size: 11px"
              >{{ form.placeIds.length }} selecionados</span
            >
          </div>
          <label class="global-search" style="width: 100%; margin-bottom: 18px"
            ><AppIcon name="search" :size="17" /><input
              v-model="search"
              type="search"
              aria-label="Buscar locais para o roteiro"
              placeholder="Busque um destino ou uma cidade..."
          /></label>
          <div class="selection-grid">
            <label
              v-for="place in filteredPlaces"
              :key="place.id"
              class="place-option"
              :class="{ 'is-selected': form.placeIds.includes(place.id) }"
              ><input v-model="form.placeIds" type="checkbox" :value="place.id" /><img
                :src="imageUrl(place.imageUrl)"
                :alt="place.name"
                loading="lazy"
              /><span
                >{{ place.name }}<small>{{ place.city }}</small></span
              ></label
            >
          </div>
          <p v-if="!filteredPlaces.length" class="panel-description">
            {{
              places.length
                ? 'Nenhum local corresponde à busca.'
                : 'Ainda não existem locais cadastrados para criar um roteiro.'
            }}
          </p>
        </section>
      </div>
      <aside class="panel selection-summary">
        <h2>Seu roteiro, até aqui</h2>
        <p class="panel-description">
          {{ form.duracaoDias }}
          {{
            form.duracaoDias === 1
              ? 'dia para descobrir novos caminhos.'
              : 'dias para descobrir novos caminhos.'
          }}
        </p>
        <ul>
          <li v-for="place in selectedPlaces" :key="place.id">
            <AppIcon name="pin" :size="15" /><span>{{ place.name }}</span
            ><button
              class="icon-button"
              type="button"
              :aria-label="`Remover ${place.name} do roteiro`"
              @click="removePlace(place.id)"
            >
              <AppIcon name="close" :size="14" />
            </button>
          </li>
        </ul>
        <p v-if="!selectedPlaces.length" class="panel-description">
          Os lugares escolhidos vão aparecer aqui.
        </p>
        <p class="notice">
          {{
            id
              ? 'A edição respeita a situação atual do roteiro. Roteiros em análise ficam bloqueados.'
              : 'Seu roteiro será salvo como rascunho. Depois, você poderá enviá-lo para análise.'
          }}
        </p>
        <button class="btn-primary full-width" type="submit" :disabled="saving || !places.length">
          <AppIcon name="save" :size="16" />{{ saving ? 'Salvando...' : 'Salvar roteiro' }}
        </button>
      </aside>
    </form>
  </div>
</template>
