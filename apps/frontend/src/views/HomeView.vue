<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
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

const places = ref<any[]>([]);
const totalPlaces = ref(0);
const router = useRouter();
const mapContainer = ref<HTMLElement | null>(null);

onMounted(async () => {
  try {
    const response = await api.get('/places', { params: { limit: 100 } });
    places.value = response.data.data || response.data;
    totalPlaces.value = response.data.meta?.total ?? places.value.length;
    initMap();
  } catch (error) {
    console.error('Erro ao buscar locais:', error);
  }
});

const initMap = () => {
  if (!mapContainer.value) return;
  const bounds = L.latLngBounds(L.latLng(-18.5, -48.5), L.latLng(-1.0, -34.5));
  const map = L.map(mapContainer.value, { maxBounds: bounds, maxBoundsViscosity: 1.0, minZoom: 5 }).setView([-5.7944, -36.5], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  places.value.forEach((place) => {
    if (place.latitude != null && place.longitude != null) {
      L.marker([place.latitude, place.longitude]).addTo(map)
        .bindPopup(`<b>${place.name}</b>`)
        .on('click', () => router.push(`/places/${place.id}`));
    }
  });
};
</script>

<template>
  <div class="page-shell space-y-6">
    <section class="overflow-hidden rounded-3xl bg-gradient-to-br from-teal-950 via-teal-800 to-cyan-700 px-6 py-8 text-white shadow-lg sm:px-10 sm:py-10">
      <p class="text-sm font-semibold uppercase tracking-[0.18em] text-teal-200">Explore o Nordeste</p>
      <div class="mt-3 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Encontre seu próximo destino</h1>
          <p class="mt-2 max-w-xl text-teal-100">Descubra pontos turísticos, monte roteiros e viva experiências memoráveis.</p>
        </div>
        <span class="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">{{ totalPlaces }} locais disponíveis</span>
      </div>
    </section>

    <div ref="mapContainer" class="h-[46vh] min-h-[340px] overflow-hidden rounded-2xl border border-slate-200 shadow-sm"></div>

    <section class="surface-card p-5 sm:p-7">
      <div class="mb-5">
        <h2 class="section-title">Locais para conhecer</h2>
        <p class="section-subtitle">Selecione um cartão para ver detalhes, avaliações e localização.</p>
      </div>
      <div v-if="places.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button v-for="place in places" :key="place.id" @click="router.push(`/places/${place.id}`)" class="group rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-md">
          <span class="inline-flex rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">{{ place.category }}</span>
          <h3 class="mt-3 font-bold text-slate-900 group-hover:text-teal-700">{{ place.name }}</h3>
          <p class="mt-1 text-sm text-slate-500">{{ place.city }}</p>
        </button>
      </div>
      <p v-else class="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">Nenhum local disponível no momento.</p>
    </section>
  </div>
</template>
