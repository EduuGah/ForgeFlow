import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Dumbbell, Flame } from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import { getUserStorageData, saveUserStorageData } from '../utils/userStorage'
import { getCompletedSets, getTotalVolume } from '../utils/analyticsUtils'

import AppPageIntro from '../components/app/AppPageIntro'

function toDateKey(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function getSessionDate(session = {}) {
  return session.finishedAt || session.completedAt || session.date || session.createdAt || session.startedAt
}

function formatDate(value) {
  if (!value) return 'Sem data'
  return new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatShortDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
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
  return `${Number(value || 0).toLocaleString('pt-BR')} kg`
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const firstWeekDay = firstDay.getDay()
  const totalDays = lastDay.getDate()
  const days = []

  for (let i = 0; i < firstWeekDay; i += 1) days.push(null)
  for (let day = 1; day <= totalDays; day += 1) days.push(new Date(year, month, day))
  while (days.length % 7 !== 0) days.push(null)
  return days
}

function WorkoutCalendar() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [source, setSource] = useState('local')
  const [loading, setLoading] = useState(true)
  const [selectedDateKey, setSelectedDateKey] = useState('')
  const [currentMonth, setCurrentMonth] = useState(() => new Date())

  useEffect(() => {
    if (!user) return undefined
    let isMounted = true

    async function loadHistory() {
      const cachedHistory = getUserStorageData(user, 'history', [])
      if (isMounted) {
        setHistory(Array.isArray(cachedHistory) ? cachedHistory : [])
        setSource('local')
        setLoading(true)
      }

      try {
        const data = await apiFetch('/workout-history')
        if (!isMounted) return
        const normalizedHistory = Array.isArray(data) ? data : data?.history || []
        setHistory(normalizedHistory)
        saveUserStorageData(user, 'history', normalizedHistory)
        setSource('database')
      } catch (error) {
        console.error(error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadHistory()
    return () => { isMounted = false }
  }, [user])

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

  const monthSessions = useMemo(() => history.filter((session) => {
    const date = new Date(getSessionDate(session))
    return date.getFullYear() === year && date.getMonth() === month
  }), [history, year, month])

  const monthStats = useMemo(() => {
    const monthSets = getCompletedSets(monthSessions)
    const totalVolume = getTotalVolume(monthSets)
    const totalDuration = monthSessions.reduce((total, session) => total + Number(session.durationSeconds || session.duration || 0), 0)
    const trainedDays = new Set(monthSessions.map((session) => toDateKey(getSessionDate(session)))).size
    return { totalWorkouts: monthSessions.length, trainedDays, totalVolume, totalDuration }
  }, [monthSessions])

  function changeMonth(direction) {
    setCurrentMonth((current) => {
      const next = new Date(current)
      next.setMonth(current.getMonth() + direction)
      return next
    })
    setSelectedDateKey('')
  }

  const monthLabel = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="ff-hevy-page ff-hevy-page-workoutcalendar">

      <AppPageIntro
        eyebrow="Calendário"
        title="Treinos no mês"
        description="Visualize os dias treinados sem cara de tabela web."
        metrics={[
          { label: 'Treinos', value: history.length },
          { label: 'Mês', value: monthLabel },
          { label: 'Fonte', value: source === 'database' ? 'API' : 'Local' },
        ]}
      />
      <PageHeader
        title="Calendário"
        description="Veja seus dias treinados e os treinos feitos em cada data."
        action={<Badge variant={source === 'database' ? 'purple' : 'default'}>{loading ? 'Carregando' : source === 'database' ? 'Sincronizado' : 'Local'}</Badge>}
      />

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--ff-accent-text)]">Mês selecionado</p>
              <h2 className="mt-1 text-2xl font-black capitalize text-[var(--ff-text)]">{monthLabel}</h2>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button type="button" variant="secondary" onClick={() => changeMonth(-1)}><ChevronLeft size={17} />Anterior</Button>
              <Button type="button" variant="secondary" onClick={() => changeMonth(1)}>Próximo<ChevronRight size={17} /></Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-2 text-center" data-calendar>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="text-[10px] font-black uppercase tracking-wide text-[var(--ff-muted)] sm:text-[11px]">{day}</div>
            ))}

            {days.map((day, index) => {
              const key = day ? toDateKey(day) : `empty-${index}`
              const sessions = day ? sessionsByDate.get(toDateKey(day)) || [] : []
              const isSelected = day && selectedDateKey === toDateKey(day)
              const isToday = day && toDateKey(day) === toDateKey(new Date())

              return (
                <button
                  key={key}
                  type="button"
                  disabled={!day}
                  onClick={() => day && setSelectedDateKey(toDateKey(day))}
                  className={[
                    'min-h-[58px] rounded-2xl border p-2 text-left transition sm:min-h-[88px]',
                    !day ? 'border-transparent opacity-0' : isSelected ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] shadow-[0_0_22px_var(--ff-accent-shadow)]/20' : sessions.length > 0 ? 'border-[var(--ff-accent-border)]/40 bg-[var(--ff-card)] hover:bg-[var(--ff-card-hover)]' : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] hover:bg-[var(--ff-card-hover)]',
                  ].join(' ')}
                >
                  {day && (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className={isToday ? 'flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ff-accent)] text-xs font-black text-white' : 'text-sm font-black text-[var(--ff-text)]'}>{day.getDate()}</span>
                        {sessions.length > 0 && <span className="rounded-full bg-[var(--ff-accent)] px-2 py-0.5 text-[10px] font-black text-white">{sessions.length}</span>}
                      </div>
                      {sessions.length > 0 && <div className="mt-3 space-y-1"><div className="h-1.5 rounded-full bg-[var(--ff-accent)]" /><p className="hidden line-clamp-1 text-[11px] font-bold text-[var(--ff-muted)] sm:block">{sessions[0].workoutName || sessions[0].name || 'Treino'}</p></div>}
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </Card>

        <aside className="space-y-5">
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]"><CalendarDays size={22} /></div>
              <div><h2 className="text-lg font-black text-[var(--ff-text)]">Resumo do mês</h2><p className="text-sm capitalize text-[var(--ff-muted)]">{monthLabel}</p></div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3"><Dumbbell size={18} className="text-[var(--ff-accent-text)]" /><p className="mt-2 text-xl font-black text-[var(--ff-text)]">{monthStats.totalWorkouts}</p><p className="text-xs text-[var(--ff-muted)]">treinos</p></div>
              <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3"><CalendarDays size={18} className="text-[var(--ff-accent-text)]" /><p className="mt-2 text-xl font-black text-[var(--ff-text)]">{monthStats.trainedDays}</p><p className="text-xs text-[var(--ff-muted)]">dias</p></div>
              <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3"><Flame size={18} className="text-orange-300" /><p className="mt-2 text-sm font-black text-[var(--ff-text)]">{formatVolume(monthStats.totalVolume)}</p><p className="text-xs text-[var(--ff-muted)]">volume</p></div>
              <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3"><Clock size={18} className="text-emerald-300" /><p className="mt-2 text-sm font-black text-[var(--ff-text)]">{formatDuration(monthStats.totalDuration)}</p><p className="text-xs text-[var(--ff-muted)]">tempo</p></div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-black text-[var(--ff-text)]">{selectedDateKey ? formatDate(selectedDateKey) : 'Selecione um dia'}</h2>
            <div className="mt-4 space-y-3">
              {selectedDateKey && selectedSessions.length === 0 && <EmptyState title="Sem treino neste dia" description="Nenhum treino finalizado foi encontrado nessa data." />}
              {!selectedDateKey && <EmptyState title="Escolha uma data" description="Clique em um dia do calendário para ver os treinos." />}
              {selectedSessions.map((session) => {
                const sets = getCompletedSets([session])
                return (
                  <div key={session.id || session._id || `${session.workoutName}-${getSessionDate(session)}`} className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                    <p className="font-black text-[var(--ff-text)]">{session.workoutName || session.name || 'Treino'}</p>
                    <p className="mt-1 text-xs text-[var(--ff-muted)]">{formatShortDate(getSessionDate(session))} • {formatDuration(session.durationSeconds || session.duration || 0)} • {sets.length} séries</p>
                    <p className="mt-2 text-xs font-bold text-[var(--ff-accent-text)]">{formatVolume(getTotalVolume(sets))}</p>
                  </div>
                )
              })}
            </div>
          </Card>
        </aside>
      </section>
    </div>
  )
}

export default WorkoutCalendar
