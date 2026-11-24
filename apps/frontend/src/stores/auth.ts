import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, refreshAccessToken } from '../services/api'

export interface UserPayload {
  id: string
  name: string
  email: string
  role: 'USER' | 'GUIA'
}

export const useAuthStore = defineStore('auth', () => {
  localStorage.removeItem('refresh_token')
  const accessToken = ref<string | null>(localStorage.getItem('access_token'))
  const sessionEmail = ref(localStorage.getItem('seridotour:session-email') || '')
  let refreshTimer: number | undefined

  const parseJwt = (token: string): UserPayload | null => {
    try {
      const base64Url = token.split('.')[1]
      if (!base64Url) return null
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      )
      const payload = JSON.parse(jsonPayload)
      if (!payload.sub || (payload.exp && payload.exp * 1000 <= Date.now())) return null
      return {
        id: payload.sub,
        name: payload.name,
        email: payload.email || sessionEmail.value,
        role: payload.role,
      }
    } catch (e) {
      return null
    }
  }

  const user = computed<UserPayload | null>(() => {
    return accessToken.value ? parseJwt(accessToken.value) : null
  })

  const isAuthenticated = computed(() => !!user.value)
  const isGuia = computed(() => user.value?.role === 'GUIA')

  const clearSession = () => {
    if (refreshTimer) window.clearTimeout(refreshTimer)
    accessToken.value = null
    sessionEmail.value = ''
    localStorage.removeItem('access_token')
    localStorage.removeItem('seridotour:session-email')
  }

  const getExpiration = (token: string) => {
    try {
      const base64Url = token.split('.')[1]
      if (!base64Url) return null
      const payload = JSON.parse(atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')))
      return typeof payload.exp === 'number' ? payload.exp * 1000 : null
    } catch {
      return null
    }
  }

  const refreshSession = async () => {
    if (!accessToken.value) return false

    try {
      const access = await refreshAccessToken()
      setTokens(access)
      return true
    } catch {
      clearSession()
      return false
    }
  }

  const scheduleRefresh = (access: string) => {
    if (refreshTimer) window.clearTimeout(refreshTimer)
    const expiresAt = getExpiration(access)
    if (!expiresAt) return

    const delay = Math.max(0, expiresAt - Date.now())
    refreshTimer = window.setTimeout(() => void refreshSession(), delay)
  }

  const setTokens = (access: string) => {
    accessToken.value = access
    localStorage.setItem('access_token', access)
    localStorage.removeItem('refresh_token')
    scheduleRefresh(access)
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // A sessão local também deve ser encerrada se a API estiver indisponível.
    } finally {
      clearSession()
      delete api.defaults.headers.common['Authorization']
    }
  }

  const login = async (credentials: { email: string; password: string }) => {
    const { data } = await api.post('/auth/login', credentials)
    sessionEmail.value = credentials.email
    localStorage.setItem('seridotour:session-email', credentials.email)
    setTokens(data.access_token)
  }

  const register = async (payload: {
    name: string
    email: string
    password: string
  }) => {
    await api.post('/users/cadastrar', payload)
    await login({ email: payload.email, password: payload.password })
  }

  if (accessToken.value) scheduleRefresh(accessToken.value)

  return {
    accessToken,
    user,
    isAuthenticated,
    isGuia,
    setTokens,
    logout,
    login,
    register,
    refreshSession,
  }
})
