import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  Bell,
  CalendarCheck,
  ChevronRight,
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
} from '../utils/workoutScheduleUtils'

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

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

function buildLastSevenDays(history) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sessionsByDay = new Map()

  history.forEach((session) => {
    const date = getSessionDate(session)
    if (!date) return
    date.setHours(0, 0, 0, 0)

    const key = getDateKey(date)
    sessionsByDay.set(key, (sessionsByDay.get(key) || 0) + 1)
  })

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    const key = getDateKey(date)
    const total = sessionsByDay.get(key) || 0

    return {
      key,
      total,
      label: DAY_LABELS[date.getDay()],
      day: date.getDate(),
      isToday: key === getDateKey(today),
    }
  })
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
    <section className="ff-dashboard-v2-hero">
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
    <section className="ff-dashboard-v2-panel ff-dashboard-v2-today">
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
    <section className="ff-dashboard-v2-panel ff-dashboard-v2-week">
      <div className="ff-dashboard-v2-section-title">
        <div>
          <span>Consistencia</span>
          <h2>Ultimos 7 dias</h2>
        </div>
        <Link to="/calendar">Calendario</Link>
      </div>

      <div className="ff-dashboard-v2-week__grid">
        {days.map((day) => (
          <div
            key={day.key}
            className={day.total > 0 ? 'is-trained' : day.isToday ? 'is-today' : ''}
            style={{ '--ff-day-height': `${Math.max(18, (day.total / max) * 58)}px` }}
          >
            <span>{day.label}</span>
            <div><i /></div>
            <strong>{day.day}</strong>
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
    <section className="ff-dashboard-v2-panel ff-dashboard-v2-chart">
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
    <section className="ff-dashboard-v2-panel ff-dashboard-v2-recent">
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
  const { startSession } = useWorkoutSession()

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

  const weeklyTarget = useMemo(() => getWeeklyTarget(profile, user), [profile, user])
  const weeklyProgress = useMemo(() => {
    return Math.min(100, Math.round((toNumber(consistencyStats.workoutsLast7Days) / weeklyTarget) * 100))
  }, [consistencyStats.workoutsLast7Days, weeklyTarget])
  const lastSevenDays = useMemo(() => buildLastSevenDays(history), [history])
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

      <DashboardWeekStrip days={lastSevenDays} />

      <DashboardMiniChart volumeByWorkout={volumeByWorkout} />

      <DashboardFocusCards
        strongestMuscleGroup={strongestMuscleGroup}
        heaviestExercise={heaviestExercise}
        bestVolumeSet={bestVolumeSet}
        mostRecoveredMuscles={mostRecoveredMuscles}
        recentPRs={recentPRs}
      />

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
