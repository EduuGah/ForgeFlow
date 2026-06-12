import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getToken } from '../../services/api'
import AuthLoadingScreen from './AuthLoadingScreen'

function ProtectedRoute({ children }) {
  const location = useLocation()
  const { user, loadingUser, authChecked, authWarmupProgress, authWarmupStatus } = useAuth()
  const token = getToken()

  if (loadingUser || !authChecked) {
    return (
      <AuthLoadingScreen
        label="Carregando sessao..."
        progress={authWarmupProgress}
        status={authWarmupStatus}
      />
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

  if (
    !user.profileCompleted &&
    location.pathname !== '/complete-profile'
  ) {
    return <Navigate to="/complete-profile" replace />
  }

  return children
}

export default ProtectedRoute
