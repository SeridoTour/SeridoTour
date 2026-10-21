<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import {
  ITINERARY_STATUS_CLASSES,
  ITINERARY_STATUS_LABELS,
  type Itinerary,
} from '../constants/itineraryStatus';

const itineraries = ref<Itinerary[]>([]);
const loading = ref(true);
const errorMessage = ref('');
const actionLoading = ref<string | null>(null);
const authStore = useAuthStore();
const router = useRouter();

const loadItineraries = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const endpoint = authStore.isGuia ? '/itineraries' : '/itineraries/meus';
    const { data } = await api.get(endpoint);
    itineraries.value = data;
  } catch (error) {
    console.error('Falha ao buscar roteiros', error);
    errorMessage.value =
      'Não foi possível carregar os roteiros. Atualize a página ou entre novamente.';
  } finally {
    loading.value = false;
  }
};

const getErrorMessage = (error: any) => {
  const message = error.response?.data?.message || error.message;
  return Array.isArray(message) ? message.join(', ') : message;
};

const submitForReview = async (roteiro: Itinerary) => {
  actionLoading.value = roteiro.id;
  errorMessage.value = '';

  try {
    await api.patch(`/itineraries/${roteiro.id}/submit`);
    await loadItineraries();
  } catch (error: any) {
    errorMessage.value =
      getErrorMessage(error) || 'Não foi possível enviar o roteiro para análise.';
  } finally {
    actionLoading.value = null;
  }
};

const publish = async (roteiro: Itinerary) => {
  actionLoading.value = roteiro.id;
  errorMessage.value = '';

  try {
    await api.patch(`/itineraries/${roteiro.id}/publish`);
    await loadItineraries();
  } catch (error: any) {
    errorMessage.value =
      getErrorMessage(error) || 'Não foi possível publicar o roteiro.';
  } finally {
    actionLoading.value = null;
  }
};

const reject = async (roteiro: Itinerary) => {
  const reason = window.prompt('Motivo da rejeição (opcional):');
  if (reason === null) return;

  actionLoading.value = roteiro.id;
  errorMessage.value = '';

  try {
    await api.patch(`/itineraries/${roteiro.id}/reject`, { reason });
    await loadItineraries();
  } catch (error: any) {
    errorMessage.value =
      getErrorMessage(error) || 'Não foi possível rejeitar o roteiro.';
  } finally {
    actionLoading.value = null;
  }
};

const unpublish = async (roteiro: Itinerary) => {
  if (!window.confirm('Despublicar este roteiro? Ele voltará para o status Rascunho.')) return;

  actionLoading.value = roteiro.id;
  errorMessage.value = '';

  try {
    await api.patch(`/itineraries/${roteiro.id}/unpublish`);
    await loadItineraries();
  } catch (error: any) {
    errorMessage.value =
      getErrorMessage(error) || 'Não foi possível despublicar o roteiro.';
  } finally {
    actionLoading.value = null;
  }
};

const hasActions = (roteiro: Itinerary) =>
  authStore.isGuia
    ? ['EM_ANALISE', 'PUBLICADO'].includes(roteiro.status)
    : ['RASCUNHO', 'REJEITADO'].includes(roteiro.status);

onMounted(loadItineraries);
</script>

<template>
  <div class="page-shell">
    <div class="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Planejamento de viagem</p>
        <h1 class="section-title mt-2">{{ authStore.isGuia ? 'Roteiros em Geral' : 'Meus Roteiros' }}</h1>
        <p class="section-subtitle">{{ authStore.isGuia ? 'Acompanhe, revise e publique os roteiros criados na plataforma.' : 'Acompanhe o status dos seus roteiros e envie os rascunhos para análise.' }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <router-link to="/roteiros-publicos" class="btn-secondary">Ver publicados</router-link>
        <button @click="router.push('/roteiros/new')" class="btn-primary">+ Criar roteiro</button>
      </div>
    </div>

    <p v-if="loading" class="surface-card p-8 text-center text-slate-500">Carregando roteiros...</p>
    <p v-else-if="errorMessage" class="mb-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{{ errorMessage }}</p>

    <template v-if="!loading">
      <div v-if="itineraries.length === 0 && !errorMessage" class="surface-card p-10 text-center">
        <p class="text-lg font-semibold text-slate-800">Nenhum roteiro encontrado</p>
        <p class="mt-2 text-sm text-slate-500">Comece criando um roteiro com os lugares que quer visitar.</p>
      </div>

      <div v-else-if="itineraries.length" class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="roteiro in itineraries" :key="roteiro.id" class="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-teal-300 hover:shadow-lg">
          <button class="flex-1 p-6 text-left" @click="router.push(`/roteiros/${roteiro.id}`)">
            <div class="flex items-start justify-between gap-3">
              <h2 class="text-xl font-bold text-slate-900">{{ roteiro.title }}</h2>
              <span :class="['shrink-0 rounded-full px-2.5 py-1 text-xs font-bold', ITINERARY_STATUS_CLASSES[roteiro.status]]">
                {{ ITINERARY_STATUS_LABELS[roteiro.status] }}
              </span>
            </div>
            <p class="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{{ roteiro.description || 'Sem descrição adicionada.' }}</p>
            <p class="mt-4 text-sm font-semibold text-teal-700">{{ roteiro.duracaoDias }} dias · {{ roteiro.places.length }} locais</p>
            <p v-if="authStore.isGuia" class="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">Criado por: <span class="font-medium text-slate-700">{{ roteiro.user?.name ?? 'Usuário não identificado' }}</span></p>
            <p v-if="roteiro.status === 'REJEITADO' && roteiro.rejectionReason" class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              Motivo da rejeição: {{ roteiro.rejectionReason }}
            </p>
          </button>

          <div v-if="hasActions(roteiro)" class="flex flex-wrap gap-2 border-t border-slate-100 px-6 py-4">
            <template v-if="authStore.isGuia">
              <button v-if="roteiro.status === 'EM_ANALISE'" class="btn-primary" :disabled="actionLoading === roteiro.id" @click="publish(roteiro)">
                Publicar
              </button>
              <button v-if="roteiro.status === 'EM_ANALISE'" class="btn-danger" :disabled="actionLoading === roteiro.id" @click="reject(roteiro)">
                Rejeitar
              </button>
              <button v-if="roteiro.status === 'PUBLICADO'" class="btn-secondary" :disabled="actionLoading === roteiro.id" @click="unpublish(roteiro)">
                Despublicar
              </button>
            </template>

            <template v-else>
              <button v-if="roteiro.status === 'RASCUNHO' || roteiro.status === 'REJEITADO'" class="btn-primary" :disabled="actionLoading === roteiro.id" @click="submitForReview(roteiro)">
                {{ actionLoading === roteiro.id ? 'Enviando...' : roteiro.status === 'REJEITADO' ? 'Reenviar para análise' : 'Enviar para análise' }}
              </button>
            </template>
          </div>
        </article>
      </div>
    </template>
  </div>
</template>
