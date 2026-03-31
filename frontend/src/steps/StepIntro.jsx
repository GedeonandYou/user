import { PhoneFrame } from '../components/ui/PhoneFrame'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StepContainer } from '../components/ui/StepContainer'
import { PrimaryButton } from '../components/ui/PrimaryButton'

export function StepIntro({ frame, nav, totalSteps, setStep }) {
  const { isNarrow } = frame
  return (
    <PhoneFrame {...frame}>
      <ProgressBar {...nav} isNarrow={isNarrow} />
      <StepContainer centered isNarrow={isNarrow} animating={nav.animating}>
        <div style={{ textAlign: 'center', padding: '0 12px' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🎯</div>
          <h2 style={{
            color: 'var(--text)', fontSize: isNarrow ? 22 : 26, fontWeight: 800,
            margin: '0 0 12px', fontFamily: "'DM Sans', sans-serif",
          }}>
            Te connaître en 10 questions
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.6, margin: '0 0 8px' }}>
            Pour trouver les bons plans près de chez toi, t'alerter au bon moment,
            et ne jamais rater ce qui compte pour toi.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 36px' }}>
            ≈ 1 minute • Tu peux modifier à tout moment
          </p>
          <PrimaryButton onClick={nav.goNext} isNarrow={isNarrow}>C'est parti !</PrimaryButton>
          <button onClick={() => setStep(totalSteps - 2)} type="button" style={{
            display: 'block', width: '100%', marginTop: 12,
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: 13, cursor: 'pointer', padding: 8, fontFamily: "'DM Sans', sans-serif",
          }}>
            Passer pour l'instant
          </button>
        </div>
      </StepContainer>
    </PhoneFrame>
  )
}
