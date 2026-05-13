import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logout as logoutService, logoutFromApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)

  async function loadUser() {
    try {
      const data = await getCurrentUser()
      setUser(data)
    } catch {
      setUser(null)
    } finally {
      setLoadingUser(false)
    }
  }

  function logout({ redirect = true } = {}) {
    setUser(null)
    setLoadingUser(false)
    logoutService()

    if (redirect) {
      navigate('/login', { replace: true })
    }

    logoutFromApi().catch((error) => {
      console.warn('[ForgeFlow] Não foi possível limpar sessão remota:', error)
    })
  }

  useEffect(() => {
    loadUser()
  }, [])

  const value = useMemo(
    () => ({
      user,
      setUser,
      loadingUser,
      isAuthenticated: Boolean(user),
      loadUser,
      logout,
    }),
    [user, loadingUser, navigate]
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