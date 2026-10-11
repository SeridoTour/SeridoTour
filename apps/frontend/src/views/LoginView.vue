```vue
<template>
  <main class="login-page">
    <!-- Painel esquerdo -->
    <section class="login-panel">
      <div class="brand">
        <svg class="brand-icon" viewBox="0 0 90 75" fill="none"
          xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M8 44 Q23 20 40 39 T70 35"
            stroke="#b96a3d" stroke-width="2.5" />
          <path d="M5 51 Q25 37 42 49 T75 47"
            stroke="#b96a3d" stroke-width="2.5" />
          <path d="M8 59 Q26 50 44 60 T70 59"
            stroke="#b96a3d" stroke-width="2.5" />
          <path d="M58 51 V20 Q58 14 62 14 V51
            M58 33 Q48 33 48 24 V20
            M62 39 Q73 39 73 29 V25"
            stroke="#9f572f" stroke-width="3"
            stroke-linecap="round" />
          <circle cx="62" cy="8" r="6"
            stroke="#9f572f" stroke-width="2" />
        </svg>

        <div class="brand-text">
          <h1>Seridó<span>Tour</span></h1>
          <p>ROTEIROS DO SERIDÓ</p>
        </div>
      </div>

      <div class="login-content">
        <header class="intro">
          <h2>
            Explore o melhor do
            <span>Seridó potiguar.</span>
          </h2>
          <p>
            Descubra roteiros incríveis, viva experiências únicas
            e conecte-se com a cultura, a natureza e o povo
            dessa terra especial.
          </p>
        </header>

        <form @submit.prevent="handleSubmit" class="login-form">
          <label class="input-box">
            <span class="input-icon">✉</span>
            <input
              v-model.trim="form.email"
              type="email"
              placeholder="E-mail"
              autocomplete="email"
              required
            />
          </label>

          <label class="input-box">
            <span class="input-icon">♙</span>
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Senha"
              :autocomplete="isLogin ? 'current-password' : 'new-password'"
              required
            />
            <button
              class="eye-button"
              type="button"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
            >
              {{ showPassword ? '◉' : '◎' }}
            </button>
          </label>

          <div class="form-options">
            <label class="remember">
              <input v-model="rememberMe" type="checkbox" />
              <span>Lembrar de mim</span>
            </label>

            <button
              class="text-button"
              type="button"
              @click="showRecoveryMessage"
            >
              Esqueceu sua senha?
            </button>
          </div>

          <p v-if="!isLogin" class="register-label">
            Nome completo
          </p>
          <input
            v-if="!isLogin"
            v-model.trim="form.name"
            class="extra-input"
            type="text"
            placeholder="Seu nome completo"
            autocomplete="name"
            required
          />

          <template v-if="!isLogin">
            <p class="register-label">Código de Guia (opcional)</p>
            <input
              v-model.trim="form.codigoguia"
              class="extra-input"
              type="text"
              placeholder="Código de guia"
            />
          </template>

          <p v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </p>

          <button class="primary-button" type="submit" :disabled="isLoading">
            {{ isLoading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Criar conta') }}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <div class="separator">
          <span></span>
          <p>ou continue com</p>
          <span></span>
        </div>

        <div class="social-buttons">
          <button type="button" @click="socialNotice('Google')">
            <strong class="google-letter">G</strong>
            Google
          </button>
          <button type="button" @click="socialNotice('Apple')">
            <strong class="apple-letter">●</strong>
            Apple
          </button>
        </div>

        <p class="account-prompt">
          {{ isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?' }}
          <button class="text-button" type="button" @click="toggleMode">
            {{ isLogin ? 'Cadastre-se' : 'Entrar' }}
          </button>
        </p>
      </div>

      <div class="bottom-decoration" aria-hidden="true">
        <span class="decor-cactus">♣</span>
        <span class="decor-hill"></span>
      </div>
    </section>

    <!-- Painel direito com fotografia -->
    <section class="landscape-panel">
      <nav class="landscape-nav">
        <span></span>
        <a href="#natureza">NATUREZA</a>
        <i>•</i>
        <a href="#cultura">CULTURA</a>
        <i>•</i>
        <a href="#aventura">AVENTURA</a>
      </nav>

      <div class="landscape-caption">
        <p class="location-name">⌖ <span>Seridó</span></p>
        <p class="location-state">RIO GRANDE DO NORTE</p>
      </div>

      <svg class="landscape-decoration" viewBox="0 0 300 100"
        preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 100 Q90 20 170 70 T300 20"
          fill="none" stroke="#f2d5b9" stroke-width="2" />
        <path d="M70 100 Q150 40 220 80 T300 45"
          fill="none" stroke="#f2d5b9" stroke-width="1.5" />
      </svg>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const isLogin = ref(true)
const isLoading = ref(false)
const showPassword = ref(false)
const rememberMe = ref(false)
const errorMessage = ref('')

const form = ref({
  name: '',
  email: '',
  password: '',
  codigoguia: ''
})

function toggleMode() {
  isLogin.value = !isLogin.value
  errorMessage.value = ''
  form.value.password = ''

  if (isLogin.value) {
    form.value.name = ''
    form.value.codigoguia = ''
  }
}

function showRecoveryMessage() {
  errorMessage.value =
    'A recuperação de senha precisa ser conectada ao serviço do projeto.'
}

function socialNotice(provider: string) {
  errorMessage.value =
    `O acesso com ${provider} ainda precisa ser configurado.`
}

async function handleSubmit() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    if (isLogin.value) {
      await authStore.login({
        email: form.value.email,
        password: form.value.password
      })
    } else {
      const payload: Record<string, string> = {
        name: form.value.name,
        email: form.value.email,
        password: form.value.password
      }

      if (form.value.codigoguia) {
        payload.codigoguia = form.value.codigoguia
      }

      await authStore.register(payload)
    }
  } catch (error: any) {
    console.error(error)
    const message = error.response?.data?.message || error.message

    errorMessage.value = Array.isArray(message)
      ? message.join(', ')
      : message || 'Não foi possível entrar. Confira seus dados.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style>
:root {
  --sand: #f5e9dc;
  --sand-light: #fbf3e9;
  --brown: #4a3021;
  --muted: #a39484;
  --terracotta: #b96035;
  --terracotta-dark: #a94f2a;
}

* {
  box-sizing: border-box;
}

html,
body,
#app {
  margin: 0;
  min-height: 100%;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  color: var(--brown);
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.login-page {
  display: grid;
  grid-template-columns: 48% 52%;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  background: var(--sand);
}

.login-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 35px 9% 30px;
  background:
    radial-gradient(ellipse at 20% 15%, #fff8ee 0%, transparent 65%),
    var(--sand);
  overflow: hidden;
  z-index: 1;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 440px;
  margin-bottom: 22px;
}

.brand-icon {
  width: 85px;
  flex-shrink: 0;
}

.brand-text h1 {
  margin: 0;
  font-size: clamp(22px, 2.3vw, 34px);
  font-weight: 500;
  letter-spacing: -1.2px;
  white-space: nowrap;
}

.brand-text h1 span {
  color: var(--terracotta);
  font-weight: 700;
}

.brand-text p {
  margin: 5px 0 0;
  color: var(--terracotta);
  font-size: 8px;
  letter-spacing: 3px;
}

.login-content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 440px;
}

.intro h2 {
  margin: 0 0 10px;
  font-size: clamp(23px, 2vw, 31px);
  line-height: 1.15;
  font-weight: 400;
  letter-spacing: -0.6px;
}

.intro h2 span {
  display: block;
  color: var(--terracotta);
  font-weight: 600;
}

.intro > p {
  max-width: 360px;
  margin: 0 0 20px;
  color: #978778;
  font-size: 12px;
  line-height: 1.55;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-box,
.extra-input {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 44px;
  padding: 0 13px;
  border: 1px solid #dfcdbc;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-box:focus-within,
.extra-input:focus {
  border-color: var(--terracotta);
  box-shadow: 0 0 0 3px rgba(185, 96, 53, 0.1);
  outline: none;
}

.input-icon {
  width: 20px;
  font-size: 16px;
  color: var(--brown);
}

.input-box input,
.extra-input {
  min-width: 0;
  color: var(--brown);
  font-size: 12px;
}

.input-box input {
  flex: 1;
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
}

.input-box input::placeholder,
.extra-input::placeholder {
  color: #a99a8a;
}

.eye-button {
  border: 0;
  background: transparent;
  color: var(--brown);
  padding: 5px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 10px;
}

.remember {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8d7d6d;
}

.remember input {
  accent-color: var(--terracotta);
}

.text-button {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--terracotta);
  font-size: inherit;
}

.text-button:hover {
  text-decoration: underline;
}

.register-label {
  margin: 2px 0 -7px;
  color: #806c5a;
  font-size: 12px;
}

.extra-input {
  outline: none;
}

.primary-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-height: 44px;
  margin-top: 2px;
  border: 0;
  border-radius: 30px;
  color: white;
  background: var(--terracotta);
  font-size: 12px;
  font-weight: 600;
  transition: background 0.2s, transform 0.2s;
}

.primary-button span {
  font-size: 19px;
  font-weight: 400;
}

.primary-button:hover {
  background: var(--terracotta-dark);
  transform: translateY(-1px);
}

.primary-button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.error-message {
  margin: 0;
  color: #a63327;
  font-size: 12px;
  line-height: 1.5;
}

.separator {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 17px 0 12px;
}

.separator span {
  flex: 1;
  height: 1px;
  background: #dfcdbc;
}

.separator p {
  margin: 0;
  color: #9c8b7a;
  font-size: 11px;
}

.social-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.social-buttons button {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  border: 1px solid #d8c4b1;
  border-radius: 12px;
  color: #4c392c;
  background: transparent;
  font-size: 12px;
}

.social-buttons button:hover {
  background: rgba(255, 255, 255, 0.5);
}

.google-letter {
  font-size: 17px;
}

.apple-letter {
  font-size: 14px;
}

.account-prompt {
  margin: 26px 0 0;
  color: #9a8877;
  font-size: 11px;
}

.account-prompt .text-button {
  margin-left: 6px;
}

.bottom-decoration {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 115px;
  overflow: hidden;
  pointer-events: none;
}

.decor-hill {
  position: absolute;
  left: -10%;
  bottom: -66px;
  width: 125%;
  height: 115px;
  border-radius: 50% 50% 0 0;
  background: #d58c67;
  transform: rotate(5deg);
}

.decor-hill::after {
  content: "";
  position: absolute;
  left: 42%;
  top: -17px;
  width: 70%;
  height: 100px;
  border-radius: 50% 50% 0 0;
  background: #f5e9dc;
  transform: rotate(-10deg);
}

.decor-cactus {
  position: absolute;
  z-index: 1;
  bottom: 28px;
  left: 8px;
  color: #bd714a;
  font-size: 65px;
  transform: rotate(-15deg);
}

.landscape-panel {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  border-radius: 0 0 0 0;
  background-image:
    linear-gradient(180deg, rgba(50, 28, 14, 0.15), transparent 28%),
    url('/serido-sunset.png');
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}

/* Curva que aproxima a divisão da referência */
.landscape-panel::before {
  content: "";
  position: absolute;
  z-index: 1;
  left: -100px;
  top: -8%;
  width: 145px;
  height: 116%;
  border-radius: 50%;
  background: var(--sand);
}

.landscape-nav {
  position: absolute;
  z-index: 2;
  top: 7%;
  right: 8%;
  display: flex;
  align-items: center;
  gap: 13px;
  color: white;
  font-size: 9px;
  letter-spacing: 2px;
}

.landscape-nav a {
  color: inherit;
  text-decoration: none;
}

.landscape-nav a:hover {
  text-decoration: underline;
}

.landscape-nav span {
  width: 28px;
  height: 1px;
  background: rgba(255, 255, 255, 0.65);
  margin-right: 5px;
}

.landscape-nav i {
  font-style: normal;
  opacity: 0.7;
}

.landscape-caption {
  position: absolute;
  z-index: 2;
  left: 10%;
  bottom: 10%;
  color: white;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.4);
}

.location-name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 7px;
  font-family: Georgia, serif;
  font-size: 29px;
  font-style: italic;
}

.location-state {
  margin: 0 0 0 25px;
  font-size: 9px;
  letter-spacing: 3px;
}

.landscape-decoration {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 40%;
  height: 110px;
}

@media (min-width: 1200px) {
  .login-panel {
    padding-top: 6vh;
  }

  .brand {
    margin-bottom: 5vh;
  }

  .login-content {
    max-width: 430px;
  }

  .input-box {
    min-height: 48px;
  }

  .primary-button {
    min-height: 48px;
  }
}

@media (max-width: 760px) {
  .login-page {
    grid-template-columns: 1fr;
    min-height: 100vh;
  }

  .login-panel {
    grid-row: 1;
    padding: 30px 24px 80px;
  }

  .brand {
    justify-content: center;
    margin-bottom: 35px;
  }

  .login-content {
    max-width: 440px;
  }

  .landscape-panel {
    grid-row: 2;
    min-height: 360px;
  }

  .landscape-panel::before {
    display: none;
  }

  .landscape-nav {
    top: 25px;
    right: 20px;
    gap: 8px;
    font-size: 8px;
  }

  .bottom-decoration {
    height: 65px;
  }
}

@media (max-width: 380px) {
  .brand-icon {
    width: 65px;
  }

  .brand-text h1 {
    font-size: 24px;
  }

  .brand-text p {
    letter-spacing: 2px;
  }

  .form-options {
    align-items: flex-start;
    font-size: 9px;
  }

  .landscape-nav {
    letter-spacing: 1px;
  }
}
</style>