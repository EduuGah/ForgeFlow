import { useEffect, useMemo, useState } from 'react'
import { Activity, BarChart3, CalendarDays, Search, TrendingUp, Weight } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import { getUserStorageData, saveUserStorageData } from '../utils/userStorage'
import { getCompletedSets } from '../utils/analyticsUtils'
import { chartItemStyle, chartLabelStyle, getChartTooltipStyle } from '../utils/chartUtils'

function normalizeExerciseName(value) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function formatLongDate(value) {
  if (!value) return 'Sem data'
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatWeight(value) { return `${Number(value || 0).toLocaleString('pt-BR')} kg` }
function formatVolume(value) { return `${Number(value || 0).toLocaleString('pt-BR')} kg` }

function ExerciseProgress() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [source, setSource] = useState('local')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedExerciseName, setSelectedExerciseName] = useState('')

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

  const completedSets = useMemo(() => getCompletedSets(history).map((set, index) => ({
    ...set,
    normalizedExerciseName: normalizeExerciseName(set.exerciseName),
    chartIndex: index + 1,
  })).sort((a, b) => new Date(a.date) - new Date(b.date)), [history])

  const exerciseOptions = useMemo(() => {
    const map = new Map()
    completedSets.forEach((set) => {
      const key = set.normalizedExerciseName
      if (!key) return
      const current = map.get(key) || { name: set.exerciseName, normalizedName: key, muscleGroup: set.muscleGroup, count: 0, maxWeight: 0, maxVolume: 0, lastDate: set.date }
      current.count += 1
      current.maxWeight = Math.max(current.maxWeight, set.weight)
      current.maxVolume = Math.max(current.maxVolume, set.volume)
      current.lastDate = set.date
      map.set(key, current)
    })
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [completedSets])

  useEffect(() => {
    if (!selectedExerciseName && exerciseOptions.length > 0) setSelectedExerciseName(exerciseOptions[0].normalizedName)
  }, [exerciseOptions, selectedExerciseName])

  const filteredExerciseOptions = useMemo(() => {
    const term = normalizeExerciseName(search)
    if (!term) return exerciseOptions
    return exerciseOptions.filter((exercise) => normalizeExerciseName(exercise.name).includes(term))
  }, [exerciseOptions, search])

  const selectedSets = useMemo(() => completedSets.filter((set) => set.normalizedExerciseName === selectedExerciseName), [completedSets, selectedExerciseName])

  const chartData = useMemo(() => selectedSets.map((set, index) => ({
    index: index + 1,
    axisLabel: String(index + 1),
    dateLabel: formatDate(set.date),
    setNumber: set.setNumber,
    workoutName: set.workoutName,
    weight: Number(set.weight || 0),
    reps: Number(set.reps || 0),
    volume: Number(set.volume || 0),
  })), [selectedSets])

  const stats = useMemo(() => {
    if (selectedSets.length === 0) return { maxWeight: 0, maxVolume: 0, totalVolume: 0, totalSets: 0, lastSet: null }
    return {
      maxWeight: Math.max(...selectedSets.map((set) => set.weight)),
      maxVolume: Math.max(...selectedSets.map((set) => set.volume)),
      totalVolume: selectedSets.reduce((total, set) => total + set.volume, 0),
      totalSets: selectedSets.length,
      lastSet: selectedSets[selectedSets.length - 1],
    }
  }, [selectedSets])

  const selectedExercise = exerciseOptions.find((exercise) => exercise.normalizedName === selectedExerciseName)

  return (
    <>
      <PageHeader
        title="Progresso por exercício"
        description="Escolha um exercício e veja séries registradas, evolução de carga e volume."
        action={<Badge variant={source === 'database' ? 'purple' : 'default'}>{loading ? 'Carregando' : source === 'database' ? 'Sincronizado' : 'Local'}</Badge>}
      />

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <Card>
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-[var(--ff-muted)]">
              <Search size={18} />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar exercício..." className="w-full bg-transparent text-sm text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted)]" />
            </div>
            <div className="mt-4 max-h-[560px] space-y-2 overflow-y-auto pr-1">
              {filteredExerciseOptions.length === 0 ? <EmptyState title="Nenhum exercício" description="Finalize treinos com séries válidas para aparecerem aqui." /> : filteredExerciseOptions.map((exercise) => (
                <button key={exercise.normalizedName} type="button" onClick={() => setSelectedExerciseName(exercise.normalizedName)} className={['w-full rounded-2xl border p-3 text-left transition', selectedExerciseName === exercise.normalizedName ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)]' : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] hover:bg-[var(--ff-card-hover)]'].join(' ')}>
                  <p className="line-clamp-1 font-black text-[var(--ff-text)]">{exercise.name}</p>
                  <p className="mt-1 text-xs text-[var(--ff-muted)]">{exercise.count} série(s) • {exercise.muscleGroup}</p>
                </button>
              ))}
            </div>
          </Card>
        </aside>

        <div className="space-y-5">
          {!selectedExercise ? (
            <Card><EmptyState title="Selecione um exercício" description="Escolha um exercício na lista para ver a evolução." /></Card>
          ) : (
            <>
              <Card>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div><p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ff-accent-text)]">Exercício selecionado</p><h2 className="mt-1 text-2xl font-black text-[var(--ff-text)]">{selectedExercise.name}</h2><p className="mt-1 text-sm text-[var(--ff-muted)]">{selectedExercise.muscleGroup}</p></div>
                  <Badge>{stats.totalSets} séries</Badge>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3"><Weight size={18} className="text-[var(--ff-accent-text)]" /><p className="mt-2 text-lg font-black text-[var(--ff-text)]">{formatWeight(stats.maxWeight)}</p><p className="text-xs text-[var(--ff-muted)]">maior carga</p></div>
                  <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3"><BarChart3 size={18} className="text-orange-300" /><p className="mt-2 text-lg font-black text-[var(--ff-text)]">{formatVolume(stats.maxVolume)}</p><p className="text-xs text-[var(--ff-muted)]">maior volume</p></div>
                  <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3"><Activity size={18} className="text-emerald-300" /><p className="mt-2 text-lg font-black text-[var(--ff-text)]">{formatVolume(stats.totalVolume)}</p><p className="text-xs text-[var(--ff-muted)]">volume total</p></div>
                  <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3"><CalendarDays size={18} className="text-[var(--ff-accent-text)]" /><p className="mt-2 text-lg font-black text-[var(--ff-text)]">{stats.lastSet ? formatDate(stats.lastSet.date) : '—'}</p><p className="text-xs text-[var(--ff-muted)]">última série</p></div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-black text-[var(--ff-text)]">Evolução de carga e volume</h2><p className="mt-1 text-sm text-[var(--ff-muted)]">Cada ponto representa uma série concluída.</p></div><TrendingUp size={22} className="text-[var(--ff-accent-text)]" /></div>
                <div className="mt-5 h-[340px] min-h-[340px]" data-chart>
                  {chartData.length === 0 ? <EmptyState title="Sem séries" description="Nenhuma série válida foi encontrada para esse exercício." /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 16, right: 14, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
                        <XAxis dataKey="axisLabel" stroke="var(--ff-muted)" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--ff-muted)" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} />
                        <Tooltip formatter={(value, name) => [name === 'volume' ? formatVolume(value) : formatWeight(value), name === 'volume' ? 'Volume' : 'Peso']} labelFormatter={(_, payload) => payload?.[0]?.payload ? `${payload[0].payload.dateLabel} • Série ${payload[0].payload.setNumber}` : 'Série'} contentStyle={getChartTooltipStyle()} labelStyle={chartLabelStyle} itemStyle={chartItemStyle} />
                        <Line type="monotone" dataKey="weight" stroke="var(--ff-accent)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'var(--ff-card)' }} />
                        <Line type="monotone" dataKey="volume" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-black text-[var(--ff-text)]">Séries registradas</h2><p className="mt-1 text-sm text-[var(--ff-muted)]">Todas as séries válidas encontradas no histórico.</p>
                <div className="mt-5 max-h-[560px] space-y-3 overflow-y-auto pr-1">
                  {selectedSets.length === 0 ? <EmptyState title="Nenhuma série encontrada" description="Esse exercício ainda não tem séries válidas no histórico." /> : selectedSets.slice().reverse().map((set) => (
                    <div key={set.id} className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                      <div className="flex items-start justify-between gap-3"><div><p className="font-black text-[var(--ff-text)]">{formatLongDate(set.date)}</p><p className="mt-1 text-xs text-[var(--ff-muted)]">{set.workoutName} • Série {set.setNumber}</p></div><Badge>{formatVolume(set.volume)}</Badge></div>
                      <div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-xl bg-[var(--ff-card)] p-3"><p className="text-xs text-[var(--ff-muted)]">Peso</p><p className="font-black text-[var(--ff-accent-text)]">{formatWeight(set.weight)}</p></div><div className="rounded-xl bg-[var(--ff-card)] p-3"><p className="text-xs text-[var(--ff-muted)]">Reps</p><p className="font-black text-[var(--ff-text)]">{set.reps}</p></div></div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </section>
    </>
  )
}

export default ExerciseProgress
