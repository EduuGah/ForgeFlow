import { isLocalWebRuntime } from '../utils/platformUtils'

export const PRODUCTION_API_URL = 'https://forgeflow-citr.onrender.com'
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV || isLocalWebRuntime() ? 'http://localhost:3001' : PRODUCTION_API_URL)
).replace(/\/$/, '')

const TOKEN_KEY = 'forgeflow:token'
const DEFAULT_TIMEOUT_MS = 20000

let cachedCsrfToken = ''

function shouldAttachCsrf(method = 'GET') {
  return !['GET', 'HEAD', 'OPTIONS'].includes(String(method || 'GET').toUpperCase())
}

function createTimeoutSignal(timeoutMs = DEFAULT_TIMEOUT_MS, externalSignal) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => {
    controller.abort(new DOMException('Tempo limite da requisição excedido.', 'TimeoutError'))
  }, timeoutMs)

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason)
    } else {
      externalSignal.addEventListener(
        'abort',
        () => controller.abort(externalSignal.reason),
        { once: true }
      )
    }
  }

  return {
    signal: controller.signal,
    clear: () => window.clearTimeout(timeout),
  }
}

async function fetchWithTimeout(url, options = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...fetchOptions } = options
  const timeoutSignal = createTimeoutSignal(timeoutMs, signal)

  try {
    return await fetch(url, {
      ...fetchOptions,
      signal: timeoutSignal.signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError' || error?.name === 'TimeoutError') {
      throw new Error('Servidor demorou para responder. Tente novamente em alguns segundos.', { cause: error })
    }

    throw error
  } finally {
    timeoutSignal.clear()
  }
}

async function ensureCsrfToken() {
  if (cachedCsrfToken) return cachedCsrfToken

  const response = await fetchWithTimeout(`${API_BASE_URL}/auth/csrf`, {
    method: 'GET',
    credentials: 'include',
    timeoutMs: 15000,
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
  const method = options.method || 'GET'
  const csrfToken = shouldAttachCsrf(method) ? await ensureCsrfToken() : ''

  async function makeRequest(nextCsrfToken = csrfToken) {
    return fetchWithTimeout(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(nextCsrfToken ? { 'X-CSRF-Token': nextCsrfToken } : {}),
        ...(options.headers || {}),
      },
    })
  }

  let response = await makeRequest()
  let data = await response.json().catch(() => null)

  if (!response.ok && data?.reason === 'csrf_failed') {
    cachedCsrfToken = ''
    const freshCsrfToken = await ensureCsrfToken()
    response = await makeRequest(freshCsrfToken)
    data = await response.json().catch(() => null)
  }

  if (!response.ok) {
    const error = new Error(data?.message || 'Erro na requisição.')
    error.status = response.status
    error.data = data
    throw error
  }

  if (data?.csrfToken) {
    setCsrfToken(data.csrfToken)
  }

  return data
}

export async function apiDownload(path, filename, options = {}) {
  const token = getToken()

  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    method: 'GET',
    credentials: 'include',
    timeoutMs: 30000,
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
  const method = options.method || 'POST'
  const csrfToken = shouldAttachCsrf(method) ? await ensureCsrfToken() : ''

  async function makeRequest(nextCsrfToken = csrfToken) {
    return fetchWithTimeout(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      timeoutMs: options.timeoutMs || 45000,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(nextCsrfToken ? { 'X-CSRF-Token': nextCsrfToken } : {}),
        ...(options.headers || {}),
      },
      body: formData,
    })
  }

  let response = await makeRequest()
  let data = await response.json().catch(() => null)

  if (!response.ok && data?.reason === 'csrf_failed') {
    cachedCsrfToken = ''
    const freshCsrfToken = await ensureCsrfToken()
    response = await makeRequest(freshCsrfToken)
    data = await response.json().catch(() => null)
  }

  if (!response.ok) {
    const error = new Error(data?.message || 'Erro na requisição.')
    error.status = response.status
    error.data = data
    throw error
  }

  if (data?.csrfToken) {
    setCsrfToken(data.csrfToken)
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
