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

export async function apiDownload(path, filename) {
  const token = getToken()

  const response = await fetch(`${API_URL}${path}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    let message = 'Erro ao baixar arquivo.'

    try {
      const data = await response.json()
      message = data?.message || message
    } catch {
      // A resposta pode não ser JSON.
    }

    throw new Error(message)
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()

  window.URL.revokeObjectURL(url)
}

export async function getCurrentUser() {
  return apiFetch('/me')
}
