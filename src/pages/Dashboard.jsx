import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  Beef,
  Bell,
  CalendarCheck,
  ChevronRight,
  Droplets,
  Dumbbell,
  Flame,
  Gauge,
  Medal,
  Play,
  Plus,
  Sparkles,
  Target,
  Trophy,
  TrendingUp,
  Weight,
  Zap,
} from 'lucide-react'

import { useWorkoutSession } from '../context/useWorkoutSession'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import { useDashboardData } from '../features/dashboard/hooks/useDashboardData'
import { useDashboardDerivedData } from '../features/dashboard/hooks/useDashboardDerivedData'
import {
  formatDuration,
  formatShortDate,
} from '../features/dashboard/dashboardUtils'
import { getUserAppSettings, saveUserAppSettings } from '../utils/settingsUtils'
import {
  countScheduledWorkoutDays,
  getNextScheduledWorkout,
  getScheduleSummary,
  getTodayScheduledWorkout,
  getWorkoutName,
  normalizeWeeklySchedule,
  WEEK_DAYS,
} from '../utils/workoutScheduleUtils'
import { getTodayNutrition } from '../services/nutritionService'

function toNumber(value) {
  return Number(value) || 0
}

function getFirstName(user, profile) {
  const name = profile?.name || user?.name || 'Atleta'
  return String(name).trim().split(/\s+/)[0] || 'Atleta'
}

