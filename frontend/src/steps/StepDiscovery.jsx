import { PhoneFrame } from '../components/ui/PhoneFrame'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StepContainer } from '../components/ui/StepContainer'
import { Title } from '../components/ui/Title'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { OptionCard } from '../components/ui/OptionCard'

const OPTIONS = [
  { id: 'discover', emoji: '🧭', label: 'Explorateur', sub: 'Surprends-moi ! Nouveautés, découvertes' },
  { id: 'routine',  emoji: '❤️', label: 'Fidèle',       sub: 'Mes artistes, mes équipes, mes lieux' },
  { id: 'both',     emoji: '⚖️', label: 'Les deux',     sub: 'Un mix de nouveauté et de valeurs sûres' },
]

export function StepDiscovery({ frame, nav, profile, setProfile }) {
  const { isNarrow } = frame
  return (
    <PhoneFrame {...frame}>
      <ProgressBar {...nav} isNarrow={isNarrow} />
      <StepContainer isNarrow={isNarrow} animating={nav.animating}>
        <Title isNarrow={isNarrow} sub="On calibre la dose de surprise">
          ⑨ Ton style de sortie
        </Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {OPTIONS.map(opt => (
            <OptionCard key={opt.id} isNarrow={isNarrow} {...opt}
              selected={profile.discovery === opt.id}
              onClick={() => setProfile(p => ({ ...p, discovery: opt.id }))} />
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 12 }}>
          <PrimaryButton onClick={nav.goNext} disabled={!profile.discovery} isNarrow={isNarrow}>
            Suivant
          </PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  )
}
