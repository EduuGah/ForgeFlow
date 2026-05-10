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
import { formatDuration, formatVolume } from '../utils/chartUtils'
import { getCompletedSets, getSessionDate, getSessionDuration, getTotalVolume, getWorkoutName } from '../utils/analyticsUtils'

function normalizeApiArray(data, key) { return Array.isArray(data) ? data : Array.isArray(data?.[key]) ? data[key] : [] }
function toDateKey(value) { if (!value) return ''; const date = new Date(value); if (Number.isNaN(date.getTime())) return ''; return date.toISOString().slice(0, 10) }
function formatDate(value) { if (!value) return 'Sem data'; return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) }
function getCalendarDays(year, month) { const firstDay = new Date(year, month, 1); const lastDay = new Date(year, month + 1, 0); const days = []; for (let i = 0; i < firstDay.getDay(); i += 1) days.push(null); for (let day = 1; day <= lastDay.getDate(); day += 1) days.push(new Date(year, month, day)); while (days.length % 7 !== 0) days.push(null); return days }
function sessionVolume(session) { return getTotalVolume(getCompletedSets([session])) }

function WorkoutCalendar() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [source, setSource] = useState('local')
  const [loading, setLoading] = useState(true)
  const [selectedDateKey, setSelectedDateKey] = useState('')
  const [currentMonth, setCurrentMonth] = useState(() => new Date())

  useEffect(() => {
    if (!user) return undefined
    let mounted = true
    const cached = getUserStorageData(user, 'workoutHistory', [])
    setHistory(Array.isArray(cached) ? cached : [])
    async function load() {
      setLoading(true)
      try {
        const data = await apiFetch('/workout-history')
        if (!mounted) return
        const value = normalizeApiArray(data, 'history')
        setHistory(value)
        saveUserStorageData(user, 'workoutHistory', value)
        setSource('database')
      } catch (error) { console.error(error) } finally { if (mounted) setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [user])

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const days = useMemo(() => getCalendarDays(year, month), [year, month])
  const sessionsByDate = useMemo(() => { const map = new Map(); history.forEach((session) => { const key = toDateKey(getSessionDate(session)); if (!key) return; const current = map.get(key) || []; current.push(session); map.set(key, current) }); return map }, [history])
  const selectedSessions = sessionsByDate.get(selectedDateKey) || []
  const monthSessions = useMemo(() => history.filter((session) => { const date = new Date(getSessionDate(session)); return date.getFullYear() === year && date.getMonth() === month }), [history, year, month])
  const monthStats = useMemo(() => ({ totalWorkouts: monthSessions.length, trainedDays: new Set(monthSessions.map((session) => toDateKey(getSessionDate(session)))).size, totalVolume: monthSessions.reduce((total, session) => total + sessionVolume(session), 0), totalDuration: monthSessions.reduce((total, session) => total + getSessionDuration(session), 0) }), [monthSessions])
  const monthLabel = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  function changeMonth(amount) { setCurrentMonth((current) => { const next = new Date(current); next.setMonth(next.getMonth() + amount); return next }); setSelectedDateKey('') }

  return <>
    <PageHeader title="Calendário" description="Veja seus dias treinados e os treinos feitos em cada data." action={<Badge variant={source === 'database' ? 'purple' : 'default'}>{loading ? 'Carregando' : source === 'database' ? 'Sincronizado' : 'Local'}</Badge>} />
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--ff-accent-text)]">Mês selecionado</p><h2 className="mt-1 text-2xl font-black capitalize text-[var(--ff-text)]">{monthLabel}</h2></div><div className="flex gap-2"><Button variant="secondary" onClick={() => changeMonth(-1)}><ChevronLeft size={17} />Anterior</Button><Button variant="secondary" onClick={() => changeMonth(1)}>Próximo<ChevronRight size={17} /></Button></div></div>
        <div className="mt-6 grid grid-cols-7 gap-2 text-center" data-calendar>{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((day) => <div key={day} className="text-[11px] font-black uppercase tracking-wide text-[var(--ff-muted)]">{day}</div>)}{days.map((day, index) => { const key = day ? toDateKey(day) : `empty-${index}`; const sessions = day ? sessionsByDate.get(toDateKey(day)) || [] : []; const isSelected = day && selectedDateKey === toDateKey(day); const isToday = day && toDateKey(day) === toDateKey(new Date()); return <button key={key} type="button" disabled={!day} onClick={() => day && setSelectedDateKey(toDateKey(day))} className={['min-h-[70px] rounded-2xl border p-2 text-left transition sm:min-h-[88px]', !day ? 'border-transparent opacity-0' : isSelected ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] shadow-[0_0_22px_var(--ff-accent-shadow)]/20' : sessions.length > 0 ? 'border-[var(--ff-accent-border)]/40 bg-[var(--ff-card)] hover:bg-[var(--ff-card-hover)]' : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] hover:bg-[var(--ff-card-hover)]'].join(' ')}>{day && <><div className="flex items-center justify-between gap-2"><span className={isToday ? 'flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ff-accent)] text-xs font-black text-white' : 'text-sm font-black text-[var(--ff-text)]'}>{day.getDate()}</span>{sessions.length > 0 && <span className="rounded-full bg-[var(--ff-accent)] px-2 py-0.5 text-[10px] font-black text-white">{sessions.length}</span>}</div>{sessions.length > 0 && <div className="mt-3 space-y-1"><div className="h-1.5 rounded-full bg-[var(--ff-accent)]" /><p className="line-clamp-1 text-[11px] font-bold text-[var(--ff-muted)]">{getWorkoutName(sessions[0])}</p></div>}</>}</button> })}</div>
      </Card>
      <aside className="space-y-5"><Card><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]"><CalendarDays size={22} /></div><div><h2 className="text-lg font-black text-[var(--ff-text)]">Resumo do mês</h2><p className="text-sm text-[var(--ff-muted)] capitalize">{monthLabel}</p></div></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3"><Dumbbell size={18} className="text-[var(--ff-accent-text)]" /><p className="mt-2 text-xl font-black text-[var(--ff-text)]">{monthStats.totalWorkouts}</p><p className="text-xs text-[var(--ff-muted)]">treinos</p></div><div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3"><CalendarDays size={18} className="text-[var(--ff-accent-text)]" /><p className="mt-2 text-xl font-black text-[var(--ff-text)]">{monthStats.trainedDays}</p><p className="text-xs text-[var(--ff-muted)]">dias</p></div><div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3"><Flame size={18} className="text-orange-300" /><p className="mt-2 text-sm font-black text-[var(--ff-text)]">{formatVolume(monthStats.totalVolume)}</p><p className="text-xs text-[var(--ff-muted)]">volume</p></div><div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3"><Clock size={18} className="text-emerald-300" /><p className="mt-2 text-sm font-black text-[var(--ff-text)]">{formatDuration(monthStats.totalDuration)}</p><p className="text-xs text-[var(--ff-muted)]">tempo</p></div></div></Card><Card><h2 className="text-lg font-black text-[var(--ff-text)]">{selectedDateKey ? formatDate(selectedDateKey) : 'Selecione um dia'}</h2><div className="mt-4 space-y-3">{!selectedDateKey && <EmptyState title="Escolha uma data" description="Clique em um dia do calendário para ver os treinos." />}{selectedDateKey && selectedSessions.length === 0 && <EmptyState title="Sem treino neste dia" description="Nenhum treino finalizado foi encontrado nessa data." />}{selectedSessions.map((session, index) => <div key={session.id || session._id || index} className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4"><p className="font-black text-[var(--ff-text)]">{getWorkoutName(session, index)}</p><p className="mt-1 text-xs text-[var(--ff-muted)]">{formatDuration(getSessionDuration(session))}</p><p className="mt-2 text-xs font-bold text-[var(--ff-accent-text)]">{formatVolume(sessionVolume(session))}</p></div>)}</div></Card></aside>
    </section>
  </>
}
export default WorkoutCalendar
