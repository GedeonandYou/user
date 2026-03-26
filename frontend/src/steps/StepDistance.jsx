import { PhoneFrame } from '../components/ui/PhoneFrame'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StepContainer } from '../components/ui/StepContainer'
import { Title } from '../components/ui/Title'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { OptionCard } from '../components/ui/OptionCard'

const OPTIONS = [
  { id: '5km',           emoji: '📍',  label: 'Mon quartier',          sub: 'Moins de 5 km' },
  { id: '20km',          emoji: '🏙️', label: 'Ma ville',              sub: 'Moins de 20 km' },
  { id: '100km',         emoji: '🚗',  label: 'Ma région',             sub: "Jusqu'à 100 km" },
  { id: 'national',      emoji: '🗺️', label: 'Partout dans le pays',  sub: 'Si ça vaut le déplacement' },
  { id: 'international', emoji: '✈️',  label: 'Sans frontières !',     sub: 'Le monde est mon terrain de jeu' },
]

export function StepDistance({ frame, nav, profile, setProfile }) {
  const { isNarrow } = frame
  return (
    <PhoneFrame {...frame}>
      <ProgressBar {...nav} isNarrow={isNarrow} />
      <StepContainer isNarrow={isNarrow} animating={nav.animating}>
        <Title isNarrow={isNarrow} sub="Rayon de recherche par défaut (modifiable)">
          ⑤ Jusqu'où tu irais ?
        </Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {OPTIONS.map(opt => (
            <OptionCard key={opt.id} isNarrow={isNarrow} {...opt}
              selected={profile.distance === opt.id}
              onClick={() => setProfile(p => ({ ...p, distance: opt.id }))} />
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 12 }}>
          <PrimaryButton onClick={nav.goNext} disabled={!profile.distance} isNarrow={isNarrow}>
            Suivant
          </PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  )
}
