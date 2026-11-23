import catalog from '../data/geossitios-preview.json'

export interface CatalogPhoto {
  url: string
  publicId: string
  author: string | null
  caption: string
  sourceUrl: string
  sourceLabel: string
  license: string | null
  licenseUrl: string | null
  permissionStatus: 'licensed' | 'public_domain' | 'pending'
  changes: string
  creditNote?: string
}

const entries = catalog.places as { id: string; image: CatalogPhoto | null }[]

export function getCatalogPhoto(place: { id: string; imageUrl?: string | null }) {
  const photo = entries.find(entry => entry.id === place.id)?.image
  // Uma foto substituída pelo guia não pode herdar o crédito da imagem anterior.
  return photo && place.imageUrl === photo.url ? photo : null
}
