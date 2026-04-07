import type { EventData, RawEvent, AuthUser, Category } from './types'

const BASE = ''  // même origine Flask

// Mapping intérêts Gedeon → catégories UI
const INTEREST_TO_CATEGORY: Record<string, Category> = {
  music: 'Concerts',
  cinema: 'Films',
  salons: 'Salons',
  sport: 'Sports',
  outdoor: 'Outdoor',
  culture: 'Culture',
  gastronomy: 'Gastronomie',
  tech: 'Tech',
}

// Mapping source → catégorie par défaut
function guessCategory(event: RawEvent): Category {
  const src = (event.source || '').toLowerCase()
  const title = (event.title || '').toLowerCase()
  if (src === 'cinema') return 'Films'
  if (src === 'salon') return 'Salons'
  if (title.includes('concert') || title.includes('jazz') || title.includes('rock') || title.includes('electro') || title.includes('musique')) return 'Concerts'
  if (title.includes('foot') || title.includes('marathon') || title.includes('sport') || title.includes('yoga') || title.includes('randonnée')) return 'Sports'
  if (title.includes('randonnée') || title.includes('nature') || title.includes('outdoor')) return 'Outdoor'
  if (title.includes('expo') || title.includes('art') || title.includes('musée') || title.includes('danse') || title.includes('théâtre') || title.includes('opéra')) return 'Culture'
  if (title.includes('gastro') || title.includes('cuisine') || title.includes('food') || title.includes('marché')) return 'Gastronomie'
  if (title.includes('tech') || title.includes('hackathon') || title.includes('numérique') || title.includes('digital')) return 'Tech'
  return 'Tous'
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export function transformEvent(raw: RawEvent): EventData {
  const id = raw.uid || raw.id || Math.random().toString(36).slice(2)
  const title = raw.title || raw.name || 'Événement'
  const city = raw.city || raw.commune || raw.theaterName || raw.lieu || ''
  const dateBegin = raw.begin || raw.date_debut || ''
  const dateEnd = raw.end || raw.date_fin || null
  const category = guessCategory(raw)
  const meta = [city, formatDate(dateBegin)].filter(Boolean).join(' · ')

  return {
    id,
    title,
    description: raw.description || '',
    meta,
    badge: category === 'Tous' ? (raw.source || 'Événement') : category,
    category,
    image: raw.image || null,
    location: {
      lat: raw.latitude || 0,
      lng: raw.longitude || 0,
      label: city,
    },
    dateBegin,
    dateEnd,
    distanceKm: raw.distanceKm || 0,
    source: (raw.source as EventData['source']) || 'DATAtourisme',
    url: raw.openagendaUrl,
  }
}

export async function checkAuth(): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${BASE}/api/auth/check`, { credentials: 'include' })
    const data = await res.json()
    if (data.logged_in) return { username: data.username, preferences: data.preferences || {} }
    return null
  } catch {
    return null
  }
}

export async function fetchEvents(params: {
  lat: number
  lon: number
  radiusKm: number
  days: number
}): Promise<EventData[]> {
  const { lat, lon, radiusKm, days } = params
  const url = `${BASE}/api/events/nearby?lat=${lat}&lon=${lon}&radiusKm=${radiusKm}&days=${days}`
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) return []
  const data = await res.json()
  return (data.events || []).map(transformEvent)
}

export function getAvailableCategories(events: EventData[]): Category[] {
  const cats = new Set<Category>(events.map(e => e.category))
  const order: Category[] = ['Tous', 'Concerts', 'Films', 'Salons', 'Sports', 'Outdoor', 'Culture', 'Gastronomie', 'Tech']
  return order.filter(c => c === 'Tous' || cats.has(c))
}

export async function fetchPreferences(): Promise<AuthUser['preferences']> {
  try {
    const res = await fetch(`${BASE}/api/auth/preferences`, { credentials: 'include' })
    const data = await res.json()
    return data.preferences || {}
  } catch {
    return {}
  }
}

export async function savePreferences(preferences: AuthUser['preferences']): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/auth/preferences`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function updatePseudo(pseudo: string): Promise<{ ok: boolean; username?: string; error?: string }> {
  try {
    const res = await fetch(`${BASE}/api/auth/profile`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pseudo }),
    })
    const data = await res.json()
    if (res.ok) return { ok: true, username: data.username }
    return { ok: false, error: data.message || 'Erreur' }
  } catch {
    return { ok: false, error: 'Erreur réseau' }
  }
}

export async function logoutUser(): Promise<void> {
  await fetch(`${BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' })
}

export { INTEREST_TO_CATEGORY }
