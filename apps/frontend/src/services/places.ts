import { api } from './api'

export type Place = {
  id: string
  name: string
  description: string
  city: string
  category: string
  latitude: number
  longitude: number
  imageUrl?: string | null // URL da imagem no Cloudinary (opcional)
}

export const placesService = {
  async getAll() {
    const response = await api.get('/places?limit=50&page=1')
    return response.data.data || response.data
  },

  async create(place: Omit<Place, 'id'>) {
    const response = await api.post('/places', place)
    return response.data
  },

  async getById(id: string) {
    const response = await api.get(`/places/${id}`)
    return response.data
  }
}