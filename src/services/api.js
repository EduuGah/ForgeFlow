const API_URL = import.meta.env.VITE_API_URL

const TOKEN_KEY = 'forgeflow:token'

let cachedCsrfToken = ''

function shouldAttachCsrf(method = 'GET') {
  return !['GET', 'HEAD', 'OPTIONS'].includes(String(method || 'GET').toUpperCase())
}

async function ensureCsrfToken() {
  if (cachedCsrfToken) return cachedCsrfToken

  const response = await fetch(`${API_URL}/auth/csrf`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    return ''
  }

  cachedCsrfToken = data?.csrfToken || ''
  return cachedCsrfToken
}

export function setCsrfToken(token) {
  cachedCsrfToken = token || cachedCsrfToken
}

export function clearLegacyAuthToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function saveAuthToken(token) {
  if (!token) {
    clearLegacyAuthToken()
    return
  }

  localStorage.setItem(TOKEN_KEY, token)
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function apiFetch(path, options = {}) {
  const token = getToken()
  const csrfToken = shouldAttachCsrf(options.method || 'GET')
    ? await ensureCsrfToken()
    : ''

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...(options.headers || {}),
    },
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(data?.message || 'Erro na requisição.')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export async function apiDownload(path, filename, options = {}) {
  const token = getToken()

  const response = await fetch(`${API_URL}${path}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.password ? { 'X-ForgeFlow-Password': options.password } : {}),
      ...(options.headers || {}),
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


export async function apiFormData(path, formData, options = {}) {
  const token = getToken()
  const csrfToken = shouldAttachCsrf(options.method || 'POST')
    ? await ensureCsrfToken()
    : ''

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || 'POST',
    credentials: 'include',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...(options.headers || {}),
    },
    body: formData,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || 'Erro na requisição.')
  }

  return data
}

export async function getCurrentUser() {
  const data = await apiFetch('/auth/session')
  setCsrfToken(data?.csrfToken)
  return data
}


export async function logoutFromApi() {
  try {
    await apiFetch('/auth/logout', {
      method: 'POST',
    })
  } catch {
    // fallback local continua sendo executado no AuthContext
  }
}
