function GoalProgressBar({ value = 0 }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(Number(value) || 0)))

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-bold">
        <span className="text-[var(--ff-muted)]">Progresso</span>
        <span className="text-[var(--ff-accent-text)]">{safeValue}%</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface-2)]">
        <div
          className="h-full rounded-full bg-[var(--ff-accent)] shadow-[0_0_18px_var(--ff-accent-shadow)] transition-all duration-500"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  )
}

export default GoalProgressBar
