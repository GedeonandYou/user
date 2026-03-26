const API_BASE = window.GEDEON_API_BASE || ''

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`
  const headers = { 'Content-Type': 'application/json', ...options.headers }

  const res = await fetch(url, { ...options, headers, credentials: 'include' })

  let data = null
  try { data = await res.json() } catch (_) { /* ignore */ }

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `Erreur HTTP ${res.status}`
    const err = new Error(msg)
    err.status = res.status
    err.payload = data
    throw err
  }
  return data
}

export const api = {
  checkSession: () => apiFetch('/api/auth/check', { method: 'GET' }),

  register: (email, pseudo, password) =>
    apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, pseudo, password }),
    }),

  login: (email, password) =>
    apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  resendConfirmation: (email) =>
    apiFetch('/api/auth/resend-confirmation', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  forgotPassword: (email) =>
    apiFetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  saveOnboarding: (payload) =>
    apiFetch('/api/profile/onboarding', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
