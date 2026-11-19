export const PLACE_CATEGORIES = ['Natureza', 'Histórico', 'Culinária', 'Aventura', 'Lazer', 'Praia']

export function categoryClass(category: string): string {
  const normalized = category
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  if (normalized === 'natureza') return 'category-nature'
  if (normalized === 'historico') return 'category-history'
  return 'category-adventure'
}
