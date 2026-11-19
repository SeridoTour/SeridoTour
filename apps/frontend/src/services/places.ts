import { api } from './api'
import type { Place, PlacesPage } from '../types/tourism'

export const placesService = {
  async getPage(page = 1, limit = 12): Promise<PlacesPage> {
    const { data } = await api.get<PlacesPage>('/places', { params: { page, limit } })
    return data
  },
  async getAll(): Promise<Place[]> {
    const { data } = await this.getPage(1, 100)
    return data
  },
  async getById(id: string): Promise<Place> {
    const { data } = await api.get<Place>(`/places/${id}`)
    return data
  },
  async save(form: FormData, id?: string): Promise<Place> {
    const { data } = id
      ? await api.patch<Place>(`/places/${id}`, form)
      : await api.post<Place>('/places', form)
    return data
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/places/${id}`)
  },
}
