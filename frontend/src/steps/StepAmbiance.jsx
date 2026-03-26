import { PhoneFrame } from '../components/ui/PhoneFrame'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StepContainer } from '../components/ui/StepContainer'
import { Title } from '../components/ui/Title'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { OptionCard } from '../components/ui/OptionCard'

const OPTIONS = [
  { id: 'big',      emoji: '🏟️', label: 'En grand',           sub: 'Stades, festivals, concerts géants' },
  { id: 'intimate', emoji: '🎪',  label: 'Intimiste',          sub: 'Petites jauges, ambiance cosy' },
  { id: 'both',     emoji: '🎭',  label: 'Les deux me vont',   sub: 'Ça dépend du moment' },
]

export function StepAmbiance({ frame, nav, profile, setProfile }) {
  const { isNarrow } = frame
  return (
    <PhoneFrame {...frame}>
      <ProgressBar {...nav} isNarrow={isNarrow} />
      <StepContainer isNarrow={isNarrow} animating={nav.animating}>
        <Title isNarrow={isNarrow} sub="Dernière question !">
          ⑩ L'ambiance idéale
        </Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {OPTIONS.map(opt => (
            <OptionCard key={opt.id} isNarrow={isNarrow} {...opt}
              selected={profile.ambiance === opt.id}
              onClick={() => setProfile(p => ({ ...p, ambiance: opt.id }))} />
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 12 }}>
          <PrimaryButton onClick={nav.goNext} disabled={!profile.ambiance} isNarrow={isNarrow}>
            Terminer →
          </PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  )
}
