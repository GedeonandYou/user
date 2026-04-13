export type Category = "Tous" | "Concerts" | "Films" | "Salons" | "Sports" | "Outdoor" | "Culture" | "Gastronomie" | "Tech"

export interface EventData {
  id: string
  title: string
  description: string
  meta: string          // ex: "Antananarivo · 04 Avr"
  badge: string         // catégorie affichée
  category: Category
  image: string | null
  location: { lat: number; lng: number; label: string }
  dateBegin: string     // ISO date
  dateEnd: string | null
  distanceKm: number
  relevanceScore?: number
  source: "DATAtourisme" | "Cinema" | "Salon"
  url?: string
}

export interface ApiEventsResponse {
  status: string
  events: RawEvent[]
  count: number
}

export interface RawEvent {
  uid?: string
  id?: string
  title: string
  description?: string
  begin?: string
  date_debut?: string
  end?: string
  date_fin?: string
  latitude?: number
  longitude?: number
  city?: string
  commune?: string
  address?: string
  adresse?: string
  image?: string | null
  distanceKm?: number
  relevanceScore?: number
  source?: string
  openagendaUrl?: string
  // cinéma
  name?: string
  theaterName?: string
  // salon
  lieu?: string
}

export interface AuthUser {
  username: string
  preferences: {
    interests?: string[]
    firstName?: string
    lastName?: string
    distance?: string
    [key: string]: unknown
  }
}
