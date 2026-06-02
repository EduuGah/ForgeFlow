import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function PublicRoute({ children }) {
  const { user, loadingUser, authChecked } = useAuth()

  if (loadingUser || !authChecked) {
    return (
      <div className="ff-auth-loading">
        <div>
          <span />
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return children
}

export default PublicRoute