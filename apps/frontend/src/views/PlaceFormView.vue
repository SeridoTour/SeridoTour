<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import ImageUpload from '../components/ImageUpload.vue'
import PlaceMap from '../components/PlaceMap.vue'
import { PLACE_CATEGORIES } from '../constants/categories'
import { placesService } from '../services/places'
import { getErrorMessage } from '../utils/format'

const route = useRoute()
const router = useRouter()
const id = typeof route.params.id === 'string' ? route.params.id : undefined
const form = reactive({
  name: '',
  description: '',
  city: '',
  category: '',
  latitude: null as number | null,
  longitude: null as number | null,
})
const loading = ref(Boolean(id))
const loadFailed = ref(false)
const saving = ref(false)
const error = ref('')
const image = ref<File | null>(null)
const existingImage = ref<string | null>(null)
const map = ref<InstanceType<typeof PlaceMap> | null>(null)
const coordinates = computed(() =>
  form.latitude !== null &&
  form.longitude !== null &&
  Number.isFinite(form.latitude) &&
  Number.isFinite(form.longitude)
    ? { latitude: form.latitude, longitude: form.longitude }
    : null,
)

async function loadPlace() {
  if (!id) return
  loading.value = true
  loadFailed.value = false
  error.value = ''
  try {
    const place = await placesService.getById(id)
    Object.assign(form, {
      name: place.name,
      description: place.description,
      city: place.city,
      category: place.category,
      latitude: place.latitude,
      longitude: place.longitude,
    })
    existingImage.value = place.imageUrl || null
  } catch (cause) {
    loadFailed.value = true
    error.value = getErrorMessage(cause, 'Não foi possível carregar o local. Tente novamente.')
  } finally {
    loading.value = false
  }
}
async function savePlace() {
  if (!coordinates.value) {
    error.value = 'Escolha a localização no mapa ou informe latitude e longitude.'
    return
  }
  saving.value = true
  error.value = ''
  try {
    const body = new FormData()
    Object.entries(form).forEach(([key, value]) =>
      body.append(key, String(typeof value === 'string' ? value.trim() : value)),
    )
    if (image.value) body.append('image', image.value)
    const saved = await placesService.save(body, id)
    await router.push({ name: 'place-details', params: { id: saved.id }, query: { saved: '1' } })
  } catch (cause) {
    error.value = getErrorMessage(
      cause,
      'Não foi possível salvar o local. Confira os dados e tente novamente.',
    )
  } finally {
    saving.value = false
  }
}
onMounted(loadPlace)
</script>

<template>
  <div class="page-shell">
    <header class="page-heading">
      <div>
        <h1 class="heading-icon">
          <AppIcon name="pin" :size="30" />{{
            id ? 'Editar local turístico' : 'Cadastrar local turístico'
          }}
        </h1>
        <p>Compartilhe os lugares que fazem do Seridó um destino especial.</p>
      </div>
      <RouterLink to="/" class="btn-secondary"
        ><AppIcon name="back" :size="16" />Voltar aos locais</RouterLink
      >
    </header>
    <div v-if="error" class="notice notice-error" role="alert">
      {{ error
      }}<button v-if="loadFailed" class="btn-secondary btn-small" @click="loadPlace">
        Tentar novamente
      </button>
    </div>
    <p v-if="loading" class="loading-state" role="status">Carregando local...</p>
    <form v-else class="place-form-layout" @submit.prevent="savePlace">
      <section class="panel form-stack">
        <div>
          <h2>Informações do local</h2>
          <p class="panel-description">Os campos marcados com * são obrigatórios.</p>
        </div>
        <div>
          <label for="place-name" class="field-label">Nome do local <span>*</span></label
          ><input
            id="place-name"
            v-model.trim="form.name"
            class="field-control"
            required
            maxlength="160"
            placeholder="Ex.: Serra de São José"
          />
        </div>
        <div>
          <label for="place-category" class="field-label">Categoria <span>*</span></label
          ><select id="place-category" v-model="form.category" class="field-control" required>
            <option disabled value="">Selecione uma categoria</option>
            <option
              v-if="form.category && !PLACE_CATEGORIES.includes(form.category)"
              :value="form.category"
            >
              {{ form.category }}
            </option>
            <option v-for="category in PLACE_CATEGORIES" :key="category">{{ category }}</option>
          </select>
        </div>
        <div>
          <label for="place-description" class="field-label">Descrição <span>*</span></label
          ><textarea
            id="place-description"
            v-model.trim="form.description"
            class="field-control"
            required
            rows="6"
            placeholder="Conte a história e o que torna esse lugar especial."
          />
        </div>
        <div>
          <label for="place-city" class="field-label">Cidade <span>*</span></label
          ><input
            id="place-city"
            v-model.trim="form.city"
            class="field-control"
            required
            placeholder="Ex.: Currais Novos - RN"
          />
        </div>
        <div class="form-grid">
          <div>
            <label for="latitude" class="field-label">Latitude <span>*</span></label
            ><input
              id="latitude"
              v-model.number="form.latitude"
              class="field-control"
              type="number"
              step="any"
              min="-90"
              max="90"
              required
              placeholder="-6.26"
            />
          </div>
          <div>
            <label for="longitude" class="field-label">Longitude <span>*</span></label
            ><input
              id="longitude"
              v-model.number="form.longitude"
              class="field-control"
              type="number"
              step="any"
              min="-180"
              max="180"
              required
              placeholder="-36.51"
            />
          </div>
        </div>
      </section>
      <section class="panel form-map">
        <div class="section-heading">
          <h2>Localização no mapa</h2>
          <button class="btn-secondary btn-small" type="button" @click="map?.center()">
            <AppIcon name="target" :size="14" />Centralizar
          </button>
        </div>
        <p class="panel-description">Clique no mapa para marcar a localização exata do destino.</p>
        <PlaceMap
          ref="map"
          selectable
          :coordinates="coordinates"
          @pick="Object.assign(form, $event)"
        />
        <div class="coordinate-summary">
          <AppIcon name="pin" />
          <div>
            <small>Coordenadas selecionadas</small
            >{{
              coordinates
                ? `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`
                : 'Selecione um ponto no mapa'
            }}
          </div>
        </div>
      </section>
      <aside class="form-aside">
        <section class="panel">
          <h2>Imagem do local</h2>
          <p class="panel-description">Escolha uma foto que apresente o destino.</p>
          <ImageUpload v-model="image" :existing-image="existingImage" />
        </section>
        <div>
          <section class="panel">
            <h2>Pronto para descobrir</h2>
            <p class="panel-description">
              Ao salvar, o local ficará disponível para consulta e poderá fazer parte de novos
              roteiros.
            </p>
          </section>
          <button type="submit" class="btn-primary full-width" :disabled="saving || loadFailed">
            <AppIcon name="save" :size="17" />{{
              saving ? 'Salvando...' : 'Salvar local turístico'
            }}</button
          ><RouterLink
            :to="id ? `/places/${id}` : '/'"
            class="btn-secondary full-width"
            style="margin-top: 12px"
            >Cancelar</RouterLink
          >
        </div>
      </aside>
    </form>
  </div>
</template>
