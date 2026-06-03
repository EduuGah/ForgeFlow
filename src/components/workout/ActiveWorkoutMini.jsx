import { useLocation, useNavigate } from 'react-router-dom'
import { Activity, CheckCircle2, Dumbbell, Timer } from 'lucide-react'

import { useWorkoutSession } from '../../context/WorkoutSessionContext'

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return [hours, minutes, secs]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

const HIDDEN_ROUTES = [
  '/start-workout',
  '/settings',
  '/profile',
  '/notifications',
  '/admin',
]

function ActiveWorkoutMini({ variant = 'floating' }) {
  const location = useLocation()
  const navigate = useNavigate()

  const { activeSession, elapsedSeconds, completedSets, totalSets } =
    useWorkoutSession()

  if (!activeSession) return null
  if (HIDDEN_ROUTES.some((route) => location.pathname.startsWith(route))) return null

  const isInline = variant === 'inline'

  const progress = totalSets
    ? Math.min((completedSets / totalSets) * 100, 100)
    : 0

  const currentExercise =
    activeSession.exercises?.find((exercise) =>
      (exercise.sets || []).some((set) => !set.completed && set.type !== 'warmup')
    ) || activeSession.exercises?.[0]

  const exerciseCount = activeSession.exercises?.length || 0
  const currentExerciseName =
    currentExercise?.exercise?.name ||
    currentExercise?.exerciseName ||
    currentExercise?.name ||
    'Próximo exercício'

  function handleOpenWorkout() {
    if (location.pathname === '/start-workout') return

    navigate('/start-workout')
  }

  return (
    <button
      type="button"
      onClick={handleOpenWorkout}
      className={`ff-active-workout-mini ff-active-workout-mini-compact ${isInline ? 'ff-active-workout-mini-inline' : 'ff-active-workout-mini-floating'}`}
    >
      <span className="ff-active-workout-mini-compact__icon">
        <Dumbbell size={23} />
      </span>

      <span className="ff-active-workout-mini-compact__copy">
        <span className="ff-active-workout-mini-compact__status">
          <Activity size={12} /> Treino em andamento
        </span>
        <strong>{activeSession.workoutName}</strong>
        <small className="ff-active-workout-mini-compact__current">Atual: {currentExerciseName}</small>
        <span className="ff-active-workout-mini-compact__meta">
          <span><CheckCircle2 size={12} /> {completedSets}/{totalSets} séries</span>
          <span><Dumbbell size={12} /> {exerciseCount} exercícios</span>
        </span>
      </span>

      <span className="ff-active-workout-mini-compact__time">
        <Timer size={13} />
        {formatTime(elapsedSeconds)}
      </span>

      <span className="ff-active-workout-mini-compact__bar" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </span>
    </button>
  )
}

export default ActiveWorkoutMini
