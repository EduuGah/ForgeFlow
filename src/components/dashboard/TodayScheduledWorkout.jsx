import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck, ChevronRight, Dumbbell, Moon, Settings } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../services/api'
import { getUserAppSettings, saveUserAppSettings } from '../../utils/settingsUtils'
import {
  countScheduledWorkoutDays,
  getNextScheduledWorkout,
  getScheduleSummary,
  getTodayScheduledWorkout,
  getWorkoutName,
  normalizeWeeklySchedule,
} from '../../utils/workoutScheduleUtils'

function TodayScheduledWorkout({ workouts = [], onStartWorkout }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [settings, setSettings] = useState(() => getUserAppSettings(user))
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!user) return undefined

    let isMounted = true
    setSettings(getUserAppSettings(user))

    async function loadSettings() {
      setIsLoading(true)
      try {
        const remoteSettings = await apiFetch('/settings')
        if (!isMounted) return
        const mergedSettings = saveUserAppSettings(user, {
          ...getUserAppSettings(user),
          ...remoteSettings,
        })
        setSettings(mergedSettings)
      } catch {
        if (isMounted) setSettings(getUserAppSettings(user))
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadSettings()

    function handleSettingsChanged(event) {
      setSettings(event.detail || getUserAppSettings(user))
    }

    window.addEventListener('forgeflow:settings-changed', handleSettingsChanged)

    return () => {
      isMounted = false
      window.removeEventListener('forgeflow:settings-changed', handleSettingsChanged)
    }
  }, [user])

  const weeklySchedule = useMemo(
    () => normalizeWeeklySchedule(settings.weeklySchedule),
    [settings.weeklySchedule]
  )

  const today = useMemo(
    () => getTodayScheduledWorkout({ schedule: weeklySchedule, workouts }),
    [weeklySchedule, workouts]
  )

  const nextWorkout = useMemo(
    () => getNextScheduledWorkout({ schedule: weeklySchedule, workouts }),
    [weeklySchedule, workouts]
  )

  const summary = useMemo(() => getScheduleSummary(weeklySchedule), [weeklySchedule])
  const hasSchedule = countScheduledWorkoutDays(weeklySchedule) > 0 || summary.restDays > 0

  async function handleStartTodayWorkout() {
    if (!today.workout) return

    if (onStartWorkout) {
      await onStartWorkout(today.workout)
      return
    }

    navigate('/start-workout')
  }

  return (
    <section className="mb-6 rounded-[2rem] border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
            <CalendarCheck size={22} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-[var(--ff-text)] sm:text-xl">
                Treino de hoje
              </h2>
              <Badge>{today.day.short}</Badge>
              {isLoading && <Badge>Atualizando</Badge>}
            </div>

            {!hasSchedule && (
              <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
                Configure sua rotina semanal para o ForgeFlow mostrar o treino certo aqui.
              </p>
            )}

            {today.entry?.type === 'rest' && (
              <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
                Hoje está marcado como descanso. Boa recuperação também faz parte da evolução.
              </p>
            )}

            {today.entry?.type === 'empty' && hasSchedule && (
              <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
                Nenhum treino configurado para hoje. Ajuste a agenda ou aproveite para descansar.
              </p>
            )}

            {today.isMissingWorkout && (
              <p className="mt-1 text-sm leading-relaxed text-yellow-300">
                O treino agendado não existe mais. Atualize esse dia na agenda semanal.
              </p>
            )}

            {today.workout && (
              <div className="mt-3">
                <p className="text-sm font-bold text-[var(--ff-accent-text)]">
                  {today.day.label}
                </p>
                <h3 className="mt-1 truncate text-2xl font-black text-[var(--ff-text)]">
                  {getWorkoutName(today.workout)}
                </h3>
                <p className="mt-1 text-sm text-[var(--ff-muted)]">
                  {Array.isArray(today.workout.exercises) ? today.workout.exercises.length : 0} exercício(s) planejado(s).
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
          {today.workout ? (
            <Button type="button" onClick={handleStartTodayWorkout} className="w-full sm:w-auto">
              <Dumbbell size={18} />
              Iniciar treino
            </Button>
          ) : (
            <Button type="button" variant="secondary" onClick={() => navigate('/schedule')} className="w-full sm:w-auto">
              <Settings size={18} />
              Configurar agenda
            </Button>
          )}

          <Link
            to="/schedule"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 py-2.5 text-sm font-bold text-[var(--ff-text)] transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-card-hover)]"
          >
            Ver semana
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      {nextWorkout && (
        <div className="mt-4 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 text-sm text-[var(--ff-muted)]">
          Próximo treino: <span className="font-black text-[var(--ff-text)]">{getWorkoutName(nextWorkout.workout)}</span>{' '}
          em <span className="font-black text-[var(--ff-text)]">{nextWorkout.day.label}</span>.
        </div>
      )}

      {today.entry?.type === 'rest' && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          <Moon size={16} /> Dia de descanso registrado na agenda.
        </div>
      )}
    </section>
  )
}

export default TodayScheduledWorkout
