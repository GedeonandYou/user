import { PhoneFrame } from '../components/ui/PhoneFrame'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StepContainer } from '../components/ui/StepContainer'
import { Title } from '../components/ui/Title'
import { PrimaryButton } from '../components/ui/PrimaryButton'
import { TextInput } from '../components/ui/TextInput'

export function StepAuthForm({
  frame, nav,
  authMode, setAuthMode,
  email,
  pseudo, setPseudo,
  password, setPassword,
  password2, setPassword2,
  showPwd, setShowPwd,
  authError, authInfo, forgotInfo,
  pendingConfirm,
  authLoading, forgotLoading,
  canSubmitAuth,
  handleAuthSubmit, handleResendConfirmation, handleForgotPassword,
}) {
  const { isNarrow } = frame

  return (
    <PhoneFrame {...frame}>
      <ProgressBar {...nav} isNarrow={isNarrow} />
      <StepContainer isNarrow={isNarrow} animating={nav.animating}>
        <Title isNarrow={isNarrow} sub={
          authMode === 'register'
            ? 'Crée ton compte, puis confirme par lien email.'
            : 'Entre ton mot de passe pour te connecter.'
        }>
          {authMode === 'register' ? 'Créer ton compte' : 'Se connecter'}
        </Title>

        {authMode === 'register' && (
          <div style={{ marginBottom: 12 }}>
            <TextInput isNarrow={isNarrow} placeholder="Pseudo (ex: marie_lorio)"
              value={pseudo} onChange={(e) => setPseudo(e.target.value)}
              autoComplete="username" autoCapitalize="none" autoCorrect="off" />
            <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 8 }}>
              2 caractères min • lettres/chiffres/_/- acceptés
            </p>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div style={{ position: 'relative' }}>
            <TextInput isNarrow={isNarrow} type={showPwd ? 'text' : 'password'}
              placeholder="Mot de passe (min 4 caractères)"
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: 52 }}
              autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} />
            <button onClick={() => setShowPwd(s => !s)} type="button" aria-label="Afficher/masquer" style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', padding: 6, fontSize: 12,
            }}>
              {showPwd ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {authMode === 'register' && (
          <div style={{ marginBottom: 12 }}>
            <TextInput isNarrow={isNarrow} type={showPwd ? 'text' : 'password'}
              placeholder="Confirme le mot de passe"
              value={password2} onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password" />
            {password2.length > 0 && password2 !== password && (
              <p style={{ color: '#FFB347', fontSize: 12, marginTop: 8 }}>
                Les mots de passe ne correspondent pas
              </p>
            )}
          </div>
        )}

        {(authError || authInfo || forgotInfo) && (
          <div style={{
            padding: '12px 14px', borderRadius: 12,
            border: '1px solid var(--border-sub)',
            background: authError ? 'var(--error-bg)' : 'var(--info-bg)',
            marginBottom: 14,
          }}>
            {authError && <div style={{ color: 'var(--error-text)', fontSize: 13, lineHeight: 1.5 }}>{authError}</div>}
            {authInfo && <div style={{ color: 'var(--info-text)', fontSize: 13, lineHeight: 1.5 }}>{authInfo}</div>}
            {forgotInfo && (
              <div style={{ color: 'var(--info-text)', fontSize: 13, lineHeight: 1.5, marginTop: authError || authInfo ? 10 : 0 }}>
                {forgotInfo}
              </div>
            )}
          </div>
        )}

        {pendingConfirm && (
          <div style={{
            padding: '12px 14px', borderRadius: 12,
            border: '1px solid var(--confirm-border)', background: 'var(--confirm-bg)', marginBottom: 14,
          }}>
            <div style={{ color: 'var(--confirm-text)', fontSize: 12, lineHeight: 1.6 }}>
              ✅ <b>Confirmation email</b> : ouvre le lien reçu, puis clique sur <b>"J'ai confirmé"</b> ci-dessous.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={handleResendConfirmation} disabled={authLoading} type="button" style={{
                flex: 1, padding: '10px 12px', borderRadius: 12,
                border: '1px solid var(--btn-secondary-border)', background: 'var(--btn-secondary-bg)',
                color: 'var(--btn-secondary-text)', cursor: authLoading ? 'not-allowed' : 'pointer', fontSize: 12,
              }}>
                Renvoyer l'email
              </button>
              <button onClick={async () => { setAuthMode('login'); await handleAuthSubmit() }}
                disabled={authLoading} type="button" style={{
                  flex: 1, padding: '10px 12px', borderRadius: 12,
                  border: '1px solid rgba(255,107,53,0.5)', background: 'rgba(255,107,53,0.12)',
                  color: '#FFB347', cursor: authLoading ? 'not-allowed' : 'pointer', fontSize: 12,
                }}>
                J'ai confirmé
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 'auto' }}>
          <PrimaryButton onClick={handleAuthSubmit} disabled={!canSubmitAuth || authLoading} isNarrow={isNarrow}>
            {authLoading ? '...' : authMode === 'register' ? 'Créer le compte' : 'Se connecter'}
          </PrimaryButton>
        </div>

        <div style={{ marginTop: 10 }}>
          <button onClick={handleForgotPassword} disabled={forgotLoading} type="button" style={{
            background: 'none', border: 'none', color: '#FF6B35', fontSize: 13,
            cursor: forgotLoading ? 'not-allowed' : 'pointer', padding: 8,
            fontFamily: "'DM Sans', sans-serif", width: '100%',
          }}>
            {forgotLoading ? 'Envoi...' : 'Mot de passe oublié ?'}
          </button>
          <button onClick={() => { setAuthMode(m => m === 'login' ? 'register' : 'login') }} type="button" style={{
            background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12,
            cursor: 'pointer', padding: 8, width: '100%',
          }}>
            {authMode === 'login' ? "Je n'ai pas de compte → Créer un compte" : "J'ai déjà un compte → Se connecter"}
          </button>
        </div>
      </StepContainer>
    </PhoneFrame>
  )
}
