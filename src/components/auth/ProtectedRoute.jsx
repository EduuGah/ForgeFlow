import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getToken } from '../../services/api'

function ProtectedRoute({ children }) {
  const location = useLocation()
  const { loadingUser } = useAuth()

  const token = getToken()

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-[var(--ff-accent)]" />

          <p className="mt-4 text-sm font-semibold text-zinc-400">
            Carregando sessão...
          </p>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return children
}

export default ProtectedRoute