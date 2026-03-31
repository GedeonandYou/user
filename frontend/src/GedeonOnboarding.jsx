import { useState, useEffect, useMemo } from 'react'
import { useViewport } from './hooks/useViewport'
import { api } from './services/api'

import { StepWelcome }       from './steps/StepWelcome'
import { StepAuthChoice }    from './steps/StepAuthChoice'
import { StepAuthForm }      from './steps/StepAuthForm'
import { StepIdentity }      from './steps/StepIdentity'
import { StepIntro }         from './steps/StepIntro'
import { StepInterests }     from './steps/StepInterests'
import { StepSport }         from './steps/StepSport'
import { StepMusic }         from './steps/StepMusic'
import { StepCompanion }     from './steps/StepCompanion'
import { StepDistance }      from './steps/StepDistance'
import { StepBudget }        from './steps/StepBudget'
import { StepFrequency }     from './steps/StepFrequency'
import { StepWhen }          from './steps/StepWhen'
import { StepDiscovery }     from './steps/StepDiscovery'
import { StepAmbiance }      from './steps/StepAmbiance'
import { StepNotifications } from './steps/StepNotifications'
import { StepDone }          from './steps/StepDone'
import { StepEditProfile }   from './steps/StepEditProfile'

const TOTAL_STEPS = 18

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim().toLowerCase())
}

