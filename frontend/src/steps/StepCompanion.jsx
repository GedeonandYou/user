import { PhoneFrame } from '../components/ui/PhoneFrame'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StepContainer } from '../components/ui/StepContainer'
import { Title } from '../components/ui/Title'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { OptionCard } from '../components/ui/OptionCard'

const OPTIONS = [
  { id: 'solo',    emoji: '🧑',      label: 'En solo',      sub: "J'aime découvrir seul(e)" },
  { id: 'couple',  emoji: '💑',      label: 'En couple',    sub: 'Sorties à deux' },
  { id: 'famille', emoji: '👨‍👩‍👧', label: 'En famille',   sub: 'Avec les enfants' },
  { id: 'amis',    emoji: '👯',      label: 'Entre amis',   sub: 'La bande, toujours' },
  { id: 'depends', emoji: '🔄',      label: 'Ça dépend',    sub: 'Un peu de tout' },
]

export function StepCompanion({ frame, nav, profile, setProfile }) {
  const { isNarrow } = frame
  return (
    <PhoneFrame {...frame}>
      <ProgressBar {...nav} isNarrow={isNarrow} />
      <StepContainer isNarrow={isNarrow} animating={nav.animating}>
        <Title isNarrow={isNarrow} sub="On adapte les suggestions en conséquence">
          ④ Tu sors plutôt...
        </Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {OPTIONS.map(opt => (
            <OptionCard key={opt.id} isNarrow={isNarrow} {...opt}
              selected={profile.companion === opt.id}
              onClick={() => setProfile(p => ({ ...p, companion: opt.id }))} />
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 12 }}>
          <PrimaryButton onClick={nav.goNext} disabled={!profile.companion} isNarrow={isNarrow}>
            Suivant
          </PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  )
}
