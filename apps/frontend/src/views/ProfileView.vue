<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import DesertDecoration from '../components/DesertDecoration.vue'
import { useAuthStore } from '../stores/auth'
import { usePreferencesStore } from '../stores/preferences'
import { initials } from '../utils/format'

const auth = useAuthStore()
const preferences = usePreferencesStore()
const tab = ref('personal')
const tabs = [
  { id: 'personal', label: 'Informações pessoais', icon: 'user' as const },
  { id: 'security', label: 'Segurança', icon: 'lock' as const },
  { id: 'preferences', label: 'Preferências', icon: 'settings' as const },
]
const role = computed(() => (auth.isGuia ? 'Guia / administrador' : 'Viajante'))
</script>

<template>
  <div class="page-shell">
    <header class="page-heading">
      <div>
        <h1>Meu perfil</h1>
        <p>Seus dados, sua conta e o seu jeito de explorar o Seridó.</p>
      </div>
    </header>
    <div class="profile-layout">
      <div>
        <nav class="tabs" aria-label="Seções do perfil" style="margin-top: 0">
          <button
            v-for="item in tabs"
            :key="item.id"
            class="tab"
            :class="{ 'is-active': tab === item.id }"
            :aria-pressed="tab === item.id"
            @click="tab = item.id"
          >
            <AppIcon :name="item.icon" :size="17" />{{ item.label }}
          </button>
        </nav>
        <section v-if="tab === 'personal'" class="panel profile-content">
          <div class="profile-identity">
            <span class="avatar profile-avatar">{{ initials(auth.user?.name || 'Viajante') }}</span>
            <h2>{{ auth.user?.name }}</h2>
            <p>{{ role }}</p>
            <button class="btn-secondary full-width" disabled style="margin-top: 18px">
              <AppIcon name="image" :size="15" />Alterar foto</button
            ><small class="field-help">Foto de perfil em breve.</small
            ><DesertDecoration
              style="height: 120px; width: 100%; color: #b5784b; margin-top: 30px"
            />
          </div>
          <div class="form-stack">
            <h2>Informações básicas</h2>
            <div>
              <label for="profile-name" class="field-label">Nome completo</label
              ><input id="profile-name" :value="auth.user?.name" class="field-control" readonly />
            </div>
            <div>
              <label for="profile-email" class="field-label">E-mail</label
              ><input
                id="profile-email"
                :value="auth.user?.email"
                class="field-control"
                readonly
                placeholder="Não disponível nesta sessão"
              />
            </div>
            <p class="notice">
              <AppIcon name="info" :size="16" /> A edição dos dados pessoais e da foto estará
              disponível em breve.
            </p>
            <button class="btn-primary" disabled>
              <AppIcon name="save" :size="16" />Salvar alterações · em breve
            </button>
          </div>
        </section>
        <section v-if="tab === 'security'" class="panel form-stack">
          <h2>Alterar senha</h2>
          <p class="panel-description">A alteração de senha ainda não está disponível.</p>
          <fieldset disabled class="form-stack">
            <div>
              <label for="current-password" class="field-label">Senha atual</label
              ><input
                id="current-password"
                type="password"
                class="field-control"
                autocomplete="current-password"
                placeholder="Em breve"
              />
            </div>
            <div>
              <label for="new-password" class="field-label">Nova senha</label
              ><input
                id="new-password"
                type="password"
                class="field-control"
                autocomplete="new-password"
                placeholder="Em breve"
              />
            </div>
            <div>
              <label for="confirm-password" class="field-label">Confirmar nova senha</label
              ><input
                id="confirm-password"
                type="password"
                class="field-control"
                autocomplete="new-password"
                placeholder="Em breve"
              />
            </div>
            <button class="btn-primary" disabled>
              <AppIcon name="lock" :size="16" />Alterar senha · em breve
            </button>
          </fieldset>
        </section>
        <section v-if="tab === 'preferences'" class="panel">
          <h2>Seu jeito de explorar</h2>
          <label class="preference-row"
            ><span
              ><strong>Mostrar o mapa ao explorar destinos</strong
              ><small
                >Veja os destinos no mapa ao lado dos cartões, quando houver espaço.</small
              ></span
            ><input v-model="preferences.showMap" type="checkbox"
          /></label>
          <p class="field-help">Esta preferência é salva automaticamente neste navegador.</p>
          <div class="key-value" style="margin-top: 20px">
            <span>Idioma</span><strong>Português do Brasil</strong>
          </div>
        </section>
      </div>
      <aside class="profile-aside">
        <div class="profile-landscape">
          <img src="/serido-sunset.png" alt="Pôr do sol na paisagem do Seridó" />
          <div><strong>Seridó</strong><small>Rio Grande do Norte</small></div>
        </div>
        <section class="panel">
          <h2 class="heading-icon"><AppIcon name="users" :size="19" />Informações da conta</h2>
          <div class="key-value">
            <span>Tipo de conta</span><strong>{{ role }}</strong>
          </div>
          <div class="key-value">
            <span>Nome</span><strong>{{ auth.user?.name }}</strong>
          </div>
          <p class="notice">
            <AppIcon name="shield" :size="17" /> Mantenha sua senha em segurança e encerre sua
            sessão ao usar um computador compartilhado.
          </p>
        </section>
      </aside>
    </div>
  </div>
</template>
