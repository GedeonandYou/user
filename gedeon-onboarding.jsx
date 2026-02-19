
const { useEffect, useMemo, useState } = React;

const INTERESTS = [
  { id: "sport", emoji: "⚽", label: "Sport" },
  { id: "musique", emoji: "🎵", label: "Musique & Concerts" },
  { id: "arts", emoji: "🎭", label: "Arts & Culture" },
  { id: "festivals", emoji: "🎪", label: "Festivals" },
  { id: "gastro", emoji: "🍷", label: "Gastronomie" },
  { id: "nature", emoji: "🌿", label: "Nature & Plein air" },
  { id: "business", emoji: "💼", label: "Business & Pro" },
  { id: "famille", emoji: "👨‍👩‍👧‍👦", label: "Famille & Kids" },
  { id: "bienetre", emoji: "🧘", label: "Bien-être" },
  { id: "tech", emoji: "🚀", label: "Tech & Innovation" },
  { id: "mode", emoji: "👗", label: "Mode & Design" },
  { id: "nightlife", emoji: "🌙", label: "Nightlife" },
  { id: "patrimoine", emoji: "🏛️", label: "Patrimoine" },
  { id: "cinema", emoji: "🎬", label: "Cinéma & Séries" },
  { id: "communaute", emoji: "🤝", label: "Communauté" },
  { id: "education", emoji: "📚", label: "Éducation" },
  { id: "religion", emoji: "🕊️", label: "Spiritualité" },
];

const MUSIC_GENRES = [
  "Pop", "Rock", "Hip-Hop", "Electro", "Jazz", "Classique",
  "World Music", "Metal", "R&B / Soul", "Reggae", "Afrobeat", "Variété"
];

const SPORTS_TYPES = [
  "Football", "Basketball", "Tennis", "Rugby", "Athlétisme", "Cyclisme",
  "Sports de combat", "Natation", "Sports extrêmes", "Esport", "Danse", "Autre"
];

