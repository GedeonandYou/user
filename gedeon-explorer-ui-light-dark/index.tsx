import './index.css';
import React, { useState, useEffect, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Map as MapIcon, List as ListIcon,
  Sun, Zap, ChevronRight, MapPin, Calendar,
  X, ArrowLeft, Loader2, RefreshCw
} from "lucide-react";
import type { EventData, Category } from "./types";
import { checkAuth, fetchEvents, getAvailableCategories } from "./api";
import LeafletMap from "./LeafletMap";
import ProfilePanel from "./ProfilePanel";

// --- Image avec fallback ---
const EventImage = ({ src, alt, className }: { src: string | null; alt: string; className?: string }) => {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className={`${className} bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center`}>
        <MapPin size={24} className="text-slate-500" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`${className} object-cover`}
      referrerPolicy="no-referrer"
      onError={() => setErr(true)}
    />
  );
};

// --- Card événement (carousel) ---
const EventCard = ({ event, onClick, darkMode }: { event: EventData; onClick: () => void; darkMode: boolean }) => (
  <motion.article
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`w-[160px] shrink-0 overflow-hidden rounded-[20px] ${darkMode ? "bg-slate-800 ring-1 ring-slate-700" : "bg-[#0F172A]"} text-white shadow-lg cursor-pointer`}
  >
    <div className="relative">
      <EventImage src={event.image} alt={event.title} className="h-28 w-full" />
      {(event.relevanceScore ?? 0) > 0 && (
        <div className="absolute top-2 right-2 rounded-full bg-orange-500 px-1.5 py-0.5 text-[9px] font-black text-white shadow-lg">
          ★ Pour toi
        </div>
      )}
    </div>
    <div className="p-3">
      <div className="mb-1.5 inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/90">
        {event.badge}
      </div>
      <h3 className="line-clamp-2 text-[13px] font-bold leading-tight">{event.title}</h3>
      <p className="mt-1 text-[11px] text-slate-400 truncate">{event.meta}</p>
      {event.distanceKm > 0 && (
        <p className="mt-0.5 text-[10px] text-orange-400 font-semibold">{event.distanceKm} km</p>
      )}
    </div>
  </motion.article>
);

// --- Modale détail ---
const EventDetails = ({ event, onClose, darkMode }: { event: EventData; onClose: () => void; darkMode: boolean }) => (
  <motion.div
    initial={{ y: "100%" }}
    animate={{ y: 0 }}
    exit={{ y: "100%" }}
    transition={{ type: "spring", damping: 28, stiffness: 220 }}
    className={`fixed inset-0 z-[200] ${darkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"} flex flex-col overflow-hidden`}
  >
    <div className="relative h-72 shrink-0">
      <EventImage src={event.image} alt={event.title} className="h-full w-full" />
      <div className={`absolute inset-0 bg-gradient-to-t ${darkMode ? "from-slate-900/90" : "from-black/70"} to-transparent`} />
      <button
        onClick={onClose}
        className="absolute left-4 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white"
      >
        <ArrowLeft size={20} />
      </button>
    </div>

    <div className="flex-1 overflow-y-auto px-6 py-6 max-w-3xl mx-auto w-full">
      <div className={`mb-3 inline-flex rounded-full ${darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"} px-3 py-1 text-xs font-bold uppercase tracking-wider`}>
        {event.badge}
      </div>
      <h2 className="mb-4 text-3xl font-black leading-tight">{event.title}</h2>

      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${darkMode ? "bg-slate-800" : "bg-slate-50"}`}>
            <Calendar size={18} className="text-slate-400" />
          </div>
          <div>
            <div className="text-sm font-bold">{event.dateBegin}{event.dateEnd ? ` → ${event.dateEnd}` : ''}</div>
            <div className="text-xs text-slate-400">Date</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${darkMode ? "bg-slate-800" : "bg-slate-50"}`}>
            <MapPin size={18} className="text-slate-400" />
          </div>
          <div>
            <div className="text-sm font-bold">{event.location.label}</div>
            {event.distanceKm > 0 && <div className="text-xs text-orange-400">{event.distanceKm} km</div>}
          </div>
        </div>
      </div>

      {event.description && (
        <div className="mb-6">
          <h3 className="mb-2 text-lg font-bold">À propos</h3>
          <p className={`leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>{event.description}</p>
        </div>
      )}

      {event.url && (
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-2 rounded-2xl ${darkMode ? "bg-white text-slate-900" : "bg-slate-900 text-white"} px-6 py-3 font-bold shadow-lg`}
        >
          Voir plus d'infos
        </a>
      )}
    </div>
  </motion.div>
);

