<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import ImageUpload from '../components/ImageUpload.vue'
import PlaceMap from '../components/PlaceMap.vue'
import RatingStars from '../components/RatingStars.vue'
import ReviewList from '../components/ReviewList.vue'
import { categoryClass } from '../constants/categories'
import geosites from '../data/geossitios-preview.json'
import { api } from '../services/api'
import { placesService } from '../services/places'
import { useAuthStore } from '../stores/auth'
import { useFavoritesStore } from '../stores/favorites'
import { getErrorMessage, imageUrl } from '../utils/format'
import type { Place, Review } from '../types/tourism'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const favorites = useFavoritesStore()
const id = String(route.params.id)
const place = ref<Place | null>(null)
const catalogEntry = computed(() => geosites.places.find(item => item.id === place.value?.id))
const reviews = ref<Review[]>([])
const loading = ref(true)
const error = ref('')
const reviewsError = ref('')
const feedback = ref('')
const tab = ref('overview')
const saving = ref(false)
const deleteOpen = ref(false)
const deleting = ref(false)
const rating = ref(5)
const comment = ref('')
const image = ref<File | null>(null)
const reviewFeedback = ref('')
const reviewError = ref('')
const averageRating = computed(() =>
  reviews.value.length
    ? reviews.value.reduce((sum, item) => sum + item.rating, 0) / reviews.value.length
    : null,
)
const tabs = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'photos', label: 'Fotos' },
  { id: 'reviews', label: 'Avaliações' },
]

async function loadReviews() {
  reviewsError.value = ''
  try {
    reviews.value = (await api.get<Review[]>(`/reviews/place/${id}`)).data
  } catch (cause) {
    reviewsError.value = getErrorMessage(cause, 'Não foi possível carregar as avaliações.')
  }
}
async function loadPlace() {
  loading.value = true
  error.value = ''
  try {
    place.value = await placesService.getById(id)
    await loadReviews()
  } catch (cause) {
    error.value = getErrorMessage(
      cause,
      'Não foi possível encontrar esse destino. Volte aos locais ou tente novamente.',
    )
  } finally {
    loading.value = false
  }
}
async function submitReview() {
  if (!comment.value.trim()) {
    reviewError.value = 'Escreva um comentário sobre sua experiência.'
    return
  }
  saving.value = true
  reviewError.value = ''
  reviewFeedback.value = ''
  try {
    const body = new FormData()
    body.append('placeId', id)
    body.append('rating', String(rating.value))
    body.append('comment', comment.value.trim())
    if (image.value) body.append('image', image.value)
    await api.post('/reviews', body)
    comment.value = ''
    image.value = null
    rating.value = 5
    reviewFeedback.value = 'Avaliação publicada. Obrigado por compartilhar sua experiência!'
    await loadReviews()
  } catch (cause) {
    reviewError.value = getErrorMessage(
      cause,
      'Não foi possível publicar sua avaliação. Tente novamente.',
    )
  } finally {
    saving.value = false
  }
}
async function deletePlace() {
  deleting.value = true
  try {
    await placesService.remove(id)
    await router.push('/')
  } catch (cause) {
    error.value = getErrorMessage(
      cause,
      'Não foi possível excluir este local. Ele pode estar vinculado a avaliações ou roteiros.',
    )
    deleteOpen.value = false
  } finally {
    deleting.value = false
  }
}
async function sharePlace() {
  try {
    if (navigator.share)
      await navigator.share({ title: place.value?.name, url: window.location.href })
    else {
      await navigator.clipboard.writeText(window.location.href)
      feedback.value = 'Link copiado para compartilhar.'
    }
  } catch (cause) {
    if (!(cause instanceof DOMException && cause.name === 'AbortError'))
      feedback.value = 'Compartilhe este destino copiando o endereço da página.'
  }
}
onMounted(loadPlace)
</script>

