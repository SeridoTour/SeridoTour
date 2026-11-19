export interface Place {
  id: string
  name: string
  description: string
  city: string
  category: string
  latitude: number
  longitude: number
  imageUrl?: string | null
}

export type ItineraryStatus = 'RASCUNHO' | 'EM_ANALISE' | 'PUBLICADO' | 'REJEITADO'

export interface Itinerary {
  id: string
  title: string
  description?: string | null
  duracaoDias: number
  status: ItineraryStatus
  rejectionReason?: string | null
  userId: string
  user?: { id: string; name: string }
  places: Place[]
}

export interface ItineraryInput {
  title: string
  description: string
  duracaoDias: number
  placeIds: string[]
}

export interface Review {
  id: string
  placeId: string
  rating: number
  comment?: string | null
  imageUrl?: string | null
  createdAt: string
  user: { id: string; name: string }
}

export interface UserSummary {
  id: string
  name: string
  email: string
  role: 'USER' | 'GUIA'
  createdAt: string
}

export interface PlacesPage {
  data: Place[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}
