<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './components/AppSidebar.vue'
import AppHeader from './components/AppHeader.vue'
import DesertDecoration from './components/DesertDecoration.vue'

const route = useRoute()
const menuOpen = ref(false)
const standalone = computed(() => route.meta.standalone === true)
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)
</script>

<template>
  <template v-if="standalone">
    <header class="public-header">
      <RouterLink to="/" class="public-brand">Seridó<span>Tour</span></RouterLink
      ><RouterLink to="/">Explorar destinos <span aria-hidden="true">→</span></RouterLink>
    </header>
    <RouterView />
  </template>
  <div v-else class="app-layout" @keydown.esc="menuOpen = false">
    <a class="skip-link" href="#main-content">Ir para o conteúdo</a>
    <AppSidebar :open="menuOpen" @close="menuOpen = false" />
    <div class="app-workspace">
      <AppHeader :menu-open="menuOpen" @toggle-menu="menuOpen = !menuOpen" />
      <main id="main-content" tabindex="-1"><RouterView :key="route.path" /></main>
      <footer class="app-footer">
        <span
          ><strong>Seridó<span>Tour</span></strong> Feito para descobrir o que é nosso.</span
        ><span class="footer-caption">Seridó · Natureza · Cultura · Aventura</span
        ><DesertDecoration />
      </footer>
    </div>
  </div>
</template>
