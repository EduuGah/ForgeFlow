import { Award, Zap } from 'lucide-react'

function getLiveSetPrStatus(set, performance) {
  const weight = Number(set.weight || 0)
  const reps = Number(set.reps || 0)
  const volume = weight * reps

  const bestWeight = Number(performance?.bestWeightPerformance?.weight || 0)
  const bestVolume = Number(performance?.bestVolumePerformance?.volume || 0)

  const hasPreviousWeightRecord = Boolean(performance?.bestWeightPerformance?.weight)
  const hasPreviousVolumeRecord = Boolean(performance?.bestVolumePerformance?.volume)
  const hasValidSet = Boolean(set.completed) && set.type !== 'warmup' && weight > 0 && reps > 0

  return {
    isWeightPR:
      Boolean(set.isWeightPR) ||
      (hasValidSet &&
        hasPreviousWeightRecord &&
        performance?.weightPRSetId === set.id &&
        weight > bestWeight),
    isVolumePR:
      Boolean(set.isVolumePR) ||
      (hasValidSet &&
        hasPreviousVolumeRecord &&
        performance?.volumePRSetId === set.id &&
        volume > bestVolume),
  }
}

export function SetPrBadges({ set, performance, compact = false }) {
  const { isWeightPR, isVolumePR } = getLiveSetPrStatus(set, performance)
  const badges = []

  if (isWeightPR) {
    badges.push({
      key: 'weight',
      label: 'Peso PR',
      icon: Award,
      className:
        'border-sky-400/30 bg-sky-500/10 text-sky-200 shadow-[0_0_14px_rgba(14,165,233,0.18)]',
    })
  }

  if (isVolumePR) {
    badges.push({
      key: 'volume',
      label: 'Volume PR',
      icon: Zap,
      className:
        'border-amber-400/30 bg-amber-500/10 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.18)]',
    })
  }

  if (badges.length === 0) {
    return compact ? null : (
      <span className="text-xs font-bold text-[var(--ff-muted)]">—</span>
    )
  }

  return (
    <div className={compact ? 'flex flex-wrap gap-2' : 'flex flex-col items-start gap-1.5'}>
      {badges.map((badge) => {
        const Icon = badge.icon

        return (
          <span
            key={badge.key}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${badge.className}`}
          >
            <Icon size={12} />
            {badge.label}
          </span>
        )
      })}
    </div>
  )
}

export function WorkoutSetInput({
  icon: Icon,
  label,
  unit,
  value,
  min,
  inputMode,
  onChange,
  suggestedValue = '',
  suggestionLabel = '',
}) {
  const hasSuggestion = suggestedValue !== '' && suggestedValue !== null && suggestedValue !== undefined

  return (
    <label className="group block">
      <span className="mb-1.5 hidden items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--ff-muted)] sm:flex">
        <span>{label}</span>
        {hasSuggestion && (
          <span className="max-w-[110px] truncate rounded-full border border-[var(--ff-accent-border)]/20 bg-[var(--ff-accent-soft)]/10 px-2 py-0.5 text-[9px] text-[var(--ff-accent-text)] opacity-70 transition group-hover:opacity-100">
            {suggestionLabel || `Último: ${suggestedValue}`}
          </span>
        )}
      </span>

      <div className={`flex h-14 items-center overflow-hidden rounded-2xl border bg-[var(--ff-card)] transition group-focus-within:border-[var(--ff-accent-border)] group-focus-within:shadow-[0_0_18px_var(--ff-accent-shadow)]/20 ${hasSuggestion ? 'border-[var(--ff-accent-border)]/20 group-hover:border-[var(--ff-accent-border)]/45' : 'border-[var(--ff-border)]'}`}>
        <div className="flex h-full w-11 shrink-0 items-center justify-center border-r border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-accent-text)]">
          <Icon size={18} />
        </div>

        <input
          type="number"
          min={min}
          inputMode={inputMode}
          value={value}
          onChange={onChange}
          onFocus={(event) => {
            window.setTimeout(() => {
              event.target?.scrollIntoView?.({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest',
              })
            }, 260)
          }}
          placeholder="0"
          className="min-w-0 flex-1 bg-transparent px-2 text-center text-xl font-black tabular-nums text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted-2)]"
        />

        <div className="flex h-full min-w-12 shrink-0 items-center justify-center border-l border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-2 text-xs font-black uppercase text-[var(--ff-muted)]">
          {unit}
        </div>
      </div>
    </label>
  )
}
