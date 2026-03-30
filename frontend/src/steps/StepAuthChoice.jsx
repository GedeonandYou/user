import { PhoneFrame } from '../components/ui/PhoneFrame'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StepContainer } from '../components/ui/StepContainer'
import { Title } from '../components/ui/Title'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { OptionCard } from '../components/ui/OptionCard'
import { TextInput } from '../components/ui/TextInput'

function isValidEmail(email) {
  if (!email) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())
}

export function StepAuthChoice({ frame, nav, authMode, setAuthMode, email, setEmail }) {
  const { isNarrow } = frame
  const canProceed = isValidEmail(email)

  return (
    <PhoneFrame {...frame}>
      <ProgressBar {...nav} isNarrow={isNarrow} />
      <StepContainer isNarrow={isNarrow} animating={nav.animating}>
        <Title isNarrow={isNarrow} sub="Ton compte GEDEON est sécurisé par email + mot de passe.">
          Connexion / inscription
        </Title>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <OptionCard isNarrow={isNarrow} emoji="✨" label="Créer un compte" sub="Nouveau sur GEDEON"
            selected={authMode === 'register'} onClick={() => setAuthMode('register')} />
          <OptionCard isNarrow={isNarrow} emoji="🔑" label="Se connecter" sub="J'ai déjà un compte"
            selected={authMode === 'login'} onClick={() => setAuthMode('login')} />
          <OptionCard isNarrow={isNarrow} emoji="📱" label="Par SMS"
            sub="Connexion rapide par numéro de téléphone"
            badge="Bientôt" selected={false} disabled={true} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <TextInput isNarrow={isNarrow} type="email" placeholder="ton@email.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="email" autoCapitalize="none" autoCorrect="off" inputMode="email" />
          {!isValidEmail(email) && email.length > 0 && (
            <p style={{ color: '#FFB347', fontSize: 12, marginTop: 8 }}>Email invalide</p>
          )}
        </div>

        <div style={{ marginTop: 'auto' }}>
          <PrimaryButton onClick={nav.goNext} disabled={!canProceed} isNarrow={isNarrow}>
            Continuer →
          </PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  )
}
