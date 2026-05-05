const API_URL = import.meta.env.VITE_API_URL

export function getToken() {
  return localStorage.getItem('forgeflow:token')
}

export function saveAuthToken(token) {
  localStorage.setItem('forgeflow:token', token)
}

export function isLoggedIn() {
  return Boolean(getToken())
}

export function logout() {
  localStorage.removeItem('forgeflow:token')
  window.location.href = '/login'
}

export async function apiFetch(path, options = {}) {
  const token = getToken()

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.message || 'Erro na API')
  }

  return response.json()
}

export async function getCurrentUser() {
  return apiFetch('/me')
}