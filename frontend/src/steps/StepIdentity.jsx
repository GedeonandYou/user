import { PhoneFrame } from '../components/ui/PhoneFrame'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StepContainer } from '../components/ui/StepContainer'
import { Title } from '../components/ui/Title'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { TextInput } from '../components/ui/TextInput'

export function StepIdentity({ frame, nav, firstName, setFirstName, lastName, setLastName }) {
  const { isNarrow } = frame
  return (
    <PhoneFrame {...frame}>
      <ProgressBar {...nav} isNarrow={isNarrow} />
      <StepContainer isNarrow={isNarrow} animating={nav.animating}>
        <Title isNarrow={isNarrow} sub="Ces infos restent privées.">
          Comment tu t'appelles ?
        </Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <TextInput isNarrow={isNarrow} placeholder="Prénom" value={firstName}
            onChange={(e) => setFirstName(e.target.value)} />
          <TextInput isNarrow={isNarrow} placeholder="Nom" value={lastName}
            onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '12px 14px', background: 'rgba(255,107,53,0.06)',
          borderRadius: 10, marginBottom: 20,
        }}>
          <span style={{ fontSize: 16 }}>🔒</span>
          <p style={{ color: '#999', fontSize: 11, lineHeight: 1.5, margin: 0 }}>
            Ton identité n'est jamais partagée publiquement. Elle sert uniquement à la
            billetterie et aux réservations via nos partenaires.
          </p>
        </div>
        <div style={{ marginTop: 'auto' }}>
          <PrimaryButton onClick={nav.goNext} disabled={!firstName || !lastName} isNarrow={isNarrow}>
            Continuer
          </PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  )
}