function isValidEmail(email) {
  if (!email) return false;
  // simple & safe
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

async function apiFetch(path, options = {}) {
  const base = window.GEDEON_API_BASE || ""; // par défaut: même domaine
  const url = `${base}${path}`;
  const headers = Object.assign(
    { "Content-Type": "application/json" },
    options.headers || {}
  );

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // ignore parse errors
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      `Erreur HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

function GedeonOnboarding() {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  // AUTH
  const [authMode, setAuthMode] = useState("register"); // 'register' | 'login'
  const [email, setEmail] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authInfo, setAuthInfo] = useState("");
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotInfo, setForgotInfo] = useState("");

  // Onboarding profile
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profile, setProfile] = useState({
    interests: [],
    sportType: null,
    sportPrefs: [],
    musicGenres: [],
    companion: null,
    distance: null,
    budget: null,
    frequency: null,
    when: [],
    discovery: null,
    ambiance: null,
  });
  const [notifChoice, setNotifChoice] = useState(null);

  const [saving, setSaving] = useState(false);
  const totalSteps = 16; // 0..15 (le DONE est l'écran "else")

  const progressPercent = Math.min(100, (step / (totalSteps - 1)) * 100);

  const goNext = () => {
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setAnimating(false);
    }, 250);
  };

  const goBack = () => {
    if (step > 0) {
      setAnimating(true);
      setTimeout(() => {
        setStep((s) => s - 1);
        setAnimating(false);
      }, 250);
    }
  };

  // Auto-skip auth if already logged in
  useEffect(() => {
    (async () => {
      try {
        const chk = await apiFetch("/api/auth/check", { method: "GET" });
        if (chk && chk.logged_in) {
          // Si l'utilisateur est déjà connecté, on va directement à l'identité
          setStep(3);
        }
      } catch (e) {
        // si non dispo, ignore
      }
    })();
  }, []);

  const canProceedStep1 = useMemo(() => {
    return isValidEmail(email);
  }, [email]);

  const canSubmitAuth = useMemo(() => {
    if (!isValidEmail(email)) return false;
    if (!password || password.length < 4) return false;

    if (authMode === "register") {
      if (!pseudo || pseudo.trim().length < 2) return false;
      if (password2 !== password) return false;
    }
    return true;
  }, [authMode, email, password, password2, pseudo]);

  const toggleInterest = (id) => {
    setProfile((p) => ({
      ...p,
      interests: p.interests.includes(id)
        ? p.interests.filter((i) => i !== id)
        : p.interests.length < 5
          ? [...p.interests, id]
          : p.interests,
    }));
  };

  const toggleArrayItem = (field, item) => {
    setProfile((p) => ({
      ...p,
      [field]: p[field].includes(item)
        ? p[field].filter((i) => i !== item)
        : [...p[field], item],
    }));
  };

  async function handleAuthSubmit() {
    setAuthError("");
    setAuthInfo("");
    setForgotInfo("");
    setPendingConfirm(false);

    setAuthLoading(true);
    try {
      if (authMode === "register") {
        const data = await apiFetch("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            pseudo: pseudo.trim(),
            password,
          }),
        });

        setAuthInfo(data?.message || "Compte créé. Vérifie ton email pour confirmer.");
        setPendingConfirm(true);
        // rester sur step 2 et attendre confirmation
        return;
      }

      // login
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      setAuthInfo(data?.message || "Connexion réussie.");
      // aller à l'identité
      setStep(3);
    } catch (e) {
      const code = e?.payload?.code;
      if (code === "EMAIL_NOT_CONFIRMED") {
        setAuthError("Email non confirmé. Clique sur le lien reçu, puis réessaie.");
        setPendingConfirm(true);
      } else {
        setAuthError(e.message || "Erreur d'authentification.");
      }
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleResendConfirmation() {
    setAuthError("");
    setAuthInfo("");
    if (!isValidEmail(email)) {
      setAuthError("Entre un email valide d'abord.");
      return;
    }
    setAuthLoading(true);
    try {
      const data = await apiFetch("/api/auth/resend-confirmation", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setAuthInfo(data?.message || "Email de confirmation renvoyé.");
      setPendingConfirm(true);
    } catch (e) {
      setAuthError(e.message || "Impossible de renvoyer l'email.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleForgotPassword() {
    setForgotInfo("");
    setAuthError("");
    if (!isValidEmail(email)) {
      setAuthError("Entre ton email (valide) pour recevoir le lien.");
      return;
    }
    setForgotLoading(true);
    try {
      const data = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setForgotInfo(data?.message || "Si cet email existe, tu recevras un lien de réinitialisation.");
    } catch (e) {
      // backend renvoie souvent success même si email n'existe pas,
      // mais on gère quand même
      setForgotInfo("Si cet email existe, tu recevras un lien de réinitialisation.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function finalizeOnboardingAndGoNext() {
    setSaving(true);
    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      profile,
      notifChoice,
      savedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem("gedeon_onboarding", JSON.stringify(payload));
      localStorage.setItem("gedeon_onboarded", "true");

      // Optionnel: si un endpoint existe un jour, on essaie (sinon 404 => ignore)
      try {
        await apiFetch("/api/profile/onboarding", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } catch (e) {
        // ignore si non implémenté
      }

      goNext();
    } finally {
      setSaving(false);
    }
  }

  const PhoneFrame = ({ children }) => (
    <div style={{
      width: "100%",
      maxWidth: 420,
      margin: "20px auto",
      background: "#1a1a2e",
      borderRadius: 40,
      padding: "12px",
      boxShadow: "0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
      position: "relative",
    }}>
      <div style={{
        position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
        width: 120, height: 28, background: "#111", borderRadius: "0 0 16px 16px", zIndex: 10,
      }} />
      <div style={{
        background: "#0d0d1a",
        borderRadius: 30,
        minHeight: 720,
        maxHeight: 720,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}>
        {children}
      </div>
    </div>
  );

  const ProgressBar = () =>
    step > 0 && step < totalSteps - 1 ? (
      <div style={{
        padding: "48px 20px 8px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        {step > 0 && (
          <button onClick={goBack} style={{
            background: "none", border: "none", color: "#888", fontSize: 20, cursor: "pointer",
            padding: 4,
          }}>←</button>
        )}
        <div style={{
          flex: 1, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${progressPercent}%`,
            background: "linear-gradient(90deg, #FF6B35, #FFB347)",
            borderRadius: 2,
            transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }} />
        </div>
        <span style={{ color: "#555", fontSize: 11, fontFamily: "monospace", minWidth: 35 }}>
          {Math.round(progressPercent)}%
        </span>
      </div>
    ) : null;

  const StepContainer = ({ children, centered = false }) => (
    <div style={{
      flex: 1,
      padding: "16px 24px 24px",
      display: "flex",
      flexDirection: "column",
      justifyContent: centered ? "center" : "flex-start",
      opacity: animating ? 0 : 1,
      transform: animating ? "translateX(30px)" : "translateX(0)",
      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      overflowY: "auto",
    }}>
      {children}
    </div>
  );

  const Title = ({ children, sub }) => (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{
        color: "#fff", fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1.3,
        fontFamily: "'DM Sans', -apple-system, sans-serif",
      }}>{children}</h2>
      {sub && <p style={{ color: "#777", fontSize: 13, margin: "6px 0 0", lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );

  const PrimaryButton = ({ children, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%",
      padding: "15px 24px",
      background: disabled
        ? "rgba(255,255,255,0.06)"
        : "linear-gradient(135deg, #FF6B35, #E8530E)",
      color: disabled ? "#555" : "#fff",
      border: "none",
      borderRadius: 14,
      fontSize: 15,
      fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all 0.2s ease",
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      letterSpacing: 0.3,
    }}>
      {children}
    </button>
  );

  const Chip = ({ label, selected, onClick, emoji }) => (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "9px 14px",
      background: selected ? "rgba(255,107,53,0.15)" : "rgba(255,255,255,0.04)",
      border: selected ? "1.5px solid #FF6B35" : "1.5px solid rgba(255,255,255,0.08)",
      borderRadius: 20,
      color: selected ? "#FFB347" : "#aaa",
      fontSize: 13,
      cursor: "pointer",
      transition: "all 0.2s ease",
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      whiteSpace: "nowrap",
    }}>
      {emoji && <span style={{ fontSize: 15 }}>{emoji}</span>}
      {label}
    </button>
  );

  const OptionCard = ({ label, sub, selected, onClick, emoji, disabled }) => (
    <button onClick={disabled ? undefined : onClick} style={{
      width: "100%",
      padding: "14px 16px",
      background: selected ? "rgba(255,107,53,0.1)" : "rgba(255,255,255,0.03)",
      border: selected ? "1.5px solid #FF6B35" : "1.5px solid rgba(255,255,255,0.06)",
      borderRadius: 14,
      color: "#fff",
      cursor: disabled ? "not-allowed" : "pointer",
      display: "flex", alignItems: "center", gap: 12,
      transition: "all 0.2s ease",
      textAlign: "left",
      opacity: disabled ? 0.45 : 1,
    }}>
      {emoji && <span style={{ fontSize: 22 }}>{emoji}</span>}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{
        width: 20, height: 20, borderRadius: 10,
        border: selected ? "2px solid #FF6B35" : "2px solid #333",
        background: selected ? "#FF6B35" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s ease",
      }}>
        {selected && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
      </div>
    </button>
  );

  const Input = (props) => (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "14px 16px",
        background: "rgba(255,255,255,0.05)",
        border: "1.5px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        color: "#fff",
        fontSize: 15,
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "'DM Sans', sans-serif",
        ...(props.style || {})
      }}
    />
  );

  // STEP 0: Welcome
  if (step === 0) return (
    <PhoneFrame>
      <StepContainer centered>
        <div style={{ textAlign: "center", padding: "0 16px" }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24, margin: "0 auto 24px",
            background: "linear-gradient(135deg, #FF6B35, #FFB347)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, boxShadow: "0 8px 32px rgba(255,107,53,0.3)",
          }}>G</div>
          <h1 style={{
            color: "#fff", fontSize: 28, fontWeight: 700, margin: "0 0 8px",
            fontFamily: "'DM Sans', -apple-system, sans-serif",
          }}>GEDEON</h1>
          <p style={{ color: "#FF6B35", fontSize: 13, fontWeight: 500, letterSpacing: 2, margin: "0 0 24px", textTransform: "uppercase" }}>
            Global Event Directory
          </p>
          <p style={{ color: "#888", fontSize: 14, lineHeight: 1.6, margin: "0 0 40px" }}>
            Tous les événements du monde.{"\n"}Du concert au village jusqu'aux JO.
          </p>
          <PrimaryButton onClick={goNext}>Commencer →</PrimaryButton>
          <p style={{ color: "#555", fontSize: 11, marginTop: 16 }}>
            Inscription / connexion en 1 minute
          </p>
        </div>
      </StepContainer>
    </PhoneFrame>
  );

  // STEP 1: Auth (mode + email)
  if (step === 1) return (
    <PhoneFrame>
      <ProgressBar />
      <StepContainer>
        <Title sub="Ton compte GEDEON est sécurisé par email + mot de passe.">
          Connexion / inscription
        </Title>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          <OptionCard
            emoji="✨"
            label="Créer un compte"
            sub="Nouveau sur GEDEON"
            selected={authMode === "register"}
            onClick={() => setAuthMode("register")}
          />
          <OptionCard
            emoji="🔑"
            label="Se connecter"
            sub="J'ai déjà un compte"
            selected={authMode === "login"}
            onClick={() => setAuthMode("login")}
          />
          <OptionCard
            emoji="📱"
            label="Par SMS (bientôt)"
            sub="Non disponible dans le backend actuel"
            selected={false}
            disabled={true}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <Input
            type="email"
            placeholder="ton@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {!isValidEmail(email) && email.length > 0 && (
            <p style={{ color: "#FFB347", fontSize: 12, marginTop: 8 }}>
              Email invalide
            </p>
          )}
        </div>

        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={goNext} disabled={!canProceedStep1}>
            Continuer →
          </PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  );

  // STEP 2: Auth details (password + pseudo if register)
  if (step === 2) return (
    <PhoneFrame>
      <ProgressBar />
      <StepContainer>
        <Title sub={authMode === "register" ? "Crée ton compte, puis confirme par lien email." : "Entre ton mot de passe pour te connecter."}>
          {authMode === "register" ? "Créer ton compte" : "Se connecter"}
        </Title>

        {authMode === "register" && (
          <div style={{ marginBottom: 12 }}>
            <Input
              placeholder="Pseudo (ex: marie_lorio)"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
            />
            <p style={{ color: "#555", fontSize: 11, marginTop: 8 }}>
              2 caractères min • lettres/chiffres/_/- acceptés
            </p>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div style={{ position: "relative" }}>
            <Input
              type={showPwd ? "text" : "password"}
              placeholder="Mot de passe (min 4 caractères)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: 48 }}
            />
            <button
              onClick={() => setShowPwd((s) => !s)}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#777",
                cursor: "pointer",
                padding: 6,
                fontSize: 12,
              }}
              type="button"
            >
              {showPwd ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {authMode === "register" && (
          <div style={{ marginBottom: 12 }}>
            <Input
              type={showPwd ? "text" : "password"}
              placeholder="Confirme le mot de passe"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
            />
            {password2.length > 0 && password2 !== password && (
              <p style={{ color: "#FFB347", fontSize: 12, marginTop: 8 }}>
                Les mots de passe ne correspondent pas
              </p>
            )}
          </div>
        )}

        {(authError || authInfo || forgotInfo) && (
          <div style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            background: authError
              ? "rgba(255,80,80,0.08)"
              : "rgba(255,255,255,0.03)",
            marginBottom: 14
          }}>
            {authError && (
              <div style={{ color: "#ff8a8a", fontSize: 13, lineHeight: 1.5 }}>
                {authError}
              </div>
            )}
            {authInfo && (
              <div style={{ color: "#bbb", fontSize: 13, lineHeight: 1.5 }}>
                {authInfo}
              </div>
            )}
            {forgotInfo && (
              <div style={{ color: "#bbb", fontSize: 13, lineHeight: 1.5, marginTop: authError || authInfo ? 10 : 0 }}>
                {forgotInfo}
              </div>
            )}
          </div>
        )}

        {pendingConfirm && (
          <div style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,107,53,0.25)",
            background: "rgba(255,107,53,0.06)",
            marginBottom: 14
          }}>
            <div style={{ color: "#ddd", fontSize: 12, lineHeight: 1.6 }}>
              ✅ <b>Confirmation email</b> : ouvre le lien reçu, puis clique sur <b>“J’ai confirmé”</b> ci-dessous.
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button
                onClick={handleResendConfirmation}
                disabled={authLoading}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#bbb",
                  cursor: authLoading ? "not-allowed" : "pointer",
                  fontSize: 12,
                }}
                type="button"
              >
                Renvoyer l'email
              </button>
              <button
                onClick={async () => {
                  // tente un login : si confirmé => OK
                  setAuthMode("login");
                  await handleAuthSubmit();
                }}
                disabled={authLoading}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,107,53,0.5)",
                  background: "rgba(255,107,53,0.12)",
                  color: "#FFB347",
                  cursor: authLoading ? "not-allowed" : "pointer",
                  fontSize: 12,
                }}
                type="button"
              >
                J'ai confirmé
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
          <PrimaryButton
            onClick={handleAuthSubmit}
            disabled={!canSubmitAuth || authLoading}
          >
            {authLoading
              ? "..."
              : authMode === "register"
                ? "Créer le compte"
                : "Se connecter"}
          </PrimaryButton>
        </div>

        <div style={{ marginTop: 10 }}>
          <button
            onClick={handleForgotPassword}
            disabled={forgotLoading}
            style={{
              background: "none",
              border: "none",
              color: "#FF6B35",
              fontSize: 13,
              cursor: forgotLoading ? "not-allowed" : "pointer",
              padding: 8,
              fontFamily: "'DM Sans', sans-serif",
              width: "100%",
            }}
            type="button"
          >
            {forgotLoading ? "Envoi..." : "Mot de passe oublié ?"}
          </button>

          <button
            onClick={() => {
              setAuthError("");
              setAuthInfo("");
              setForgotInfo("");
              setPendingConfirm(false);
              setAuthMode((m) => (m === "login" ? "register" : "login"));
            }}
            style={{
              background: "none",
              border: "none",
              color: "#555",
              fontSize: 12,
              cursor: "pointer",
              padding: 8,
              width: "100%",
            }}
            type="button"
          >
            {authMode === "login"
              ? "Je n'ai pas de compte → Créer un compte"
              : "J'ai déjà un compte → Se connecter"}
          </button>
        </div>
      </StepContainer>
    </PhoneFrame>
  );

  // STEP 3: Identity
  if (step === 3) return (
    <PhoneFrame>
      <ProgressBar />
      <StepContainer>
        <Title sub="Ces infos restent privées.">
          Comment tu t'appelles ?
        </Title>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <Input placeholder="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Input placeholder="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 8,
          padding: "12px 14px", background: "rgba(255,107,53,0.06)",
          borderRadius: 10, marginBottom: 20,
        }}>
          <span style={{ fontSize: 16 }}>🔒</span>
          <p style={{ color: "#999", fontSize: 11, lineHeight: 1.5, margin: 0 }}>
            Ton identité n'est jamais partagée publiquement. Elle sert uniquement à la billetterie et aux réservations via nos partenaires.
          </p>
        </div>
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={goNext} disabled={!firstName || !lastName}>
            Continuer
          </PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  );

  // STEP 4: Intro to questions
  if (step === 4) return (
    <PhoneFrame>
      <ProgressBar />
      <StepContainer centered>
        <div style={{ textAlign: "center", padding: "0 12px" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🎯</div>
          <h2 style={{
            color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 12px",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Te connaître en 10 questions
          </h2>
          <p style={{ color: "#888", fontSize: 14, lineHeight: 1.6, margin: "0 0 8px" }}>
            Pour trouver les bons plans près de chez toi, t'alerter au bon moment, et ne jamais rater ce qui compte pour toi.
          </p>
          <p style={{ color: "#555", fontSize: 12, margin: "0 0 36px" }}>
            ≈ 1 minute • Tu peux modifier à tout moment
          </p>
          <PrimaryButton onClick={goNext}>C'est parti !</PrimaryButton>
          <button onClick={() => setStep(totalSteps - 2)} style={{
            display: "block", width: "100%", marginTop: 12,
            background: "none", border: "none", color: "#555",
            fontSize: 13, cursor: "pointer", padding: 8,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Passer pour l'instant
          </button>
        </div>
      </StepContainer>
    </PhoneFrame>
  );

  // Q1 (Step 5): Centres d'intérêt
  if (step === 5) return (
    <PhoneFrame>
      <ProgressBar />
      <StepContainer>
        <Title sub="Choisis 3 à 5 thèmes qui te parlent">
          ① Tes passions
        </Title>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {INTERESTS.map((i) => (
            <Chip key={i.id} emoji={i.emoji} label={i.label}
              selected={profile.interests.includes(i.id)}
              onClick={() => toggleInterest(i.id)}
            />
          ))}
        </div>
        <p style={{ color: "#555", fontSize: 11, textAlign: "center", margin: "4px 0 12px" }}>
          {profile.interests.length}/5 sélectionnés
        </p>
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={goNext} disabled={profile.interests.length < 3}>
            Suivant
          </PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  );

  // Q2 (Step 6): Sport rapport
  if (step === 6) return (
    <PhoneFrame>
      <ProgressBar />
      <StepContainer>
        <Title sub="Ça nous aide à calibrer tes recommandations">
          ② Le sport, pour toi c'est...
        </Title>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {[
            { id: "spectateur", emoji: "📺", label: "Spectateur", sub: "J'aime regarder, supporter" },
            { id: "pratiquant", emoji: "🏃", label: "Pratiquant", sub: "Je participe, je cours, je joue" },
            { id: "les-deux", emoji: "⚡", label: "Les deux !", sub: "Spectateur ET pratiquant" },
            { id: "bof", emoji: "😴", label: "Pas trop mon truc", sub: "On passe au suivant" },
          ].map((opt) => (
            <OptionCard key={opt.id} {...opt}
              selected={profile.sportType === opt.id}
              onClick={() => setProfile((p) => ({ ...p, sportType: opt.id }))}
            />
          ))}
        </div>
        {profile.sportType && profile.sportType !== "bof" && (
          <>
            <p style={{ color: "#777", fontSize: 12, margin: "8px 0" }}>Sports préférés (optionnel) :</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {SPORTS_TYPES.map((s) => (
                <Chip key={s} label={s}
                  selected={profile.sportPrefs.includes(s)}
                  onClick={() => toggleArrayItem("sportPrefs", s)}
                />
              ))}
            </div>
          </>
        )}
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={goNext} disabled={!profile.sportType}>Suivant</PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  );

  // Q3 (Step 7): Musique
  if (step === 7) return (
    <PhoneFrame>
      <ProgressBar />
      <StepContainer>
        <Title sub="Sélectionne autant de genres que tu veux">
          ③ Quels sons te font vibrer ?
        </Title>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {MUSIC_GENRES.map((g) => (
            <Chip key={g} label={g}
              selected={profile.musicGenres.includes(g)}
              onClick={() => toggleArrayItem("musicGenres", g)}
            />
          ))}
        </div>
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={goNext} disabled={profile.musicGenres.length === 0}>
            Suivant
          </PrimaryButton>
          <button onClick={goNext} style={{
            display: "block", width: "100%", marginTop: 8,
            background: "none", border: "none", color: "#555",
            fontSize: 12, cursor: "pointer", padding: 8,
          }}>Pas de préférence</button>
        </div>
      </StepContainer>
    </PhoneFrame>
  );

  // Q4 (Step 8): Companion
  if (step === 8) return (
    <PhoneFrame>
      <ProgressBar />
      <StepContainer>
        <Title sub="On adapte les suggestions en conséquence">
          ④ Tu sors plutôt...
        </Title>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { id: "solo", emoji: "🧑", label: "En solo", sub: "J'aime découvrir seul(e)" },
            { id: "couple", emoji: "💑", label: "En couple", sub: "Sorties à deux" },
            { id: "famille", emoji: "👨‍👩‍👧", label: "En famille", sub: "Avec les enfants" },
            { id: "amis", emoji: "👯", label: "Entre amis", sub: "La bande, toujours" },
            { id: "depends", emoji: "🔄", label: "Ça dépend", sub: "Un peu de tout" },
          ].map((opt) => (
            <OptionCard key={opt.id} {...opt}
              selected={profile.companion === opt.id}
              onClick={() => setProfile((p) => ({ ...p, companion: opt.id }))}
            />
          ))}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 12 }}>
          <PrimaryButton onClick={goNext} disabled={!profile.companion}>Suivant</PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  );

  // Q5 (Step 9): Distance
  if (step === 9) return (
    <PhoneFrame>
      <ProgressBar />
      <StepContainer>
        <Title sub="Rayon de recherche par défaut (modifiable)">
          ⑤ Jusqu'où tu irais ?
        </Title>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { id: "5km", emoji: "📍", label: "Mon quartier", sub: "Moins de 5 km" },
            { id: "20km", emoji: "🏙️", label: "Ma ville", sub: "Moins de 20 km" },
            { id: "100km", emoji: "🚗", label: "Ma région", sub: "Jusqu'à 100 km" },
            { id: "national", emoji: "🗺️", label: "Partout dans le pays", sub: "Si ça vaut le déplacement" },
            { id: "international", emoji: "✈️", label: "Sans frontières !", sub: "Le monde est mon terrain de jeu" },
          ].map((opt) => (
            <OptionCard key={opt.id} {...opt}
              selected={profile.distance === opt.id}
              onClick={() => setProfile((p) => ({ ...p, distance: opt.id }))}
            />
          ))}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 12 }}>
          <PrimaryButton onClick={goNext} disabled={!profile.distance}>Suivant</PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  );

  // Q6 (Step 10): Budget
  if (step === 10) return (
    <PhoneFrame>
      <ProgressBar />
      <StepContainer>
        <Title sub="Pour te proposer des événements dans tes moyens">
          ⑥ Budget sorties
        </Title>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { id: "free", emoji: "🆓", label: "Gratuit c'est bien", sub: "Priorité aux événements gratuits" },
            { id: "30", emoji: "💰", label: "Jusqu'à 30€", sub: "Raisonnable" },
            { id: "100", emoji: "💳", label: "Jusqu'à 100€", sub: "Pour les bonnes occasions" },
            { id: "nolimit", emoji: "✨", label: "Le prix n'est pas un frein", sub: "Si c'est bien, j'y vais" },
          ].map((opt) => (
            <OptionCard key={opt.id} {...opt}
              selected={profile.budget === opt.id}
              onClick={() => setProfile((p) => ({ ...p, budget: opt.id }))}
            />
          ))}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 12 }}>
          <PrimaryButton onClick={goNext} disabled={!profile.budget}>Suivant</PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  );

  // Q7 (Step 11): Frequency
  if (step === 11) return (
    <PhoneFrame>
      <ProgressBar />
      <StepContainer>
        <Title sub="Pour calibrer le volume de suggestions">
          ⑦ Tu sors à quelle fréquence ?
        </Title>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { id: "rare", emoji: "🌙", label: "1-2 fois par mois", sub: "Quand ça me dit" },
            { id: "weekly", emoji: "📅", label: "Chaque semaine", sub: "C'est un rituel" },
            { id: "multi", emoji: "🔥", label: "Plusieurs fois par semaine", sub: "Je ne tiens pas en place" },
            { id: "spontaneous", emoji: "🎲", label: "Quand l'envie me prend", sub: "Pas de planning" },
          ].map((opt) => (
            <OptionCard key={opt.id} {...opt}
              selected={profile.frequency === opt.id}
              onClick={() => setProfile((p) => ({ ...p, frequency: opt.id }))}
            />
          ))}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 12 }}>
          <PrimaryButton onClick={goNext} disabled={!profile.frequency}>Suivant</PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  );

  // Q8 (Step 12): When
  if (step === 12) return (
    <PhoneFrame>
      <ProgressBar />
      <StepContainer>
        <Title sub="Plusieurs choix possibles">
          ⑧ C'est quand pour toi ?
        </Title>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { id: "semaine", emoji: "🏢", label: "En semaine", sub: "Lunch, afterwork..." },
            { id: "weekend", emoji: "🌅", label: "Le weekend", sub: "Samedi, dimanche" },
            { id: "soir", emoji: "🌃", label: "En soirée", sub: "Après 19h" },
            { id: "vacances", emoji: "🏖️", label: "Vacances / jours fériés", sub: "Quand j'ai du temps" },
            { id: "anytime", emoji: "⏰", label: "Tout le temps !", sub: "Je suis toujours dispo" },
          ].map((opt) => (
            <OptionCard key={opt.id} {...opt}
              selected={profile.when.includes(opt.id)}
              onClick={() => toggleArrayItem("when", opt.id)}
            />
          ))}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 12 }}>
          <PrimaryButton onClick={goNext} disabled={profile.when.length === 0}>Suivant</PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  );

  // Q9 (Step 13): Discovery vs routine
  if (step === 13) return (
    <PhoneFrame>
      <ProgressBar />
      <StepContainer>
        <Title sub="On calibre la dose de surprise">
          ⑨ Ton style de sortie
        </Title>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { id: "discover", emoji: "🧭", label: "Explorateur", sub: "Surprends-moi ! Nouveautés, découvertes" },
            { id: "routine", emoji: "❤️", label: "Fidèle", sub: "Mes artistes, mes équipes, mes lieux" },
            { id: "both", emoji: "⚖️", label: "Les deux", sub: "Un mix de nouveauté et de valeurs sûres" },
          ].map((opt) => (
            <OptionCard key={opt.id} {...opt}
              selected={profile.discovery === opt.id}
              onClick={() => setProfile((p) => ({ ...p, discovery: opt.id }))}
            />
          ))}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 12 }}>
          <PrimaryButton onClick={goNext} disabled={!profile.discovery}>Suivant</PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  );

  // Q10 (Step 14): Ambiance
  if (step === 14) return (
    <PhoneFrame>
      <ProgressBar />
      <StepContainer>
        <Title sub="Dernière question !">
          ⑩ L'ambiance idéale
        </Title>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { id: "big", emoji: "🏟️", label: "En grand", sub: "Stades, festivals, concerts géants" },
            { id: "intimate", emoji: "🎪", label: "Intimiste", sub: "Petites jauges, ambiance cosy" },
            { id: "both", emoji: "🎭", label: "Les deux me vont", sub: "Ça dépend du moment" },
          ].map((opt) => (
            <OptionCard key={opt.id} {...opt}
              selected={profile.ambiance === opt.id}
              onClick={() => setProfile((p) => ({ ...p, ambiance: opt.id }))}
            />
          ))}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 12 }}>
          <PrimaryButton onClick={goNext} disabled={!profile.ambiance}>
            Terminer →
          </PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  );

  // STEP 15: Notifications (save here)
  if (step === 15) return (
    <PhoneFrame>
      <ProgressBar />
      <StepContainer centered>
        <div style={{ textAlign: "center", padding: "0 12px" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🔔</div>
          <h2 style={{
            color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 12px",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Notifications
          </h2>
          <p style={{ color: "#888", fontSize: 14, lineHeight: 1.6, margin: "0 0 32px" }}>
            Pas obligatoire, mais conseillé pour ne pas rater un événement près de chez toi !
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            <OptionCard emoji="✅" label="Oui, m'alerter" sub="Événements majeurs + mes favoris uniquement"
              selected={notifChoice === true} onClick={() => setNotifChoice(true)} />
            <OptionCard emoji="⏳" label="Plus tard" sub="Tu pourras activer dans les réglages"
              selected={notifChoice === false} onClick={() => setNotifChoice(false)} />
          </div>
          <PrimaryButton
            onClick={finalizeOnboardingAndGoNext}
            disabled={notifChoice === null || saving}
          >
            {saving ? "Enregistrement..." : "Finaliser"}
          </PrimaryButton>
        </div>
      </StepContainer>
    </PhoneFrame>
  );

  // DONE SCREEN
  return (
    <PhoneFrame>
      <StepContainer centered>
        <div style={{ textAlign: "center", padding: "0 12px" }}>
          <div style={{
            width: 100, height: 100, borderRadius: 50, margin: "0 auto 24px",
            background: "linear-gradient(135deg, #FF6B35, #FFB347)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 42, boxShadow: "0 12px 40px rgba(255,107,53,0.35)",
          }}>🎉</div>
          <h2 style={{
            color: "#fff", fontSize: 24, fontWeight: 700, margin: "0 0 8px",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Bienvenue{firstName ? ` ${firstName}` : ""} !
          </h2>
          <p style={{ color: "#888", fontSize: 14, lineHeight: 1.6, margin: "0 0 32px" }}>
            Ton profil est prêt. GEDEON va maintenant te proposer des événements sur mesure.
          </p>

          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: "16px", marginBottom: 24, textAlign: "left",
          }}>
            <p style={{ color: "#777", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px" }}>
              Ton profil
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {profile.interests.map((id) => {
                const interest = INTERESTS.find((i) => i.id === id);
                return interest ? (
                  <span key={id} style={{
                    padding: "4px 10px", background: "rgba(255,107,53,0.12)",
                    borderRadius: 12, color: "#FFB347", fontSize: 12,
                  }}>
                    {interest.emoji} {interest.label}
                  </span>
                ) : null;
              })}
            </div>
          </div>

          <PrimaryButton onClick={() => (window.location.href = "/")}>
            Explorer GEDEON →
          </PrimaryButton>

          <button
            onClick={() => setStep(0)}
            style={{
              marginTop: 10,
              background: "none",
              border: "none",
              color: "#555",
              fontSize: 12,
              cursor: "pointer",
              padding: 8,
              width: "100%",
            }}
            type="button"
          >
            Refaire l'onboarding
          </button>
        </div>
      </StepContainer>
    </PhoneFrame>
  );
}

// Mount
(function mount() {
  const el = document.getElementById("root");
  if (!el) return;
  const root = ReactDOM.createRoot(el);
  root.render(<GedeonOnboarding />);
})();
