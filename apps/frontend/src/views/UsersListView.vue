<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { api } from '../services/api'
import type { UserSummary } from '../types/tourism'
import { formatDate, getErrorMessage, initials, normalizeText } from '../utils/format'

const users = ref<UserSummary[]>([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const role = ref('')
const filtered = computed(() =>
  users.value.filter(
    (user) =>
      (!role.value || user.role === role.value) &&
      normalizeText(`${user.name} ${user.email}`).includes(normalizeText(search.value)),
  ),
)
async function loadUsers() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get<UserSummary[]>('/users')
    users.value = data.map(({ id, name, email, role, createdAt }) => ({
      id,
      name,
      email,
      role,
      createdAt,
    }))
  } catch (cause) {
    error.value = getErrorMessage(cause, 'Não foi possível carregar os usuários. Tente novamente.')
  } finally {
    loading.value = false
  }
}
onMounted(loadUsers)
</script>

<template>
  <div class="page-shell">
    <header class="page-heading">
      <div>
        <h1 class="heading-icon"><AppIcon name="users" :size="29" />Usuários cadastrados</h1>
        <p>Conheça as pessoas que fazem parte da comunidade SeridóTour.</p>
      </div>
      <span class="status-badge status-draft">{{ users.length }} contas</span>
    </header>
    <div class="filter-row">
      <label class="global-search" style="width: 380px; max-width: 100%"
        ><AppIcon name="search" :size="17" /><input
          v-model="search"
          type="search"
          aria-label="Buscar usuário por nome ou e-mail"
          placeholder="Buscar por nome ou e-mail..." /></label
      ><button
        v-for="item in [
          { value: '', label: 'Todos' },
          { value: 'USER', label: 'Viajantes' },
          { value: 'GUIA', label: 'Guias' },
        ]"
        :key="item.value"
        class="filter-chip"
        :class="{ 'is-active': role === item.value }"
        :aria-pressed="role === item.value"
        @click="role = item.value"
      >
        {{ item.label }}
      </button>
    </div>
    <p v-if="loading" class="loading-state" role="status">Carregando usuários...</p>
    <div v-else-if="error" class="notice notice-error" role="alert">
      {{ error }}
      <button class="btn-secondary btn-small" @click="loadUsers">Tentar novamente</button>
    </div>
    <div v-else-if="!filtered.length" class="empty-state">
      <AppIcon name="users" :size="36" />
      <h2>Nenhum usuário encontrado</h2>
      <p>Tente outro nome, e-mail ou perfil.</p>
    </div>
    <div v-else class="table-container">
      <table class="data-table">
        <caption class="sr-only">
          Contas cadastradas no SeridóTour
        </caption>
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">E-mail</th>
            <th scope="col">Perfil</th>
            <th scope="col">Cadastro</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filtered" :key="user.id">
            <td>
              <div class="table-user">
                <span class="avatar">{{ initials(user.name) }}</span
                ><strong>{{ user.name }}</strong>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td>
              <span
                class="status-badge"
                :class="user.role === 'GUIA' ? 'status-published' : 'status-draft'"
                >{{ user.role === 'GUIA' ? 'Guia / administrador' : 'Viajante' }}</span
              >
            </td>
            <td>{{ formatDate(user.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="field-help" style="margin-top: 18px">
      Esta área permite consultar as contas cadastradas. Edição, bloqueio e exclusão de usuários
      ainda não estão disponíveis.
    </p>
  </div>
</template>
