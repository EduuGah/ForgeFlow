import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { App as CapacitorApp } from '@capacitor/app'

import { getCurrentUser, saveAuthToken } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { isNativeApp } from '../../utils/platformUtils'

function isForgeFlowAuthCallback(url) {
  return (
    url.protocol === 'forgeflow:' &&
    url.hostname === 'auth' &&
    url.pathname === '/callback'
  )
}

function AppUrlListener() {
  const navigate = useNavigate()
  const { setUser } = useAuth()

  useEffect(() => {
    if (!isNativeApp()) return undefined

    let isMounted = true

    async function handleAuthCallback(urlString) {
      try {
        const url = new URL(urlString)

        if (!isForgeFlowAuthCallback(url)) return

        const token = url.searchParams.get('token')

        if (!token) {
          navigate('/login?error=google-mobile', { replace: true })
          return
        }

        saveAuthToken(token)

        const user = await getCurrentUser()

        if (!isMounted) return

        setUser(user)

        if (!user?.profileCompleted) {
          navigate('/complete-profile', { replace: true })
          return
        }

        navigate('/', { replace: true })
      } catch (error) {
        console.error('[ForgeFlow] Erro ao processar deep link:', error)

        if (isMounted) {
          navigate('/login?error=google-mobile', { replace: true })
        }
      }
    }

    const listenerPromise = CapacitorApp.addListener('appUrlOpen', (event) => {
      handleAuthCallback(event.url)
    })

    CapacitorApp.getLaunchUrl()
      .then((result) => {
        if (result?.url) {
          handleAuthCallback(result.url)
        }
      })
      .catch((error) => {
        console.warn('[ForgeFlow] Não foi possível ler URL inicial do app:', error)
      })

    return () => {
      isMounted = false
      listenerPromise.then((listener) => listener.remove()).catch(() => {})
    }
  }, [navigate, setUser])

  return null
}

export default AppUrlListener
