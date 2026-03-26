import { PhoneFrame } from '../components/ui/PhoneFrame'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StepContainer } from '../components/ui/StepContainer'
import { Title } from '../components/ui/Title'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { OptionCard } from '../components/ui/OptionCard'

const OPTIONS = [
  { id: 'free',    emoji: '🆓', label: "Gratuit c'est bien",        sub: 'Priorité aux événements gratuits' },
  { id: '30',      emoji: '💰', label: "Jusqu'à 30€",               sub: 'Raisonnable' },
  { id: '100',     emoji: '💳', label: "Jusqu'à 100€",              sub: 'Pour les bonnes occasions' },
  { id: 'nolimit', emoji: '✨', label: "Le prix n'est pas un frein", sub: "Si c'est bien, j'y vais" },
]

export function StepBudget({ frame, nav, profile, setProfile }) {
  const { isNarrow } = frame
  return (
    <PhoneFrame {...frame}>
      <ProgressBar {...nav} isNarrow={isNarrow} />
      <StepContainer isNarrow={isNarrow} animating={nav.animating}>
        <Title isNarrow={isNarrow} sub="Pour te proposer des événements dans tes moyens">
          ⑥ Budget sorties
        </Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {OPTIONS.map(opt => (
            <OptionCard key={opt.id} isNarrow={isNarrow} {...opt}
              selected={profile.budget === opt.id}
              onClick={() => setProfile(p => ({ ...p, budget: opt.id }))} />
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 12 }}>
          <PrimaryButton onClick={nav.goNext} disabled={!profile.budget} isNarrow={isNarrow}>
            Suivant
          </PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  )
}
