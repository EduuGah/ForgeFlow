import { BellRing, CheckCircle2, Dumbbell, Moon, Plus, AlertTriangle } from 'lucide-react'

import { getScheduleEntryTime } from '../../utils/workoutScheduleUtils'

function WeekDayCard({
  day,
  entry,
  workout,
  dateLabel,
  fallbackTime,
  isToday,
  isSelected,
  isMissingWorkout,
  alertsEnabled,
  onSelect,
}) {
  const isWorkout = entry?.type === 'workout'
  const isRest = entry?.type === 'rest'
  const time = getScheduleEntryTime(entry, fallbackTime)
  const title = isWorkout
    ? workout?.name || workout?.title || entry?.workoutName || 'Treino removido'
    : isRest
      ? 'Descanso'
      : 'Sem plano'

  return (
    <button
      type="button"
      className={`ff-schedule-v2-day ${isSelected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''} ${isWorkout ? 'is-workout' : ''} ${isRest ? 'is-rest' : ''}`}
      onClick={onSelect}
      aria-pressed={isSelected}
    >
      <span className="ff-schedule-v2-day__top">
        <span>
          <strong>{day.short}</strong>
          <small>{dateLabel}</small>
        </span>
        {isToday && <b>Hoje</b>}
      </span>

      <span className="ff-schedule-v2-day__body">
        <span className="ff-schedule-v2-day__icon">
          {isMissingWorkout ? <AlertTriangle size={18} /> : isWorkout ? <Dumbbell size={18} /> : isRest ? <Moon size={18} /> : <Plus size={18} />}
        </span>
        <span className="ff-schedule-v2-day__text">
          <strong>{title}</strong>
          <small>{isWorkout ? time : isRest ? 'Recuperação' : 'Toque para planejar'}</small>
        </span>
      </span>

      <span className="ff-schedule-v2-day__footer">
        {isWorkout && alertsEnabled && !isMissingWorkout ? (
          <span><BellRing size={13} /> Alerta</span>
        ) : isWorkout && !isMissingWorkout ? (
          <span>Sem alerta</span>
        ) : isRest ? (
          <span>Descanso ativo</span>
        ) : (
          <span>Disponível</span>
        )}
        {isWorkout && !isMissingWorkout && <CheckCircle2 size={14} />}
      </span>
    </button>
  )
}

export default WeekDayCard
