import { Link, useLocation } from 'react-router-dom'
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
  const { activeSession, elapsedSeconds, completedSets, totalSets } =
    useWorkoutSession()

  if (!activeSession) return null
  if (location.pathname === '/start-workout') return null

  const progress = totalSets ? Math.min((completedSets / totalSets) * 100, 100) : 0

  return (
    <Link
      to="/start-workout"
      className="fixed bottom-4 left-4 right-4 z-50 overflow-hidden rounded-3xl border border-violet-500/30 bg-[#121212]/95 p-4 text-white shadow-2xl shadow-violet-950/50 backdrop-blur-xl transition hover:border-violet-400/60 hover:shadow-[0_0_28px_rgba(139,92,246,0.28)] md:left-auto md:w-[420px]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_34%)]" />

      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-300 shadow-[0_0_18px_rgba(139,92,246,0.22)]">
              <Dumbbell size={23} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-emerald-400" />

                <p className="text-xs font-bold text-emerald-400">
                  Treino em andamento
                </p>
              </div>

              <h3 className="mt-1 truncate text-sm font-black text-white">
                {activeSession.workoutName}
              </h3>

              <p className="mt-1 text-xs text-zinc-500">
                {completedSets}/{totalSets} séries concluídas
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-violet-300">
                <Clock size={14} />

                <p className="text-sm font-black">
                  {formatTime(elapsedSeconds)}
                </p>
              </div>

              <p className="mt-1 text-[11px] font-medium text-zinc-500">
                abrir treino
              </p>
            </div>

            <div className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-400 md:flex">
              <ChevronRight size={20} />
            </div>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-violet-500 transition-all"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>
    </Link>
  )
}

export default ActiveWorkoutMini