function AuthLoadingScreen({
  label = 'Carregando sessao...',
  progress = 12,
  status = '',
}) {
  const normalizedProgress = Math.max(0, Math.min(100, Math.round(Number(progress) || 0)))

  return (
    <div className="ff-auth-loading">
      <div className="ff-auth-loading__card">
        <div
          className="ff-auth-loading__ring"
          style={{ '--ff-auth-loading-progress': `${normalizedProgress}%` }}
          aria-label={`${normalizedProgress}%`}
        >
          <strong>{normalizedProgress}%</strong>
        </div>
        <p>{status || label}</p>
        <small>{label}</small>
      </div>
    </div>
  )
}

export default AuthLoadingScreen
