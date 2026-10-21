<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <NavigationMenu />
    <router-view />
  </div>
</template>

<script setup lang="ts">
// É obrigatório importar o componente aqui no script setup
import NavigationMenu from './components/NavigationMenu.vue'
</script>
