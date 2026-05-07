const API_URL = import.meta.env.VITE_API_URL

const TOKEN_KEY = 'forgeflow:token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function saveAuthToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function apiFetch(path, options = {}) {
  const token = getToken()

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