<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppIcon, { type IconName } from './AppIcon.vue'
import BrandLogo from './BrandLogo.vue'
import DesertDecoration from './DesertDecoration.vue'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const links = computed(() => {
  const items: Array<{ to: string; label: string; icon: IconName; section: string }> = [
    {
      to: '/',
      label: auth.isGuia ? 'Locais turísticos' : 'Explorar destinos',
      icon: 'compass',
      section: 'places',
    },
    {
      to: '/roteiros-publicos',
      label: 'Roteiros publicados',
      icon: 'map',
      section: 'public-itineraries',
    },
  ]
  if (auth.isAuthenticated)
    items.push({ to: '/roteiros', label: 'Meus roteiros', icon: 'home', section: 'itineraries' })
  items.push(
    { to: '/mapa', label: 'Mapa do Seridó', icon: 'pin', section: 'map' },
    { to: '/favoritos', label: 'Favoritos', icon: 'heart', section: 'favorites' },
  )
  if (auth.isGuia)
    items.push(
      { to: '/moderacao', label: 'Moderação', icon: 'shield', section: 'moderation' },
      { to: '/users', label: 'Usuários', icon: 'users', section: 'users' },
    )
  if (auth.isAuthenticated)
    items.push({ to: '/perfil', label: 'Meu perfil', icon: 'user', section: 'profile' })
  return items
})

function logout() {
  auth.logout()
  emit('close')
  void router.push('/')
}
</script>

<template>
  <button v-if="open" class="sidebar-backdrop" aria-label="Fechar menu" @click="emit('close')" />
  <aside id="main-sidebar" class="app-sidebar" :class="{ 'is-open': open }">
    <RouterLink to="/" class="sidebar-brand" aria-label="SeridóTour, início" @click="emit('close')"
      ><BrandLogo
    /></RouterLink>
    <button class="sidebar-close icon-button" aria-label="Fechar menu" @click="emit('close')">
      <AppIcon name="close" />
    </button>
    <nav class="sidebar-nav" aria-label="Navegação principal">
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="nav-item"
        :class="{ 'is-active': route.meta.section === link.section }"
        @click="emit('close')"
      >
        <AppIcon :name="link.icon" /><span>{{ link.label }}</span>
      </RouterLink>
    </nav>
    <div class="sidebar-story">
      <DesertDecoration />
      <p>O Seridó não é apenas<br />um destino, é uma<br />experiência.</p>
    </div>
    <button v-if="auth.isAuthenticated" class="nav-item sidebar-exit" @click="logout">
      <AppIcon name="logout" />Sair da conta
    </button>
    <RouterLink v-else to="/login" class="nav-item sidebar-exit" @click="emit('close')"
      ><AppIcon name="user" />Entrar na minha conta</RouterLink
    >
  </aside>
</template>
