import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getToken } from '../../services/api'

function ProtectedRoute({ children }) {
  const location = useLocation()
  const { user, loadingUser, authChecked } = useAuth()
  const token = getToken()

  if (loadingUser || !authChecked) {
    return (
      <div className="ff-auth-loading">
        <div>
          <span />
          <p>Carregando sessão...</p>
        </div>
      </div>
    )
  }

  if (!token || !user) {
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