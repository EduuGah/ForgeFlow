import { Link } from 'react-router-dom'
import { useWorkoutSession } from '../../context/WorkoutSessionContext'

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return [
    hours,
    minutes,
    secs,
  ]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

function ActiveWorkoutMini() {
  const { activeSession, elapsedSeconds, completedSets, totalSets } =
    useWorkoutSession()

  if (!activeSession) return null

  return (
    <Link
      to="/start-workout"
      className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl border border-violet-500/30 bg-zinc-900/95 p-4 shadow-2xl shadow-violet-950/40 backdrop-blur transition hover:border-violet-400 md:left-auto md:w-96"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-violet-400">
            Treino em andamento
          </p>

          <h3 className="mt-1 font-bold text-white">
            {activeSession.workoutName}
          </h3>

          <p className="mt-1 text-xs text-zinc-500">
            {completedSets}/{totalSets} séries concluídas
          </p>
        </div>

        <div className="text-right">
          <p className="text-lg font-bold text-violet-400">
            {formatTime(elapsedSeconds)}
          </p>

          <p className="text-xs text-zinc-500">
            tocar para abrir
          </p>
        </div>
      </div>
    </Link>
  )
}

export default ActiveWorkoutMini