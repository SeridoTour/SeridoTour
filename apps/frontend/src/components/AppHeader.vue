<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { initials } from '../utils/format'
import AppIcon from './AppIcon.vue'

defineEmits<{ toggleMenu: [] }>()
defineProps<{ menuOpen: boolean }>()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const search = ref('')
watch(
  () => route.query.q,
  (value) => {
    search.value = typeof value === 'string' ? value : ''
  },
  { immediate: true },
)
function submitSearch() {
  void router.push({ name: 'home', query: search.value.trim() ? { q: search.value.trim() } : {} })
}
</script>

<template>
  <header class="app-header">
    <button
      class="mobile-menu icon-button"
      :aria-expanded="menuOpen"
      aria-controls="main-sidebar"
      aria-label="Abrir menu"
      @click="$emit('toggleMenu')"
    >
      <AppIcon name="menu" />
    </button>
    <form class="global-search" role="search" @submit.prevent="submitSearch">
      <AppIcon name="search" /><input
        v-model="search"
        aria-label="Buscar destinos ou cidades"
        placeholder="Busque por destinos, experiências ou cidades..."
        type="search"
      />
    </form>
    <RouterLink v-if="auth.isAuthenticated" to="/perfil" class="header-profile">
      <span class="avatar">{{ initials(auth.user?.name || 'Viajante') }}</span>
      <span
        ><strong>{{ auth.user?.name }}</strong
        ><small>{{ auth.isGuia ? 'Guia / administrador' : 'Viajante' }}</small></span
      >
      <AppIcon name="chevron" :size="16" />
    </RouterLink>
    <RouterLink v-else to="/login" class="btn-primary header-login"
      ><AppIcon name="user" :size="17" />Entrar</RouterLink
    >
  </header>
</template>
