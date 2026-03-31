import { useState } from 'react'
import { PhoneFrame } from '../components/ui/PhoneFrame'
import { StepContainer } from '../components/ui/StepContainer'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { TextInput } from '../components/ui/TextInput'

export function StepEditProfile({
  frame, nav,
  firstName, setFirstName,
  lastName, setLastName,
  sessionPseudo,
  saving, setSaving,
  onSave,
  setStep,
}) {
  const { isNarrow } = frame
  const [editPseudo, setEditPseudo] = useState(sessionPseudo.split('_')[0] || '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim() || !editPseudo.trim()) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await onSave(firstName.trim(), lastName.trim(), editPseudo.trim())
      setSuccess('Profil mis à jour !')
    } catch (e) {
      setError(e.message || 'Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  const canSave = firstName.trim() && lastName.trim() && editPseudo.trim() && !saving

  return (
    <PhoneFrame {...frame}>
      <StepContainer isNarrow={isNarrow} animating={nav.animating}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <button onClick={() => setStep(16)} type="button" style={{
            background: 'none', border: 'none', color: 'var(--text-dim)',
            fontSize: 20, cursor: 'pointer', padding: '4px 8px', borderRadius: 8,
          }}>←</button>
          <h2 style={{
            color: 'var(--text)', fontSize: isNarrow ? 20 : 24, fontWeight: 800,
            margin: 0, fontFamily: "'DM Sans', sans-serif",
          }}>Mon profil</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
          <label style={{ color: 'var(--text-sub)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
            Prénom
          </label>
          <TextInput isNarrow={isNarrow} placeholder="Prénom"
            value={firstName} onChange={e => setFirstName(e.target.value)} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
          <label style={{ color: 'var(--text-sub)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
            Nom
          </label>
          <TextInput isNarrow={isNarrow} placeholder="Nom"
            value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <label style={{ color: 'var(--text-sub)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
            Pseudo
          </label>
          <TextInput isNarrow={isNarrow} placeholder="Pseudo"
            value={editPseudo} onChange={e => setEditPseudo(e.target.value)}
            autoCapitalize="none" autoCorrect="off" />
          <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: 0 }}>
            Actuel : <span style={{ color: 'var(--text-dim)' }}>{sessionPseudo || '—'}</span>
          </p>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 14,
            background: 'var(--error-bg)', border: '1px solid var(--border-sub)',
            color: 'var(--error-text)', fontSize: 13,
          }}>{error}</div>
        )}
        {success && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 14,
            background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
            color: '#4ade80', fontSize: 13,
          }}>{success}</div>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PrimaryButton onClick={handleSave} disabled={!canSave} isNarrow={isNarrow}>
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </PrimaryButton>
          <button onClick={() => setStep(5)} type="button" style={{
            padding: '13px 18px', borderRadius: 14,
            background: 'var(--btn-secondary-bg)',
            border: '1px solid var(--btn-secondary-border)',
            color: 'var(--btn-secondary-text)', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
            ✏️ Modifier mes préférences
          </button>
        </div>
      </StepContainer>
    </PhoneFrame>
  )
}