export function GedeonOnboarding() {
  const vp = useViewport()
  const isNarrow = vp.w < 560
  const isTablet = vp.w >= 560 && vp.w < 980

  // Thème clair/sombre
  const [theme, setTheme] = useState(() => localStorage.getItem('gedeon_theme') || 'dark')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('gedeon_theme', theme)
  }, [theme])

  // Navigation
  const [step, setStep] = useState(0)
  const [animating, setAnimating] = useState(false)

  // Auth
  const [authMode, setAuthMode] = useState('register')
  const [email, setEmail] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authInfo, setAuthInfo] = useState('')
  const [pendingConfirm, setPendingConfirm] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotInfo, setForgotInfo] = useState('')

  // Profile
  const [sessionPseudo, setSessionPseudo] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [profile, setProfile] = useState({
    interests: [], sportType: null, sportPrefs: [], musicGenres: [],
    companion: null, distance: null, budget: null,
    frequency: null, when: [], discovery: null, ambiance: null,
  })
  const [notifChoice, setNotifChoice] = useState(null)
  const [saving, setSaving] = useState(false)

  // Popup de choix au re-login
  const [showUpdateModal, setShowUpdateModal] = useState(false)

  // Auto-skip: si déjà connecté, charger les préférences existantes
  useEffect(() => {
    ;(async () => {
      try {
        const chk = await api.checkSession()
        if (!chk?.logged_in) return
        const prefs = chk.preferences || {}
        if (prefs.interests && prefs.interests.length > 0) {
          // Préférences existantes → pré-remplir et afficher la popup de choix
          setProfile({
            interests:   prefs.interests    || [],
            sportType:   prefs.sportType    ?? null,
            sportPrefs:  prefs.sportPrefs   || [],
            musicGenres: prefs.musicGenres  || [],
            companion:   prefs.companion    ?? null,
            distance:    prefs.distance     ?? null,
            budget:      prefs.budget       ?? null,
            frequency:   prefs.frequency    ?? null,
            when:        prefs.when         || [],
            discovery:   prefs.discovery    ?? null,
            ambiance:    prefs.ambiance     ?? null,
          })
          setNotifChoice(prefs.notifications ?? null)
          setFirstName(prefs.firstName || '')
          setLastName(prefs.lastName || '')
          setSessionPseudo(chk.username || '')
          setStep(16) // StepDone en fond
          setShowUpdateModal(true) // popup par-dessus
        } else {
          setSessionPseudo(chk.username || '')
          setStep(3) // StepIdentity (auth déjà faite)
        }
      } catch (_) { /* ignore */ }
    })()
  }, [])

  const progressPercent = Math.min(100, (step / (TOTAL_STEPS - 1)) * 100)

  const goNext = () => {
    setAnimating(true)
    setTimeout(() => { setStep(s => s + 1); setAnimating(false) }, 220)
  }
  const goBack = () => {
    if (step > 0) {
      setAnimating(true)
      setTimeout(() => { setStep(s => s - 1); setAnimating(false) }, 220)
    }
  }

  const canSubmitAuth = useMemo(() => {
    if (!isValidEmail(email)) return false
    if (!password || password.length < 4) return false
    if (authMode === 'register') {
      if (!pseudo || pseudo.trim().length < 2) return false
      if (password2 !== password) return false
    }
    return true
  }, [authMode, email, password, password2, pseudo])

  const toggleInterest = (id) => {
    setProfile(p => ({
      ...p,
      interests: p.interests.includes(id)
        ? p.interests.filter(i => i !== id)
        : p.interests.length < 5 ? [...p.interests, id] : p.interests,
    }))
  }

  const toggleArrayItem = (field, item) => {
    setProfile(p => ({
      ...p,
      [field]: p[field].includes(item) ? p[field].filter(i => i !== item) : [...p[field], item],
    }))
  }

  async function handleAuthSubmit() {
    setAuthError(''); setAuthInfo(''); setForgotInfo(''); setPendingConfirm(false)
    setAuthLoading(true)
    try {
      if (authMode === 'register') {
        const data = await api.register(email.trim().toLowerCase(), pseudo.trim(), password)
        setAuthInfo(data?.message || 'Compte créé. Vérifie ton email pour confirmer.')
        setPendingConfirm(true)
        return
      }
      const data = await api.login(email.trim().toLowerCase(), password)
      setAuthInfo(data?.message || 'Connexion réussie.')
      setStep(3)
    } catch (e) {
      if (e?.payload?.code === 'EMAIL_NOT_CONFIRMED') {
        setAuthError('Email non confirmé. Clique sur le lien reçu, puis réessaie.')
        setPendingConfirm(true)
      } else {
        setAuthError(e.message || "Erreur d'authentification.")
      }
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleResendConfirmation() {
    setAuthError(''); setAuthInfo('')
    if (!isValidEmail(email)) { setAuthError("Entre un email valide d'abord."); return }
    setAuthLoading(true)
    try {
      const data = await api.resendConfirmation(email.trim().toLowerCase())
      setAuthInfo(data?.message || 'Email de confirmation renvoyé.')
      setPendingConfirm(true)
    } catch (e) {
      setAuthError(e.message || "Impossible de renvoyer l'email.")
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleForgotPassword() {
    setForgotInfo(''); setAuthError('')
    if (!isValidEmail(email)) { setAuthError("Entre ton email (valide) pour recevoir le lien."); return }
    setForgotLoading(true)
    try {
      const data = await api.forgotPassword(email.trim().toLowerCase())
      setForgotInfo(data?.message || 'Si cet email existe, tu recevras un lien de réinitialisation.')
    } catch (_) {
      setForgotInfo('Si cet email existe, tu recevras un lien de réinitialisation.')
    } finally {
      setForgotLoading(false)
    }
  }

  async function finalizeOnboarding() {
    setSaving(true)
    const preferences = {
      ...profile,
      notifications: notifChoice,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    }
    try {
      localStorage.setItem('gedeon_onboarded', 'true')
      try { await api.savePreferences(preferences) } catch { /* ignore if endpoint missing */ }
      goNext()
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveProfile(newFirstName, newLastName, newPseudo) {
    const preferences = {
      ...profile,
      notifications: notifChoice,
      firstName: newFirstName,
      lastName: newLastName,
    }
    await api.savePreferences(preferences)
    setFirstName(newFirstName)
    setLastName(newLastName)

    const currentBase = sessionPseudo.split('_')[0] || ''
    if (newPseudo.toLowerCase() !== currentBase.toLowerCase()) {
      const result = await api.updateProfile({ pseudo: newPseudo })
      setSessionPseudo(result.username || sessionPseudo)
    }
  }

  // Responsive frame sizes
  const frameHeightMobile = Math.min(720, Math.max(560, vp.h - 40))
  const frameHeightWide   = Math.min(860, Math.max(620, vp.h - 56))
  const frameWidthWide    = Math.min(980, Math.max(680, vp.w - 40))

  const frame = { isNarrow, isTablet, frameHeightMobile, frameHeightWide, frameWidthWide }
  const nav   = { step, totalSteps: TOTAL_STEPS, progressPercent, goNext, goBack, animating }

  const steps = [
    <StepWelcome key={0} frame={frame} nav={nav} />,
    <StepAuthChoice key={1} frame={frame} nav={nav}
      authMode={authMode} setAuthMode={setAuthMode}
      email={email} setEmail={setEmail} />,
    <StepAuthForm key={2} frame={frame} nav={nav}
      authMode={authMode} setAuthMode={setAuthMode}
      email={email}
      pseudo={pseudo} setPseudo={setPseudo}
      password={password} setPassword={setPassword}
      password2={password2} setPassword2={setPassword2}
      showPwd={showPwd} setShowPwd={setShowPwd}
      authError={authError} authInfo={authInfo} forgotInfo={forgotInfo}
      pendingConfirm={pendingConfirm}
      authLoading={authLoading} forgotLoading={forgotLoading}
      canSubmitAuth={canSubmitAuth}
      handleAuthSubmit={handleAuthSubmit}
      handleResendConfirmation={handleResendConfirmation}
      handleForgotPassword={handleForgotPassword} />,
    <StepIdentity key={3} frame={frame} nav={nav}
      firstName={firstName} setFirstName={setFirstName}
      lastName={lastName} setLastName={setLastName} />,
    <StepIntro key={4} frame={frame} nav={nav}
      totalSteps={TOTAL_STEPS} setStep={setStep} />,
    <StepInterests key={5} frame={frame} nav={nav}
      profile={profile} toggleInterest={toggleInterest} />,
    <StepSport key={6} frame={frame} nav={nav}
      profile={profile} setProfile={setProfile} toggleArrayItem={toggleArrayItem} />,
    <StepMusic key={7} frame={frame} nav={nav}
      profile={profile} toggleArrayItem={toggleArrayItem} />,
    <StepCompanion key={8} frame={frame} nav={nav}
      profile={profile} setProfile={setProfile} />,
    <StepDistance key={9} frame={frame} nav={nav}
      profile={profile} setProfile={setProfile} />,
    <StepBudget key={10} frame={frame} nav={nav}
      profile={profile} setProfile={setProfile} />,
    <StepFrequency key={11} frame={frame} nav={nav}
      profile={profile} setProfile={setProfile} />,
    <StepWhen key={12} frame={frame} nav={nav}
      profile={profile} toggleArrayItem={toggleArrayItem} />,
    <StepDiscovery key={13} frame={frame} nav={nav}
      profile={profile} setProfile={setProfile} />,
    <StepAmbiance key={14} frame={frame} nav={nav}
      profile={profile} setProfile={setProfile} />,
    <StepNotifications key={15} frame={frame} nav={nav}
      notifChoice={notifChoice} setNotifChoice={setNotifChoice}
      saving={saving} finalizeOnboarding={finalizeOnboarding} />,
    <StepDone key={16} frame={frame} nav={nav}
      firstName={firstName} profile={profile} setStep={setStep} />,
    <StepEditProfile key={17} frame={frame} nav={nav}
      firstName={firstName} setFirstName={setFirstName}
      lastName={lastName} setLastName={setLastName}
      sessionPseudo={sessionPseudo}
      saving={saving} setSaving={setSaving}
      onSave={handleSaveProfile}
      setStep={setStep} />,
  ]

  return (
    <>
      <button
        onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        type="button"
        title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        style={{
          position: 'fixed', top: 14, right: 14, zIndex: 9999,
          width: 36, height: 36, borderRadius: 18,
          background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          border: theme === 'dark' ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.15)',
          cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)', transition: 'all 0.2s ease',
        }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      {steps[step] ?? steps[0]}
      {showUpdateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.72)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 20px',
        }}>
          <div style={{
            background: '#1a1a1a', borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '32px 24px', maxWidth: 360, width: '100%',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>👋</div>
            <h2 style={{
              color: '#fff', fontSize: 20, fontWeight: 800,
              margin: '0 0 8px', fontFamily: "'DM Sans', sans-serif",
            }}>
              Content de te revoir !
            </h2>
            <p style={{
              color: '#777', fontSize: 14, lineHeight: 1.6, margin: '0 0 28px',
            }}>
              Que veux-tu faire ?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => { setShowUpdateModal(false); setStep(5) }}
                type="button"
                style={{
                  padding: '14px 20px', borderRadius: 14,
                  background: 'linear-gradient(135deg, #FF6B35, #FFB347)',
                  border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                ✏️ Actualiser mes attentes
              </button>
              <button
                onClick={() => { setShowUpdateModal(false); window.location.href = '/' }}
                type="button"
                style={{
                  padding: '14px 20px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#ccc', fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                🗺️ Naviguer sur GEDEON
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
