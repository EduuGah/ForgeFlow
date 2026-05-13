import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getCurrentUser } from '../services/api'
import { useAuth } from '../context/AuthContext'

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
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-8 text-center">
        {!error ? (
          <>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-[var(--ff-accent)]" />

            <h1 className="mt-5 text-xl font-black">
              Entrando...
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Verificando seu perfil no ForgeFlow.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-black text-red-300">
              Erro no login
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              {error}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default AuthCallback