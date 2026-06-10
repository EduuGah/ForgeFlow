import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Award, Medal, Zap } from 'lucide-react'

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
      label: compact ? 'KG' : 'Peso PR',
      title: 'Recorde de peso',
      icon: Award,
      className:
        'border-sky-400/30 bg-sky-500/10 text-sky-200 shadow-[0_0_14px_rgba(14,165,233,0.18)]',
    })
  }

  if (isVolumePR) {
    badges.push({
      key: 'volume',
      label: compact ? 'VOL' : 'Volume PR',
      title: 'Recorde de volume',
      icon: Zap,
      className:
        'border-amber-400/30 bg-amber-500/10 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.18)]',
    })
  }

  if (badges.length === 0) {
    return compact ? <span className="ff-pr-empty">—</span> : (
      <span className="text-xs font-bold text-[var(--ff-muted)]">—</span>
    )
  }

  return (
    <div className={compact ? 'ff-pr-badges-compact' : 'ff-pr-badges'}>
      {badges.map((badge) => {
        const Icon = badge.icon

        return (
          <span
            key={badge.key}
            title={badge.title}
            aria-label={badge.title}
            className={`ff-pr-badge ff-pr-badge--${badge.key} ${compact ? 'is-compact' : ''}`}
          >
            <Icon size={compact ? 13 : 12} aria-hidden="true" />
            <span className="ff-pr-badge__label">{badge.label}</span>
          </span>
        )
      })}
    </div>
  )
}



function getRecordDate(record = {}) {
  return (
    record.date ||
    record.fullDate ||
    record.finishedAt ||
    record.completedAt ||
    record.workoutDate ||
    record.createdAt ||
    record.updatedAt ||
    ''
  )
}

function formatRecordDate(value) {
  if (!value) return 'Sem data anterior'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sem data anterior'

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function formatWeightRecord(record = {}) {
  const weight = Number(record.weight || 0)
  const reps = Number(record.reps || 0)

  if (!weight && !reps) return 'Sem registro anterior'
  if (!weight) return `${reps} reps`
  if (!reps) return `${weight}kg`

  return `${weight}kg × ${reps}`
}

function formatVolumeRecord(record = {}) {
  const weight = Number(record.weight || 0)
  const reps = Number(record.reps || 0)
  const volume = Number(record.volume || weight * reps || 0)

  if (!volume) return 'Sem registro anterior'

  return `${volume} vol. ${weight && reps ? `(${weight}kg × ${reps})` : ''}`.trim()
}

function buildPrDetails(set, performance) {
  const { isWeightPR, isVolumePR } = getLiveSetPrStatus(set, performance)
  const weight = Number(set?.weight || 0)
  const reps = Number(set?.reps || 0)
  const volume = weight * reps
  const details = []

  if (isWeightPR) {
    const previous = performance?.bestWeightPerformance || {}

    details.push({
      key: 'weight',
      label: 'Recorde de peso',
      badge: 'PESO',
      current: `${weight}kg${reps ? ` × ${reps}` : ''}`,
      previous: formatWeightRecord(previous),
      date: formatRecordDate(getRecordDate(previous)),
    })
  }

  if (isVolumePR) {
    const previous = performance?.bestVolumePerformance || {}

    details.push({
      key: 'volume',
      label: 'Recorde de volume',
      badge: 'VOL',
      current: `${volume} vol. ${weight && reps ? `(${weight}kg × ${reps})` : ''}`.trim(),
      previous: formatVolumeRecord(previous),
      date: formatRecordDate(getRecordDate(previous)),
    })
  }

  return details
}

export function SetPrMedal({ set, performance }) {
  const [isOpen, setIsOpen] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState({ left: 0, top: 0 })
  const medalButtonRef = useRef(null)
  const details = buildPrDetails(set, performance)

  function updatePopoverPosition() {
    if (typeof window === 'undefined' || !medalButtonRef.current) return

    const rect = medalButtonRef.current.getBoundingClientRect()
    const popoverHalfWidth = window.innerWidth <= 420 ? 138 : 148
    const safeLeft = Math.min(
      Math.max(rect.left + rect.width / 2, popoverHalfWidth),
      window.innerWidth - popoverHalfWidth
    )
    const safeTop = Math.max(rect.top, 112)

    setPopoverPosition({ left: safeLeft, top: safeTop })
  }

  useEffect(() => {
    if (!isOpen) return undefined

    updatePopoverPosition()

    function handleReposition() {
      updatePopoverPosition()
    }

    function handleCloseOnOutsideClick() {
      setIsOpen(false)
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)
    document.addEventListener('pointerdown', handleCloseOnOutsideClick)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
      document.removeEventListener('pointerdown', handleCloseOnOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  if (!set?.completed || details.length === 0) {
    return <span className="ff-pr-empty">—</span>
  }

  const popover = isOpen && typeof document !== 'undefined'
    ? createPortal(
      <div
        className="ff-pr-medal-popover-layer"
        role="presentation"
        onClick={() => setIsOpen(false)}
      >
        <div
          className="ff-pr-medal-popover"
          role="dialog"
          aria-label="Detalhes do recorde"
          style={{
            '--ff-pr-popover-left': `${popoverPosition.left}px`,
            '--ff-pr-popover-top': `${popoverPosition.top}px`,
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="ff-pr-medal-popover__title">
            <Medal size={17} aria-hidden="true" />
            <div>
              <span>Novo recorde</span>
              <small>Série confirmada com PR</small>
            </div>
          </div>

          <div className="ff-pr-medal-popover__list">
            {details.map((detail) => (
              <section key={detail.key} className={`ff-pr-medal-popover__item is-${detail.key}`}>
                <div className="ff-pr-medal-popover__item-header">
                  <span>{detail.badge}</span>
                  <strong>{detail.label}</strong>
                </div>

                <div className="ff-pr-medal-popover__comparison">
                  <div className="ff-pr-medal-popover__metric is-current">
                    <small>PR atual</small>
                    <b>{detail.current}</b>
                  </div>

                  <div className="ff-pr-medal-popover__metric is-previous">
                    <small>Recorde anterior</small>
                    <b>{detail.previous}</b>
                    <em>{detail.date}</em>
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>,
      document.body
    )
    : null

  return (
    <div className="ff-pr-medal-wrap">
      <button
        ref={medalButtonRef}
        type="button"
        className="ff-pr-medal-button"
        aria-label="Ver detalhes do recorde da série"
        aria-expanded={isOpen}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          updatePopoverPosition()
          setIsOpen((current) => !current)
        }}
      >
        <Medal size={19} aria-hidden="true" />
      </button>

      {popover}
    </div>
  )
}

export function SetRecordBanner() {
  return null
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
