import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import L from 'leaflet'
import 'leaflet.markercluster'
import type { EventData } from './types'

interface Props {
  events: EventData[]
  position: { lat: number; lon: number } | null
  darkMode: boolean
  onSelectEvent: (e: EventData) => void
}

// Tiles OSM clair / sombre
const TILE_LIGHT = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_DARK  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const ATTR_OSM   = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const ATTR_DARK  = '&copy; <a href="https://carto.com/">CARTO</a>'

function markerColor(source: string) {
  if (source === 'Cinema') return '#ef4444'
  if (source === 'Salon')  return '#22c55e'
  return '#f97316'
}

function makeIcon(source: string) {
  const color = markerColor(source)
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,.45)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  })
}

export default function LeafletMap({ events, position, darkMode, onSelectEvent }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<L.Map | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterRef   = useRef<any>(null)
  const tileRef      = useRef<L.TileLayer | null>(null)
  const onSelectRef  = useRef(onSelectEvent)
  onSelectRef.current = onSelectEvent

  // Init carte une seule fois
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [46.603354, 1.888334],
      zoom: 6,
      zoomControl: false,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    const tile = L.tileLayer(darkMode ? TILE_DARK : TILE_LIGHT, {
      attribution: darkMode ? ATTR_DARK : ATTR_OSM,
      maxZoom: 19,
    }).addTo(map)

    const cluster = (L as any).markerClusterGroup({ maxClusterRadius: 50 })
    map.addLayer(cluster)

    mapRef.current   = map
    clusterRef.current = cluster
    tileRef.current  = tile

    return () => {
      map.remove()
      mapRef.current = null
      clusterRef.current = null
      tileRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Changer le fond carte quand darkMode change
  useEffect(() => {
    const map  = mapRef.current
    const tile = tileRef.current
    if (!map || !tile) return
    tile.setUrl(darkMode ? TILE_DARK : TILE_LIGHT)
    tile.options.attribution = darkMode ? ATTR_DARK : ATTR_OSM
  }, [darkMode])

  // Centrer sur la position utilisateur
  useEffect(() => {
    if (!mapRef.current || !position) return
    mapRef.current.setView([position.lat, position.lon], 10, { animate: true })
  }, [position])

  // Mettre à jour les marqueurs
  useEffect(() => {
    const cluster = clusterRef.current
    if (!cluster) return
    cluster.clearLayers()

    events.forEach(event => {
      const { lat, lng } = event.location
      if (!lat && !lng) return

      const marker = L.marker([lat, lng], { icon: makeIcon(event.source) })

      // Clic direct → ouvre la modale EventDetails sans popup intermédiaire
      marker.on('click', () => onSelectRef.current(event))

      cluster.addLayer(marker)
    })
  }, [events])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
    />
  )
}
