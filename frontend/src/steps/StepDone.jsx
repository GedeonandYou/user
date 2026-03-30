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
            color: '#fff', fontSize: isNarrow ? 24 : 28, fontWeight: 800,
            margin: '0 0 8px', fontFamily: "'DM Sans', sans-serif",
          }}>
            Bienvenue{firstName ? ` ${firstName}` : ''} !
          </h2>
          <p style={{ color: '#888', fontSize: 14, lineHeight: 1.6, margin: '0 0 32px' }}>
            Ton profil est prêt. GEDEON va maintenant te proposer des événements sur mesure.
          </p>
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: 16, marginBottom: 24, textAlign: 'left',
          }}>
            <p style={{ color: '#777', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>
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
          <button onClick={() => setStep(0)} type="button" style={{
            marginTop: 10, background: 'none', border: 'none',
            color: '#555', fontSize: 12, cursor: 'pointer',
          }}>
            Recommencer l'onboarding
          </button>
        </div>
      </StepContainer>
    </PhoneFrame>
  )
}
