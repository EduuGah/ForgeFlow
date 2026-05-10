import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Camera, Dumbbell, Flame, Trophy, Weight } from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import BodyWeightChart from '../components/progress/BodyWeightChart'
import TrainingVolumeChart from '../components/progress/TrainingVolumeChart'
import MuscleGroupChart from '../components/progress/MuscleGroupChart'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import { getUserStorageData, saveUserStorageData } from '../utils/userStorage'
import { formatDuration, formatVolume } from '../utils/chartUtils'
import { getCompletedSets, getExercisePRs, getMuscleGroupVolumeStats, getRecentPRs, getSessionDuration, getTotalVolume, groupSetsByWeek } from '../utils/analyticsUtils'

function normalizeApiArray(data, key) { return Array.isArray(data) ? data : Array.isArray(data?.[key]) ? data[key] : [] }
function formatDate(value) { if (!value) return 'Sem data'; return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) }
function formatLongDate(value) { if (!value) return 'Sem data'; return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) }
function getSessionDate(session = {}) { return session.finishedAt || session.completedAt || session.date || session.createdAt || session.startedAt || null }
function getWorkoutName(session = {}, index = 0) { return session.workoutName || session.name || session.title || `Treino ${index + 1}` }
function normalizeWeight(item) { const date = item.date || item.createdAt; return { label: date ? formatDate(date) : '—', date, weight: Number(item.weight || 0) } }

function SmallStat({ icon: Icon, label, value, description }) {
  return <Card className="p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-[var(--ff-muted)]">{label}</p><Icon size={20} className="text-[var(--ff-accent-text)]" /></div><p className="mt-2 text-2xl font-black text-[var(--ff-text)]">{value}</p>{description && <p className="mt-1 text-xs text-[var(--ff-muted)]">{description}</p>}</Card>
}

