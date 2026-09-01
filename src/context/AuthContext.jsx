import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getCurrentUser,
  getToken,
  logout as logoutService,
  logoutFromApi,
  warmUpApi,
} from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUserState] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [authWarmupProgress, setAuthWarmupProgress] = useState(10)
  const [authWarmupStatus, setAuthWarmupStatus] = useState('Carregando sessão...')

  // Toda escrita explícita de usuário (login, cadastro, callback do Google)
  // invalida qualquer verificação de sessão que ainda esteja em voo. Sem isso,
  // uma resposta lenta de /auth/session sobrescreve o usuário recém-autenticado
  // com null e devolve a pessoa para a tela de login já estando logada.
  const sessionRequestIdRef = useRef(0)

  const setUser = useCallback((nextUser) => {
    sessionRequestIdRef.current += 1
    setUserState(nextUser)
    setLoadingUser(false)
    setAuthChecked(true)
  }, [])

  const loadUser = useCallback(async () => {
    const requestId = (sessionRequestIdRef.current += 1)
    const isStale = () => sessionRequestIdRef.current !== requestId

    // Sem token não há sessão para validar: liberamos a navegação na hora para
    // que a tela de login apareça mesmo com a API fora do ar ou hibernando.
    if (!getToken()) {
      if (!isStale()) setUserState(null)
      setLoadingUser(false)
      setAuthChecked(true)
      warmUpApi()
      return null
    }

    setLoadingUser(true)

    try {
      const data = await getCurrentUser()

      if (!isStale()) setUserState(data)

      return data
    } catch (error) {
      // 401/403 significam sessão realmente inválida: limpamos o token local.
      // Falha de rede não desloga ninguém, só mantém a sessão não confirmada.
      if (error?.status === 401 || error?.status === 403) {
        logoutService()
      } else {
        console.warn('[ForgeFlow] Não foi possível confirmar a sessão:', error)
      }

      if (!isStale()) setUserState(null)

      return null
    } finally {
      setLoadingUser(false)
      setAuthChecked(true)
    }
  }, [])

  const logout = useCallback(({ redirect = true } = {}) => {
    setUser(null)
    logoutService()

    if (redirect) {
      navigate('/login', { replace: true })
    }

    logoutFromApi().catch((error) => {
      console.warn('[ForgeFlow] Não foi possível limpar a sessão remota:', error)
    })
  }, [navigate, setUser])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  // Barra de progresso da tela de sessão. É puramente visual e nunca decide se
  // o app pode navegar — quem decide isso é authChecked.
  useEffect(() => {
    if (!loadingUser) {
      setAuthWarmupProgress(100)
      setAuthWarmupStatus('Sessão pronta')
      return undefined
    }

    setAuthWarmupProgress(10)
    setAuthWarmupStatus('Carregando sessão...')

    const intervalId = window.setInterval(() => {
      setAuthWarmupProgress((current) => {
        const next = Math.min(96, current + (current < 64 ? 3 : 1))

        if (next > 82) setAuthWarmupStatus('Acordando o servidor...')
        else if (next > 52) setAuthWarmupStatus('Conectando ao servidor...')

        return next
      })
    }, 320)

    return () => window.clearInterval(intervalId)
  }, [loadingUser])

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
    [user, setUser, loadingUser, authChecked, authWarmupProgress, authWarmupStatus, loadUser, logout]
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
