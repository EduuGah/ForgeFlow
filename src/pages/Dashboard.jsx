import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CalendarDays, Camera, Dumbbell, Flame, Play, Target, Trophy, Weight } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useWorkoutSession } from '../context/WorkoutSessionContext'
import { apiFetch } from '../services/api'
import { getUserStorageData, saveUserStorageData } from '../utils/userStorage'
import { chartItemStyle, chartLabelStyle, formatDuration, formatVolume, getChartTooltipStyle } from '../utils/chartUtils'
import { getCompletedSets, getExercisePRs, getMostTrainedExercise, getMuscleGroupVolumeStats, getRecentPRs, getSessionDuration, getTotalVolume, groupSetsByWeek } from '../utils/analyticsUtils'

function normalizeApiArray(data, key) { return Array.isArray(data) ? data : Array.isArray(data?.[key]) ? data[key] : [] }
function formatDate(value) { if (!value) return 'Sem data'; return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) }
function getSessionDate(session = {}) { return session.finishedAt || session.completedAt || session.date || session.createdAt || session.startedAt || null }
function getWorkoutName(session = {}, index = 0) { return session.workoutName || session.name || session.title || `Treino ${index + 1}` }
function getCurrentWeight(weights = []) { const valid = weights.filter((x) => Number(x.weight) > 0); return valid.at(-1)?.weight || null }

function StatCard({ icon: Icon, label, value, description }) {
  return <Card className="p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-[var(--ff-muted)]">{label}</p><Icon size={20} className="text-[var(--ff-accent-text)]" /></div><p className="mt-2 text-2xl font-black text-[var(--ff-text)]">{value}</p>{description && <p className="mt-1 text-xs text-[var(--ff-muted)]">{description}</p>}</Card>
}