// --- Carousel fluide infini (CSS animation translateX) ---
const carouselStyle = `
@keyframes gedeon-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.gedeon-track {
  display: flex;
  gap: 16px;
  width: max-content;
  animation: gedeon-scroll linear infinite;
}
.gedeon-track:hover { animation-play-state: paused; }
`;

const CarouselSection = ({ events, onSelect, darkMode: dm }: { events: EventData[]; onSelect: (e: EventData) => void; darkMode: boolean }) => {
  // Durée : 4s par card (min 20s)
  const duration = Math.max(20, events.length * 4);
  // On duplique pour l'effet infini sans saut
  const doubled = [...events, ...events];

  return (
    <div style={{ background: dm ? '#020617' : '#f8fafc', paddingTop: 20, paddingBottom: 16, overflow: 'hidden' }}>
      <style>{carouselStyle}</style>
      <div style={{ paddingLeft: 32, paddingRight: 32, marginBottom: 12, display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontWeight: 900, fontSize: 16, color: dm ? '#fff' : '#0f172a' }}>Autour de toi</span>
        <span style={{ fontSize: 11, color: dm ? '#64748b' : '#94a3b8' }}>{events.length} événements</span>
      </div>
      <div
        className="gedeon-track"
        style={{ animationDuration: `${duration}s`, paddingLeft: 32 }}
      >
        {doubled.map((event, i) => (
          <EventCard key={`${event.id}-${i}`} event={event} onClick={() => onSelect(event)} darkMode={dm} />
        ))}
      </div>
    </div>
  );
};

