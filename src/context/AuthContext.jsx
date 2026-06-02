import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
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

  const loadUser = useCallback(async () => {
    const token = getToken()

    if (!token) {
      setUser(null)
      setLoadingUser(false)
      setAuthChecked(true)
      return null
    }

    setLoadingUser(true)

    try {
      const data = await getCurrentUser()
      setUser(data)
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
  }, [])

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
      isAuthenticated: Boolean(user),
      loadUser,
      logout,
    }),
    [user, loadingUser, authChecked, loadUser, logout]
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