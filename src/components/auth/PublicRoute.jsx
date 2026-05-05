import { Navigate } from 'react-router-dom'
import { getToken } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

function PublicRoute({ children }) {
  const { loadingUser } = useAuth()
  const token = getToken()

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        Carregando...
      </div>
    )
  }

  if (token) {
    return <Navigate to="/" replace />
  }

  return children
}

export default PublicRoute