import { api } from './api'
import type { Itinerary, ItineraryInput } from '../types/tourism'

export type ItineraryAction = 'submit' | 'publish' | 'reject' | 'unpublish'

export const itinerariesService = {
  async getAll(scope: 'public' | 'mine' | 'all'): Promise<Itinerary[]> {
    const endpoint = {
      public: '/itineraries/public',
      mine: '/itineraries/meus',
      all: '/itineraries',
    }[scope]
    const { data } = await api.get<Itinerary[]>(endpoint)
    return data
  },
  async getById(id: string, isPublic = false): Promise<Itinerary> {
    const { data } = await api.get<Itinerary>(`/itineraries/${isPublic ? 'public/' : ''}${id}`)
    return data
  },
  async save(input: ItineraryInput, id?: string): Promise<Itinerary> {
    const { data } = id
      ? await api.patch<Itinerary>(`/itineraries/${id}`, input)
      : await api.post<Itinerary>('/itineraries', input)
    return data
  },
  async transition(id: string, action: ItineraryAction, reason?: string): Promise<void> {
    await api.patch(`/itineraries/${id}/${action}`, reason === undefined ? undefined : { reason })
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/itineraries/${id}`)
  },
}
