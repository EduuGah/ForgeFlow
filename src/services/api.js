const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '')

export function getAuthToken() {
  return localStorage.getItem('forgeflow:token')
}

export function saveAuthToken(token) {
  localStorage.setItem('forgeflow:token', token)
}

export function removeAuthToken() {
  localStorage.removeItem('forgeflow:token')
}

export async function apiFetch(path, options = {}) {
  const token = getAuthToken()

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || 'Erro na requisição.')
  }

  return data
}

export async function getCurrentUser() {
  return apiFetch('/me')
}