function getGreeting() {
  const hour = new Date().getHours()

  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function getDateKey(date) {
  return date.toISOString().slice(0, 10)
}

function getSessionDate(session) {
  const date = new Date(session?.finishedAt || session?.createdAt || session?.date || 0)
  return Number.isNaN(date.getTime()) ? null : date
}

function getSessionDuration(session) {
  return toNumber(session?.durationSeconds || session?.duration)
}

function getSessionExerciseCount(session) {
  return Array.isArray(session?.exercises) ? session.exercises.length : 0
}

function getWorkoutExerciseCount(workout) {
  return Array.isArray(workout?.exercises) ? workout.exercises.length : 0
}

function formatClock(seconds) {
  const total = Math.max(0, Number(seconds) || 0)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatCompactNumber(value, suffix = '') {
  const number = toNumber(value)

  if (Math.abs(number) >= 10000) {
    return `${new Intl.NumberFormat('pt-BR', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(number)}${suffix ? ` ${suffix}` : ''}`
  }

  return `${new Intl.NumberFormat('pt-BR').format(number)}${suffix ? ` ${suffix}` : ''}`
}

function getWeeklyTarget(profile, user) {
  const fromProfile = String(profile?.weeklyTarget || '').match(/\d+/)?.[0]
  const fromUser = user?.profile?.trainingFrequency
  return Math.max(1, Number(fromProfile || fromUser || 4))
}

function buildCurrentWeekDays(history, weeklySchedule) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const monday = new Date(today)
  const todayDay = today.getDay() || 7
  monday.setDate(today.getDate() - todayDay + 1)

  const sessionsByDay = new Map()

  history.forEach((session) => {
    const date = getSessionDate(session)
    if (!date) return
    date.setHours(0, 0, 0, 0)

    const key = getDateKey(date)
    sessionsByDay.set(key, (sessionsByDay.get(key) || 0) + 1)
  })

  const normalizedSchedule = normalizeWeeklySchedule(weeklySchedule)

  return WEEK_DAYS.map((day, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    const key = getDateKey(date)
    const total = sessionsByDay.get(key) || 0
    const entry = normalizedSchedule[day.key] || { type: 'empty' }

    return {
      key,
      total,
      label: day.short,
      day: date.getDate(),
      isToday: key === getDateKey(today),
      planned: entry.type === 'workout',
      rest: entry.type === 'rest',
    }
  })
}

function getActiveWorkoutInfo(activeSession, completedSets, totalSets) {
  if (!activeSession) return null

  const currentExercise =
    activeSession.exercises?.find((exercise) =>
      (exercise.sets || []).some((set) => !set.completed && set.type !== 'warmup')
    ) || activeSession.exercises?.[0]

  const currentExerciseName =
    currentExercise?.exercise?.name ||
    currentExercise?.exerciseName ||
    currentExercise?.name ||
    'Proximo exercicio'

  const currentWorkingSets = (currentExercise?.sets || []).filter(
    (set) => set.type !== 'warmup'
  )
  const nextIncompleteSetIndex = currentWorkingSets.findIndex((set) => !set.completed)
  const activeSetIndex = nextIncompleteSetIndex >= 0
    ? nextIncompleteSetIndex
    : Math.max(0, currentWorkingSets.length - 1)
  const currentSetLabel = currentWorkingSets.length > 0
    ? `Serie ${activeSetIndex + 1}/${currentWorkingSets.length}`
    : `${completedSets}/${totalSets} series`
  const nextSet = currentWorkingSets[activeSetIndex]

  return {
    currentExerciseName,
    currentSetLabel,
    nextSet,
    exerciseCount: activeSession.exercises?.length || 0,
    progress: totalSets ? Math.min(100, Math.round((completedSets / totalSets) * 100)) : 0,
  }
}

function DashboardMetricCard({ icon: Icon, label, value, detail, tone = 'default' }) {
  return (
    <article className={`ff-dashboard-v2-metric is-${tone}`}>
      <div className="ff-dashboard-v2-metric__icon">
        <Icon size={18} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

function DashboardHero({
  user,
  profile,
  weeklyTarget,
  weeklyProgress,
  consistencyStats,
  lastSession,
  lastWorkoutVolume,
  loadingDashboard,
  dashboardSource,
}) {
  const firstName = getFirstName(user, profile)
  const lastWorkoutLabel = lastSession
    ? `${lastSession.workoutName || 'Treino'} - ${formatShortDate(lastSession.finishedAt)}`
    : 'Comece registrando seu primeiro treino.'

  return (
    <section className="ff-dashboard-v2-hero" data-tutorial="dashboard-hero">
      <div className="ff-dashboard-v2-hero__top">
        <div className="ff-dashboard-v2-hero__copy">
          <span className="ff-dashboard-v2-eyebrow">
            <Sparkles size={14} />
            {getGreeting()}, {firstName}
          </span>
          <h1>Seu centro de treino</h1>
          <p>{lastWorkoutLabel}</p>
        </div>

        <div
          className="ff-dashboard-v2-ring"
          style={{ '--ff-dashboard-ring-value': `${weeklyProgress}%` }}
          aria-label={`Progresso semanal ${weeklyProgress}%`}
        >
          <strong>{weeklyProgress}%</strong>
          <span>semana</span>
        </div>
      </div>

      <div className="ff-dashboard-v2-hero__stats">
        <div>
          <span>Meta</span>
          <strong>{weeklyTarget}x</strong>
        </div>
        <div>
          <span>7 dias</span>
          <strong>{toNumber(consistencyStats.workoutsLast7Days)}x</strong>
        </div>
        <div>
          <span>Ultimo volume</span>
          <strong>{formatCompactNumber(lastWorkoutVolume, 'kg')}</strong>
        </div>
      </div>

      <div className="ff-dashboard-v2-hero__footer">
        <span className={loadingDashboard ? 'is-syncing' : ''}>
          <Zap size={14} />
          {loadingDashboard ? 'Sincronizando dados' : dashboardSource === 'api' ? 'Dados online' : 'Dados locais'}
        </span>
        <Link to="/history">
          Ver historico
          <ChevronRight size={15} />
        </Link>
      </div>
    </section>
  )
}

function DashboardActiveWorkoutCard({ activeSession, elapsedSeconds, completedSets, totalSets }) {
  const navigate = useNavigate()
  const activeInfo = getActiveWorkoutInfo(activeSession, completedSets, totalSets)

  if (!activeSession || !activeInfo) return null

  return (
    <button
      type="button"
      onClick={() => navigate('/start-workout')}
      className="ff-dashboard-v2-active"
      data-tutorial="dashboard-active-workout"
    >
      <span className="ff-dashboard-v2-active__icon">
        <Dumbbell size={22} />
      </span>

      <span className="ff-dashboard-v2-active__content">
        <span className="ff-dashboard-v2-eyebrow">
          <Activity size={13} />
          Treino em andamento
        </span>
        <strong>Continuar {activeSession.workoutName || 'treino'}</strong>
        <small>{activeInfo.currentSetLabel} - {activeInfo.currentExerciseName}</small>
        <em>
          Proxima serie: {activeInfo.nextSet?.plannedDescription || activeInfo.nextSet?.description || 'registrar kg e reps'}
        </em>
      </span>

      <span className="ff-dashboard-v2-active__side">
        <strong>{formatClock(elapsedSeconds)}</strong>
        <small>{activeInfo.progress}%</small>
      </span>

      <span className="ff-dashboard-v2-active__bar">
        <i style={{ width: `${activeInfo.progress}%` }} />
      </span>
    </button>
  )
}

function DashboardTodaySummary({
  todayPlan,
  nutrition,
  dashboardGoals,
  criticalRecovery,
}) {
  const mainGoal = dashboardGoals[0]
  const plannedWorkoutName = todayPlan?.workout
    ? getWorkoutName(todayPlan.workout)
    : todayPlan?.entry?.type === 'rest'
      ? 'Descanso'
      : 'Livre'

  return (
    <section className="ff-dashboard-v2-panel ff-dashboard-v2-summary" data-tutorial="dashboard-summary">
      <div className="ff-dashboard-v2-section-title">
        <div>
          <span>Resumo de hoje</span>
          <h2>O que importa agora</h2>
        </div>
      </div>

      <div className="ff-dashboard-v2-summary__grid">
        <Link to="/schedule">
          <CalendarCheck size={17} />
          <span>Planejado</span>
          <strong>{plannedWorkoutName}</strong>
        </Link>

        <Link to="/nutrition">
          <Droplets size={17} />
          <span>Agua</span>
          <strong>{formatCompactNumber(nutrition.waterMl, 'ml')}</strong>
        </Link>

        <Link to="/nutrition">
          <Beef size={17} />
          <span>Kcal / Prot.</span>
          <strong>{nutrition.calories} / {nutrition.proteinG}g</strong>
        </Link>

        <Link to="/goals">
          <Target size={17} />
          <span>Meta</span>
          <strong>{mainGoal ? `${Math.round(toNumber(mainGoal.progressPercent))}%` : 'Criar'}</strong>
        </Link>

        <Link to="/muscle-recovery" className="is-wide">
          <Gauge size={17} />
          <span>Recuperacao critica</span>
          <strong>
            {criticalRecovery
              ? `${criticalRecovery.muscleGroup} - ${Math.round(toNumber(criticalRecovery.recoveryPercent))}%`
              : 'Sem alerta muscular'}
          </strong>
        </Link>
      </div>
    </section>
  )
}

function DashboardNextAction({
  activeSession,
  todayPlan,
  nutrition,
  criticalRecovery,
  recentPRs,
}) {
  const waterLeft = Math.max(0, toNumber(nutrition.waterGoalMl) - toNumber(nutrition.waterMl))
  let label = 'Proxima melhor acao'
  let title = 'Escolha uma acao para manter ritmo'
  let description = 'Treino, agua, meta ou recuperacao: mantenha o dia simples.'
  let to = '/workouts'
  let Icon = Zap

  if (activeSession) {
    title = 'Continue o treino ativo'
    description = 'Seu treino ainda esta aberto. Finalize as series antes de sair do ritmo.'
    to = '/start-workout'
    Icon = Dumbbell
  } else if (todayPlan?.workout) {
    title = `Hoje e dia de ${getWorkoutName(todayPlan.workout)}`
    description = `${getWorkoutExerciseCount(todayPlan.workout)} exercicio(s) planejado(s) na agenda.`
    to = '/workouts'
    Icon = CalendarCheck
  } else if (waterLeft > 0 && waterLeft <= 750) {
    title = `Faltam ${waterLeft}ml para sua meta de agua`
    description = 'Um copo agora ja fecha boa parte da meta do dia.'
    to = '/nutrition'
    Icon = Droplets
  } else if (criticalRecovery) {
    title = `Evite forcar ${criticalRecovery.muscleGroup} hoje`
    description = `Recuperacao estimada em ${Math.round(toNumber(criticalRecovery.recoveryPercent))}%.`
    to = '/muscle-recovery'
    Icon = Gauge
  } else if (recentPRs.length > 0) {
    title = `Voce esta perto de novos PRs`
    description = `${recentPRs[0]?.exerciseName || 'Um exercicio'} apareceu nos recordes recentes.`
    to = '/exercise-progress'
    Icon = Trophy
  }

  return (
    <Link to={to} className="ff-dashboard-v2-next-action" data-tutorial="dashboard-next-action">
      <span>
        <Icon size={20} />
      </span>
      <div>
        <small>{label}</small>
        <strong>{title}</strong>
        <em>{description}</em>
      </div>
      <ChevronRight size={18} />
    </Link>
  )
}

function DashboardTodayWorkout({ user, workouts, onStartWorkout }) {
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
  const todayWorkoutName = today.workout ? getWorkoutName(today.workout) : null
  const plannedExercises = Array.isArray(today.workout?.exercises) ? today.workout.exercises.length : 0

  async function handleStartTodayWorkout() {
    if (!today.workout) {
      navigate('/schedule')
      return
    }

    await onStartWorkout(today.workout)
  }

  return (
    <section className="ff-dashboard-v2-panel ff-dashboard-v2-today" data-tutorial="dashboard-today-workout">
      <div className="ff-dashboard-v2-section-title">
        <div>
          <span>Plano do dia</span>
          <h2>Treino de hoje</h2>
        </div>
        <Link to="/schedule" aria-label="Abrir agenda">
          <CalendarCheck size={18} />
        </Link>
      </div>

      <div className="ff-dashboard-v2-today__body">
        <div className="ff-dashboard-v2-today__main">
          <span className="ff-dashboard-v2-pill">
            {isLoading ? 'Atualizando' : today.day.label}
          </span>
          <h3>
            {todayWorkoutName || (today.entry?.type === 'rest' ? 'Descanso planejado' : 'Sem treino marcado')}
          </h3>
          <p>
            {todayWorkoutName
              ? `${plannedExercises} exercicio(s) na rotina.`
              : hasSchedule
                ? 'Ajuste sua semana ou aproveite para recuperar.'
                : 'Monte uma agenda semanal para o app guiar seu dia.'}
          </p>
        </div>

        <button type="button" onClick={handleStartTodayWorkout} className="ff-dashboard-v2-start">
          {today.workout ? <Play size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {nextWorkout && (
        <div className="ff-dashboard-v2-next">
          <span>Proximo</span>
          <strong>{getWorkoutName(nextWorkout.workout)}</strong>
          <small>{nextWorkout.day.label}</small>
        </div>
      )}
    </section>
  )
}

function DashboardWeekStrip({ days }) {
  const max = Math.max(1, ...days.map((day) => day.total))

  return (
    <section className="ff-dashboard-v2-panel ff-dashboard-v2-week" data-tutorial="dashboard-week">
      <div className="ff-dashboard-v2-section-title">
        <div>
          <span>Semana</span>
          <h2>Agenda e treinos</h2>
        </div>
        <Link to="/calendar">Calendario</Link>
      </div>

      <div className="ff-dashboard-v2-week__grid">
        {days.map((day) => (
          <div
            key={day.key}
            className={[
              day.total > 0 ? 'is-trained' : '',
              day.planned ? 'is-planned' : '',
              day.rest ? 'is-rest' : '',
              day.isToday ? 'is-today' : '',
            ].filter(Boolean).join(' ')}
            style={{ '--ff-day-height': `${Math.max(18, (day.total / max) * 58)}px` }}
          >
            <span>{day.label}</span>
            <div><i /></div>
            <strong>{day.day}</strong>
            <small>{day.total > 0 ? 'feito' : day.rest ? 'off' : day.planned ? 'plan' : ''}</small>
          </div>
        ))}
      </div>
    </section>
  )
}

function DashboardMiniChart({ volumeByWorkout }) {
  const chartItems = volumeByWorkout.slice(-6)
  const maxVolume = Math.max(1, ...chartItems.map((item) => toNumber(item.volume)))

  return (
    <section className="ff-dashboard-v2-panel ff-dashboard-v2-chart" data-tutorial="dashboard-metrics">
      <div className="ff-dashboard-v2-section-title">
        <div>
          <span>Performance</span>
          <h2>Volume recente</h2>
        </div>
        <Link to="/progress">
          Evolucao
          <ChevronRight size={15} />
        </Link>
      </div>

      {chartItems.length > 0 ? (
        <div className="ff-dashboard-v2-chart__bars">
          {chartItems.map((item) => (
            <div key={`${item.fullName}-${item.name}`}>
              <span>{formatCompactNumber(item.volume)}</span>
              <i style={{ '--ff-chart-height': `${Math.max(16, (toNumber(item.volume) / maxVolume) * 112)}px` }} />
              <small>{item.name}</small>
            </div>
          ))}
        </div>
      ) : (
        <div className="ff-dashboard-v2-empty">Finalize treinos para ver seu grafico aqui.</div>
      )}
    </section>
  )
}

function DashboardFocusCards({
  strongestMuscleGroup,
  heaviestExercise,
  bestVolumeSet,
  mostRecoveredMuscles,
  recentPRs,
}) {
  const readyMuscle = mostRecoveredMuscles[0]

  return (
    <section className="ff-dashboard-v2-panel ff-dashboard-v2-focus">
      <div className="ff-dashboard-v2-section-title">
        <div>
          <span>Leitura rapida</span>
          <h2>Onde focar</h2>
        </div>
      </div>

      <div className="ff-dashboard-v2-focus__list">
        <Link to="/muscle-recovery">
          <Gauge size={18} />
          <span>
            <strong>{readyMuscle?.muscleGroup || 'Recuperacao'}</strong>
            <small>{readyMuscle ? `${Math.round(toNumber(readyMuscle.recoveryPercent))}% pronto` : 'Sem dados suficientes'}</small>
          </span>
        </Link>

        <Link to="/progress">
          <TrendingUp size={18} />
          <span>
            <strong>{strongestMuscleGroup?.muscleGroup || 'Grupo lider'}</strong>
            <small>{strongestMuscleGroup ? `${strongestMuscleGroup.total} series registradas` : 'Ainda sem ranking'}</small>
          </span>
        </Link>

        <Link to="/exercise-progress">
          <Trophy size={18} />
          <span>
            <strong>{heaviestExercise?.exerciseName || bestVolumeSet?.exerciseName || 'Recordes'}</strong>
            <small>{recentPRs.length > 0 ? `${recentPRs.length} PRs recentes` : 'Registre cargas para comparar'}</small>
          </span>
        </Link>
      </div>
    </section>
  )
}

function DashboardGoalsAlerts({ dashboardGoals, dashboardNotifications, unreadNotificationsCount }) {
  return (
    <section className="ff-dashboard-v2-panel ff-dashboard-v2-goals">
      <div className="ff-dashboard-v2-section-title">
        <div>
          <span>Proximos passos</span>
          <h2>Metas e alertas</h2>
        </div>
        <Link to="/notifications">
          {unreadNotificationsCount}
          <Bell size={15} />
        </Link>
      </div>

      <div className="ff-dashboard-v2-goals__grid">
        <Link to="/goals" className="ff-dashboard-v2-goal-card">
          <Target size={18} />
          <strong>{dashboardGoals[0]?.title || dashboardGoals[0]?.name || 'Criar meta'}</strong>
          <span>{dashboardGoals[0] ? `${Math.round(toNumber(dashboardGoals[0].progressPercent))}% completo` : 'Defina seu proximo alvo'}</span>
        </Link>

        <Link to="/notifications" className="ff-dashboard-v2-goal-card">
          <Bell size={18} />
          <strong>{dashboardNotifications[0]?.title || 'Sem alerta urgente'}</strong>
          <span>{dashboardNotifications[0]?.message || 'Tudo em ordem por enquanto'}</span>
        </Link>
      </div>
    </section>
  )
}

function DashboardRecentSessions({ recentSessions }) {
  return (
    <section className="ff-dashboard-v2-panel ff-dashboard-v2-recent" data-tutorial="dashboard-recent-history">
      <div className="ff-dashboard-v2-section-title">
        <div>
          <span>Historico</span>
          <h2>Ultimos treinos</h2>
        </div>
        <Link to="/history">Ver tudo</Link>
      </div>

      <div className="ff-dashboard-v2-recent__list">
        {recentSessions.length > 0 ? (
          recentSessions.map((session) => (
            <Link to="/history" key={session.id || session._id || `${session.workoutName}-${session.finishedAt}`}>
              <span>
                <Dumbbell size={17} />
              </span>
              <strong>{session.workoutName || 'Treino'}</strong>
              <small>{formatShortDate(session.finishedAt)}</small>
              <em>{formatDuration(getSessionDuration(session))}</em>
            </Link>
          ))
        ) : (
          <div className="ff-dashboard-v2-empty">Seu historico aparece aqui depois do primeiro treino.</div>
        )}
      </div>
    </section>
  )
}

function DashboardQuickActions() {
  const actions = [
    { to: '/workouts', label: 'Treinos', icon: Dumbbell },
    { to: '/exercises', label: 'Exercicios', icon: Activity },
    { to: '/progress-photos', label: 'Fotos', icon: Sparkles },
    { to: '/nutrition', label: 'Nutricao', icon: Flame },
  ]

  return (
    <section className="ff-dashboard-v2-actions">
      {actions.map((action) => {
        const Icon = action.icon

        return (
          <Link to={action.to} key={action.to}>
            <Icon size={18} />
            <span>{action.label}</span>
          </Link>
        )
      })}
    </section>
  )
}

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const {
    activeSession,
    elapsedSeconds,
    completedSets,
    totalSets,
    startSession,
  } = useWorkoutSession()
  const [dashboardSettings, setDashboardSettings] = useState(() => getUserAppSettings(user))

  const {
    exercises,
    workouts,
    history,
    bodyWeight,
    profile,
    loadingDashboard,
    dashboardSource,
    muscleRecovery,
    goals,
    notifications,
    unreadNotificationsCount,
    consistencyStats,
  } = useDashboardData(user)

  const {
    averageDuration,
    averageVolume,
    bestVolumeSet,
    currentWeight,
    dashboardGoals,
    dashboardNotifications,
    favoriteWorkouts,
    heaviestExercise,
    lastSession,
    lastWorkoutVolume,
    mostRecoveredMuscles,
    prCount,
    profileCompletion,
    recentPRs,
    recentWorkouts,
    strongestMuscleGroup,
    totalTrainingSeconds,
    totalVolume,
    volumeByWorkout,
    volumePRCount,
    weightPRCount,
  } = useDashboardDerivedData({
    bodyWeight,
    exercises,
    goals,
    history,
    muscleRecovery,
    notifications,
    prSearch: '',
    profile,
    workouts,
  })

  useEffect(() => {
    if (!user) return undefined

    let isMounted = true
    setDashboardSettings(getUserAppSettings(user))

    async function loadDashboardSettings() {
      try {
        const remoteSettings = await apiFetch('/settings')
        if (!isMounted) return

        setDashboardSettings(saveUserAppSettings(user, {
          ...getUserAppSettings(user),
          ...remoteSettings,
        }))
      } catch {
        if (isMounted) setDashboardSettings(getUserAppSettings(user))
      }
    }

    loadDashboardSettings()

    function handleSettingsChanged(event) {
      setDashboardSettings(event.detail || getUserAppSettings(user))
    }

    window.addEventListener('forgeflow:settings-changed', handleSettingsChanged)

    return () => {
      isMounted = false
      window.removeEventListener('forgeflow:settings-changed', handleSettingsChanged)
    }
  }, [user])

  const weeklySchedule = useMemo(
    () => normalizeWeeklySchedule(dashboardSettings.weeklySchedule),
    [dashboardSettings.weeklySchedule]
  )
  const todayPlan = useMemo(
    () => getTodayScheduledWorkout({ schedule: weeklySchedule, workouts }),
    [weeklySchedule, workouts]
  )
  const nutritionToday = useMemo(() => getTodayNutrition(), [])
  const criticalRecovery = useMemo(() => {
    return muscleRecovery
      .filter((item) => Number.isFinite(Number(item.recoveryPercent)))
      .slice()
      .sort((a, b) => toNumber(a.recoveryPercent) - toNumber(b.recoveryPercent))[0] || null
  }, [muscleRecovery])
  const weeklyTarget = useMemo(() => getWeeklyTarget(profile, user), [profile, user])
  const weeklyProgress = useMemo(() => {
    return Math.min(100, Math.round((toNumber(consistencyStats.workoutsLast7Days) / weeklyTarget) * 100))
  }, [consistencyStats.workoutsLast7Days, weeklyTarget])
  const currentWeekDays = useMemo(
    () => buildCurrentWeekDays(history, weeklySchedule),
    [history, weeklySchedule]
  )
  const recentSessions = useMemo(() => history.slice(0, 3), [history])

  async function handleStartWorkout(workout) {
    try {
      if (workout?.id) {
        await apiFetch(`/workouts/${workout.id}/start`, {
          method: 'POST',
        })
      }
    } catch (error) {
      console.error(error)
    }

    startSession(workout)
    navigate('/start-workout')
  }

  return (
    <div className="ff-hevy-page ff-hevy-page-dashboard ff-dashboard-v2">
      <DashboardHero
        user={user}
        profile={profile}
        weeklyTarget={weeklyTarget}
        weeklyProgress={weeklyProgress}
        consistencyStats={consistencyStats}
        lastSession={lastSession}
        lastWorkoutVolume={lastWorkoutVolume}
        loadingDashboard={loadingDashboard}
        dashboardSource={dashboardSource}
      />

      <DashboardActiveWorkoutCard
        activeSession={activeSession}
        elapsedSeconds={elapsedSeconds}
        completedSets={completedSets}
        totalSets={totalSets}
      />

      <DashboardWeekStrip days={currentWeekDays} />

      <DashboardTodaySummary
        todayPlan={todayPlan}
        nutrition={nutritionToday}
        dashboardGoals={dashboardGoals}
        criticalRecovery={criticalRecovery}
      />

      <DashboardNextAction
        activeSession={activeSession}
        todayPlan={todayPlan}
        nutrition={nutritionToday}
        criticalRecovery={criticalRecovery}
        recentPRs={recentPRs}
      />

      <DashboardTodayWorkout
        user={user}
        workouts={workouts}
        onStartWorkout={handleStartWorkout}
      />

      <section className="ff-dashboard-v2-metrics">
        <DashboardMetricCard
          icon={CalendarCheck}
          label="Treinos"
          value={history.length}
          detail={`${toNumber(consistencyStats.currentStreak)} dias de sequencia`}
          tone="accent"
        />
        <DashboardMetricCard
          icon={Weight}
          label="Volume"
          value={formatCompactNumber(totalVolume, 'kg')}
          detail={`${formatCompactNumber(averageVolume, 'kg')} media`}
        />
        <DashboardMetricCard
          icon={Medal}
          label="Recordes"
          value={prCount}
          detail={`${weightPRCount} carga / ${volumePRCount} volume`}
        />
        <DashboardMetricCard
          icon={Activity}
          label="Corpo"
          value={currentWeight ? `${currentWeight}kg` : `${profileCompletion}%`}
          detail={currentWeight ? `${formatDuration(totalTrainingSeconds)} treinando` : 'perfil completo'}
        />
      </section>

      <details className="ff-dashboard-v2-advanced">
        <summary>
          <span>
            <TrendingUp size={17} />
            Estatisticas avancadas
          </span>
          <ChevronRight size={17} />
        </summary>

        <div className="ff-dashboard-v2-advanced__content">
          <DashboardMiniChart volumeByWorkout={volumeByWorkout} />

          <DashboardFocusCards
            strongestMuscleGroup={strongestMuscleGroup}
            heaviestExercise={heaviestExercise}
            bestVolumeSet={bestVolumeSet}
            mostRecoveredMuscles={mostRecoveredMuscles}
            recentPRs={recentPRs}
          />
        </div>
      </details>

      <DashboardGoalsAlerts
        dashboardGoals={dashboardGoals}
        dashboardNotifications={dashboardNotifications}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <section className="ff-dashboard-v2-panel ff-dashboard-v2-routines">
        <div className="ff-dashboard-v2-section-title">
          <div>
            <span>Rotinas</span>
            <h2>Acesso rapido</h2>
          </div>
          <Link to="/workouts">Todas</Link>
        </div>

        <div className="ff-dashboard-v2-routines__rail">
          {(favoriteWorkouts.length > 0 ? favoriteWorkouts : recentWorkouts).slice(0, 4).map((workout) => (
            <button
              type="button"
              key={workout.id || workout._id || workout.name}
              onClick={() => handleStartWorkout(workout)}
            >
              <Play size={16} />
              <strong>{getWorkoutName(workout)}</strong>
              <span>{Array.isArray(workout.exercises) ? workout.exercises.length : 0} exercicios</span>
            </button>
          ))}

          {workouts.length === 0 && (
            <Link to="/workouts" className="ff-dashboard-v2-routine-empty">
              <Plus size={18} />
              Criar rotina
            </Link>
          )}
        </div>
      </section>

      <DashboardRecentSessions recentSessions={recentSessions} />

      <DashboardQuickActions />

      <div className="ff-dashboard-v2-bottom-note">
        <span>Tempo medio</span>
        <strong>{formatDuration(averageDuration)}</strong>
        <small>{getSessionExerciseCount(lastSession)} exercicios no ultimo treino</small>
      </div>
    </div>
  )
}

export default Dashboard
