import { PhoneFrame } from '../components/ui/PhoneFrame'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StepContainer } from '../components/ui/StepContainer'
import { Title } from '../components/ui/Title'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { OptionCard } from '../components/ui/OptionCard'

const OPTIONS = [
  { id: 'rare',        emoji: '🌙', label: '1-2 fois par mois',           sub: 'Quand ça me dit' },
  { id: 'weekly',      emoji: '📅', label: 'Chaque semaine',              sub: "C'est un rituel" },
  { id: 'multi',       emoji: '🔥', label: 'Plusieurs fois par semaine',  sub: 'Je ne tiens pas en place' },
  { id: 'spontaneous', emoji: '🎲', label: "Quand l'envie me prend",      sub: 'Pas de planning' },
]

export function StepFrequency({ frame, nav, profile, setProfile }) {
  const { isNarrow } = frame
  return (
    <PhoneFrame {...frame}>
      <ProgressBar {...nav} isNarrow={isNarrow} />
      <StepContainer isNarrow={isNarrow} animating={nav.animating}>
        <Title isNarrow={isNarrow} sub="Pour calibrer le volume de suggestions">
          ⑦ Tu sors à quelle fréquence ?
        </Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {OPTIONS.map(opt => (
            <OptionCard key={opt.id} isNarrow={isNarrow} {...opt}
              selected={profile.frequency === opt.id}
              onClick={() => setProfile(p => ({ ...p, frequency: opt.id }))} />
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 12 }}>
          <PrimaryButton onClick={nav.goNext} disabled={!profile.frequency} isNarrow={isNarrow}>
            Suivant
          </PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  )
}
