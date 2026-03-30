import { PhoneFrame } from '../components/ui/PhoneFrame'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StepContainer } from '../components/ui/StepContainer'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { OptionCard } from '../components/ui/OptionCard'

export function StepNotifications({ frame, nav, notifChoice, setNotifChoice, saving, finalizeOnboarding }) {
  const { isNarrow } = frame
  return (
    <PhoneFrame {...frame}>
      <ProgressBar {...nav} isNarrow={isNarrow} />
      <StepContainer centered isNarrow={isNarrow} animating={nav.animating}>
        <div style={{ textAlign: 'center', padding: '0 12px' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🔔</div>
          <h2 style={{
            color: '#fff', fontSize: isNarrow ? 22 : 26, fontWeight: 800,
            margin: '0 0 12px', fontFamily: "'DM Sans', sans-serif",
          }}>Notifications</h2>
          <p style={{ color: '#888', fontSize: 14, lineHeight: 1.6, margin: '0 0 32px' }}>
            Pas obligatoire, mais conseillé pour ne pas rater un événement près de chez toi !
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            <OptionCard isNarrow={isNarrow} emoji="✅" label="Oui, m'alerter"
              sub="Événements majeurs + mes favoris uniquement"
              selected={notifChoice === true} onClick={() => setNotifChoice(true)} />
            <OptionCard isNarrow={isNarrow} emoji="⏳" label="Plus tard"
              sub="Tu pourras activer dans les réglages"
              selected={notifChoice === false} onClick={() => setNotifChoice(false)} />
          </div>
          <PrimaryButton onClick={finalizeOnboarding} disabled={notifChoice === null || saving} isNarrow={isNarrow}>
            {saving ? 'Enregistrement...' : 'Finaliser'}
          </PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  )
}
