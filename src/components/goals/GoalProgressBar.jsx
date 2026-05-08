function formatGoalValue(value, unit) {
  const number = Number(value || 0)

  if (!unit) return number.toLocaleString('pt-BR')

  return `${number.toLocaleString('pt-BR')} ${unit}`
}

function GoalProgressBar({ currentValue = 0, targetValue = 0, unit = '', progressPercent = 0 }) {
  const percent = Math.max(0, Math.min(100, Number(progressPercent || 0)))

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">
          Progresso
        </p>

        <p className="text-sm font-black text-[var(--ff-accent-text)]">
          {percent}%
        </p>
      </div>

      <div className="h-3 overflow-hidden rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface-2)]">
        <div
          className="h-full rounded-full bg-[var(--ff-accent)] shadow-[0_0_18px_var(--ff-accent-shadow)] transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-xs">
        <span className="font-bold text-[var(--ff-muted)]">
          Atual: {formatGoalValue(currentValue, unit)}
        </span>

        <span className="font-bold text-[var(--ff-muted)]">
          Meta: {formatGoalValue(targetValue, unit)}
        </span>
      </div>
    </div>
  )
}

export default GoalProgressBar
