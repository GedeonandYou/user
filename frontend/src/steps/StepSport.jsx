import { PhoneFrame } from '../components/ui/PhoneFrame'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StepContainer } from '../components/ui/StepContainer'
import { Title } from '../components/ui/Title'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { OptionCard } from '../components/ui/OptionCard'
import { Chip } from '../components/ui/Chip'
import { SPORTS_TYPES } from '../data/constants'

const SPORT_OPTIONS = [
  { id: 'spectateur', emoji: '📺', label: 'Spectateur',        sub: "J'aime regarder, supporter" },
  { id: 'pratiquant', emoji: '🏃', label: 'Pratiquant',        sub: 'Je participe, je cours, je joue' },
  { id: 'les-deux',   emoji: '⚡', label: 'Les deux !',         sub: 'Spectateur ET pratiquant' },
  { id: 'bof',        emoji: '😴', label: 'Pas trop mon truc', sub: 'On passe au suivant' },
]

export function StepSport({ frame, nav, profile, setProfile, toggleArrayItem }) {
  const { isNarrow } = frame
  return (
    <PhoneFrame {...frame}>
      <ProgressBar {...nav} isNarrow={isNarrow} />
      <StepContainer isNarrow={isNarrow} animating={nav.animating}>
        <Title isNarrow={isNarrow} sub="Ça nous aide à calibrer tes recommandations">
          ② Le sport, pour toi c'est...
        </Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {SPORT_OPTIONS.map(opt => (
            <OptionCard key={opt.id} isNarrow={isNarrow} {...opt}
              selected={profile.sportType === opt.id}
              onClick={() => setProfile(p => ({ ...p, sportType: opt.id }))} />
          ))}
        </div>
        {profile.sportType && profile.sportType !== 'bof' && (
          <>
            <p style={{ color: '#777', fontSize: 12, margin: '8px 0' }}>Sports préférés (optionnel) :</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {SPORTS_TYPES.map(s => (
                <Chip key={s} label={s}
                  selected={profile.sportPrefs.includes(s)}
                  onClick={() => toggleArrayItem('sportPrefs', s)} />
              ))}
            </div>
          </>
        )}
        <div style={{ marginTop: 'auto' }}>
          <PrimaryButton onClick={nav.goNext} disabled={!profile.sportType} isNarrow={isNarrow}>
            Suivant
          </PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  )
}
