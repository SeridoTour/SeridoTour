<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../services/api';

const router = useRouter();
const availablePlaces = ref<any[]>([]);
const isLoading = ref(false);
const message = ref('');

const form = ref({
  title: '',
  description: '',
  duracaoDias: 1,
  placeIds: [] as string[]
});

// Dentro do onMounted em RoteiroFormView.vue
onMounted(async () => {
  try {
    const response = await api.get('/places', { params: { limit: 100 } });
    
    // Verifique se o back-end retorna { data: [...] }
    // Se retornar { data: { data: [...] } }, você precisa acessar duas vezes
    availablePlaces.value = response.data.data ? response.data.data : response.data;
    
    console.log('Locais carregados:', availablePlaces.value);
  } catch (error) {
    console.error('Erro ao carregar locais', error);
  }
});

const submitRoteiro = async () => {
  if (form.value.placeIds.length === 0) {
    message.value = 'Selecione pelo menos um ponto turístico para o seu roteiro.';
    return;
  }

  isLoading.value = true;
  message.value = '';

  try {
    await api.post('/itineraries', form.value);
    message.value = 'Roteiro criado como rascunho! Envie-o para análise na página Meus Roteiros.';
    setTimeout(() => {
      router.push('/roteiros');
    }, 1500);
  } catch (error) {
    message.value = 'Erro ao criar roteiro. Tente novamente.';
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="p-8 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6 text-teal-800">Criar Novo Roteiro</h1>
    
    <div class="bg-white shadow rounded p-6">
      <form @submit.prevent="submitRoteiro" class="space-y-6">
        
        <div>
          <label class="block font-semibold mb-1">Título do Roteiro</label>
          <input v-model="form.title" type="text" required class="w-full border p-2 rounded" placeholder="Ex: Fim de semana em Natal" />
        </div>
        
        <div>
          <label class="block font-semibold mb-1">Descrição</label>
          <textarea v-model="form.description" required rows="3" class="w-full border p-2 rounded" placeholder="Conte um pouco sobre este roteiro..."></textarea>
        </div>

        <div>
          <label class="block font-semibold mb-1">Duração (em dias)</label>
          <input v-model="form.duracaoDias" type="number" min="1" required class="w-32 border p-2 rounded" />
        </div>

        <hr class="my-4" />

        <div>
          <label class="block font-semibold mb-2">Selecione os Pontos Turísticos</label>
          <p class="text-sm text-gray-500 mb-4">Escolha os locais que farão parte desta viagem.</p>
          
          <div v-if="availablePlaces.length" class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-64 overflow-y-auto p-2 border rounded bg-gray-50">
            <label 
              v-for="place in availablePlaces" 
              :key="place.id" 
              class="flex items-start space-x-3 p-3 bg-white border rounded cursor-pointer hover:bg-teal-50 transition"
            >
              <input 
                type="checkbox" 
                :value="place.id" 
                v-model="form.placeIds" 
                class="mt-1 h-4 w-4 text-teal-600 rounded focus:ring-teal-500"
              />
              <span class="flex flex-col">
                <span class="font-bold text-gray-800">{{ place.name }}</span>
                <span class="text-xs text-gray-500">{{ place.category }}</span>
              </span>
            </label>
          </div>
          <p v-else class="text-red-500 text-sm">Nenhum ponto turístico disponível. O guia precisa cadastrar locais primeiro.</p>
        </div>

        <div class="pt-4 flex items-center justify-between">
          <p v-if="message" class="font-semibold" :class="message.includes('sucesso') ? 'text-green-600' : 'text-red-600'">
            {{ message }}
          </p>
          <button type="submit" :disabled="isLoading" class="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded transition ml-auto">
            {{ isLoading ? 'A Guardar...' : 'Salvar Roteiro' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
