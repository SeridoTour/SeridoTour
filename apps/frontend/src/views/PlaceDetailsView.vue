<script setup lang="ts">
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { api } from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const place = ref<any>(null);
const reviews = ref<any[]>([]);
const mapContainer = ref<HTMLElement | null>(null);
let mapInstance: L.Map | null = null;

const newReview = ref({ rating: 5, comment: '' });
const selectedFile = ref<File | null>(null);
const fileError = ref<string>('');

// ==================== FUNÇÕES ====================

const loadReviews = async () => {
  try {
    const reviewsResponse = await api.get(`/reviews/place/${route.params.id}`);
    reviews.value = reviewsResponse.data;
  } catch (error) {
    console.error('Erro ao carregar avaliações:', error);
  }
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  fileError.value = '';

  if (target.files && target.files.length > 0) {
    const file = target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      fileError.value = 'A imagem é muito grande. O limite é 5MB.';
      target.value = '';
      selectedFile.value = null;
      return;
    }

    selectedFile.value = file;
  } else {
    selectedFile.value = null;
  }
};

const submitReview = async () => {
  if (!newReview.value.comment?.trim()) {
    alert('Escreva um comentário.');
    return;
  }

  try {
    let photoUrl: string | null = null;

    // 1. Upload da foto (se existir)
    if (selectedFile.value) {
      const photoFormData = new FormData();
      photoFormData.append('photo', selectedFile.value);

      const uploadRes = await api.post('/reviews/photos', photoFormData);
      
      photoUrl = uploadRes.data.url;        // ← Pegue a URL
      console.log('Foto enviada:', photoUrl);
    }

    // 2. Criar o Review com a foto
    const reviewPayload = {
      placeId: route.params.id as string,
      rating: Number(newReview.value.rating),
      comment: newReview.value.comment.trim(),
      photoUrl: photoUrl,                    // ← Envia a URL
    };

    await api.post('/reviews', reviewPayload);

    alert('✅ Avaliação enviada com sucesso!');

    newReview.value = { rating: 5, comment: '' };
    selectedFile.value = null;
    await loadReviews();

  } catch (error: any) {
    console.error(error.response?.data || error);
    alert('Erro ao enviar avaliação');
  }
};

const deletePlace = async () => {
  if (!place.value || !window.confirm(`Excluir "${place.value.name}"? Esta ação não pode ser desfeita.`)) return;

  try {
    await api.delete(`/places/${place.value.id}`);
    await router.push('/');
  } catch (error) {
    console.error('Erro ao excluir local:', error);
    alert('Não foi possível excluir este local.');
  }
};

const initMap = () => {
  if (!mapContainer.value || !place.value?.latitude || !place.value?.longitude) return;

  mapInstance = L.map(mapContainer.value).setView(
    [place.value.latitude, place.value.longitude],
    13
  );

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
  L.marker([place.value.latitude, place.value.longitude]).addTo(mapInstance);
};

// ==================== LIFECYCLE ====================

onMounted(async () => {
  try {
    const response = await api.get(`/places/${route.params.id}`);
    place.value = response.data.data ?? response.data;

    await loadReviews();           // ← Agora usando a função
    await nextTick();
    initMap();
  } catch (error) {
    console.error('Erro ao carregar detalhes:', error);
  }
});

onBeforeUnmount(() => {
  mapInstance?.remove();
});

const getFullImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  
  // Em produção usa a URL do ambiente
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

</script>

<template>
  <div class="p-8 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8" v-if="place">
    <div>
      <h1 class="text-4xl font-bold mb-2">{{ place.name }}</h1>
      <span class="inline-block bg-teal-100 text-teal-800 px-2 py-1 rounded text-sm mb-4">
        {{ place.category }}
      </span>
      <p class="text-gray-700 mb-6">{{ place.description }}</p>

      <div v-if="authStore.isGuia" class="flex gap-3 mb-6">
        <router-link
          :to="`/places/${place.id}/edit`"
          class="bg-teal-600 text-white px-4 py-2 rounded font-semibold hover:bg-teal-700"
        >
          Editar local
        </router-link>
        <button
          @click="deletePlace"
          class="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700"
        >
          Excluir local
        </button>
      </div>

      <h3 class="text-xl font-bold mt-8 mb-4">Avaliações</h3>
      <div v-if="reviews.length" class="space-y-4 mb-8">
        <div v-for="review in reviews" :key="review.id" class="p-4 bg-gray-50 rounded">
          <p class="font-bold">Nota: {{ review.rating }}/5</p>
          <p class="italic text-gray-600">"{{ review.comment }}"</p>
          
          <!-- Foto da avaliação -->
          <img
            v-if="review.photoUrl"
            :src="getFullImageUrl(review.photoUrl)"
            class="mt-3 max-w-full h-auto rounded shadow"
            alt="Foto da avaliação"
          />
        </div>
      </div>
      <p v-else class="text-gray-500 mb-8">Nenhuma avaliação ainda.</p>

      <!-- Formulário de avaliação -->
      <div v-if="authStore.isAuthenticated" class="border p-4 rounded bg-white shadow-sm">
        <h4 class="font-bold mb-2">Deixe a sua avaliação</h4>
        <form @submit.prevent="submitReview" class="flex flex-col gap-3">
          <input
            type="number"
            v-model="newReview.rating"
            min="1"
            max="5"
            class="border p-2 rounded w-24"
            required
          />

          <textarea
            v-model="newReview.comment"
            class="border p-2 rounded"
            rows="3"
            placeholder="O que achou deste local?"
            required
          ></textarea>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Adicionar uma Foto (Opcional)
            </label>
            <input
              type="file"
              accept="image/jpeg, image/png, image/webp"
              @change="handleFileChange"
              class="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <p v-if="fileError" class="text-red-500 text-xs mt-1">{{ fileError }}</p>
          </div>

          <button
            type="submit"
            class="bg-teal-600 text-white py-2 rounded font-semibold hover:bg-teal-700"
          >
            Avaliar
          </button>
        </form>
      </div>
      <div v-else class="p-4 bg-yellow-50 text-yellow-800 rounded border border-yellow-200">
        <router-link to="/login" class="underline font-semibold">
          Faça login para avaliar este local
        </router-link>
      </div>
    </div>

    <div class="h-96 w-full rounded shadow z-0" ref="mapContainer"></div>
  </div>
</template>