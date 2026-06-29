import { BellRing, Clock3, Dumbbell, Moon, Save, Trash2, AlertTriangle } from 'lucide-react'

import Button from '../ui/Button'
import Select from '../ui/Select'
import Input from '../ui/Input'
import Badge from '../ui/Badge'
import { getScheduleEntryTime, getWorkoutId, getWorkoutName } from '../../utils/workoutScheduleUtils'

function DayDetailsPanel({
  day,
  entry,
  workout,
  workouts,
  fallbackTime,
  alertsEnabled,
  hasUnsavedChanges,
  isSaving,
  isToday,
  onWorkoutChange,
  onTimeChange,
  onMarkRest,
  onClearDay,
  onSave,
  onStartWorkout,
}) {
  const isWorkout = entry?.type === 'workout'
  const isRest = entry?.type === 'rest'
  const workoutMissing = isWorkout && !workout
  const selectedValue = isWorkout ? entry.workoutId : entry?.type || 'empty'

  return (
    <section className="ff-schedule-v2-details" data-tutorial="schedule-day-details" aria-label={`Detalhes de ${day.label}`}>
      <div className="ff-schedule-v2-section-title">
        <div>
          <span>Dia selecionado</span>
          <h2>{day.label}</h2>
        </div>
        {isToday && <Badge variant="purple">Hoje</Badge>}
      </div>

      <div className={`ff-schedule-v2-details__status ${isWorkout ? 'is-workout' : isRest ? 'is-rest' : 'is-empty'}`}>
        <span>
          {workoutMissing ? <AlertTriangle size={20} /> : isWorkout ? <Dumbbell size={20} /> : isRest ? <Moon size={20} /> : <Clock3 size={20} />}
        </span>
        <div>
          <strong>{workoutMissing ? 'Treino indisponível' : isWorkout ? getWorkoutName(workout) : isRest ? 'Dia de descanso' : 'Dia livre'}</strong>
          <small>
            {workoutMissing
              ? 'O treino salvo foi removido. Escolha outro treino.'
              : isWorkout
                ? `${getScheduleEntryTime(entry, fallbackTime)} · ${alertsEnabled ? 'alerta ativo' : 'alerta desligado'}`
                : isRest
                  ? 'Recuperação planejada para manter consistência.'
                  : 'Escolha um treino ou marque descanso.'}
          </small>
        </div>
      </div>

      <div className="ff-schedule-v2-details__form">
        <Select
          label="Treino do dia"
          value={selectedValue || 'empty'}
          onChange={(event) => onWorkoutChange(event.target.value)}
        >
          <option value="empty">Sem configuração</option>
          <option value="rest">Descanso</option>
          {workouts.map((item) => (
            <option key={getWorkoutId(item)} value={getWorkoutId(item)}>
              {getWorkoutName(item)}
            </option>
          ))}
        </Select>

        {isWorkout && (
          <Input
            label="Horário do treino"
            type="time"
            value={getScheduleEntryTime(entry, fallbackTime)}
            onChange={(event) => onTimeChange(event.target.value)}
          />
        )}
      </div>

      {isWorkout && alertsEnabled && (
        <p className="ff-schedule-v2-details__hint">
          <BellRing size={15} /> O alerta será reagendado automaticamente quando você salvar.
        </p>
      )}

      <div className="ff-schedule-v2-details__actions">
        {isToday && workout && (
          <Button type="button" onClick={onStartWorkout} data-tutorial="schedule-start-today" className="ff-schedule-v2-details__primary">
            <Dumbbell size={17} /> Iniciar treino
          </Button>
        )}

        <Button type="button" variant="secondary" onClick={onMarkRest}>
          <Moon size={17} /> Marcar descanso
        </Button>

        <Button type="button" variant="danger" onClick={onClearDay}>
          <Trash2 size={17} /> Remover
        </Button>
      </div>

      <Button
        type="button"
        onClick={onSave}
        disabled={isSaving || !hasUnsavedChanges}
        className="ff-schedule-v2-details__save"
      >
        <Save size={17} /> {isSaving ? 'Salvando...' : hasUnsavedChanges ? 'Salvar agenda' : 'Sem alterações'}
      </Button>
    </section>
  )
}

export default DayDetailsPanel
