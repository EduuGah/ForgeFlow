import { useEffect, useMemo, useState } from 'react'
import { BellRing, CalendarCheck, Dumbbell, Moon, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import Toast from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'
import { useWorkoutSession } from '../context/useWorkoutSession'
import { apiFetch } from '../services/api'
import { loadScheduleSettings, saveScheduleSettings } from '../services/workoutScheduleService'
import { rescheduleConfiguredNotifications, scheduleWeeklyWorkoutReminders } from '../services/nativeNotificationService'
import { getUserStorageData, migrateLegacyUserStorageData } from '../utils/userStorage'
import { normalizeWorkoutFromApi } from '../utils/workoutNormalizers'
import {
  WEEK_DAYS,
  findWorkoutByScheduleEntry,
  getScheduleSummary,
  getTodayScheduledWorkout,
  getWorkoutId,
  getWorkoutName,
  hydrateWeeklyScheduleWithWorkoutNames,
  normalizeWeeklySchedule,
} from '../utils/workoutScheduleUtils'
import { defaultSettings } from '../utils/settingsUtils'

import AppPageIntro from '../components/app/AppPageIntro'

function normalizeWorkouts(workouts = []) {
  return workouts.map((workout) => normalizeWorkoutFromApi(workout))
}

function WorkoutSchedule() {
  const { user } = useAuth()
  const { startSession } = useWorkoutSession()
  const navigate = useNavigate()

  const [workouts, setWorkouts] = useState([])
  const [settings, setSettings] = useState(defaultSettings)
  const [weeklySchedule, setWeeklySchedule] = useState(defaultSettings.weeklySchedule)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const today = useMemo(
    () => getTodayScheduledWorkout({ schedule: weeklySchedule, workouts }),
    [weeklySchedule, workouts]
  )

  const summary = useMemo(() => getScheduleSummary(weeklySchedule), [weeklySchedule])
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(normalizeWeeklySchedule(weeklySchedule)) !== JSON.stringify(normalizeWeeklySchedule(settings.weeklySchedule))
  }, [settings.weeklySchedule, weeklySchedule])

  function showToast(type, title, message = '') {
    setToast({ type, title, message })
    window.setTimeout(() => setToast(null), 3200)
  }

  useEffect(() => {
    if (!user) return undefined

    let isMounted = true

    async function loadData() {
      setIsLoading(true)

      const cachedWorkouts = migrateLegacyUserStorageData(user, 'workouts', [])
      let loadedWorkouts = Array.isArray(cachedWorkouts) ? cachedWorkouts : []

      try {
        const remoteWorkouts = await apiFetch('/workouts')
        loadedWorkouts = Array.isArray(remoteWorkouts) ? normalizeWorkouts(remoteWorkouts) : loadedWorkouts
      } catch {
        loadedWorkouts = getUserStorageData(user, 'workouts', loadedWorkouts)
      }

      const loadedSettings = await loadScheduleSettings(user)
      const hydratedSchedule = hydrateWeeklyScheduleWithWorkoutNames(
        loadedSettings.weeklySchedule,
        loadedWorkouts
      )

      if (!isMounted) return

      setWorkouts(loadedWorkouts)
      setSettings({ ...loadedSettings, weeklySchedule: hydratedSchedule })
      setWeeklySchedule(hydratedSchedule)
      setIsLoading(false)
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [user])

  function handleDayChange(dayKey, value) {
    setWeeklySchedule((current) => {
      const normalized = normalizeWeeklySchedule(current)

      if (value === 'rest') {
        return {
          ...normalized,
          [dayKey]: { type: 'rest' },
        }
      }

      if (value === 'empty') {
        return {
          ...normalized,
          [dayKey]: { type: 'empty' },
        }
      }

      const workout = workouts.find((item) => getWorkoutId(item) === value)

      return {
        ...normalized,
        [dayKey]: {
          type: 'workout',
          workoutId: value,
          workoutName: workout ? getWorkoutName(workout) : 'Treino agendado',
        },
      }
    })
  }

  async function handleSaveSchedule(nextSettings = settings) {
    setIsSaving(true)

    const hydratedSchedule = hydrateWeeklyScheduleWithWorkoutNames(weeklySchedule, workouts)
    const payload = {
      ...nextSettings,
      weeklySchedule: hydratedSchedule,
    }

    try {
      const savedSettings = await saveScheduleSettings(user, payload)
      setSettings(savedSettings)
      setWeeklySchedule(savedSettings.weeklySchedule)

      await rescheduleConfiguredNotifications({
        settings: savedSettings,
        workouts,
      })

      showToast('success', 'Agenda salva', 'Sua rotina semanal foi atualizada.')
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao salvar', error.message || 'Não foi possível salvar a agenda.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleReminderChange(key, value) {
    const nextSettings = {
      ...settings,
      [key]: value,
      weeklySchedule,
    }

    setSettings(nextSettings)

    try {
      const savedSettings = await saveScheduleSettings(user, nextSettings)
      setSettings(savedSettings)

      if (key === 'workoutReminderEnabled' || key === 'workoutReminderTime') {
        if (savedSettings.workoutReminderEnabled) {
          if (getScheduleSummary(weeklySchedule).workoutDays === 0) {
            const disabledSettings = await saveScheduleSettings(user, {
              ...savedSettings,
              workoutReminderEnabled: false,
              weeklySchedule,
            })
            setSettings(disabledSettings)
            showToast('error', 'Agenda vazia', 'Selecione pelo menos um treino na semana antes de ativar lembrete.')
            return
          }

          const result = await scheduleWeeklyWorkoutReminders({
            schedule: weeklySchedule,
            workouts,
            time: savedSettings.workoutReminderTime,
          })

          if (result?.reason === 'not-native') {
            showToast('success', 'Preferência salva', 'No navegador, a notificação real só será agendada no APK.')
          } else if (result?.reason === 'empty-schedule') {
            showToast('error', 'Agenda vazia', 'Selecione pelo menos um treino na semana.')
          } else {
            showToast('success', 'Lembretes atualizados', `${result?.count || 0} lembrete(s) configurado(s).`)
          }
        } else {
          await rescheduleConfiguredNotifications({ settings: savedSettings, workouts })
          showToast('success', 'Lembretes desativados', 'As notificações de treino foram canceladas.')
        }
      }
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao atualizar', 'Não foi possível atualizar essa configuração.')
    }
  }

  async function handleStartTodayWorkout() {
    if (!today.workout) return

    try {
      await apiFetch(`/workouts/${getWorkoutId(today.workout)}/start`, {
        method: 'POST',
      })
    } catch (error) {
      console.error(error)
    }

    startSession(today.workout)
    navigate('/start-workout')
  }

  return (
    <div className="ff-hevy-page ff-hevy-page-workoutschedule">

      <AppPageIntro
        eyebrow="Agenda"
        title="Semana de treino"
        description="Organize sua rotina por dia e inicie o treino certo rapidamente."
        metrics={[
          { label: 'Rotinas', value: workouts.length },
          { label: 'Dias', value: summary.workoutDays },
          { label: 'Descanso', value: summary.restDays },
        ]}
      />
      <PageHeader
        title="Agenda semanal"
        description="Defina qual treino você faz em cada dia e use isso para lembretes no APK."
        action={<Badge>{hasUnsavedChanges ? 'Alterações pendentes' : `${summary.workoutDays} dia(s) com treino`}</Badge>}
      />

      <section className="ff-page-mobile-main-grid grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="ff-schedule-primary-flow space-y-5">
          <Card className="ff-schedule-today-card overflow-hidden">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-[var(--ff-accent-text)]">
                  <CalendarCheck size={18} /> Treino de hoje
                </div>

                {today.workout && (
                  <>
                    <h2 className="mt-3 text-3xl font-black text-[var(--ff-text)]">
                      {getWorkoutName(today.workout)}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--ff-muted)]">
                      {today.day.label} · {Array.isArray(today.workout.exercises) ? today.workout.exercises.length : 0} exercício(s)
                    </p>
                  </>
                )}

                {today.entry?.type === 'rest' && (
                  <div className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-300">
                    <Moon size={18} /> Hoje é descanso.
                  </div>
                )}

                {today.entry?.type === 'empty' && (
                  <p className="mt-3 text-sm leading-relaxed text-[var(--ff-muted)]">
                    Nenhum treino configurado para hoje.
                  </p>
                )}

                {today.isMissingWorkout && (
                  <p className="mt-3 text-sm leading-relaxed text-yellow-300">
                    O treino salvo para hoje foi removido. Escolha outro treino para esse dia.
                  </p>
                )}
              </div>

              {today.workout && (
                <Button type="button" onClick={handleStartTodayWorkout} className="w-full sm:w-auto">
                  <Dumbbell size={18} />
                  Iniciar treino de hoje
                </Button>
              )}
            </div>
          </Card>

          {hasUnsavedChanges && (
            <div className="ff-schedule-pending-banner rounded-3xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] p-4 text-sm font-bold text-[var(--ff-accent-text)]">
              Você alterou a agenda. Toque em “Salvar alterações” para atualizar os lembretes do APK.
            </div>
          )}

          <Card className="ff-schedule-week-card">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-[var(--ff-text)]">Rotina da semana</h2>
                <p className="mt-1 text-sm text-[var(--ff-muted)]">
                  Escolha um treino existente, marque descanso ou deixe o dia sem configuração.
                </p>
              </div>

              <Button type="button" onClick={() => handleSaveSchedule()} disabled={isSaving || isLoading}>
                <Save size={18} />
                {isSaving ? 'Salvando...' : hasUnsavedChanges ? 'Salvar alterações' : 'Salvar agenda'}
              </Button>
            </div>

            <div className="ff-schedule-week-grid mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {WEEK_DAYS.map((day) => {
                const entry = normalizeWeeklySchedule(weeklySchedule)[day.key]
                const selectedValue = entry.type === 'workout' ? entry.workoutId : entry.type
                const workoutMissing = entry.type === 'workout' && !findWorkoutByScheduleEntry(workouts, entry)

                return (
                  <div
                    key={day.key}
                    className="ff-schedule-day-card rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-[var(--ff-text)]">{day.label}</p>
                        <p className="text-xs font-bold text-[var(--ff-muted)]">{day.short}</p>
                      </div>

                      {today.dayKey === day.key && <Badge>Hoje</Badge>}
                    </div>

                    <Select
                      value={selectedValue || 'empty'}
                      onChange={(event) => handleDayChange(day.key, event.target.value)}
                      disabled={isLoading}
                    >
                      <option value="empty">Sem configuração</option>
                      <option value="rest">Descanso</option>
                      {workouts.map((workout) => (
                        <option key={getWorkoutId(workout)} value={getWorkoutId(workout)}>
                          {getWorkoutName(workout)}
                        </option>
                      ))}
                    </Select>

                    {workoutMissing && (
                      <p className="mt-2 text-xs font-bold text-yellow-300">
                        Treino removido ou indisponível. Escolha outro.
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {workouts.length === 0 && !isLoading && (
              <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm leading-relaxed text-yellow-100/80">
                Você ainda não tem treinos criados. Crie um treino em “Treinos” para montar sua agenda.
              </div>
            )}
          </Card>
        </div>

        <aside className="ff-schedule-side-panel space-y-5">
          <Card className="ff-schedule-reminder-card">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-[var(--ff-accent-text)]">
              <BellRing size={18} /> Lembretes
            </div>

            <p className="mt-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              Os lembretes de treino usam a agenda acima. No navegador eles ficam salvos; no APK viram notificações locais.
            </p>

            <div className="mt-5 space-y-4">
              <label className="ff-schedule-reminder-toggle flex items-center justify-between gap-4 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                <span>
                  <span className="block text-sm font-black text-[var(--ff-text)]">Lembrete de treino</span>
                  <span className="block text-xs text-[var(--ff-muted)]">Avisar nos dias com treino</span>
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(settings.workoutReminderEnabled)}
                  onChange={(event) => handleReminderChange('workoutReminderEnabled', event.target.checked)}
                  className="h-5 w-5 accent-[var(--ff-accent)]"
                />
              </label>

              <Input
                label="Horário do lembrete"
                type="time"
                value={settings.workoutReminderTime}
                onChange={(event) => handleReminderChange('workoutReminderTime', event.target.value)}
              />
            </div>
          </Card>

          <Card className="ff-schedule-summary-card">
            <h3 className="text-lg font-black text-[var(--ff-text)]">Resumo</h3>
            <div className="ff-schedule-summary-grid mt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <p>{summary.workoutDays}</p>
                <span>Treinos</span>
              </div>
              <div>
                <p>{summary.restDays}</p>
                <span>Descanso</span>
              </div>
              <div>
                <p>{summary.emptyDays}</p>
                <span>Vazios</span>
              </div>
            </div>
          </Card>
        </aside>
      </section>

      <Toast
        show={Boolean(toast)}
        type={toast?.type}
        title={toast?.title}
        message={toast?.message}
        onClose={() => setToast(null)}
      />
    </div>
  )
}

export default WorkoutSchedule
