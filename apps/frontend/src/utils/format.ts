import axios from 'axios'

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback
  const message: unknown = error.response?.data?.message
  if (Array.isArray(message)) return message.join(' ')
  return typeof message === 'string' ? message : fallback
}

export function imageUrl(value?: string | null): string {
  if (!value) return '/serido-sunset.png'
  if (/^https?:\/\//i.test(value)) return value
  if (!value.startsWith('/')) return '/serido-sunset.png'
  return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${value}`
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value))
}
