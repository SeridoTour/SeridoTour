import type { ItineraryStatus } from '../types/tourism'

export const ITINERARY_STATUS_LABELS: Record<ItineraryStatus, string> = {
  RASCUNHO: 'Rascunho',
  EM_ANALISE: 'Em análise',
  PUBLICADO: 'Publicado',
  REJEITADO: 'Rejeitado',
}

export const ITINERARY_STATUS_CLASSES: Record<ItineraryStatus, string> = {
  RASCUNHO: 'status-draft',
  EM_ANALISE: 'status-pending',
  PUBLICADO: 'status-published',
  REJEITADO: 'status-rejected',
}
