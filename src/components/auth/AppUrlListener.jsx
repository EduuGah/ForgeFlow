import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { App as CapacitorApp } from '@capacitor/app'
import { registerPlugin } from '@capacitor/core'

import { getCurrentUser, saveAuthToken } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { isNativeApp } from '../../utils/platformUtils'

const LocalNotifications = registerPlugin('LocalNotifications')

function isForgeFlowAuthCallback(url) {
  return (
    url.protocol === 'forgeflow:' &&
    url.hostname === 'auth' &&
    url.pathname === '/callback'
  )
}

function isForgeFlowActiveWorkout(url) {
  return (
    url.protocol === 'forgeflow:' &&
    url.hostname === 'workout' &&
    url.pathname === '/active'
  )
}

function AppUrlListener() {
  const navigate = useNavigate()
  const { setUser } = useAuth()

  useEffect(() => {
    if (!isNativeApp()) return undefined

    let isMounted = true

    async function handleForgeFlowUrl(urlString) {
      try {
        const url = new URL(urlString)

        if (isForgeFlowActiveWorkout(url)) {
          try {
            window.sessionStorage.setItem('forgeflow:open-active-workout-details', '1')
            if (url.searchParams.get('action') === 'finish-confirm') {
              window.sessionStorage.setItem('forgeflow:active-workout-finish-confirm', '1')
            }
          } catch {
            // A navegação direta continua funcionando mesmo se sessionStorage não estiver disponível.
          }

          navigate('/start-workout', {
            replace: false,
            state: { fromActiveWorkoutNotification: true },
          })
          return
        }

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
      handleForgeFlowUrl(event.url)
    })
    const localNotificationListenerPromise = LocalNotifications.addListener?.(
      'localNotificationActionPerformed',
      (event) => {
        const route = event?.notification?.extra?.forgeflowRoute
        const action = event?.notification?.extra?.forgeflowAction || event?.actionId

        if (route === '/start-workout') {
          try {
            if (action === 'finish-confirm') {
              window.sessionStorage.setItem('forgeflow:active-workout-finish-confirm', '1')
            }
          } catch {
            // A navegação continua funcionando sem sessionStorage.
          }
          navigate('/start-workout', {
            replace: false,
            state: { fromActiveWorkoutNotification: true },
          })
        }
      }
    )

    CapacitorApp.getLaunchUrl()
      .then((result) => {
        if (result?.url) {
          handleForgeFlowUrl(result.url)
        }
      })
      .catch((error) => {
        console.warn('[ForgeFlow] Não foi possível ler URL inicial do app:', error)
      })

    return () => {
      isMounted = false
      listenerPromise.then((listener) => listener.remove()).catch(() => {})
      localNotificationListenerPromise?.then((listener) => listener.remove()).catch(() => {})
    }
  }, [navigate, setUser])

  return null
}

export default AppUrlListener
