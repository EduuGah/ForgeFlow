import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AuthLoadingScreen from './AuthLoadingScreen'

function PublicRoute({ children }) {
  const { user, loadingUser, authChecked, authWarmupProgress, authWarmupStatus } = useAuth()

  if (loadingUser || !authChecked) {
    return (
      <AuthLoadingScreen
        label="Carregando sessao..."
        progress={authWarmupProgress}
        status={authWarmupStatus}
      />
    )
  }

  if (user) {
    return <Navigate to={user.profileCompleted ? '/' : '/complete-profile'} replace />
  }

  return children
}

export default PublicRoute
