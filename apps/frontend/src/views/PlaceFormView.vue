<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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

const mapContainer = ref<HTMLElement | null>(null);
const route = useRoute();
const router = useRouter();
const isEditing = computed(() => typeof route.params.id === 'string');
let mapInstance: L.Map | null = null;
let marker: L.Marker | null = null;

const isLoading = ref(false);
const message = ref('');

const form = ref({
  name: '',
  description: '',
  city: '',
  category: '',
  latitude: null as number | null,
  longitude: null as number | null
});

// Upload de imagem do place
const selectedFile = ref<File | null>(null);
const fileError = ref<string>('');
const previewUrl = ref<string | null>(null);

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  fileError.value = '';
  previewUrl.value = null;

  if (target.files && target.files.length > 0) {
    const file = target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      fileError.value = 'A imagem é muito grande. O limite é 5MB.';
      target.value = '';
      selectedFile.value = null;
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      fileError.value = 'Formato inválido. Use JPEG, PNG ou WEBP.';
      target.value = '';
      selectedFile.value = null;
      return;
    }

    selectedFile.value = file;
    // Pré-visualização local (object URL)
    previewUrl.value = URL.createObjectURL(file);
  } else {
    selectedFile.value = null;
  }
};

onMounted(async () => {
  initMap();
  if (!isEditing.value) return;

  try {
    const { data } = await api.get(`/places/${route.params.id}`);
    const { name, description, city, category, latitude, longitude } = data;
    form.value = { name, description, city, category, latitude, longitude };
    await nextTick();
    const { latitude: selectedLatitude, longitude: selectedLongitude } = form.value;
    if (selectedLatitude != null && selectedLongitude != null && mapInstance) {
      marker = L.marker([selectedLatitude, selectedLongitude]).addTo(mapInstance);
      mapInstance.setView([selectedLatitude, selectedLongitude], 13);
    }
  } catch (error) {
    console.error('Erro ao carregar local:', error);
    message.value = 'Não foi possível carregar os dados do local.';
  }
});

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove();
  }
});

const initMap = () => {
  if (!mapContainer.value) return;

  // Limites aproximados do Rio Grande do Norte
  const bounds = L.latLngBounds(L.latLng(-6.9, -38.6), L.latLng(-4.8, -34.9)); 

  mapInstance = L.map(mapContainer.value, {
    maxBounds: bounds,
    maxBoundsViscosity: 1.0,
    minZoom: 7
  }).setView([-5.7944, -36.5], 8); // Foco em Natal/RN

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);

  mapInstance.on('click', (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    form.value.latitude = lat;
    form.value.longitude = lng;

    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      marker = L.marker([lat, lng]).addTo(mapInstance!);
    }
  });
};

const submitPlace = async () => {
  if (!form.value.latitude || !form.value.longitude) {
    message.value = 'Por favor, selecione as coordenadas clicando no mapa.'
    return
  }

  isLoading.value = true
  message.value = ''

  try {
    // FormData: envia campos de texto + arquivo em multipart/form-data
    const formData = new FormData()
    formData.append('name', form.value.name)
    formData.append('description', form.value.description)
    formData.append('city', form.value.city)
    formData.append('category', form.value.category)
    formData.append('latitude', String(form.value.latitude))
    formData.append('longitude', String(form.value.longitude))

    // Se escolheu arquivo novo, envia; se editando e não escolheu, NÃO envia "image"
    if (selectedFile.value) {
      formData.append('image', selectedFile.value)
    }

    if (isEditing.value) {
      await api.patch(`/places/${route.params.id}`, formData)
      message.value = 'Ponto turístico atualizado com sucesso!'
      setTimeout(() => router.push(`/places/${route.params.id}`), 800)
      return
    }

    await api.post('/places', formData)
    message.value = 'Ponto turístico cadastrado com sucesso!'

    // Reseta o formulário
    form.value = { name: '', description: '', city: '', category: '', latitude: null, longitude: null }
    selectedFile.value = null
    previewUrl.value = null
    if (marker && mapInstance) {
      mapInstance.removeLayer(marker)
      marker = null
    }
  } catch (error) {
    message.value = 'Erro ao cadastrar local. Verifique os dados e tente novamente.'
    console.error(error)
  } finally {
    isLoading.value = false
  }
};
</script>

<template>
  <div class="p-8 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">{{ isEditing ? 'Editar Ponto Turístico' : 'Registrar Novo Ponto Turístico' }}</h1>
    
    <form @submit.prevent="submitPlace" class="grid grid-cols-1 md:grid-cols-2 gap-8">
      
      <div class="space-y-4">
        <div>
          <label class="block font-semibold mb-1">Nome do Local</label>
          <input v-model="form.name" type="text" required class="w-full border p-2 rounded" placeholder="Ex: Forte dos Reis Magos" />
        </div>
        
        <div>
          <label class="block font-semibold mb-1">Descrição</label>
          <textarea v-model="form.description" required rows="3" class="w-full border p-2 rounded" placeholder="Descrição detalhada do local..."></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block font-semibold mb-1">Cidade</label>
            <input v-model="form.city" type="text" required class="w-full border p-2 rounded" placeholder="Ex: Natal" />
          </div>
          <div>
            <label class="block font-semibold mb-1">Categoria</label>
            <select v-model="form.category" required class="w-full border p-2 rounded bg-white">
              <option value="" disabled>Selecione...</option>
              <option value="Natureza">Natureza</option>
              <option value="Histórico">Histórico</option>
              <option value="Culinária">Culinária</option>
              <option value="Lazer">Lazer</option>
            </select>
          </div>
        </div>

        <!-- Upload de imagem do place -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Imagem do Local (Opcional)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            @change="handleFileChange"
            class="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          <p v-if="fileError" class="text-red-500 text-xs mt-1">{{ fileError }}</p>
          <!-- Pré-visualização -->
          <img
            v-if="previewUrl"
            :src="previewUrl"
            class="mt-3 max-w-xs h-auto rounded shadow border"
            alt="Pré-visualização da imagem"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block font-semibold mb-1 text-gray-500">Latitude</label>
            <input :value="form.latitude" type="text" readonly class="w-full border p-2 rounded bg-gray-100 cursor-not-allowed" placeholder="Clique no mapa" />
          </div>
          <div>
            <label class="block font-semibold mb-1 text-gray-500">Longitude</label>
            <input :value="form.longitude" type="text" readonly class="w-full border p-2 rounded bg-gray-100 cursor-not-allowed" placeholder="Clique no mapa" />
          </div>
        </div>

        <button type="submit" :disabled="isLoading" class="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded transition mt-4">
          {{ isLoading ? 'A Guardar...' : (isEditing ? 'Salvar Alterações' : 'Guardar Ponto Turístico') }}
        </button>

        <p v-if="message" class="mt-4 font-semibold" :class="message.includes('sucesso') ? 'text-green-600' : 'text-red-600'">
          {{ message }}
        </p>
      </div>

      <div class="flex flex-col">
        <label class="block font-semibold mb-2">Selecione a localização exata (RN)</label>
        <div ref="mapContainer" class="w-full h-96 rounded shadow-inner border z-0 bg-gray-50 min-h-[400px]"></div>
      </div>

    </form>
  </div>
</template>
