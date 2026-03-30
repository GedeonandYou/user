import { PhoneFrame } from '../components/ui/PhoneFrame'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StepContainer } from '../components/ui/StepContainer'
import { Title } from '../components/ui/Title'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { OptionCard } from '../components/ui/OptionCard'

const OPTIONS = [
  { id: 'semaine',  emoji: '🏢', label: 'En semaine',             sub: 'Lunch, afterwork...' },
  { id: 'weekend',  emoji: '🌅', label: 'Le weekend',             sub: 'Samedi, dimanche' },
  { id: 'soir',     emoji: '🌃', label: 'En soirée',              sub: 'Après 19h' },
  { id: 'vacances', emoji: '🏖️', label: 'Vacances / jours fériés', sub: "Quand j'ai du temps" },
  { id: 'anytime',  emoji: '⏰', label: 'Tout le temps !',        sub: 'Je suis toujours dispo' },
]

export function StepWhen({ frame, nav, profile, toggleArrayItem }) {
  const { isNarrow } = frame
  return (
    <PhoneFrame {...frame}>
      <ProgressBar {...nav} isNarrow={isNarrow} />
      <StepContainer isNarrow={isNarrow} animating={nav.animating}>
        <Title isNarrow={isNarrow} sub="Plusieurs choix possibles">
          ⑧ C'est quand pour toi ?
        </Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {OPTIONS.map(opt => (
            <OptionCard key={opt.id} isNarrow={isNarrow} {...opt}
              selected={profile.when.includes(opt.id)}
              onClick={() => toggleArrayItem('when', opt.id)} />
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 12 }}>
          <PrimaryButton onClick={nav.goNext} disabled={profile.when.length === 0} isNarrow={isNarrow}>
            Suivant
          </PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  )
}
