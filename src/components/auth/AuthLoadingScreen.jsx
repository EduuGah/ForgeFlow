function AuthLoadingScreen({
  label = 'Isso costuma levar só alguns segundos.',
  progress = 12,
  status = 'Carregando sessão...',
}) {
  const normalizedProgress = Math.max(0, Math.min(100, Math.round(Number(progress) || 0)))

  return (
    <div className="ff-auth-loading" role="status" aria-live="polite">
      <div className="ff-auth-loading__card">
        <div
          className="ff-auth-loading__ring"
          style={{ '--ff-auth-loading-progress': `${normalizedProgress}%` }}
          aria-hidden="true"
        >
          <strong>{normalizedProgress}%</strong>
        </div>
        <p>{status}</p>
        <small>{label}</small>
      </div>
    </div>
  )
}

export default AuthLoadingScreen
