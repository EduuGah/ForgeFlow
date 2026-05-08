import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BarChart3,
  CalendarDays,
  Dumbbell,
  Flame,
  Search,
  Target,
  Trophy,
  Weight,
  X,
} from 'lucide-react'
import {
  LabelList,
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

import { useAuth } from '../context/AuthContext'
import { getUserStorageData } from '../utils/userStorage'

function formatDate(dateString) {
  if (!dateString) return 'Sem data'

  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function formatLongDate(dateString) {
  if (!dateString) return 'Sem data'

  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function isValidWorkingSet(set) {
  return (
    set.type !== 'warmup' &&
    set.completed &&
    set.weight &&
    set.reps &&
    Number(set.weight) > 0 &&
    Number(set.reps) > 0
  )
}

function getSetVolume(set) {
  return Number(set.weight) * Number(set.reps)
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null

  const item = payload[0].payload

  return (
    <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 shadow-2xl">
      <p className="text-sm font-bold text-[var(--ff-text)]">
        {item.workoutName}
      </p>

      <p className="mt-1 text-xs text-[var(--ff-muted)]">
        {formatLongDate(item.fullDate)}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-2">
          <p className="text-[var(--ff-muted)]">
            Peso
          </p>

          <p className="mt-1 font-bold text-[var(--ff-accent-text)]">
            {item.weight}kg
          </p>
        </div>

        <div className="rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-2">
          <p className="text-[var(--ff-muted)]">
            Reps
          </p>

          <p className="mt-1 font-bold text-[var(--ff-text)]">
            {item.reps}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-2">
          <p className="text-[var(--ff-muted)]">
            Volume
          </p>

          <p className="mt-1 font-bold text-orange-300">
            {item.volume}kg
          </p>
        </div>

        <div className="rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-2">
          <p className="text-[var(--ff-muted)]">
            Série
          </p>

          <p className="mt-1 font-bold text-[var(--ff-text)]">
            {item.setNumber}
          </p>
        </div>
      </div>
    </div>
  )
}

function ExerciseProgress() {
  const { user } = useAuth()

  const [history, setHistory] = useState([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [sortMode, setSortMode] = useState('mostSets')

  useEffect(() => {
    setHistory(getUserStorageData(user, 'history', []))
  }, [user])

  const exerciseLibrary = useMemo(() => {
    const map = new Map()

    history.forEach((session) => {
      session.exercises.forEach((item) => {
        const exercise = item.exercise

        if (!exercise?.name) return

        const validSets = item.sets.filter(isValidWorkingSet)

        const volume = validSets.reduce((total, set) => {
          return total + getSetVolume(set)
        }, 0)

        if (!map.has(exercise.name)) {
          map.set(exercise.name, {
            name: exercise.name,
            muscleGroup: exercise.muscleGroup || 'Sem grupo',
            equipment: exercise.equipment || 'Sem equipamento',
            mediaUrl:
              exercise.media?.gif ||
              exercise.media?.image ||
              exercise.mediaUrl ||
              exercise.gifUrl ||
              '',
            totalAppearances: 0,
            totalSets: 0,
            totalVolume: 0,
            lastDate: session.finishedAt,
          })
        }

        const current = map.get(exercise.name)

        map.set(exercise.name, {
          ...current,
          totalAppearances: current.totalAppearances + 1,
          totalSets: current.totalSets + validSets.length,
          totalVolume: current.totalVolume + volume,
          lastDate:
            new Date(session.finishedAt) > new Date(current.lastDate)
              ? session.finishedAt
              : current.lastDate,
        })
      })
    })

    return [...map.values()]
  }, [history])

  const muscleGroups = useMemo(() => {
    return [...new Set(exerciseLibrary.map((exercise) => exercise.muscleGroup))]
      .filter(Boolean)
      .sort()
  }, [exerciseLibrary])

  const filteredExercises = useMemo(() => {
    const filtered = exerciseLibrary.filter((exercise) => {
      const matchesSearch = `${exercise.name} ${exercise.muscleGroup} ${exercise.equipment}`
        .toLowerCase()
        .includes(search.toLowerCase())

      const matchesGroup = groupFilter
        ? exercise.muscleGroup === groupFilter
        : true

      return matchesSearch && matchesGroup
    })

    return filtered.sort((a, b) => {
      if (sortMode === 'name') return a.name.localeCompare(b.name)
      if (sortMode === 'mostSets') return b.totalSets - a.totalSets
      if (sortMode === 'mostWorkouts') return b.totalAppearances - a.totalAppearances
      if (sortMode === 'volume') return b.totalVolume - a.totalVolume
      if (sortMode === 'recent') return new Date(b.lastDate) - new Date(a.lastDate)

      return 0
    })
  }, [exerciseLibrary, search, groupFilter, sortMode])

  const groupedExercises = useMemo(() => {
    return filteredExercises.reduce((groups, exercise) => {
      const group = exercise.muscleGroup || 'Sem grupo'

      if (!groups[group]) groups[group] = []

      groups[group].push(exercise)

      return groups
    }, {})
  }, [filteredExercises])

  const selectedExerciseData = useMemo(() => {
    if (!selectedExercise) return null

    return exerciseLibrary.find((exercise) => exercise.name === selectedExercise) || null
  }, [exerciseLibrary, selectedExercise])

  const chartData = useMemo(() => {
    if (!selectedExercise) return []

    const data = []

    history.forEach((session) => {
      session.exercises.forEach((item) => {
        const exercise = item.exercise

        if (exercise?.name !== selectedExercise) return

        item.sets.filter(isValidWorkingSet).forEach((set) => {
          const weight = Number(set.weight)
          const reps = Number(set.reps)
          const volume = weight * reps

          data.push({
            id: `${session.id}-${item.id}-${set.id}`,
            workoutName: session.workoutName,
            fullDate: session.finishedAt,
            date: formatDate(session.finishedAt),
            setNumber: set.setNumber,
            weight,
            reps,
            volume,
          })
        })
      })
    })

    return data.sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate))
  }, [history, selectedExercise])

  const bestWeight = useMemo(() => {
    return chartData.slice().sort((a, b) => b.weight - a.weight)[0] || null
  }, [chartData])

  const bestVolume = useMemo(() => {
    return chartData.slice().sort((a, b) => b.volume - a.volume)[0] || null
  }, [chartData])

  const bestReps = useMemo(() => {
    return chartData.slice().sort((a, b) => b.reps - a.reps)[0] || null
  }, [chartData])

  const totalVolume = useMemo(() => {
    return chartData.reduce((total, item) => total + item.volume, 0)
  }, [chartData])

  return (
    <>
      <PageHeader
        title="Evolução"
        description="Acompanhe a progressão de carga, repetições e volume por exercício."
        action={
          <Badge variant="purple">
            {exerciseLibrary.length} exercícios
          </Badge>
        }
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
              <Search size={24} />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Exercícios
              </h2>

              <p className="text-sm text-zinc-500">
                Selecione um exercício para ver a evolução.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-zinc-400">
              <Search size={20} />

              <input
                type="text"
                placeholder="Buscar exercício..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-zinc-500 transition hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <select
                value={groupFilter}
                onChange={(event) => setGroupFilter(event.target.value)}
                className="h-12 rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-sm font-bold text-white outline-none transition focus:border-[var(--ff-accent-border)]"
              >
                <option value="">Todos os grupos</option>

                {muscleGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>

              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value)}
                className="h-12 rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-sm font-bold text-white outline-none transition focus:border-[var(--ff-accent-border)]"
              >
                <option value="mostSets">Mais séries</option>
                <option value="mostWorkouts">Mais treinos</option>
                <option value="volume">Maior volume</option>
                <option value="recent">Mais recente</option>
                <option value="name">Nome</option>
              </select>
            </div>
          </div>

          <div className="mt-5 max-h-[720px] space-y-5 overflow-y-auto pr-2">
            {exerciseLibrary.length === 0 && (
              <EmptyState
                title="Sem histórico ainda"
                description="Finalize treinos para gerar evolução dos exercícios."
              />
            )}

            {Object.entries(groupedExercises).map(([group, exercises]) => (
              <div key={group}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wide text-zinc-500">
                    {group}
                  </h3>

                  <span className="text-xs font-bold text-zinc-600">
                    {exercises.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {exercises.map((exercise) => (
                    <button
                      key={exercise.name}
                      type="button"
                      onClick={() => setSelectedExercise(exercise.name)}
                      className={
                        selectedExercise === exercise.name
                          ? 'w-full rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)]/15 p-3 text-left shadow-[0_0_18px_var(--ff-accent-shadow)]/15'
                          : 'w-full rounded-2xl border border-zinc-800 bg-[#18181b] p-3 text-left transition hover:border-[var(--ff-accent-border)]/30 hover:bg-[#1f1f23]'
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-white">
                          {exercise.mediaUrl ? (
                            <img
                              src={exercise.mediaUrl}
                              alt={exercise.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Dumbbell size={23} className="text-zinc-900" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={
                              selectedExercise === exercise.name
                                ? 'truncate font-bold text-[var(--ff-accent-text)]'
                                : 'truncate font-bold text-white'
                            }
                          >
                            {exercise.name}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            {exercise.totalSets} séries • {exercise.totalAppearances} treinos
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          {!selectedExerciseData ? (
            <Card>
              <EmptyState
                title="Selecione um exercício"
                description="Escolha um exercício na lista para visualizar gráficos e marcas pessoais."
              />
            </Card>
          ) : (
            <>
              <Card className="overflow-hidden border-[var(--ff-accent-border)]/20 bg-gradient-to-br from-[var(--ff-accent-soft)]/20 via-[#18181b] to-[#121212]">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-zinc-800 bg-white">
                      {selectedExerciseData.mediaUrl ? (
                        <img
                          src={selectedExerciseData.mediaUrl}
                          alt={selectedExerciseData.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Dumbbell size={36} className="text-zinc-900" />
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-accent-text)]">
                        Exercício selecionado
                      </p>

                      <h1 className="mt-1 text-3xl font-black">
                        {selectedExerciseData.name}
                      </h1>

                      <p className="mt-2 text-sm text-zinc-400">
                        {selectedExerciseData.muscleGroup} • {selectedExerciseData.equipment}
                      </p>
                    </div>
                  </div>

                  <Badge variant="purple">
                    {selectedExerciseData.totalSets} séries
                  </Badge>
                </div>
              </Card>

              <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-500">
                      Melhor peso
                    </p>

                    <Weight size={20} className="text-[var(--ff-accent-text)]" />
                  </div>

                  <h3 className="mt-2 text-3xl font-black text-[var(--ff-accent-text)]">
                    {bestWeight ? `${bestWeight.weight}kg` : '--'}
                  </h3>

                  <p className="mt-2 text-xs text-zinc-500">
                    {bestWeight ? `${bestWeight.reps} reps` : 'Sem dados'}
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-500">
                      Melhor volume
                    </p>

                    <Flame size={20} className="text-orange-400" />
                  </div>

                  <h3 className="mt-2 text-3xl font-black text-orange-300">
                    {bestVolume ? `${bestVolume.volume}kg` : '--'}
                  </h3>

                  <p className="mt-2 text-xs text-zinc-500">
                    {bestVolume ? `${bestVolume.weight}kg × ${bestVolume.reps}` : 'Sem dados'}
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-500">
                      Melhor reps
                    </p>

                    <Trophy size={20} className="text-yellow-400" />
                  </div>

                  <h3 className="mt-2 text-3xl font-black">
                    {bestReps ? bestReps.reps : '--'}
                  </h3>

                  <p className="mt-2 text-xs text-zinc-500">
                    {bestReps ? `${bestReps.weight}kg` : 'Sem dados'}
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-500">
                      Volume total
                    </p>

                    <Activity size={20} className="text-[var(--ff-accent-text)]" />
                  </div>

                  <h3 className="mt-2 text-2xl font-black">
                    {totalVolume.toLocaleString('pt-BR')}kg
                  </h3>

                  <p className="mt-2 text-xs text-zinc-500">
                    acumulado
                  </p>
                </Card>
              </section>

              <Card>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      Evolução de carga
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Peso usado ao longo dos treinos.
                    </p>
                  </div>

                  <BarChart3 size={24} className="text-[var(--ff-accent-text)]" />
                </div>

                <div className="mt-5 h-80">
                  {chartData.length === 0 ? (
                    <EmptyState
                      title="Sem dados para gráfico"
                      description="Esse exercício ainda não tem séries válidas no histórico."
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
                        <XAxis dataKey="date" stroke="var(--ff-muted)" />
                        <YAxis stroke="var(--ff-muted)" />
                        <Tooltip content={<ChartTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="weight"
                          name="Peso"
                          stroke="var(--ff-accent)"
                          strokeWidth={3}
                          dot={{ r: 5, strokeWidth: 2, fill: 'var(--ff-card)', stroke: 'var(--ff-accent)' }}
                          activeDot={{ r: 8, strokeWidth: 3, fill: 'var(--ff-accent)', stroke: 'var(--ff-card)' }}
                        >
                          <LabelList
                            dataKey="weight"
                            position="top"
                            formatter={(value) => `${value}kg`}
                            style={{ fill: 'var(--ff-text)', fontSize: 12, fontWeight: 800 }}
                          />
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              <Card>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      Evolução de volume
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Peso × repetições por série.
                    </p>
                  </div>

                  <Flame size={24} className="text-orange-400" />
                </div>

                <div className="mt-5 h-80">
                  {chartData.length === 0 ? (
                    <EmptyState
                      title="Sem dados para gráfico"
                      description="Esse exercício ainda não tem volume no histórico."
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
                        <XAxis dataKey="date" stroke="var(--ff-muted)" />
                        <YAxis stroke="var(--ff-muted)" />
                        <Tooltip content={<ChartTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="volume"
                          name="Volume"
                          stroke="#f97316"
                          strokeWidth={3}
                          dot
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-bold">
                  Registros do exercício
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Todas as séries válidas encontradas no histórico.
                </p>

                <div className="mt-5 max-h-[460px] space-y-3 overflow-y-auto pr-2">
                  {chartData.length === 0 && (
                    <EmptyState
                      title="Nenhum registro"
                      description="Finalize um treino com esse exercício."
                    />
                  )}

                  {chartData
                    .slice()
                    .reverse()
                    .map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-bold text-white">
                              {item.workoutName}
                            </p>

                            <p className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                              <CalendarDays size={14} />
                              {formatLongDate(item.fullDate)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="purple">
                              {item.weight}kg
                            </Badge>

                            <Badge>
                              {item.reps} reps
                            </Badge>

                            <Badge>
                              {item.volume}kg volume
                            </Badge>
                          </div>
                        </div>
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
