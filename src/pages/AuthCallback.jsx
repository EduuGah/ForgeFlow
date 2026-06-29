import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getCurrentUser } from '../services/api'
import { useAuth } from '../context/AuthContext'

import AppPageIntro from '../components/app/AppPageIntro'

function AuthCallback() {
  const navigate = useNavigate()
  const { setUser } = useAuth()

  const [error, setError] = useState('')

  useEffect(() => {
    async function finishLogin() {
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')
      const mode = params.get('mode')

      if (!token && mode !== 'cookie') {
        setError('Token não encontrado na URL de callback.')

        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 2500)

        return
      }

      if (token) {
        localStorage.setItem('forgeflow:token', token)
      } else {
        localStorage.removeItem('forgeflow:token')
      }

      try {
        const user = await getCurrentUser()

        setUser(user)

        if (!user.profileCompleted) {
          navigate('/complete-profile', { replace: true })
          return
        }

        navigate('/', { replace: true })
      } catch {
        localStorage.removeItem('forgeflow:token')
        setUser(null)
        navigate('/login', { replace: true })
      }
    }

    finishLogin()
  }, [navigate, setUser])

  return (
    <div className="ff-hevy-page ff-hevy-page-authcallback">

      <AppPageIntro eyebrow="Autenticação" title="Conectando" description="Finalizando login com segurança." />

    <div className="ff-auth-flow flex min-h-screen items-center justify-center bg-[var(--ff-card)] px-4 text-[var(--ff-text)]">
      <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-8 text-center">
        {!error ? (
          <>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--ff-border)] border-t-[var(--ff-accent)]" />

            <h1 className="mt-5 text-xl font-black">
              Entrando...
            </h1>

            <p className="mt-2 text-sm text-[var(--ff-muted-2)]">
              Verificando seu perfil no ForgeFlow.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-black text-red-300">
              Erro no login
            </h1>

            <p className="mt-2 text-sm text-[var(--ff-muted-2)]">
              {error}
            </p>
          </>
        )}
      </div>
    </div>
  
    </div>
  )
}

export default AuthCallback
