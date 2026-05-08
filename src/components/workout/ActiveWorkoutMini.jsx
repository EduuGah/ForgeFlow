import { useLocation, useNavigate } from 'react-router-dom'
import { Activity, ChevronRight, Clock, Dumbbell } from 'lucide-react'

import { useWorkoutSession } from '../../context/WorkoutSessionContext'

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return [hours, minutes, secs]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

function ActiveWorkoutMini() {
  const location = useLocation()
  const navigate = useNavigate()

  const { activeSession, elapsedSeconds, completedSets, totalSets } =
    useWorkoutSession()

  if (!activeSession) return null
  if (location.pathname === '/start-workout') return null

  const progress = totalSets
    ? Math.min((completedSets / totalSets) * 100, 100)
    : 0

  function handleOpenWorkout() {
    if (location.pathname === '/start-workout') return

    navigate('/start-workout')
  }

  return (
    <button
      type="button"
      onClick={handleOpenWorkout}
      className="fixed bottom-4 left-4 right-4 z-50 overflow-hidden rounded-3xl border border-[var(--ff-accent-border)] bg-[var(--ff-card)]/95 p-4 text-left text-[var(--ff-text)] shadow-2xl shadow-black/20 backdrop-blur-xl transition hover:shadow-[0_0_28px_var(--ff-accent-shadow)] md:left-auto md:w-[420px]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--ff-accent-soft),transparent_34%)]" />

      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] shadow-[0_0_18px_var(--ff-accent-shadow)]">
              <Dumbbell size={23} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-[var(--ff-success-text)]" />

                <p className="text-xs font-bold text-[var(--ff-success-text)]">
                  Treino em andamento
                </p>
              </div>

              <h3 className="mt-1 truncate text-sm font-black text-[var(--ff-text)]">
                {activeSession.workoutName}
              </h3>

              <p className="mt-1 text-xs text-[var(--ff-muted)]">
                {completedSets}/{totalSets} séries concluídas
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-[var(--ff-accent-text)]">
                <Clock size={14} />

                <p className="text-sm font-black">
                  {formatTime(elapsedSeconds)}
                </p>
              </div>

              <p className="mt-1 text-[11px] font-medium text-[var(--ff-muted)]">
                abrir treino
              </p>
            </div>

            <div className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] md:flex">
              <ChevronRight size={20} />
            </div>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--ff-surface-3)]">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress}%`,
              backgroundColor: 'var(--ff-accent)',
            }}
          />
        </div>
      </div>
    </button>
  )
}

export default ActiveWorkoutMini
