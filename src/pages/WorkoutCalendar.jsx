import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock,
  Dumbbell,
  Flame,
  MapPin,
  Moon,
  RotateCcw,
  Sparkles,
  Trophy,
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import { formatLocationLabel, getMapsUrl } from '../services/geolocationService'
import { loadScheduleSettings } from '../services/workoutScheduleService'
import { getUserStorageData, saveUserStorageData } from '../utils/userStorage'
import { getCompletedSets, getPRCount, getTotalVolume } from '../utils/analyticsUtils'
import { getTodayScheduleKey, normalizeWeeklySchedule } from '../utils/workoutScheduleUtils'

import AppPageIntro from '../components/app/AppPageIntro'

const WEEK_LABELS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

function parseLocalDate(value) {
  if (!value) return null

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0, 0)
  }

  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split('-').map(Number)
    return new Date(year, month - 1, day, 12, 0, 0, 0)
  }

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return null

  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0)
}

function toDateKey(value) {
  const date = parseLocalDate(value)
  if (!date) return ''

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function getSessionDate(session = {}) {
  return session.finishedAt || session.completedAt || session.date || session.createdAt || session.startedAt
}

function getWorkoutName(session = {}) {
  return session.workoutName || session.name || session.title || 'Treino'
}

function getDurationSeconds(session = {}) {
  return Number(session.durationSeconds || session.duration || 0) || 0
}

function formatDate(value, options = {}) {
  const date = parseLocalDate(value)
  if (!date) return 'Sem data'

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...options,
  })
}

function formatShortDate(value) {
  const date = parseLocalDate(value)
  if (!date) return '—'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function formatDuration(seconds = 0) {
  const totalSeconds = Number(seconds || 0)
  if (!totalSeconds) return '0min'
  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}min` : `${hours}h`
}

function formatVolume(value = 0) {
  const number = Number(value || 0)
  const formatted = Math.abs(number) >= 10000
    ? new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(number)
    : number.toLocaleString('pt-BR')

  return `${formatted} kg`
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1, 12, 0, 0, 0)
  const lastDay = new Date(year, month + 1, 0, 12, 0, 0, 0)
  const firstWeekDay = firstDay.getDay()
  const totalDays = lastDay.getDate()
  const days = []

  for (let i = 0; i < firstWeekDay; i += 1) days.push(null)
  for (let day = 1; day <= totalDays; day += 1) days.push(new Date(year, month, day, 12, 0, 0, 0))
  while (days.length % 7 !== 0) days.push(null)
  return days
}

function getMonthSessionFilter(year, month) {
  return (session) => {
    const date = parseLocalDate(getSessionDate(session))
    return date?.getFullYear() === year && date?.getMonth() === month
  }
}

function getSessionSummary(session) {
  const sets = getCompletedSets([session])
  const prCount = getPRCount(sets)
  const totalVolume = session.totalVolume ? Number(session.totalVolume || 0) : getTotalVolume(sets)
  const exerciseCount = Array.isArray(session.exercises) ? session.exercises.length : 0

  return {
    sets,
    prCount,
    totalVolume,
    exerciseCount,
    duration: getDurationSeconds(session),
  }
}

function getDayAggregate(sessions = []) {
  const sets = getCompletedSets(sessions)
  const duration = sessions.reduce((total, session) => total + getDurationSeconds(session), 0)
  const exerciseCount = sessions.reduce((total, session) => total + (Array.isArray(session.exercises) ? session.exercises.length : 0), 0)
  const totalVolumeFromSessions = sessions.reduce((total, session) => total + Number(session.totalVolume || 0), 0)

  return {
    workouts: sessions.length,
    sets: sets.length,
    duration,
    exerciseCount,
    prCount: getPRCount(sets),
    totalVolume: totalVolumeFromSessions || getTotalVolume(sets),
  }
}


function getActiveWorkoutStreak(history = []) {
  const trainedDays = new Set(history.map((session) => toDateKey(getSessionDate(session))).filter(Boolean))
  let cursor = parseLocalDate(new Date())
  let streak = 0

  while (cursor) {
    const key = toDateKey(cursor)
    if (!trainedDays.has(key)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function getBestDay(monthSessions = []) {
  const byDate = new Map()

  monthSessions.forEach((session) => {
    const key = toDateKey(getSessionDate(session))
    if (!key) return
    byDate.set(key, [...(byDate.get(key) || []), session])
  })

  return Array.from(byDate.entries())
    .map(([key, sessions]) => ({ key, ...getDayAggregate(sessions) }))
    .sort((a, b) => b.totalVolume - a.totalVolume)[0]
}

function MonthSummaryCard({ icon: Icon, label, value, detail, tone = 'default' }) {
  return (
    <Card className={`ff-calendar-stat-card is-${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
      <Icon size={20} />
    </Card>
  )
}

