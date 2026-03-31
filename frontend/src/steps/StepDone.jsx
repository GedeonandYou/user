import { PhoneFrame } from '../components/ui/PhoneFrame'
import { StepContainer } from '../components/ui/StepContainer'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { INTERESTS } from '../data/constants'

export function StepDone({ frame, nav, firstName, profile, setStep }) {
  const { isNarrow } = frame
  return (
    <PhoneFrame {...frame}>
      <StepContainer centered isNarrow={isNarrow} animating={nav.animating}>
        <div style={{ textAlign: 'center', padding: '0 12px' }}>
          <div style={{
            width: 100, height: 100, borderRadius: 50, margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #FF6B35, #FFB347)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 42, boxShadow: '0 12px 40px rgba(255,107,53,0.35)',
          }}>🎉</div>
          <h2 style={{
            color: 'var(--text)', fontSize: isNarrow ? 24 : 28, fontWeight: 800,
            margin: '0 0 8px', fontFamily: "'DM Sans', sans-serif",
          }}>
            {firstName ? `Bonjour ${firstName} !` : 'Ton profil'}
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.6, margin: '0 0 32px' }}>
            Tes préférences sont enregistrées. Tu peux les modifier à tout moment.
          </p>
          <div style={{
            background: 'var(--profile-card-bg)', border: '1px solid var(--profile-card-border)',
            borderRadius: 16, padding: 16, marginBottom: 24, textAlign: 'left',
          }}>
            <p style={{ color: 'var(--profile-label)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>
              Ton profil
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {profile.interests.map(id => {
                const interest = INTERESTS.find(i => i.id === id)
                return interest ? (
                  <span key={id} style={{
                    padding: '4px 10px', background: 'rgba(255,107,53,0.12)',
                    borderRadius: 12, color: '#FFB347', fontSize: 12,
                  }}>
                    {interest.emoji} {interest.label}
                  </span>
                ) : null
              })}
            </div>
          </div>
          <PrimaryButton onClick={() => (window.location.href = '/')} isNarrow={isNarrow}>
            Explorer GEDEON →
          </PrimaryButton>
          <button onClick={() => setStep(5)} type="button" style={{
            marginTop: 10, background: 'none', border: '1px solid var(--profile-card-border)',
            color: 'var(--text-dim)', fontSize: 13, cursor: 'pointer',
            padding: '8px 16px', borderRadius: 10, width: '100%',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            ✏️ Modifier mes préférences
          </button>
        </div>
      </StepContainer>
    </PhoneFrame>
  )
}
