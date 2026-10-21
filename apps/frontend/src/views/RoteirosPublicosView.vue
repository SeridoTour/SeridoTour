<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../services/api';
import type { Itinerary } from '../constants/itineraryStatus';

const itineraries = ref<Itinerary[]>([]);
const loading = ref(true);
const errorMessage = ref('');
const router = useRouter();

onMounted(async () => {
  try {
    const { data } = await api.get('/itineraries/public');
    itineraries.value = data;
  } catch (error) {
    console.error('Falha ao buscar roteiros publicados', error);
    errorMessage.value = 'Não foi possível carregar os roteiros publicados.';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="page-shell space-y-6">
    <section class="overflow-hidden rounded-3xl bg-gradient-to-br from-teal-950 via-teal-800 to-cyan-700 px-6 py-8 text-white shadow-lg sm:px-10 sm:py-10">
      <p class="text-sm font-semibold uppercase tracking-[0.18em] text-teal-200">Inspire-se para viajar</p>
      <h1 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Roteiros publicados</h1>
      <p class="mt-2 max-w-xl text-teal-100">Roteiros aprovados pelos guias e prontos para você conhecer o Nordeste.</p>
    </section>

    <p v-if="loading" class="surface-card p-8 text-center text-slate-500">Carregando roteiros...</p>
    <p v-else-if="errorMessage" class="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{{ errorMessage }}</p>

    <div v-else-if="itineraries.length === 0" class="surface-card p-10 text-center">
      <p class="text-lg font-semibold text-slate-800">Nenhum roteiro publicado ainda</p>
      <p class="mt-2 text-sm text-slate-500">Volte em breve para descobrir novas experiências.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      <button
        v-for="roteiro in itineraries"
        :key="roteiro.id"
        class="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg"
        @click="router.push(`/roteiros-publicos/${roteiro.id}`)"
      >
        <div class="flex items-start justify-between gap-3">
          <h2 class="text-xl font-bold text-slate-900 group-hover:text-teal-700">{{ roteiro.title }}</h2>
          <span class="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">Publicado</span>
        </div>
        <p class="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{{ roteiro.description || 'Sem descrição adicionada.' }}</p>
        <div class="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
          <span class="font-semibold text-teal-700">{{ roteiro.duracaoDias }} dias</span>
          <span>{{ roteiro.places.length }} locais</span>
        </div>
        <p class="mt-2 text-sm text-slate-500">Por <span class="font-medium text-slate-700">{{ roteiro.user?.name ?? 'Guia' }}</span></p>
      </button>
    </div>
  </div>
</template>
