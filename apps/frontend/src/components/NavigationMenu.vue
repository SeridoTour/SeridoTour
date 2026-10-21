<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRoute, useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const menuOpen = ref(false);

const loginTarget = computed(() => {
  const canReturn = route.name && !['login', 'manutencao', 'not-found'].includes(String(route.name));
  return canReturn
    ? { name: 'login', query: { redirect: route.fullPath } }
    : { name: 'login' };
});

const handleLogout = () => {
  menuOpen.value = false;
  authStore.logout();
  router.push('/');
};
</script>

<template>
  <nav class="sticky top-0 z-50 border-b border-teal-800 bg-teal-950/95 text-white shadow-sm backdrop-blur">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
      <button class="flex items-center gap-2 text-xl font-bold tracking-tight" @click="router.push('/')">
        <span class="grid h-9 w-9 place-items-center rounded-xl bg-teal-500 text-lg">N</span>
        NortheasTour
      </button>

      <button class="rounded-lg p-2 hover:bg-teal-900 md:hidden" @click="menuOpen = !menuOpen" :aria-expanded="menuOpen" aria-label="Abrir menu">
        <span class="text-xl">☰</span>
      </button>

      <div :class="menuOpen ? 'flex' : 'hidden'" class="absolute left-0 right-0 top-full flex-col gap-1 border-b border-teal-800 bg-teal-950 p-4 md:static md:flex md:flex-row md:items-center md:gap-1 md:border-0 md:bg-transparent md:p-0">
        <router-link to="/" class="rounded-lg px-3 py-2 text-sm font-medium text-teal-100 hover:bg-teal-900 hover:text-white" @click="menuOpen = false">Explorar locais</router-link>
        <router-link to="/roteiros-publicos" class="rounded-lg px-3 py-2 text-sm font-medium text-teal-100 hover:bg-teal-900 hover:text-white" @click="menuOpen = false">Explorar roteiros</router-link>

        <template v-if="!authStore.isAuthenticated">
          <router-link v-if="route.name !== 'login'" :to="loginTarget" class="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-teal-900 hover:bg-teal-50" @click="menuOpen = false">Entrar</router-link>
        </template>

        <template v-else>
          <router-link to="/roteiros" class="rounded-lg px-3 py-2 text-sm font-medium text-teal-100 hover:bg-teal-900 hover:text-white" @click="menuOpen = false">
            {{ authStore.isGuia ? 'Roteiros em geral' : 'Meus roteiros' }}
          </router-link>
          <router-link to="/roteiros/new" class="rounded-lg px-3 py-2 text-sm font-medium text-teal-100 hover:bg-teal-900 hover:text-white" @click="menuOpen = false">Criar roteiro</router-link>

          <template v-if="authStore.isGuia">
            <router-link to="/places/new" class="rounded-lg px-3 py-2 text-sm font-medium text-teal-100 hover:bg-teal-900 hover:text-white" @click="menuOpen = false">Registrar local</router-link>
            <router-link to="/users" class="rounded-lg px-3 py-2 text-sm font-medium text-teal-100 hover:bg-teal-900 hover:text-white" @click="menuOpen = false">Usuários</router-link>
          </template>

          <button @click="handleLogout" class="rounded-lg px-3 py-2 text-left text-sm font-medium text-teal-100 hover:bg-red-950 hover:text-red-200">Sair</button>
          <div class="mx-2 border-t border-teal-800 pt-3 text-xs text-teal-200 md:ml-2 md:border-l md:border-t-0 md:pl-3 md:pt-0">
            Olá, <span class="font-semibold text-white">{{ authStore.user?.name }}</span> · {{ authStore.user?.role === 'GUIA' ? 'Guia' : 'Turista' }}
          </div>
        </template>
      </div>
    </div>
  </nav>
</template>
