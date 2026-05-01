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

import { getStorageData } from '../utils/analyticsUtils'

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
    <div className="rounded-2xl border border-zinc-800 bg-[#101014] p-4 shadow-2xl">
      <p className="text-sm font-bold text-white">
        {item.workoutName}
      </p>

      <p className="mt-1 text-xs text-zinc-500">
        {formatLongDate(item.fullDate)}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2">
          <p className="text-zinc-500">
            Peso
          </p>

          <p className="mt-1 font-bold text-violet-300">
            {item.weight}kg
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2">
          <p className="text-zinc-500">
            Reps
          </p>

          <p className="mt-1 font-bold text-white">
            {item.reps}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2">
          <p className="text-zinc-500">
            Volume
          </p>

          <p className="mt-1 font-bold text-orange-300">
            {item.volume}kg
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2">
          <p className="text-zinc-500">
            Série
          </p>

          <p className="mt-1 font-bold text-white">
            {item.setNumber}
          </p>
        </div>
      </div>
    </div>
  )
}

function ExerciseProgress() {
  const [history, setHistory] = useState([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('')

  const [sortMode, setSortMode] = useState('mostSets')

  useEffect(() => {
    setHistory(getStorageData('forgeflow:history', []))
  }, [])

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
            mediaUrl: exercise.mediaUrl || '',
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
      if (sortMode === 'name') {
        return a.name.localeCompare(b.name)
      }

      if (sortMode === 'mostSets') {
        return b.totalSets - a.totalSets
      }

      if (sortMode === 'mostWorkouts') {
        return b.totalAppearances - a.totalAppearances
      }

      if (sortMode === 'volume') {
        return b.totalVolume - a.totalVolume
      }

      if (sortMode === 'recent') {
        return new Date(b.lastDate) - new Date(a.lastDate)
      }

      return 0
    })
  }, [exerciseLibrary, search, groupFilter, sortMode])

  const groupedExercises = useMemo(() => {
    return filteredExercises.reduce((groups, exercise) => {
      const group = exercise.muscleGroup || 'Sem grupo'

      if (!groups[group]) {
        groups[group] = []
      }

      groups[group].push(exercise)

      return groups
    }, {})
  }, [filteredExercises])

  const selectedExerciseData = useMemo(() => {
    return exerciseLibrary.find((exercise) => exercise.name === selectedExercise) || null
  }, [exerciseLibrary, selectedExercise])

  const allSets = useMemo(() => {
    if (!selectedExercise) return []

    const sets = []

    history
      .slice()
      .reverse()
      .forEach((session) => {
        session.exercises.forEach((exercise) => {
          if (exercise.exercise?.name !== selectedExercise) return

          exercise.sets
            .filter(isValidWorkingSet)
            .forEach((set) => {
              sets.push({
                id: `${session.id}-${set.id}`,
                sessionId: session.id,
                workoutName: session.workoutName,
                fullDate: session.finishedAt,
                date: formatDate(session.finishedAt),
                setNumber: set.setNumber,
                plannedDescription: set.plannedDescription,
                weight: Number(set.weight),
                reps: Number(set.reps),
                volume: getSetVolume(set),
                isWeightPR: Boolean(set.isWeightPR),
                isVolumePR: Boolean(set.isVolumePR),
                isPR: Boolean(set.isPR || set.isWeightPR || set.isVolumePR),
              })
            })
        })
      })

    return sets
  }, [history, selectedExercise])

  const progressData = useMemo(() => {
    if (!selectedExercise) return []

    return history
      .slice()
      .reverse()
      .map((session) => {
        const exercise = session.exercises.find(
          (item) => item.exercise?.name === selectedExercise
        )

        if (!exercise) return null

        const completedSets = exercise.sets.filter(isValidWorkingSet)

        if (completedSets.length === 0) return null

        const bestWeightSet = completedSets.reduce((best, current) => {
          const currentWeight = Number(current.weight)
          const bestWeight = Number(best.weight)

          if (currentWeight > bestWeight) return current

          if (
            currentWeight === bestWeight &&
            Number(current.reps) > Number(best.reps)
          ) {
            return current
          }

          return best
        }, completedSets[0])

        const bestVolumeSet = completedSets.reduce((best, current) => {
          return getSetVolume(current) > getSetVolume(best) ? current : best
        }, completedSets[0])

        const totalVolume = completedSets.reduce((total, set) => {
          return total + getSetVolume(set)
        }, 0)

        const totalReps = completedSets.reduce((total, set) => {
          return total + Number(set.reps)
        }, 0)

        return {
          id: session.id,
          workoutName: session.workoutName,
          date: formatDate(session.finishedAt),
          fullDate: session.finishedAt,

          maxWeight: Number(bestWeightSet.weight),
          maxWeightReps: Number(bestWeightSet.reps),
          maxWeightVolume: getSetVolume(bestWeightSet),
          maxWeightSetNumber: bestWeightSet.setNumber,

          maxVolume: getSetVolume(bestVolumeSet),
          maxVolumeWeight: Number(bestVolumeSet.weight),
          maxVolumeReps: Number(bestVolumeSet.reps),
          maxVolumeSetNumber: bestVolumeSet.setNumber,

          totalVolume,
          totalReps,
          sets: completedSets,
        }
      })
      .filter(Boolean)
  }, [history, selectedExercise])

  const weightChartData = useMemo(() => {
    return progressData.map((record) => ({
      id: record.id,
      workoutName: record.workoutName,
      date: record.date,
      fullDate: record.fullDate,
      weight: record.maxWeight,
      reps: record.maxWeightReps,
      volume: record.maxWeightVolume,
      setNumber: record.maxWeightSetNumber,
    }))
  }, [progressData])

  const volumeChartData = useMemo(() => {
    return progressData.map((record) => ({
      id: record.id,
      workoutName: record.workoutName,
      date: record.date,
      fullDate: record.fullDate,
      weight: record.maxVolumeWeight,
      reps: record.maxVolumeReps,
      volume: record.maxVolume,
      setNumber: record.maxVolumeSetNumber,
    }))
  }, [progressData])

  const bestWeight = useMemo(() => {
    if (allSets.length === 0) return null

    return allSets.reduce((best, current) => {
      if (current.weight > best.weight) return current

      if (current.weight === best.weight && current.reps > best.reps) {
        return current
      }

      return best
    }, allSets[0])
  }, [allSets])

  const bestVolume = useMemo(() => {
    if (allSets.length === 0) return null

    return allSets.reduce((best, current) =>
      current.volume > best.volume ? current : best
    )
  }, [allSets])

  const bestReps = useMemo(() => {
    if (allSets.length === 0) return null

    return allSets.reduce((best, current) =>
      current.reps > best.reps ? current : best
    )
  }, [allSets])

  const totalVolume = useMemo(() => {
    return allSets.reduce((total, set) => total + set.volume, 0)
  }, [allSets])

  return (
    <>
      <PageHeader
        title="Evolução"
        description="Acompanhe peso, volume, repetições, datas e séries por exercício."
        action={
          <Badge variant="purple">
            {exerciseLibrary.length} exercícios
          </Badge>
        }
      />

      <section className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="xl:sticky xl:top-24">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
                <Search size={23} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Exercícios
                </h2>

                <p className="text-sm text-zinc-500">
                  {filteredExercises.length} encontrados
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex h-12 items-center gap-3 rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-zinc-500">
                <Search size={19} />

                <input
                  type="text"
                  placeholder="Buscar exercício..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-zinc-600"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="transition hover:text-white"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <select
                  value={groupFilter}
                  onChange={(event) => setGroupFilter(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-sm font-bold text-white outline-none transition hover:border-zinc-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
                >
                  <option value="">Todos os músculos</option>

                  {muscleGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>

                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-sm font-bold text-white outline-none transition hover:border-zinc-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
                >
                  <option value="mostSets">Mais séries feitas</option>
                  <option value="mostWorkouts">Mais treinos feitos</option>
                  <option value="volume">Maior volume total</option>
                  <option value="recent">Mais recentes</option>
                  <option value="name">Nome A-Z</option>
                </select>
              </div>
            </div>

            <div className="mt-5 max-h-[720px] overflow-y-auto pr-2 space-y-5">
              {filteredExercises.length === 0 && (
                <EmptyState
                  title="Nenhum exercício"
                  description="Tente limpar os filtros ou finalizar treinos."
                />
              )}

              {Object.entries(groupedExercises).map(([group, exercises]) => (
                <div key={group}>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
                      {group}
                    </p>

                    <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-1 text-[10px] font-bold text-zinc-500">
                      {exercises.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {exercises.map((exercise) => {
                      const isSelected = selectedExercise === exercise.name

                      return (
                        <button
                          key={exercise.name}
                          type="button"
                          onClick={() => setSelectedExercise(exercise.name)}
                          className={
                            isSelected
                              ? 'flex w-full items-center gap-3 rounded-3xl border border-violet-500/40 bg-violet-500/10 p-3 text-left shadow-[0_0_20px_rgba(139,92,246,0.22)]'
                              : 'flex w-full items-center gap-3 rounded-3xl border border-zinc-800 bg-zinc-950 p-3 text-left transition hover:border-violet-500/30 hover:bg-[#18181b]'
                          }
                        >
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-white">
                            {exercise.mediaUrl ? (
                              <img
                                src={exercise.mediaUrl}
                                alt={exercise.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Dumbbell size={25} className="text-zinc-900" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-white">
                              {exercise.name}
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                              {exercise.equipment}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-1">
                              <span className="rounded-lg bg-violet-500/10 px-2 py-1 text-[10px] font-bold text-violet-300">
                                {exercise.totalSets} séries
                              </span>

                              <span className="rounded-lg bg-zinc-800 px-2 py-1 text-[10px] font-bold text-zinc-400">
                                {exercise.totalAppearances} treinos
                              </span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="xl:col-span-3 space-y-6">
          {!selectedExercise && (
            <EmptyState
              icon={BarChart3}
              title="Selecione um exercício"
              description="Escolha um exercício na lista para visualizar gráficos, recordes e histórico detalhado."
            />
          )}

          {selectedExercise && progressData.length === 0 && (
            <EmptyState
              icon={Activity}
              title="Sem registros válidos"
              description="Finalize treinos com peso e repetições para gerar evolução. Aquecimentos não entram nas estatísticas."
            />
          )}

          {progressData.length > 0 && (
            <>
              <Card className="overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-600/20 via-[#18181b] to-[#121212]">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-white">
                      {selectedExerciseData?.mediaUrl ? (
                        <img
                          src={selectedExerciseData.mediaUrl}
                          alt={selectedExerciseData.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Dumbbell size={34} className="text-zinc-900" />
                      )}
                    </div>

                    <div>
                      <Badge variant="purple">
                        {selectedExerciseData?.muscleGroup}
                      </Badge>

                      <h2 className="mt-3 text-2xl font-black">
                        {selectedExercise}
                      </h2>

                      <p className="mt-1 text-sm text-zinc-400">
                        {progressData.length} treinos registrados • {allSets.length} séries válidas
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:w-[310px]">
                    <div className="rounded-3xl border border-zinc-800 bg-black/30 p-4">
                      <p className="text-xs text-zinc-500">
                        Volume total
                      </p>

                      <p className="mt-2 text-lg font-black text-orange-300">
                        {totalVolume.toLocaleString('pt-BR')}kg
                      </p>
                    </div>

                    <div className="rounded-3xl border border-zinc-800 bg-black/30 p-4">
                      <p className="text-xs text-zinc-500">
                        Repetições
                      </p>

                      <p className="mt-2 text-lg font-black">
                        {allSets.reduce((total, set) => total + set.reps, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-500">
                      Maior peso
                    </p>

                    <Weight size={20} className="text-violet-400" />
                  </div>

                  <h3 className="mt-2 text-3xl font-black text-violet-300">
                    {bestWeight?.weight}kg
                  </h3>

                  <p className="mt-2 text-xs text-zinc-500">
                    {bestWeight?.reps} reps • {bestWeight?.workoutName}
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    {formatLongDate(bestWeight?.fullDate)}
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-500">
                      Maior volume
                    </p>

                    <Flame size={20} className="text-orange-400" />
                  </div>

                  <h3 className="mt-2 text-3xl font-black text-orange-300">
                    {bestVolume?.volume}kg
                  </h3>

                  <p className="mt-2 text-xs text-zinc-500">
                    {bestVolume?.weight}kg × {bestVolume?.reps} reps
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    {formatLongDate(bestVolume?.fullDate)}
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-500">
                      Mais repetições
                    </p>

                    <Trophy size={20} className="text-yellow-400" />
                  </div>

                  <h3 className="mt-2 text-3xl font-black">
                    {bestReps?.reps}
                  </h3>

                  <p className="mt-2 text-xs text-zinc-500">
                    {bestReps?.weight}kg • {bestReps?.workoutName}
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    {formatLongDate(bestReps?.fullDate)}
                  </p>
                </Card>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold">
                        Evolução de carga
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        Maior peso usado em cada treino, com reps e série no tooltip.
                      </p>
                    </div>

                    <Weight size={24} className="text-violet-400" />
                  </div>

                  <div className="mt-5 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weightChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" stroke="#71717a" />
                        <YAxis stroke="#71717a" />
                        <Tooltip content={<ChartTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="weight"
                          stroke="#8b5cf6"
                          strokeWidth={3}
                          dot
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold">
                        Evolução de volume
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        Maior volume em uma série de cada treino.
                      </p>
                    </div>

                    <Flame size={24} className="text-orange-400" />
                  </div>

                  <div className="mt-5 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={volumeChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" stroke="#71717a" />
                        <YAxis stroke="#71717a" />
                        <Tooltip content={<ChartTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="volume"
                          stroke="#f97316"
                          strokeWidth={3}
                          dot
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </section>

              <Card>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      Histórico detalhado
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Todas as séries válidas registradas para {selectedExercise}.
                    </p>
                  </div>

                  <Target size={24} className="text-violet-400" />
                </div>

                <div className="mt-5 space-y-3">
                  {progressData
                    .slice()
                    .reverse()
                    .map((record) => (
                      <div
                        key={record.id}
                        className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-bold">
                              {record.workoutName}
                            </h3>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant="purple">
                                <CalendarDays size={13} />
                                {formatLongDate(record.fullDate)}
                              </Badge>

                              <Badge>
                                {record.sets.length} séries
                              </Badge>

                              <Badge variant="orange">
                                {record.totalVolume.toLocaleString('pt-BR')}kg volume
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="mb-2 hidden grid-cols-[70px_minmax(90px,1fr)_minmax(90px,1fr)_minmax(90px,1fr)_130px] gap-3 px-3 text-xs font-bold uppercase tracking-wide text-zinc-500 md:grid">
                            <span>Série</span>
                            <span>KG</span>
                            <span>Reps</span>
                            <span>Volume</span>
                            <span>Recorde</span>
                          </div>

                          <div className="space-y-2">
                            {record.sets.map((set) => {
                              const volume = getSetVolume(set)

                              return (
                                <div
                                  key={set.id}
                                  className="grid grid-cols-1 gap-2 rounded-2xl border border-zinc-800 bg-[#18181b] p-3 md:grid-cols-[70px_minmax(90px,1fr)_minmax(90px,1fr)_minmax(90px,1fr)_130px] md:items-center"
                                >
                                  <div>
                                    <p className="text-xs text-zinc-500 md:hidden">
                                      Série
                                    </p>

                                    <p className="font-bold">
                                      {set.setNumber}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-zinc-500 md:hidden">
                                      KG
                                    </p>

                                    <p className="font-semibold">
                                      {set.weight}kg
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-zinc-500 md:hidden">
                                      Reps
                                    </p>

                                    <p className="font-semibold">
                                      {set.reps}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-zinc-500 md:hidden">
                                      Volume
                                    </p>

                                    <p className="font-semibold text-orange-300">
                                      {volume}kg
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap gap-1">
                                    {set.isWeightPR && (
                                      <span className="rounded-lg bg-violet-500/20 px-2 py-1 text-[10px] font-bold text-violet-300">
                                        PESO PR
                                      </span>
                                    )}

                                    {set.isVolumePR && (
                                      <span className="rounded-lg bg-orange-500/20 px-2 py-1 text-[10px] font-bold text-orange-300">
                                        VOL PR
                                      </span>
                                    )}

                                    {!set.isWeightPR && !set.isVolumePR && (
                                      <span className="text-xs text-zinc-600">
                                        —
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
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