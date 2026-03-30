import { PhoneFrame } from '../components/ui/PhoneFrame'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StepContainer } from '../components/ui/StepContainer'
import { Title } from '../components/ui/Title'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { Chip } from '../components/ui/Chip'
import { MUSIC_GENRES } from '../data/constants'

export function StepMusic({ frame, nav, profile, toggleArrayItem }) {
  const { isNarrow } = frame
  return (
    <PhoneFrame {...frame}>
      <ProgressBar {...nav} isNarrow={isNarrow} />
      <StepContainer isNarrow={isNarrow} animating={nav.animating}>
        <Title isNarrow={isNarrow} sub="Sélectionne autant de genres que tu veux">
          ③ Quels sons te font vibrer ?
        </Title>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {MUSIC_GENRES.map(g => (
            <Chip key={g} label={g}
              selected={profile.musicGenres.includes(g)}
              onClick={() => toggleArrayItem('musicGenres', g)} />
          ))}
        </div>
        <div style={{ marginTop: 'auto' }}>
          <PrimaryButton onClick={nav.goNext} disabled={profile.musicGenres.length === 0} isNarrow={isNarrow}>
            Suivant
          </PrimaryButton>
          <button onClick={nav.goNext} type="button" style={{
            display: 'block', width: '100%', marginTop: 8,
            background: 'none', border: 'none', color: '#555', fontSize: 12, cursor: 'pointer', padding: 8,
          }}>
            Pas de préférence
          </button>
        </div>
      </StepContainer>
    </PhoneFrame>
  )
}
