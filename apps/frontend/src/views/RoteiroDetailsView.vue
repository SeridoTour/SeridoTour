<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth';
import {
  ITINERARY_STATUS_CLASSES,
  ITINERARY_STATUS_LABELS,
  type Itinerary,
} from '../constants/itineraryStatus';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const roteiro = ref<Itinerary | null>(null);
const loading = ref(true);
const errorMessage = ref('');

const isPublicView = computed(() => route.name === 'roteiro-publico-details');
const backTarget = computed(() =>
  isPublicView.value ? '/roteiros-publicos' : '/roteiros'
);

onMounted(async () => {
  try {
    const endpoint = isPublicView.value
      ? `/itineraries/public/${route.params.id}`
      : `/itineraries/${route.params.id}`;
    const { data } = await api.get(endpoint);
    roteiro.value = data;
  } catch (error: any) {
    console.error('Erro ao carregar roteiro', error);
    errorMessage.value =
      error.response?.status === 404
        ? 'Roteiro não encontrado ou ainda não publicado.'
        : 'Não foi possível carregar o roteiro.';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="page-shell max-w-4xl">
    <p v-if="loading" class="surface-card p-8 text-center text-slate-500">Carregando roteiro...</p>
    <p v-else-if="errorMessage" class="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{{ errorMessage }}</p>

    <div v-else-if="roteiro" class="space-y-6">
      <button class="btn-secondary" @click="router.push(backTarget)">← Voltar</button>

      <section class="surface-card p-6 sm:p-8">
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Roteiro de viagem</p>
            <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{{ roteiro.title }}</h1>
          </div>
          <span :class="['self-start rounded-full px-3 py-1.5 text-sm font-bold', ITINERARY_STATUS_CLASSES[roteiro.status]]">
            {{ ITINERARY_STATUS_LABELS[roteiro.status] }}
          </span>
        </div>

        <p class="mt-5 leading-7 text-slate-700">{{ roteiro.description || 'Sem descrição adicionada.' }}</p>

        <div class="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5 text-sm">
          <span class="rounded-full bg-teal-50 px-3 py-1.5 font-semibold text-teal-700">{{ roteiro.duracaoDias }} dias</span>
          <span class="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">{{ roteiro.places.length }} locais</span>
          <span class="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">Por <span class="font-semibold text-slate-700">{{ roteiro.user?.name ?? 'Usuário não identificado' }}</span></span>
        </div>

        <p v-if="roteiro.status === 'REJEITADO' && roteiro.rejectionReason" class="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          Motivo da rejeição: {{ roteiro.rejectionReason }}
        </p>

        <p v-if="!isPublicView && authStore.isAuthenticated && roteiro.status === 'RASCUNHO'" class="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          Este roteiro é um rascunho. Envie-o para análise na página Meus Roteiros.
        </p>
      </section>

      <section class="surface-card p-6 sm:p-8">
        <h2 class="text-2xl font-semibold text-slate-900">Locais deste roteiro</h2>
        <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            v-for="place in roteiro.places"
            :key="place.id"
            class="rounded-xl border border-slate-200 p-4 text-left transition hover:border-teal-300 hover:bg-teal-50"
            @click="router.push(`/places/${place.id}`)"
          >
            <h3 class="font-bold text-slate-900">{{ place.name }}</h3>
            <p class="mt-1 text-sm text-slate-500">{{ place.category }}</p>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
