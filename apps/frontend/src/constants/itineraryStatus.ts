export type ItineraryStatus =
  | 'RASCUNHO'
  | 'EM_ANALISE'
  | 'PUBLICADO'
  | 'REJEITADO';

export interface Itinerary {
  id: string;
  title: string;
  description?: string | null;
  duracaoDias: number;
  status: ItineraryStatus;
  rejectionReason?: string | null;
  userId: string;
  user?: {
    id: string;
    name: string;
  };
  places: Array<{
    id: string;
    name: string;
    category?: string;
  }>;
}

export const ITINERARY_STATUS_LABELS: Record<ItineraryStatus, string> = {
  RASCUNHO: 'Rascunho',
  EM_ANALISE: 'Em Análise',
  PUBLICADO: 'Publicado',
  REJEITADO: 'Rejeitado',
};

export const ITINERARY_STATUS_CLASSES: Record<ItineraryStatus, string> = {
  RASCUNHO: 'bg-slate-100 text-slate-700',
  EM_ANALISE: 'bg-amber-100 text-amber-800',
  PUBLICADO: 'bg-emerald-100 text-emerald-800',
  REJEITADO: 'bg-red-100 text-red-700',
};