// --- App principale ---
export default function GedeonExplorer() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('gedeon_theme') !== 'light';
  });
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [activeCategory, setActiveCategory] = useState<Category>("Tous");
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activePot, setActivePot] = useState<"km" | "days" | null>(null);
  const [distanceKm, setDistanceKm] = useState(50);
  const [days, setDays] = useState(90);

  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<{ lat: number; lon: number } | null>(null);
  const [categories, setCategories] = useState<Category[]>(["Tous"]);
  const [currentUser, setCurrentUser] = useState<{ username: string; preferences: Record<string, unknown> } | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  // Sync dark mode
  useEffect(() => {
    const saved = localStorage.getItem('gedeon_theme');
    setDarkMode(saved !== 'light');
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('gedeon_theme', next ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  };

  // Auth check + géoloc IP
  useEffect(() => {
    (async () => {
      const user = await checkAuth();
      if (!user) {
        window.location.href = '/';
        return;
      }
      setCurrentUser({ username: user.username, preferences: user.preferences as Record<string, unknown> });

      // Appliquer la distance sauvegardée si elle existe
      const savedDist = parseInt(String(user.preferences?.distance ?? '')) || 0;
      if (savedDist > 0) setDistanceKm(savedDist);

      // Position depuis préférences, sinon Paris par défaut
      // (DATAtourisme couvre uniquement la France — pas de géoloc IP)
      const prefLat = parseFloat(String((user.preferences as Record<string, unknown>)?.lat ?? ''));
      const prefLon = parseFloat(String((user.preferences as Record<string, unknown>)?.lon ?? ''));
      if (isFinite(prefLat) && isFinite(prefLon)) {
        setPosition({ lat: prefLat, lon: prefLon });
      } else {
        setPosition({ lat: 48.8566, lon: 2.3522 }); // Paris
      }
    })();
  }, []);

  // Charger événements quand position ou filtres changent
  const loadEvents = useCallback(async () => {
    if (!position) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEvents({ lat: position.lat, lon: position.lon, radiusKm: distanceKm, days });
      setEvents(data);
      setCategories(getAvailableCategories(data));
    } catch {
      setError("Impossible de charger les événements.");
    } finally {
      setLoading(false);
    }
  }, [position, distanceKm, days]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // Filtres catégorie + recherche
  const filteredEvents = events.filter(e => {
    const matchCat = activeCategory === "Tous" || e.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || e.title.toLowerCase().includes(q) || e.location.label.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // Helpers sliders logarithmiques
  const distToPct = (v: number) => v <= 0 ? 0 : (Math.log10(Math.max(v, 1)) / 4) * 100;
  const pctToDist = (p: number) => p <= 0 ? 0 : Math.round(Math.pow(10, (p / 100) * 4));
  const daysToPct = (v: number) => (v / 365) * 100;
  const pctToDays = (p: number) => Math.round((p / 100) * 365);

  const dm = darkMode;

  return (
    <div className={`min-h-screen w-full ${dm ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"} font-sans transition-colors duration-300`}>

      {/* ===== HEADER ===== */}
      <header className={`sticky top-0 z-50 ${dm ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-200"} border-b backdrop-blur-sm`}>
        {/* Ligne 1 : Logo + actions */}
        <div className="px-4 md:px-8 py-3 flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-2xl font-black tracking-tight bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
              Gedeon
            </div>
            <span className={`text-xs ${dm ? "text-slate-500" : "text-slate-400"} hidden md:block`}>Explorer autour de toi</span>
          </div>

          {/* Search — masquée sur mobile, visible md+ */}
          <div className="flex-1 max-w-xl relative hidden sm:block">
            <div className={`flex items-center gap-2 rounded-2xl ${dm ? "bg-slate-800 ring-slate-700" : "bg-slate-100 ring-slate-200"} ring-1 px-4 py-2`}>
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                placeholder="Rechercher un événement, un lieu..."
                className={`flex-1 bg-transparent outline-none text-sm ${dm ? "text-white placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-400"}`}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X size={14} className="text-slate-400" />
                </button>
              )}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActivePot(activePot === "km" ? null : "km")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-all ${activePot === "km" ? "bg-orange-500 text-white" : dm ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}
            >
              <MapPin size={13} /> {distanceKm} km
            </button>
            <button
              onClick={() => setActivePot(activePot === "days" ? null : "days")}
              className={`items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-all hidden sm:flex ${activePot === "days" ? "bg-orange-500 text-white" : dm ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}
            >
              <Calendar size={13} /> {days}j
            </button>
            <button onClick={loadEvents} className={`flex h-9 w-9 items-center justify-center rounded-xl ${dm ? "bg-slate-800" : "bg-slate-100"} transition-colors`}>
              <RefreshCw size={15} className={loading ? "animate-spin text-orange-400" : "text-slate-400"} />
            </button>
            <button onClick={toggleDark} className={`h-9 w-9 items-center justify-center rounded-xl ${dm ? "bg-slate-800" : "bg-slate-100"} transition-colors hidden sm:flex`}>
              {dm ? <Zap size={16} className="text-yellow-400 fill-yellow-400" /> : <Sun size={16} className="text-amber-500" />}
            </button>
            {currentUser && (
              <button
                onClick={() => setShowProfile(true)}
                title={currentUser.username}
                className="h-9 w-9 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 flex items-center justify-center text-white text-xs font-black transition-all shadow-md shrink-0"
              >
                {currentUser.username.split('#')[0].slice(0, 2).toUpperCase()}
              </button>
            )}
          </div>
        </div>

        {/* Ligne 2 mobile uniquement : search bar pleine largeur */}
        <div className="sm:hidden px-4 pb-3">
          <div className={`flex items-center gap-2 rounded-2xl ${dm ? "bg-slate-800 ring-slate-700" : "bg-slate-100 ring-slate-200"} ring-1 px-4 py-2`}>
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher un événement, un lieu..."
              className={`flex-1 bg-transparent outline-none text-sm ${dm ? "text-white placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-400"}`}
            />
            {searchQuery && <button onClick={() => setSearchQuery("")}><X size={14} className="text-slate-400" /></button>}
          </div>
        </div>
      </header>

      {/* ===== SLIDER POTENTIOMÈTRE ===== */}
      <AnimatePresence>
        {activePot && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`${dm ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} border-b px-4 md:px-8 py-4 flex items-center gap-6 overflow-hidden`}
          >
            <span className={`text-sm font-semibold ${dm ? "text-slate-300" : "text-slate-700"} shrink-0`}>
              {activePot === "km" ? `Distance : ${distanceKm} km` : `Période : ${days} jours`}
            </span>
            <input
              type="range" min="0" max="100" step="0.5"
              value={activePot === "km" ? distToPct(distanceKm) : daysToPct(days)}
              onChange={e => {
                const p = parseFloat(e.target.value);
                if (activePot === "km") setDistanceKm(pctToDist(p));
                else setDays(pctToDays(p));
              }}
              className="flex-1 max-w-xs accent-orange-500"
            />
            <button onClick={() => setActivePot(null)} className={`text-xs ${dm ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>Fermer</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== CATEGORY CHIPS ===== */}
      <div className={`${dm ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"} border-b px-4 md:px-8 py-3 flex items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
              activeCategory === cat
                ? "bg-orange-500 text-white shadow-md"
                : dm ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
        <div className="ml-auto shrink-0 flex items-center gap-2">
          <span className={`text-sm ${dm ? "text-slate-500" : "text-slate-400"}`}>
            {filteredEvents.length} résultat{filteredEvents.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ===== VUE TABS CARTE / LISTE ===== */}
      <div className={`flex items-center gap-1 px-4 md:px-8 pt-4 pb-0`}>
        {([["map", MapIcon, "Carte"], ["list", ListIcon, "Liste"]] as const).map(([mode, Icon, label]) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              viewMode === mode
                ? "bg-orange-500 text-white shadow"
                : dm ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* ===== CONTENU PRINCIPAL ===== */}
      <main className="px-4 md:px-8 py-4">

        {/* État chargement / erreur */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 size={24} className="animate-spin text-orange-500" />
            <span className={dm ? "text-slate-400" : "text-slate-500"}>Chargement des événements...</span>
          </div>
        )}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <p className="text-red-400">{error}</p>
            <button onClick={loadEvents} className="bg-orange-500 text-white px-6 py-2 rounded-xl font-semibold">Réessayer</button>
          </div>
        )}

        {/* ===== VUE CARTE ===== */}
        {!loading && !error && viewMode === "map" && (
          <div style={{ position: 'relative', width: '100%', borderRadius: 16, overflow: 'hidden', height: 'clamp(320px, calc(100vh - 260px), 700px)' }}>
            <LeafletMap
              events={filteredEvents}
              position={position}
              darkMode={dm}
              onSelectEvent={setSelectedEvent}
            />
            <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 1000, background: dm ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.92)', color: dm ? '#cbd5e1' : '#334155', padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, backdropFilter: 'blur(8px)', pointerEvents: 'none' }}>
              {filteredEvents.length} événement{filteredEvents.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* ===== VUE LISTE ===== */}
        {!loading && !error && viewMode === "list" && (
          <>
            {filteredEvents.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <p className={`text-lg font-semibold ${dm ? "text-slate-500" : "text-slate-400"}`}>Aucun événement trouvé</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredEvents.map(event => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedEvent(event)}
                    className={`rounded-2xl overflow-hidden cursor-pointer transition-shadow hover:shadow-xl ${dm ? "bg-slate-900 ring-1 ring-slate-800 hover:ring-orange-500/40" : "bg-white shadow ring-1 ring-slate-200 hover:ring-orange-400/40"}`}
                  >
                    <EventImage src={event.image} alt={event.title} className="h-44 w-full" />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${dm ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600"}`}>
                          {event.badge}
                        </span>
                        {event.distanceKm > 0 && (
                          <span className={`text-[10px] font-semibold ${dm ? "text-slate-500" : "text-slate-400"} shrink-0`}>{event.distanceKm} km</span>
                        )}
                      </div>
                      <h3 className={`font-bold text-sm leading-snug line-clamp-2 mb-1 ${dm ? "text-white" : "text-slate-900"}`}>{event.title}</h3>
                      <p className={`text-xs line-clamp-1 ${dm ? "text-slate-500" : "text-slate-400"}`}>{event.meta}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* ===== CAROUSEL pleine largeur avec flèches ===== */}
      {!loading && !error && filteredEvents.length > 0 && (
        <CarouselSection events={filteredEvents} onSelect={setSelectedEvent} darkMode={dm} />
      )}

      {/* ===== FOOTER ===== */}
      <footer className={`${dm ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-slate-900 text-slate-400"} border-t mt-auto`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Colonne 1 : Brand */}
          <div>
            <div className="text-2xl font-black tracking-tight bg-linear-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent mb-2">
              Gedeon
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Découvrez les événements, concerts, cinémas et salons près de chez vous.
            </p>
          </div>
          {/* Colonne 2 : Navigation */}
          <div>
            <h3 className="text-white text-sm font-bold mb-3 uppercase tracking-wider">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:text-white transition-colors">Carte principale</a></li>
              <li><a href="/new" className="hover:text-white transition-colors">Explorer</a></li>
              <li><a href="/onboarding" className="hover:text-white transition-colors">Mon profil</a></li>
            </ul>
          </div>
          {/* Colonne 3 : Infos */}
          <div>
            <h3 className="text-white text-sm font-bold mb-3 uppercase tracking-wider">Sources</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />DATAtourisme</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />Cinémas Allociné</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />Salons & Foires</li>
            </ul>
          </div>
        </div>
        <div className={`border-t border-slate-800 px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2`}>
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} Gedeon. Tous droits réservés.</p>
          <p className="text-xs text-slate-600">Interface de consultation des événements en temps réel</p>
        </div>
      </footer>

      {/* ===== PANEL PROFIL ===== */}
      <AnimatePresence>
        {showProfile && currentUser && (
          <ProfilePanel
            user={{ username: currentUser.username, preferences: currentUser.preferences as import('./types').AuthUser['preferences'] }}
            darkMode={dm}
            onClose={() => setShowProfile(false)}
            onUserUpdate={(username) => setCurrentUser(u => u ? { ...u, username } : u)}
          />
        )}
      </AnimatePresence>

      {/* ===== MODALE DÉTAIL ===== */}
      <AnimatePresence>
        {selectedEvent && (
          <EventDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} darkMode={dm} />
        )}
      </AnimatePresence>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<GedeonExplorer />);