function Dashboard() {
  const { user } = useAuth()
  const { startSession } = useWorkoutSession()
  const navigate = useNavigate()
  const [workouts, setWorkouts] = useState([])
  const [history, setHistory] = useState([])
  const [exercises, setExercises] = useState([])
  const [weights, setWeights] = useState([])
  const [goals, setGoals] = useState([])
  const [notifications, setNotifications] = useState([])
  const [source, setSource] = useState('local')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return undefined
    let mounted = true
    const cachedWorkouts = getUserStorageData(user, 'workouts', [])
    const cachedHistory = getUserStorageData(user, 'workoutHistory', [])
    const cachedExercises = getUserStorageData(user, 'exercises', [])
    const cachedWeights = getUserStorageData(user, 'bodyWeight', [])
    const cachedGoals = getUserStorageData(user, 'goals', [])
    const cachedNotifications = getUserStorageData(user, 'notifications', [])
    setWorkouts(Array.isArray(cachedWorkouts) ? cachedWorkouts : [])
    setHistory(Array.isArray(cachedHistory) ? cachedHistory : [])
    setExercises(Array.isArray(cachedExercises) ? cachedExercises : [])
    setWeights(Array.isArray(cachedWeights) ? cachedWeights : [])
    setGoals(Array.isArray(cachedGoals) ? cachedGoals : [])
    setNotifications(Array.isArray(cachedNotifications) ? cachedNotifications : [])
    async function load() {
      setLoading(true)
      const [workoutsData, historyData, exercisesData, weightsData, goalsData, notificationsData] = await Promise.allSettled([
        apiFetch('/workouts'), apiFetch('/workout-history'), apiFetch('/exercises'), apiFetch('/body-weight'), apiFetch('/goals'), apiFetch('/notifications?limit=5'),
      ])
      if (!mounted) return
      if (workoutsData.status === 'fulfilled') { const value = normalizeApiArray(workoutsData.value, 'workouts'); setWorkouts(value); saveUserStorageData(user, 'workouts', value) }
      if (historyData.status === 'fulfilled') { const value = normalizeApiArray(historyData.value, 'history'); setHistory(value); saveUserStorageData(user, 'workoutHistory', value) }
      if (exercisesData.status === 'fulfilled') { const value = normalizeApiArray(exercisesData.value, 'exercises'); setExercises(value); saveUserStorageData(user, 'exercises', value) }
      if (weightsData.status === 'fulfilled') { const value = normalizeApiArray(weightsData.value, 'weights'); setWeights(value); saveUserStorageData(user, 'bodyWeight', value) }
      if (goalsData.status === 'fulfilled') { const value = normalizeApiArray(goalsData.value, 'goals'); setGoals(value); saveUserStorageData(user, 'goals', value) }
      if (notificationsData.status === 'fulfilled') { const value = normalizeApiArray(notificationsData.value, 'notifications'); setNotifications(value); saveUserStorageData(user, 'notifications', value) }
      setSource('database'); setLoading(false)
    }
    load().catch(() => setLoading(false))
    return () => { mounted = false }
  }, [user])

  const completedSets = useMemo(() => getCompletedSets(history), [history])
  const totalVolume = useMemo(() => getTotalVolume(completedSets), [completedSets])
  const prs = useMemo(() => getExercisePRs(completedSets), [completedSets])
  const recentPrs = useMemo(() => getRecentPRs(completedSets, 5), [completedSets])
  const muscleVolume = useMemo(() => getMuscleGroupVolumeStats(completedSets).slice(0, 8), [completedSets])
  const weeklyVolume = useMemo(() => groupSetsByWeek(completedSets).slice(-8), [completedSets])
  const currentWeight = getCurrentWeight(weights)
  const mostTrainedExercise = getMostTrainedExercise(completedSets)
  const totalDuration = history.reduce((total, session) => total + getSessionDuration(session), 0)
  const recentWorkouts = [...workouts].sort((a, b) => Number(Boolean(b.isFavorite)) - Number(Boolean(a.isFavorite))).slice(0, 4)
  const activeGoals = goals.filter((goal) => goal.status !== 'completed' && goal.status !== 'archived').slice(0, 4)
  const lastSession = [...history].sort((a, b) => new Date(getSessionDate(b) || 0) - new Date(getSessionDate(a) || 0))[0]

  function handleStartWorkout(workout) { startSession(workout); navigate('/start-workout') }

  return <>
    <PageHeader title="Dashboard" description="Resumo dos seus treinos, evolução, metas e recordes." action={<Badge variant={source === 'database' ? 'purple' : 'default'}>{loading ? 'Carregando' : source === 'database' ? 'Sincronizado' : 'Local'}</Badge>} />
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={Dumbbell} label="Treinos" value={history.length} description="sessões finalizadas" />
      <StatCard icon={Flame} label="Volume total" value={formatVolume(totalVolume)} description="peso × repetições" />
      <StatCard icon={Trophy} label="PRs" value={prs.length} description="recordes por exercício" />
      <StatCard icon={Weight} label="Peso atual" value={currentWeight ? `${currentWeight}kg` : '—'} description="último registro" />
    </section>

    <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.75fr)]">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-xl font-black text-[var(--ff-text)]">Volume semanal</h2><p className="mt-1 text-sm text-[var(--ff-muted)]">Evolução de carga × repetições por semana.</p></div><Badge>{weeklyVolume.length} semanas</Badge></div>
        <div className="mt-5 h-[330px] min-h-[330px]" data-chart>{weeklyVolume.length === 0 ? <EmptyState title="Sem dados de volume" description="Finalize treinos com peso e repetições para gerar o gráfico." /> : <ResponsiveContainer width="100%" height="100%"><BarChart data={weeklyVolume} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" /><XAxis dataKey="week" stroke="var(--ff-muted)" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} /><YAxis stroke="var(--ff-muted)" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} /><Tooltip formatter={(value) => [formatVolume(value), 'Volume']} contentStyle={getChartTooltipStyle()} labelStyle={chartLabelStyle} itemStyle={chartItemStyle} /><Bar dataKey="volume" fill="var(--ff-accent)" radius={[10,10,0,0]} /></BarChart></ResponsiveContainer>}</div>
      </Card>
      <Card>
        <h2 className="text-xl font-black text-[var(--ff-text)]">Começar agora</h2><p className="mt-1 text-sm text-[var(--ff-muted)]">Treinos salvos e ações rápidas.</p>
        <div className="mt-4 space-y-3">{recentWorkouts.length === 0 ? <EmptyState title="Nenhum treino salvo" description="Crie um treino para começar." /> : recentWorkouts.map((workout) => <div key={workout.id || workout._id || workout.name} className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3"><p className="line-clamp-1 font-black text-[var(--ff-text)]">{workout.name || 'Treino'}</p><p className="mt-1 text-xs text-[var(--ff-muted)]">{Array.isArray(workout.exercises) ? workout.exercises.length : 0} exercício(s)</p><Button onClick={() => handleStartWorkout(workout)} className="mt-3 w-full"><Play size={16} />Iniciar</Button></div>)}</div>
      </Card>
    </section>

    <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
      <Card><h2 className="text-xl font-black text-[var(--ff-text)]">Grupos musculares</h2><div className="mt-5 h-[300px] min-h-[300px]" data-chart>{muscleVolume.length === 0 ? <EmptyState title="Sem distribuição muscular" description="Finalize treinos para gerar este gráfico." /> : <ResponsiveContainer width="100%" height="100%"><BarChart data={muscleVolume} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" /><XAxis dataKey="muscleGroup" stroke="var(--ff-muted)" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} /><YAxis stroke="var(--ff-muted)" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} /><Tooltip formatter={(value) => [formatVolume(value), 'Volume']} contentStyle={getChartTooltipStyle()} labelStyle={chartLabelStyle} itemStyle={chartItemStyle} /><Bar dataKey="volume" fill="var(--ff-accent)" radius={[10,10,0,0]} /></BarChart></ResponsiveContainer>}</div></Card>
      <Card><div className="flex items-center justify-between"><h2 className="text-xl font-black text-[var(--ff-text)]">PRs recentes</h2><Link to="/exercise-progress" className="text-sm font-black text-[var(--ff-accent-text)]">Ver todos</Link></div><div className="mt-4 space-y-3">{recentPrs.length === 0 ? <EmptyState title="Sem PRs" description="Registre séries para gerar recordes." /> : recentPrs.map((pr) => <div key={`${pr.exerciseName}-${pr.date}-${pr.setNumber}-${pr.isVolumePR}`} className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3"><div className="flex items-start justify-between gap-3"><div><p className="line-clamp-1 font-black text-[var(--ff-text)]">{pr.exerciseName}</p><p className="mt-1 text-xs text-[var(--ff-muted)]">{formatDate(pr.date)} • {pr.workoutName}</p></div><Badge>{pr.isVolumePR ? 'Volume' : 'Peso'}</Badge></div><p className="mt-2 text-sm font-black text-[var(--ff-accent-text)]">{pr.weight}kg × {pr.reps} • {formatVolume(pr.volume)}</p></div>)}</div></Card>
      <Card><h2 className="text-xl font-black text-[var(--ff-text)]">Resumo útil</h2><div className="mt-4 space-y-3"><div className="rounded-2xl bg-[var(--ff-surface-2)] p-3"><p className="text-xs text-[var(--ff-muted)]">Exercício mais treinado</p><p className="mt-1 font-black text-[var(--ff-text)]">{mostTrainedExercise?.exerciseName || 'Sem dados'}</p></div><div className="rounded-2xl bg-[var(--ff-surface-2)] p-3"><p className="text-xs text-[var(--ff-muted)]">Último treino</p><p className="mt-1 font-black text-[var(--ff-text)]">{lastSession ? `${getWorkoutName(lastSession)} • ${formatDate(getSessionDate(lastSession))}` : 'Sem histórico'}</p></div><div className="rounded-2xl bg-[var(--ff-surface-2)] p-3"><p className="text-xs text-[var(--ff-muted)]">Tempo total</p><p className="mt-1 font-black text-[var(--ff-text)]">{formatDuration(totalDuration)}</p></div></div></Card>
    </section>

    <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
      <Card><div className="flex items-center justify-between"><h2 className="text-xl font-black text-[var(--ff-text)]">Metas</h2><Link to="/goals" className="text-sm font-black text-[var(--ff-accent-text)]">Abrir</Link></div><div className="mt-4 space-y-3">{activeGoals.length === 0 ? <EmptyState title="Sem metas ativas" description="Crie metas para acompanhar sua evolução." /> : activeGoals.map((goal) => <div key={goal.id || goal._id || goal.title} className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3"><div className="flex justify-between gap-3"><p className="font-black text-[var(--ff-text)]">{goal.title}</p><Badge>{Math.round(Number(goal.progressPercent || 0))}%</Badge></div><div className="mt-3 h-2 rounded-full bg-[var(--ff-card)]"><div className="h-full rounded-full bg-[var(--ff-accent)]" style={{ width: `${Math.min(100, Math.max(0, Number(goal.progressPercent || 0)))}%` }} /></div></div>)}</div></Card>
      <Card><div className="flex items-center justify-between"><h2 className="text-xl font-black text-[var(--ff-text)]">Notificações</h2><Link to="/notifications" className="text-sm font-black text-[var(--ff-accent-text)]">Central</Link></div><div className="mt-4 space-y-3">{notifications.length === 0 ? <EmptyState title="Sem notificações" description="Tudo certo por enquanto." /> : notifications.slice(0, 4).map((item) => <div key={item.id || item._id || item.title} className="flex gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3"><Bell size={18} className="mt-0.5 shrink-0 text-[var(--ff-accent-text)]" /><div><p className="line-clamp-1 font-black text-[var(--ff-text)]">{item.title}</p><p className="mt-1 line-clamp-2 text-xs text-[var(--ff-muted)]">{item.message || 'Toque para ver detalhes.'}</p></div></div>)}</div></Card>
    </section>
  </>
}
export default Dashboard
