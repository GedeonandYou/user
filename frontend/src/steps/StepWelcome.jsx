import { PhoneFrame } from '../components/ui/PhoneFrame'
import { StepContainer } from '../components/ui/StepContainer'
import { PrimaryButton } from '../components/ui/PrimaryButton'

export function StepWelcome({ frame, nav }) {
  const { isNarrow } = frame
  return (
    <PhoneFrame {...frame}>
      <StepContainer centered isNarrow={isNarrow} animating={nav.animating}>
        <div style={{ textAlign: 'center', padding: '0 16px' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24, margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #FF6B35, #FFB347)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, boxShadow: '0 8px 32px rgba(255,107,53,0.3)',
          }}>G</div>
          <h1 style={{
            color: '#fff', fontSize: isNarrow ? 28 : 34, fontWeight: 800,
            margin: '0 0 8px', fontFamily: "'DM Sans', -apple-system, sans-serif",
            letterSpacing: -0.4,
          }}>GEDEON</h1>
          <p style={{
            color: '#FF6B35', fontSize: 13, fontWeight: 600, letterSpacing: 2,
            margin: '0 0 24px', textTransform: 'uppercase',
          }}>Global Event Directory</p>
          <p style={{ color: '#888', fontSize: 14, lineHeight: 1.6, margin: '0 0 40px', whiteSpace: 'pre-line' }}>
            Tous les événements du monde.{'\n'}Du concert au village jusqu'aux JO.
          </p>
          <PrimaryButton onClick={nav.goNext} isNarrow={isNarrow}>
            Commencer →
          </PrimaryButton>
          <p style={{ color: '#555', fontSize: 11, marginTop: 16 }}>
            Inscription / connexion en 1 minute
          </p>
        </div>
      </StepContainer>
    </PhoneFrame>
  )
}
