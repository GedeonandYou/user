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

const TOTAL_STEPS = 17

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim().toLowerCase())
}

export function GedeonOnboarding() {
  const vp = useViewport()
  const isNarrow = vp.w < 560
  const isTablet = vp.w >= 560 && vp.w < 980

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
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [profile, setProfile] = useState({
    interests: [], sportType: null, sportPrefs: [], musicGenres: [],
    companion: null, distance: null, budget: null,
    frequency: null, when: [], discovery: null, ambiance: null,
  })
  const [notifChoice, setNotifChoice] = useState(null)
  const [saving, setSaving] = useState(false)

  // Auto-skip auth if already logged in
  useEffect(() => {
    ;(async () => {
      try {
        const chk = await api.checkSession()
        if (chk?.logged_in) setStep(3)
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
    const preferences = { ...profile, notifications: notifChoice }
    try {
      localStorage.setItem('gedeon_onboarding', JSON.stringify({
        firstName: firstName.trim(), lastName: lastName.trim(),
        preferences, savedAt: new Date().toISOString(),
      }))
      localStorage.setItem('gedeon_onboarded', 'true')
      try { await api.savePreferences(preferences) } catch (_) { /* ignore if endpoint missing */ }
      goNext()
    } finally {
      setSaving(false)
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
  ]

  return steps[step] ?? steps[0]
}
