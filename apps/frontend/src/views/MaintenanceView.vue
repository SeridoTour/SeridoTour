<template>
  <div class="min-h-[calc(100vh_-_61px)] bg-[#FDF8F2] flex flex-col justify-between items-center px-6 py-8 font-sans text-[#4A2E1B] relative overflow-hidden">
    
    <header class="w-full max-w-7xl flex justify-between items-center z-10">
      <div class="flex items-center gap-3">
        
        <div class="w-10 h-10 rounded-full bg-[#E87A38]/10 flex items-center justify-center border border-[#E87A38]/30">
          <svg class="w-6 h-6 text-[#A04018]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M18.364 18.364l-1.414-1.414M7.05 7.05L5.636 5.636M12 8a4 4 0 100 8 4 4 0 000-8z"></path>
          </svg>
        </div>
        <div>
          
          <h1 class="text-xl font-bold tracking-tight text-[#4A2E1B]">SeridóTour</h1>
          <p class="text-xs uppercase tracking-widest text-[#8C6D58] font-medium">Roteiros do Seridó</p>
        </div>
      </div>
      
      <span class="text-xs uppercase tracking-widest text-[#8C6D58] font-semibold border-b-2 border-[#E87A38] pb-1 hidden sm:inline-block">
        Descubra o Nordeste
      </span>
    </header>

    
    <main class="flex flex-col items-center text-center max-w-xl my-auto z-10 py-12">
      
      <div class="relative w-64 h-48 mb-6 flex items-center justify-center">
        
        <div class="absolute w-24 h-24 rounded-full bg-[#F3B068]/30 -top-2 right-12 blur-sm"></div>
        <div class="absolute w-12 h-12 rounded-full bg-[#E87A38]/40 top-4 right-16"></div>

        
        <div class="relative z-10 flex items-end gap-4">
          
          <svg class="w-16 h-24 text-[#7A6B43]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a2 2 0 00-2 2v10a2 2 0 004 0V4a2 2 0 00-2-2z"/>
            <path d="M7 8a1 1 0 00-1 1v3a3 3 0 003 3h1v-2H9a1 1 0 01-1-1V9a1 1 0 00-1-1z"/>
            <path d="M17 10a1 1 0 00-1 1v1a1 1 0 01-1 1h-1v2h1a3 3 0 003-3v-1a1 1 0 00-1-1z"/>
            <path d="M11 18h2v4h-2z"/>
          </svg>

          
          <div class="bg-white p-4 rounded-xl shadow-lg border border-[#E5D2C1] flex flex-col items-center">
            <div class="flex gap-1 self-start mb-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#E87A38]"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-[#F3B068]"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-[#A04018]"></span>
            </div>
            <div class="w-24 h-12 bg-[#FDF8F2] rounded border border-dashed border-[#8C6D58]/40 flex items-center justify-center text-[#A04018]">
              
              <svg class="w-8 h-8 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      
      <h2 class="text-4xl sm:text-5xl font-serif font-bold text-[#4A2E1B] mb-4">
        {{ feature ? `${feature} em breve!` : 'Em breve!' }}
      </h2>

      
      <p class="text-[#6B5240] text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
        <template v-if="feature">
          O acesso com {{ feature }} ainda está em desenvolvimento, mas já está nos nossos planos. Em breve você poderá utilizá-lo e aproveitar essa novidade!
        </template>
        <template v-else>
          Esta funcionalidade ainda está em desenvolvimento, mas já está nos nossos planos. Em breve você poderá acessá-la e aproveitar essa novidade!
        </template>
      </p>

      
      <div class="flex flex-col gap-3 w-full sm:w-auto">
        <router-link
          v-if="fromLogin"
          to="/login"
          class="inline-flex items-center justify-center gap-2 bg-[#A04018] hover:bg-[#853312] text-white font-medium px-8 py-3 rounded-full shadow-md transition-all duration-200"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Voltar para o login
        </router-link>

        <router-link
          to="/"
          class="inline-flex items-center justify-center gap-1.5 text-sm text-[#8C6D58] hover:text-[#4A2E1B] font-medium py-1 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
          Voltar para o início
        </router-link>
      </div>
    </main>

    
    <footer class="w-full max-w-7xl flex justify-between items-end z-10">
      <div class="relative">
        <span class="font-serif italic text-2xl text-[#A04018] opacity-80 block transform -rotate-3">
          O Seridó te espera.
        </span>
        <div class="w-20 h-0.5 bg-[#E87A38] mt-1 rounded-full opacity-60"></div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const feature = computed(() =>
  typeof route.query.feature === 'string' ? route.query.feature : ''
)
const fromLogin = computed(() => route.query.from === 'login')
</script>

<style scoped>
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.animate-spin-slow {
  animation: spin-slow 12s linear infinite;
}
</style>