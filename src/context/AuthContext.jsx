import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  apiFetch,
  getCurrentUser,
  getToken,
  logout as logoutService,
  logoutFromApi,
} from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [authWarmupProgress, setAuthWarmupProgress] = useState(8)
  const [authWarmupStatus, setAuthWarmupStatus] = useState('Carregando sessao...')

  const warmupAuthServer = useCallback(async () => {
    let progress = 8
    let attempt = 0
    let mounted = true

    setAuthWarmupProgress(progress)
    setAuthWarmupStatus('Carregando sessao...')

    const intervalId = window.setInterval(() => {
      if (!mounted) return

      progress = Math.min(96, progress + (progress < 64 ? 2 : 1))
      setAuthWarmupProgress(progress)

      if (progress > 82) {
        setAuthWarmupStatus('Preparando login seguro...')
      } else if (progress > 52) {
        setAuthWarmupStatus('Conectando ao servidor...')
      }
    }, 320)

    try {
      while (mounted) {
        try {
          await apiFetch('/auth/csrf')
          setAuthWarmupStatus('Sessao pronta')
          setAuthWarmupProgress(100)
          return true
        } catch {
          attempt += 1
          setAuthWarmupStatus(attempt > 1 ? 'Acordando servidor...' : 'Conectando ao servidor...')
          await new Promise((resolve) => window.setTimeout(resolve, 900))
        }
      }

      return false
    } finally {
      mounted = false
      window.clearInterval(intervalId)
    }
  }, [])

  const loadUser = useCallback(async () => {
    const token = getToken()

    if (!token) {
      await warmupAuthServer()
      setUser(null)
      setLoadingUser(false)
      setAuthChecked(true)
      return null
    }

    setLoadingUser(true)
    setAuthWarmupProgress((current) => Math.max(current, 18))
    setAuthWarmupStatus('Carregando sessao...')

    try {
      const data = await getCurrentUser()
      setUser(data)
      setAuthWarmupProgress(100)
      setAuthWarmupStatus('Sessao pronta')
      return data
    } catch (error) {
      console.warn('[ForgeFlow] Sessão inválida ou indisponível:', error)

      if (error?.status === 401 || error?.status === 403) {
        logoutService()
      }

      setUser(null)
      return null
    } finally {
      setLoadingUser(false)
      setAuthChecked(true)
    }
  }, [warmupAuthServer])

  const logout = useCallback(({ redirect = true } = {}) => {
    setUser(null)
    setLoadingUser(false)
    setAuthChecked(true)
    logoutService()

    if (redirect) {
      navigate('/login', { replace: true })
    }

    logoutFromApi().catch((error) => {
      console.warn('[ForgeFlow] Não foi possível limpar sessão remota:', error)
    })
  }, [navigate])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const value = useMemo(
    () => ({
      user,
      setUser,
      loadingUser,
      authChecked,
      authWarmupProgress,
      authWarmupStatus,
      isAuthenticated: Boolean(user),
      loadUser,
      logout,
    }),
    [user, loadingUser, authChecked, authWarmupProgress, authWarmupStatus, loadUser, logout]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth precisa estar dentro de AuthProvider')
  }

  return context
}