function WorkoutCalendar() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [weeklySchedule, setWeeklySchedule] = useState({})
  const [source, setSource] = useState('local')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()))
  const [currentMonth, setCurrentMonth] = useState(() => new Date())

  useEffect(() => {
    if (!user) return undefined
    let isMounted = true

    async function loadCalendarData() {
      const cachedHistory = getUserStorageData(user, 'history', [])

      if (isMounted) {
        setHistory(Array.isArray(cachedHistory) ? cachedHistory : [])
        setSource('local')
        setLoading(true)
        setErrorMessage('')
      }

      const [historyResult, settingsResult] = await Promise.allSettled([
        apiFetch('/workout-history'),
        loadScheduleSettings(user),
      ])

      if (!isMounted) return

      if (historyResult.status === 'fulfilled') {
        const normalizedHistory = Array.isArray(historyResult.value)
          ? historyResult.value
          : historyResult.value?.history || []
        setHistory(normalizedHistory)
        saveUserStorageData(user, 'history', normalizedHistory)
        setSource('database')
      } else {
        console.error(historyResult.reason)
        setErrorMessage('Não consegui atualizar o histórico agora. Exibindo dados salvos no aparelho.')
      }

      if (settingsResult.status === 'fulfilled') {
        setWeeklySchedule(settingsResult.value?.weeklySchedule || {})
      }

      setLoading(false)
    }

    loadCalendarData().catch((error) => {
      console.error(error)
      if (isMounted) {
        setLoading(false)
        setErrorMessage('Não foi possível carregar o calendário agora.')
      }
    })

    return () => { isMounted = false }
  }, [user])

  const normalizedSchedule = useMemo(() => normalizeWeeklySchedule(weeklySchedule), [weeklySchedule])

  const sessionsByDate = useMemo(() => {
    const map = new Map()
    history.forEach((session) => {
      const key = toDateKey(getSessionDate(session))
      if (!key) return
      const current = map.get(key) || []
      current.push(session)
      map.set(key, current)
    })
    return map
  }, [history])

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const days = useMemo(() => getCalendarDays(year, month), [year, month])
  const selectedSessions = sessionsByDate.get(selectedDateKey) || []
  const selectedDate = selectedDateKey ? parseLocalDate(selectedDateKey) : null
  const selectedEntry = selectedDate ? normalizedSchedule[getTodayScheduleKey(selectedDate)] || { type: 'empty' } : { type: 'empty' }
  const selectedAggregate = useMemo(() => getDayAggregate(selectedSessions), [selectedSessions])

  const monthSessions = useMemo(() => history.filter(getMonthSessionFilter(year, month)), [history, year, month])

  const monthStats = useMemo(() => {
    const monthSets = getCompletedSets(monthSessions)
    const totalVolumeFromSessions = monthSessions.reduce((total, session) => total + Number(session.totalVolume || 0), 0)
    const totalVolume = totalVolumeFromSessions || getTotalVolume(monthSets)
    const totalDuration = monthSessions.reduce((total, session) => total + getDurationSeconds(session), 0)
    const trainedDays = new Set(monthSessions.map((session) => toDateKey(getSessionDate(session))).filter(Boolean)).size
    const prCount = getPRCount(monthSets)
    const scheduledRestDays = days.filter((day) => day && normalizedSchedule[getTodayScheduleKey(day)]?.type === 'rest').length
    const bestDay = getBestDay(monthSessions)
    const streak = getActiveWorkoutStreak(history)

    return {
      totalWorkouts: monthSessions.length,
      trainedDays,
      totalVolume,
      totalDuration,
      prCount,
      scheduledRestDays,
      bestDay,
      streak,
    }
  }, [days, history, monthSessions, normalizedSchedule])

  function changeMonth(direction) {
    setCurrentMonth((current) => {
      const next = new Date(current.getFullYear(), current.getMonth() + direction, 1, 12, 0, 0, 0)
      return next
    })
    setSelectedDateKey('')
  }

  function goToCurrentMonth() {
    const today = new Date()
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0, 0))
    setSelectedDateKey(toDateKey(today))
  }

  const monthLabel = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const prevMonthLabel = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long' })
  const nextMonthLabel = new Date(year, month + 1, 1).toLocaleDateString('pt-BR', { month: 'long' })
  const selectedHasWorkout = selectedSessions.length > 0
  const selectedHasPlan = selectedEntry.type === 'workout' || selectedEntry.type === 'rest'

  return (
    <div className="ff-hevy-page ff-hevy-page-workoutcalendar ff-calendar-page">
      <AppPageIntro
        eyebrow="Calendário"
        title="Veja sua consistência e treinos do mês"
        description="Dias treinados, PRs, descanso planejado e histórico em uma visão mobile-first."
        metrics={[
          { label: monthLabel.split(' ')[0], value: `${monthStats.totalWorkouts} treinos` },
          { label: 'PRs', value: monthStats.prCount },
          { label: 'Dias ativos', value: monthStats.trainedDays },
        ]}
      />

      <PageHeader
        title="Calendário"
        description="Toque em um dia para ver detalhes, volume, PRs e atalhos para o histórico."
        action={<Badge variant={source === 'database' ? 'purple' : 'default'}>{loading ? 'Carregando' : source === 'database' ? 'Sincronizado' : 'Offline'}</Badge>}
      />

      {errorMessage && (
        <Card className="ff-calendar-alert-card">
          <AlertMessage message={errorMessage} />
        </Card>
      )}

      <section className="ff-calendar-stats-grid" aria-label="Resumo do mês">
        <MonthSummaryCard icon={Dumbbell} label="Treinos" value={monthStats.totalWorkouts} detail={`${monthStats.trainedDays} dias ativos`} tone="accent" />
        <MonthSummaryCard icon={Flame} label="Sequência" value={`${monthStats.streak} dia${monthStats.streak === 1 ? '' : 's'}`} detail={monthStats.bestDay ? `melhor dia: ${formatShortDate(monthStats.bestDay.key)}` : 'sem volume no mês'} tone="warning" />
        <MonthSummaryCard icon={Trophy} label="PRs" value={monthStats.prCount} detail="recordes no mês" tone="success" />
        <MonthSummaryCard icon={Clock} label="Volume" value={formatVolume(monthStats.totalVolume)} detail={formatDuration(monthStats.totalDuration)} tone="accent" />
      </section>

      <section className="ff-calendar-layout">
        <Card className="ff-calendar-month-card">
          <div className="ff-calendar-month-toolbar">
            <button type="button" onClick={() => changeMonth(-1)} aria-label={`Ir para ${prevMonthLabel}`}>
              <ChevronLeft size={17} />
              <span>{prevMonthLabel}</span>
            </button>

            <div>
              <p>Mês selecionado</p>
              <h2>{monthLabel}</h2>
            </div>

            <button type="button" onClick={() => changeMonth(1)} aria-label={`Ir para ${nextMonthLabel}`}>
              <span>{nextMonthLabel}</span>
              <ChevronRight size={17} />
            </button>
          </div>

          <button type="button" className="ff-calendar-today-button" onClick={goToCurrentMonth}>
            <RotateCcw size={15} />
            Voltar para hoje
          </button>

          {loading && monthSessions.length === 0 ? (
            <div className="ff-calendar-loading-state">
              <CalendarDays size={26} />
              <p>Carregando calendário...</p>
            </div>
          ) : (
            <div className="ff-calendar-grid" data-calendar>
              {WEEK_LABELS.map((day) => (
                <div key={day} className="ff-calendar-weekday">{day}</div>
              ))}

              {days.map((day, index) => {
                const dayKey = day ? toDateKey(day) : `empty-${index}`
                const sessions = day ? sessionsByDate.get(dayKey) || [] : []
                const aggregate = getDayAggregate(sessions)
                const scheduleEntry = day ? normalizedSchedule[getTodayScheduleKey(day)] || { type: 'empty' } : { type: 'empty' }
                const isSelected = day && selectedDateKey === dayKey
                const isToday = day && dayKey === toDateKey(new Date())
                const hasWorkout = sessions.length > 0
                const hasPr = aggregate.prCount > 0
                const isRest = !hasWorkout && scheduleEntry.type === 'rest'
                const isPlannedWorkout = !hasWorkout && scheduleEntry.type === 'workout'

                return (
                  <button
                    key={dayKey}
                    type="button"
                    disabled={!day}
                    onClick={() => day && setSelectedDateKey(dayKey)}
                    className={[
                      'ff-calendar-day-button',
                      !day ? 'is-empty' : '',
                      isSelected ? 'is-selected' : '',
                      isToday ? 'is-today' : '',
                      hasWorkout ? 'has-workout' : '',
                      hasPr ? 'has-pr' : '',
                      isRest ? 'is-rest' : '',
                      isPlannedWorkout ? 'is-planned' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    {day && (
                      <>
                        <span className="ff-calendar-day-number">{day.getDate()}</span>
                        <span className="ff-calendar-day-markers">
                          {hasWorkout && <i className="is-workout" aria-label="Dia com treino" />}
                          {hasPr && <i className="is-pr" aria-label="Dia com PR">PR</i>}
                          {isRest && <i className="is-rest" aria-label="Descanso planejado"><Moon size={10} /></i>}
                          {isPlannedWorkout && <i className="is-planned" aria-label="Treino planejado"><CircleDot size={10} /></i>}
                        </span>
                        {hasWorkout && <strong>{sessions.length}</strong>}
                        {hasWorkout && <small>{getWorkoutName(sessions[0])}</small>}
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {!loading && monthSessions.length === 0 && (
            <div className="ff-calendar-month-empty">
              <EmptyState
                title="Mês sem treinos registrados"
                description="Quando você concluir treinos, os dias ativos, PRs e volume aparecem aqui automaticamente."
              />
            </div>
          )}
        </Card>

        <aside className="ff-calendar-side-panel">
          <Card className="ff-calendar-day-card">
            <div className="ff-calendar-day-card__head">
              <div>
                <p>Dia selecionado</p>
                <h2>{selectedDateKey ? formatDate(selectedDateKey) : 'Selecione um dia'}</h2>
              </div>
              {selectedAggregate.prCount > 0 && <Badge variant="yellow">{selectedAggregate.prCount} PR</Badge>}
            </div>

            {selectedDateKey && selectedHasPlan && (
              <div className={selectedEntry.type === 'rest' ? 'ff-calendar-plan-card is-rest' : 'ff-calendar-plan-card'}>
                {selectedEntry.type === 'rest' ? <Moon size={18} /> : <Dumbbell size={18} />}
                <div>
                  <strong>{selectedEntry.type === 'rest' ? 'Descanso planejado' : selectedEntry.workoutName || 'Treino planejado'}</strong>
                  <span>{selectedEntry.type === 'rest' ? 'Use o dia para recuperar.' : `${selectedEntry.time || 'Horário não definido'} na agenda semanal.`}</span>
                </div>
              </div>
            )}

            {selectedDateKey && selectedHasWorkout && (
              <div className="ff-calendar-day-kpis">
                <span><strong>{formatDuration(selectedAggregate.duration)}</strong><small>Duração</small></span>
                <span><strong>{formatVolume(selectedAggregate.totalVolume)}</strong><small>Volume</small></span>
                <span><strong>{selectedAggregate.exerciseCount}</strong><small>Exercícios</small></span>
                <span><strong>{selectedAggregate.prCount}</strong><small>PRs</small></span>
              </div>
            )}

            <div className="ff-calendar-day-sessions">
              {selectedDateKey && !selectedHasWorkout && !selectedHasPlan && (
                <EmptyState title="Nenhum treino registrado" description="Use este dia para planejar ou descansar. Toque em Agenda para ajustar seus treinos da semana." />
              )}

              {!selectedDateKey && <EmptyState title="Escolha uma data" description="Clique em um dia do calendário para ver os treinos e os detalhes." />}

              {selectedSessions.map((session) => {
                const summary = getSessionSummary(session)
                const mapsUrl = getMapsUrl(session.location)

                return (
                  <article key={session.id || session._id || `${getWorkoutName(session)}-${getSessionDate(session)}`} className="ff-calendar-session-card">
                    <div className="ff-calendar-session-card__top">
                      <div>
                        <p>{getWorkoutName(session)}</p>
                        <span>{formatShortDate(getSessionDate(session))} • {formatDuration(summary.duration)} • {summary.sets.length} séries</span>
                      </div>
                      {summary.prCount > 0 && <Badge variant="yellow">{summary.prCount} PR</Badge>}
                    </div>

                    <div className="ff-calendar-session-card__stats">
                      <span>{formatVolume(summary.totalVolume)}</span>
                      <span>{summary.exerciseCount} exercícios</span>
                    </div>

                    {mapsUrl && (
                      <a href={mapsUrl} target="_blank" rel="noreferrer" className="ff-calendar-location-link">
                        <MapPin size={14} />
                        {formatLocationLabel(session.location)}
                      </a>
                    )}
                  </article>
                )
              })}
            </div>

            <div className="ff-calendar-day-actions">
              <Link to={selectedDateKey ? `/history?date=${selectedDateKey}` : '/history'}>
                Ver histórico
              </Link>
              <Link to="/schedule">
                Ver agenda
              </Link>
            </div>
          </Card>
        </aside>
      </section>
    </div>
  )
}

function AlertMessage({ message }) {
  return (
    <div className="ff-calendar-alert-message">
      <Sparkles size={18} />
      <span>{message}</span>
    </div>
  )
}

export default WorkoutCalendar
