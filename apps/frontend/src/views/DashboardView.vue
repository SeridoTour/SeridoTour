<template>
  <div class="max-w-7xl mx-auto p-4 space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div>
        <h1 class="text-3xl font-bold text-gray-800">
          {{ authStore.isGuia ? 'Gestão de Todos os Roteiros' : 'Os Meus Roteiros' }}
        </h1>
        <p class="text-gray-500 mt-1">
          {{ authStore.isGuia ? 'Como Guia, tem acesso a todos os itinerários da plataforma.' : 'Aqui estão os roteiros de viagem que planeou.' }}
        </p>
      </div>
      <router-link to="/roteiros/new" class="mt-4 md:mt-0 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-md hover:bg-blue-700 transition shadow-sm">
        + Criar Novo Roteiro
      </router-link>
    </div>

    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="text-gray-500 font-medium">A carregar roteiros...</div>
    </div>
    
    <div v-else-if="filteredItineraries.length === 0" class="text-center py-20 bg-white border border-dashed border-gray-300 rounded-lg">
      <p class="text-gray-500 mb-4">Ainda não tem roteiros para exibir.</p>
      <router-link to="/roteiros/new" class="text-blue-600 font-bold hover:underline">
        Clique aqui para começar a planear a sua primeira viagem!
      </router-link>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="itinerary in filteredItineraries" :key="itinerary.id" 
        class="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col h-full overflow-hidden">
        
        <div class="p-6 flex-grow">
          <div class="flex justify-between items-start mb-3">
            <h2 class="text-xl font-bold text-gray-800 line-clamp-1" :title="itinerary.title">{{ itinerary.title }}</h2>
            
            <span v-if="authStore.isGuia && itinerary.userId !== authStore.user?.id" 
              class="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide whitespace-nowrap ml-2">
              De Terceiros
            </span>
          </div>
          
          <p class="text-gray-600 text-sm mb-4 line-clamp-3 min-h-[4rem]">
            {{ itinerary.description || 'Sem descrição fornecida.' }}
          </p>
          
          <div class="flex items-center text-sm text-gray-500 bg-gray-50 p-2 rounded">
            <svg class="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span class="font-medium">Duração:</span> <span class="ml-1">{{ itinerary.duracaoDias }} dias</span>
          </div>
        </div>

        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <router-link :to="`/roteiros/${itinerary.id}`" class="text-blue-600 font-semibold text-sm hover:text-blue-800 transition flex items-center justify-center w-full">
            Ver detalhes do roteiro
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../services/api'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const itineraries = ref<any[]>([])
const loading = ref(true)

const fetchItineraries = async () => {
  loading.value = true
  try {
    // Busca os roteiros na API (todos para GUIA, próprios para USER)
    const endpoint = authStore.isGuia ? '/itineraries' : '/itineraries/meus'
    const response = await api.get(endpoint)
    itineraries.value = response.data
  } catch (error) {
    console.error("Erro ao buscar itinerários:", error)
  } finally {
    loading.value = false
  }
}

// Computada crucial para a Regra de Negócio pedida
const filteredItineraries = computed(() => {
  // Se for Guia (ou Admin), não filtra nada: retorna o array completo.
  if (authStore.isGuia) {
    return itineraries.value 
  }
  
  // Se for um Turista Normal ('USER'), filtra a lista para mostrar apenas os roteiros em que o userId bate com o ID do logado.
  return itineraries.value.filter((iti: any) => iti.userId === authStore.user?.id)
})

onMounted(() => {
  // Apenas busca se existir um token/utilizador válido
  if (authStore.isAuthenticated) {
    fetchItineraries()
  }
})
</script>