function Progress() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [weights, setWeights] = useState([])
  const [photos, setPhotos] = useState([])
  const [source, setSource] = useState('local')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return undefined
    let mounted = true
    const cachedHistory = getUserStorageData(user, 'workoutHistory', [])
    const cachedWeights = getUserStorageData(user, 'bodyWeight', [])
    const cachedPhotos = getUserStorageData(user, 'progressPhotos', [])
    setHistory(Array.isArray(cachedHistory) ? cachedHistory : [])
    setWeights(Array.isArray(cachedWeights) ? cachedWeights : [])
    setPhotos(Array.isArray(cachedPhotos) ? cachedPhotos : [])
    async function load() {
      setLoading(true)
      const [historyData, weightsData, photosData] = await Promise.allSettled([apiFetch('/workout-history'), apiFetch('/body-weight'), apiFetch('/progress-photos')])
      if (!mounted) return
      if (historyData.status === 'fulfilled') { const value = normalizeApiArray(historyData.value, 'history'); setHistory(value); saveUserStorageData(user, 'workoutHistory', value) }
      if (weightsData.status === 'fulfilled') { const value = normalizeApiArray(weightsData.value, 'weights'); setWeights(value); saveUserStorageData(user, 'bodyWeight', value) }
      if (photosData.status === 'fulfilled') { const value = normalizeApiArray(photosData.value, 'photos'); setPhotos(value); saveUserStorageData(user, 'progressPhotos', value) }
      setSource('database'); setLoading(false)
    }
    load().catch(() => setLoading(false))
    return () => { mounted = false }
  }, [user])

  const completedSets = useMemo(() => getCompletedSets(history), [history])
  const totalVolume = useMemo(() => getTotalVolume(completedSets), [completedSets])
  const prs = useMemo(() => getExercisePRs(completedSets), [completedSets])
  const recentPrs = useMemo(() => getRecentPRs(completedSets, 8), [completedSets])
  const muscleVolume = useMemo(() => getMuscleGroupVolumeStats(completedSets), [completedSets])
  const weeklyVolume = useMemo(() => groupSetsByWeek(completedSets), [completedSets])
  const weightData = useMemo(() => weights.map(normalizeWeight).filter((item) => item.weight > 0), [weights])
  const totalDuration = history.reduce((total, session) => total + getSessionDuration(session), 0)
  const recentSessions = [...history].sort((a, b) => new Date(getSessionDate(b) || 0) - new Date(getSessionDate(a) || 0)).slice(0, 5)
  const recentSets = [...completedSets].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 30)

  return <>
    <PageHeader title="Progresso" description="Visão geral da sua evolução. O progresso por exercício fica em uma página exclusiva." action={<div className="flex flex-wrap gap-2"><Badge variant={source === 'database' ? 'purple' : 'default'}>{loading ? 'Carregando' : source === 'database' ? 'Sincronizado' : 'Local'}</Badge><Link to="/exercise-progress"><Button variant="secondary">Progresso por exercício</Button></Link></div>} />

    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SmallStat icon={Dumbbell} label="Treinos" value={history.length} description="sessões finalizadas" />
      <SmallStat icon={Flame} label="Volume total" value={formatVolume(totalVolume)} description="peso × reps" />
      <SmallStat icon={Trophy} label="PRs" value={prs.length} description="recordes por exercício" />
      <SmallStat icon={Weight} label="Peso atual" value={weightData.at(-1)?.weight ? `${weightData.at(-1).weight}kg` : '—'} description="último registro" />
    </section>

    <section className="mt-6 space-y-6">
      <BodyWeightChart data={weightData} />
      <TrainingVolumeChart data={weeklyVolume} />
      <MuscleGroupChart data={muscleVolume} />
    </section>

    <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
      <Card><div className="flex items-center justify-between"><div><h2 className="text-xl font-black text-[var(--ff-text)]">PRs recentes</h2><p className="mt-1 text-sm text-[var(--ff-muted)]">Recordes por carga e volume.</p></div><Link to="/exercise-progress" className="text-sm font-black text-[var(--ff-accent-text)]">Abrir página</Link></div><div className="mt-4 space-y-3">{recentPrs.length === 0 ? <EmptyState title="Sem PRs" description="Registre séries para gerar recordes." /> : recentPrs.map((pr) => <div key={`${pr.exerciseName}-${pr.date}-${pr.setNumber}-${pr.isVolumePR}`} className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-[var(--ff-text)]">{pr.exerciseName}</p><p className="mt-1 text-xs text-[var(--ff-muted)]">{formatDate(pr.date)} • {pr.workoutName}</p></div><Badge>{pr.isVolumePR ? 'Volume' : 'Peso'}</Badge></div><p className="mt-2 text-sm font-black text-[var(--ff-accent-text)]">{pr.weight}kg × {pr.reps} • {formatVolume(pr.volume)}</p></div>)}</div></Card>
      <Card><h2 className="text-xl font-black text-[var(--ff-text)]">Últimos treinos</h2><p className="mt-1 text-sm text-[var(--ff-muted)]">Resumo das sessões recentes.</p><div className="mt-4 space-y-3">{recentSessions.length === 0 ? <EmptyState title="Sem histórico" description="Finalize treinos para aparecerem aqui." /> : recentSessions.map((session, index) => <div key={session.id || session._id || `${getWorkoutName(session, index)}-${index}`} className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4"><p className="font-black text-[var(--ff-text)]">{getWorkoutName(session, index)}</p><p className="mt-1 text-xs text-[var(--ff-muted)]">{formatLongDate(getSessionDate(session))} • {formatDuration(getSessionDuration(session))}</p></div>)}</div></Card>
    </section>

    <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card><h2 className="text-xl font-black text-[var(--ff-text)]">Séries recentes</h2><p className="mt-1 text-sm text-[var(--ff-muted)]">Últimas séries válidas registradas.</p><div className="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">{recentSets.length === 0 ? <EmptyState title="Sem séries" description="Finalize séries com peso e repetições." /> : recentSets.map((set) => <div key={set.id} className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-[var(--ff-text)]">{set.exerciseName}</p><p className="mt-1 text-xs text-[var(--ff-muted)]">{set.workoutName} • {formatDate(set.date)} • Série {set.setNumber}</p></div><Badge>{formatVolume(set.volume)}</Badge></div><p className="mt-2 text-sm font-black text-[var(--ff-accent-text)]">{set.weight}kg × {set.reps}</p></div>)}</div></Card>
      <Card><h2 className="text-xl font-black text-[var(--ff-text)]">Fotos recentes</h2><p className="mt-1 text-sm text-[var(--ff-muted)]">Últimos registros visuais.</p><div className="mt-4 grid grid-cols-2 gap-3">{photos.slice(0, 4).length === 0 ? <div className="col-span-2"><EmptyState title="Sem fotos" description="Adicione fotos para acompanhar a evolução." /></div> : photos.slice(0, 4).map((photo) => <Link to="/progress-photos" key={photo.id || photo._id || photo.url} className="overflow-hidden rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)]"><img src={photo.url || photo.imageUrl || photo.secureUrl} alt="Foto de evolução" className="aspect-[3/4] w-full object-cover" loading="lazy" decoding="async" /></Link>)}</div><Link to="/progress-photos"><Button variant="secondary" className="mt-4 w-full"><Camera size={16} />Abrir fotos</Button></Link></Card>
    </section>
  </>
}
export default Progress
