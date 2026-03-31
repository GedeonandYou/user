import { PhoneFrame } from '../components/ui/PhoneFrame'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StepContainer } from '../components/ui/StepContainer'
import { Title } from '../components/ui/Title'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { Chip } from '../components/ui/Chip'
import { INTERESTS } from '../data/constants'

export function StepInterests({ frame, nav, profile, toggleInterest }) {
  const { isNarrow } = frame
  return (
    <PhoneFrame {...frame}>
      <ProgressBar {...nav} isNarrow={isNarrow} />
      <StepContainer isNarrow={isNarrow} animating={nav.animating}>
        <Title isNarrow={isNarrow} sub="Choisis 3 à 5 thèmes qui te parlent">
          ① Tes passions
        </Title>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {INTERESTS.map(i => (
            <Chip key={i.id} emoji={i.emoji} label={i.label}
              selected={profile.interests.includes(i.id)}
              onClick={() => toggleInterest(i.id)} />
          ))}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', margin: '4px 0 12px' }}>
          {profile.interests.length}/5 sélectionnés
        </p>
        <div style={{ marginTop: 'auto' }}>
          <PrimaryButton onClick={nav.goNext} disabled={profile.interests.length < 3} isNarrow={isNarrow}>
            Suivant
          </PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  )
}
