import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch, getToken, logout as logoutService, logoutFromApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)

  async function loadUser() {
    try {
      const data = await apiFetch('/me')
      setUser(data)
    } catch {
      localStorage.removeItem('forgeflow:token')
      setUser(null)
    } finally {
      setLoadingUser(false)
    }
  }

  async function logout() {
    setUser(null)
    await logoutFromApi()
    logoutService()
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
    [user, loadingUser]
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