<template>
  <div class="page-shell">
    <p v-if="loading" class="loading-state" role="status">Preparando os detalhes do destino...</p>
    <div v-if="error" class="notice notice-error" role="alert">
      {{ error }}
      <div class="button-row">
        <button class="btn-secondary btn-small" @click="loadPlace">Tentar novamente</button
        ><RouterLink to="/" class="btn-secondary btn-small">Ver destinos</RouterLink>
      </div>
    </div>
    <template v-if="place && !loading">
      <p v-if="route.query.saved" class="notice notice-success" role="status">
        Local turístico salvo com sucesso.
      </p>
      <p v-if="feedback" class="notice" role="status">{{ feedback }}</p>
      <div class="detail-layout">
        <div>
          <section class="destination-hero">
            <img
              :src="imageUrl(place.imageUrl)"
              :alt="place.imageUrl ? place.name : 'Paisagem do Seridó'"
            />
            <div class="hero-tools">
              <RouterLink to="/" class="icon-button" aria-label="Voltar aos destinos"
                ><AppIcon name="back"
              /></RouterLink>
              <div class="button-row">
                <button
                  class="icon-button"
                  :aria-pressed="favorites.has('places', id)"
                  aria-label="Alternar favorito"
                  @click="favorites.toggle('places', id)"
                >
                  <AppIcon
                    name="heart"
                    :style="{ fill: favorites.has('places', id) ? 'currentColor' : 'none' }"
                  /></button
                ><button class="icon-button" aria-label="Compartilhar destino" @click="sharePlace">
                  <AppIcon name="share" :size="18" />
                </button>
              </div>
            </div>
            <div class="hero-content">
              <span class="category-badge" :class="categoryClass(place.category)"
                ><AppIcon name="leaf" :size="13" />{{ place.category }}</span
              >
              <h1>{{ place.name }}</h1>
              <p class="card-location"><AppIcon name="pin" :size="17" />{{ place.city }}</p>
              <div class="button-row" style="margin-top: 17px">
                <RatingStars v-if="averageRating !== null" :rating="averageRating" /><span
                  style="font-size: 11px"
                  >{{
                    averageRating !== null
                      ? `${averageRating.toFixed(1)} · ${reviews.length} avaliações`
                      : 'Seja o primeiro a avaliar'
                  }}</span
                >
              </div>
            </div>
          </section>
          <p v-if="!place.imageUrl" class="media-credit">Imagem ilustrativa do Seridó. Ainda não há foto deste destino.</p>
          <nav class="tabs" aria-label="Seções do destino">
            <button
              v-for="item in tabs"
              :key="item.id"
              class="tab"
              :class="{ 'is-active': tab === item.id }"
              :aria-pressed="tab === item.id"
              @click="tab = item.id"
            >
              {{ item.label }}
            </button>
          </nav>
          <section v-if="tab === 'overview'" class="panel">
            <div class="overview-grid">
              <div>
                <div class="section-heading">
                  <h2><AppIcon name="mountain" />Sobre o destino</h2>
                </div>
                <p class="prose">{{ place.description }}</p>
                <p v-if="catalogEntry" class="catalog-source">
                  Fonte do cadastro e da localização:
                  <a :href="catalogEntry.source.url" target="_blank" rel="noopener noreferrer">{{ catalogEntry.source.label }}</a>.
                  {{ geosites.coordinateNote }}
                </p>
                <span
                  class="category-badge"
                  :class="categoryClass(place.category)"
                  style="margin-top: 16px"
                  >{{ place.category }}</span
                >
              </div>
              <figure>
                <img
                  :src="imageUrl(place.imageUrl)"
                  :alt="place.imageUrl ? place.name : 'Paisagem ilustrativa do Seridó'"
                />
                <figcaption v-if="!place.imageUrl" class="field-help">
                  Paisagem ilustrativa do Seridó. Este destino ainda não possui uma foto.
                </figcaption>
              </figure>
            </div>
            <div v-if="auth.isGuia" class="form-actions">
              <RouterLink :to="`/places/${id}/edit`" class="btn-primary"
                ><AppIcon name="edit" :size="16" />Editar local</RouterLink
              ><button class="btn-danger" @click="deleteOpen = true">
                <AppIcon name="trash" :size="16" />Excluir local
              </button>
            </div>
          </section>
          <section v-if="tab === 'photos'" class="panel">
            <div class="section-heading">
              <h2><AppIcon name="image" />Fotos do destino</h2>
            </div>
            <img
              v-if="place.imageUrl"
              :src="imageUrl(place.imageUrl)"
              :alt="place.name"
              style="width: 100%; border-radius: 10px"
            />
            <p v-else class="panel-description">Este destino ainda não tem uma foto cadastrada.</p>
            <div
              v-if="reviews.some((review) => review.imageUrl)"
              class="card-grid"
              style="margin-top: 20px"
            >
              <figure v-for="review in reviews.filter((item) => item.imageUrl)" :key="review.id">
                <img
                  :src="imageUrl(review.imageUrl)"
                  :alt="`Foto enviada por ${review.user.name}`"
                  style="height: 180px; width: 100%; object-fit: cover; border-radius: 8px"
                />
                <figcaption class="field-help">Por {{ review.user.name }}</figcaption>
              </figure>
            </div>
          </section>
          <section v-if="tab === 'reviews'" class="panel">
            <div class="section-heading">
              <h2><AppIcon name="star" />Experiências de quem já foi</h2>
            </div>
            <p v-if="reviewsError" class="notice notice-error" role="alert">
              {{ reviewsError }}
              <button class="btn-secondary btn-small" @click="loadReviews">Tentar novamente</button>
            </p>
            <ReviewList :reviews="reviews" />
            <p v-if="!reviews.length && !reviewsError" class="panel-description">
              Seja o primeiro a compartilhar sua experiência neste destino.
            </p>
            <form
              v-if="auth.isAuthenticated"
              class="form-stack"
              style="margin-top: 26px"
              @submit.prevent="submitReview"
            >
              <h3>Como foi sua experiência?</h3>
              <div class="rating-input" aria-label="Escolha uma nota">
                <button
                  v-for="star in 5"
                  :key="star"
                  type="button"
                  :aria-label="`Dar ${star} de 5 estrelas`"
                  :aria-pressed="rating === star"
                  :class="{ 'is-selected': star <= rating }"
                  @click="rating = star"
                >
                  <AppIcon name="star" :size="25" />
                </button>
              </div>
              <div>
                <label class="field-label" for="review-comment">Seu comentário</label
                ><textarea
                  id="review-comment"
                  v-model.trim="comment"
                  class="field-control"
                  required
                  placeholder="Conte o que tornou a visita especial."
                />
              </div>
              <div>
                <p class="field-label">Uma foto da sua visita (opcional)</p>
                <ImageUpload v-model="image" />
              </div>
              <p v-if="reviewError" class="notice notice-error" role="alert">{{ reviewError }}</p>
              <p v-if="reviewFeedback" class="notice notice-success" role="status">
                {{ reviewFeedback }}
              </p>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Publicando...' : 'Publicar avaliação' }}
              </button>
            </form>
            <p v-else class="notice">
              <RouterLink :to="{ name: 'login', query: { redirect: route.fullPath } }"
                >Entre na sua conta para avaliar este destino →</RouterLink
              >
            </p>
          </section>
        </div>
        <aside class="detail-aside">
          <section class="panel">
            <h2><AppIcon name="pin" />Localização</h2>
            <PlaceMap :places="[place]" /><span class="coordinates"
              >{{ place.latitude.toFixed(5) }}, {{ place.longitude.toFixed(5) }}</span
            ><a
              :href="`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-primary full-width"
              >Ver no Google Maps <AppIcon name="arrow" :size="15"
            /></a>
          </section>
          <section class="panel">
            <h2><AppIcon name="compass" />Informações do destino</h2>
            <div class="key-value">
              <span>Cidade</span><strong>{{ place.city }}</strong>
            </div>
            <div class="key-value">
              <span>Categoria</span><strong>{{ place.category }}</strong>
            </div>
            <button
              class="btn-primary full-width"
              style="margin-top: 17px"
              :aria-pressed="favorites.has('places', id)"
              @click="favorites.toggle('places', id)"
            >
              <AppIcon name="heart" :size="17" />{{
                favorites.has('places', id) ? 'Salvo nos favoritos' : 'Adicionar aos favoritos'
              }}
            </button>
          </section>
          <section class="panel">
            <h2><AppIcon name="star" />Avaliações</h2>
            <div v-if="averageRating !== null" class="rating-summary">
              <strong class="rating-number">{{ averageRating.toFixed(1) }}</strong>
              <div>
                <RatingStars :rating="averageRating" /><small class="field-help"
                  >{{ reviews.length }} avaliações</small
                >
              </div>
            </div>
            <p v-if="reviewsError" class="field-error">{{ reviewsError }}</p>
            <p v-else-if="!reviews.length" class="panel-description">
              Este destino ainda não foi avaliado.
            </p>
            <ReviewList :reviews="reviews.slice(0, 2)" /><button
              class="btn-secondary full-width"
              style="margin-top: 14px"
              @click="tab = 'reviews'"
            >
              Ver e escrever avaliações
            </button>
          </section>
        </aside>
      </div>
      <ConfirmDialog
        id="delete-place"
        :open="deleteOpen"
        title="Excluir este local?"
        :message="`O local “${place.name}” será removido. Esta ação não pode ser desfeita.`"
        confirm-label="Excluir local"
        danger
        :busy="deleting"
        @close="deleteOpen = false"
        @confirm="deletePlace"
      />
    </template>
  </div>
</template>
