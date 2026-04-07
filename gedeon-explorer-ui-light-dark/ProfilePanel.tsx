import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, LogOut, Save, Check, Loader2, Lock, ChevronRight, User } from 'lucide-react'
import type { AuthUser } from './types'
import { fetchPreferences, savePreferences, updatePseudo, logoutUser } from './api'

const INTERESTS = [
  { key: 'music',      label: '🎵 Concerts' },
  { key: 'cinema',     label: '🎬 Cinéma' },
  { key: 'salons',     label: '🏢 Salons' },
  { key: 'sport',      label: '⚽ Sports' },
  { key: 'outdoor',    label: '🌿 Outdoor' },
  { key: 'culture',    label: '🎨 Culture' },
  { key: 'gastronomy', label: '🍽️ Gastronomie' },
  { key: 'tech',       label: '💻 Tech' },
]

const DISTANCES = ['5', '10', '20', '30', '50', '100', '200']

interface Props {
  user: AuthUser
  darkMode: boolean
  onClose: () => void
  onUserUpdate: (username: string) => void
}

function getInitials(username: string) {
  const name = username.split('#')[0]
  return name.slice(0, 2).toUpperCase()
}

export default function ProfilePanel({ user, darkMode: dm, onClose, onUserUpdate }: Props) {
  const [prefs, setPrefs]             = useState(user.preferences)
  const [pseudo, setPseudo]           = useState(user.username.split('#')[0])
  const [firstName, setFirstName]     = useState(user.preferences.firstName || '')
  const [lastName, setLastName]       = useState(user.preferences.lastName || '')
  const [distance, setDistance]       = useState(user.preferences.distance || '50')
  const [interests, setInterests]     = useState<string[]>(user.preferences.interests || [])

  const [pseudoSaving, setPseudoSaving] = useState(false)
  const [pseudoError, setPseudoError]   = useState('')
  const [pseudoOk, setPseudoOk]         = useState(false)

  const [prefsSaving, setPrefsSaving] = useState(false)
  const [prefsOk, setPrefsOk]         = useState(false)

  const [loggingOut, setLoggingOut]   = useState(false)

  // Charger les préférences fraîches
  useEffect(() => {
    fetchPreferences().then(p => {
      setPrefs(p)
      setFirstName(p.firstName || '')
      setLastName(p.lastName || '')
      setDistance(p.distance || '50')
      setInterests(p.interests || [])
    })
  }, [])

  function toggleInterest(key: string) {
    setInterests(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
    setPrefsOk(false)
  }

  async function handleSavePseudo() {
    if (!pseudo.trim()) return
    setPseudoSaving(true)
    setPseudoError('')
    setPseudoOk(false)
    const result = await updatePseudo(pseudo.trim())
    setPseudoSaving(false)
    if (result.ok && result.username) {
      setPseudoOk(true)
      onUserUpdate(result.username)
      setTimeout(() => setPseudoOk(false), 2500)
    } else {
      setPseudoError(result.error || 'Erreur')
    }
  }

  async function handleSavePrefs() {
    setPrefsSaving(true)
    setPrefsOk(false)
    const ok = await savePreferences({ ...prefs, firstName, lastName, distance, interests })
    setPrefsSaving(false)
    if (ok) {
      setPrefsOk(true)
      setTimeout(() => setPrefsOk(false), 2500)
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    await logoutUser()
    window.location.href = '/'
  }

  const bg  = dm ? 'bg-slate-900' : 'bg-white'
  const bdr = dm ? 'border-slate-800' : 'border-slate-200'
  const sub = dm ? 'text-slate-400' : 'text-slate-500'
  const inp = dm
    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-orange-500'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-orange-400'

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 260 }}
        className={`fixed right-0 top-0 bottom-0 z-[400] w-full max-w-[420px] ${bg} flex flex-col shadow-2xl`}
      >
        {/* Header drawer */}
        <div className={`flex items-center gap-4 px-6 py-5 border-b ${bdr} shrink-0`}>
          {/* Avatar */}
          <div className="h-12 w-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-lg shrink-0">
            {getInitials(user.username)}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`font-bold text-base truncate ${dm ? 'text-white' : 'text-slate-900'}`}>
              {user.username}
            </div>
            <div className={`text-xs ${sub}`}>Mon profil</div>
          </div>
          <button
            onClick={onClose}
            className={`h-9 w-9 flex items-center justify-center rounded-xl ${dm ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} transition-colors`}
          >
            <X size={18} className={sub} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

          {/* ── Pseudo ── */}
          <section>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${sub} mb-3`}>Pseudo</h3>
            <div className="flex gap-2">
              <input
                value={pseudo}
                onChange={e => { setPseudo(e.target.value); setPseudoError(''); setPseudoOk(false) }}
                onKeyDown={e => e.key === 'Enter' && handleSavePseudo()}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${inp}`}
                placeholder="Ton pseudo"
              />
              <button
                onClick={handleSavePseudo}
                disabled={pseudoSaving || !pseudo.trim()}
                className={`flex h-10 w-10 items-center justify-center rounded-xl font-semibold transition-all shrink-0 ${
                  pseudoOk
                    ? 'bg-green-500 text-white'
                    : 'bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50'
                }`}
              >
                {pseudoSaving ? <Loader2 size={16} className="animate-spin" /> : pseudoOk ? <Check size={16} /> : <Save size={16} />}
              </button>
            </div>
            {pseudoError && <p className="mt-1.5 text-xs text-red-400">{pseudoError}</p>}
            <p className={`mt-1.5 text-xs ${sub}`}>Le numéro (#xxxx) est attribué automatiquement.</p>
          </section>

          {/* ── Informations ── */}
          <section>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${sub} mb-3`}>Informations</h3>
            <div className="space-y-3">
              <input
                value={firstName}
                onChange={e => { setFirstName(e.target.value); setPrefsOk(false) }}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${inp}`}
                placeholder="Prénom"
              />
              <input
                value={lastName}
                onChange={e => { setLastName(e.target.value); setPrefsOk(false) }}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${inp}`}
                placeholder="Nom"
              />
            </div>
          </section>

          {/* ── Centres d'intérêt ── */}
          <section>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${sub} mb-3`}>Centres d'intérêt</h3>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(({ key, label }) => {
                const active = interests.includes(key)
                return (
                  <button
                    key={key}
                    onClick={() => toggleInterest(key)}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                      active
                        ? 'bg-orange-500 text-white shadow'
                        : dm
                          ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── Distance préférée ── */}
          <section>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${sub} mb-3`}>Rayon de recherche</h3>
            <div className="flex flex-wrap gap-2">
              {DISTANCES.map(d => (
                <button
                  key={d}
                  onClick={() => { setDistance(d); setPrefsOk(false) }}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                    distance === d
                      ? 'bg-orange-500 text-white shadow'
                      : dm
                        ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d} km
                </button>
              ))}
            </div>
          </section>

          {/* ── Bouton sauvegarder préférences ── */}
          <button
            onClick={handleSavePrefs}
            disabled={prefsSaving}
            className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 font-bold text-sm transition-all ${
              prefsOk
                ? 'bg-green-500 text-white'
                : 'bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-60'
            }`}
          >
            {prefsSaving
              ? <><Loader2 size={16} className="animate-spin" /> Sauvegarde...</>
              : prefsOk
                ? <><Check size={16} /> Préférences sauvées !</>
                : <><Save size={16} /> Sauvegarder les préférences</>
            }
          </button>

          {/* ── Actions compte ── */}
          <section className={`border-t ${bdr} pt-6 space-y-2`}>
            <a
              href="/reset-password"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${dm ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}
            >
              <Lock size={16} className={sub} />
              <span className="flex-1">Changer le mot de passe</span>
              <ChevronRight size={14} className={sub} />
            </a>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${dm ? 'hover:bg-red-950/50 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
            >
              {loggingOut
                ? <Loader2 size={16} className="animate-spin" />
                : <LogOut size={16} />
              }
              <span>{loggingOut ? 'Déconnexion...' : 'Se déconnecter'}</span>
            </button>
          </section>

        </div>
      </motion.aside>
    </>
  )
}
