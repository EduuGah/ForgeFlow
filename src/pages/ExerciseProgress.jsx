import { useEffect, useMemo, useState } from 'react'
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
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
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

function ExerciseProgress() {
  const [history, setHistory] = useState([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setHistory(getStorageData('forgeflow:history', []))
  }, [])

  const exerciseNames = useMemo(() => {
    const names = []

    history.forEach((session) => {
      session.exercises.forEach((item) => {
        if (item.exercise?.name) {
          names.push(item.exercise.name)
        }
      })
    })

    return [...new Set(names)].sort()
  }, [history])

  const filteredExerciseNames = useMemo(() => {
    return exerciseNames.filter((name) =>
      name.toLowerCase().includes(search.toLowerCase())
    )
  }, [exerciseNames, search])

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

        const completedSets = exercise.sets.filter(
          (set) => set.completed && set.weight && set.reps
        )

        if (completedSets.length === 0) return null

        const maxWeight = Math.max(
          ...completedSets.map((set) => Number(set.weight))
        )

        const maxVolume = Math.max(
          ...completedSets.map((set) => Number(set.weight) * Number(set.reps))
        )

        const totalVolume = completedSets.reduce((total, set) => {
          return total + Number(set.weight) * Number(set.reps)
        }, 0)

        const totalReps = completedSets.reduce((total, set) => {
          return total + Number(set.reps)
        }, 0)

        return {
          id: session.id,
          workoutName: session.workoutName,
          date: formatDate(session.finishedAt),
          fullDate: session.finishedAt,
          maxWeight,
          maxVolume,
          totalVolume,
          totalReps,
          sets: completedSets,
        }
      })
      .filter(Boolean)
  }, [history, selectedExercise])

  const bestWeight = useMemo(() => {
    if (progressData.length === 0) return null

    return progressData.reduce((best, current) =>
      current.maxWeight > best.maxWeight ? current : best
    )
  }, [progressData])

  const bestVolume = useMemo(() => {
    if (progressData.length === 0) return null

    return progressData.reduce((best, current) =>
      current.maxVolume > best.maxVolume ? current : best
    )
  }, [progressData])

  return (
    <>
      <PageHeader
        title="Evolução por Exercício"
        description="Acompanhe carga, volume e progresso de cada exercício ao longo do tempo."
        action={
          <Badge variant="purple">
            {exerciseNames.length} exercícios
          </Badge>
        }
      />

      <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 space-y-6">
          <Card>
            <h2 className="text-xl font-bold">
              Selecionar exercício
            </h2>

            <p className="text-sm text-zinc-500 mt-1">
              Pesquise e escolha um exercício para analisar.
            </p>

            <div className="mt-5 space-y-4">
              <Input
                placeholder="Buscar exercício..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <Select
                value={selectedExercise}
                onChange={(event) => setSelectedExercise(event.target.value)}
              >
                <option value="">Selecione</option>

                {filteredExerciseNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">
              Melhores marcas
            </h2>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                <p className="text-xs text-yellow-400">
                  PR de Peso
                </p>

                {bestWeight ? (
                  <>
                    <p className="text-2xl font-bold text-yellow-300 mt-1">
                      {bestWeight.maxWeight}kg
                    </p>

                    <p className="text-xs text-zinc-400 mt-1">
                      {bestWeight.date} • {bestWeight.workoutName}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-zinc-500 mt-2">
                    Sem dados.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
                <p className="text-xs text-orange-400">
                  PR de Volume
                </p>

                {bestVolume ? (
                  <>
                    <p className="text-2xl font-bold text-orange-300 mt-1">
                      {bestVolume.maxVolume}kg
                    </p>

                    <p className="text-xs text-zinc-400 mt-1">
                      {bestVolume.date} • {bestVolume.workoutName}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-zinc-500 mt-2">
                    Sem dados.
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="xl:col-span-3 space-y-6">
          {!selectedExercise && (
            <EmptyState
              title="Escolha um exercício"
              description="Selecione um exercício para visualizar gráficos e histórico de evolução."
            />
          )}

          {selectedExercise && progressData.length === 0 && (
            <EmptyState
              title="Sem registros para este exercício"
              description="Finalize treinos com peso e repetições para gerar evolução."
            />
          )}

          {progressData.length > 0 && (
            <>
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-zinc-500">
                    Registros
                  </p>

                  <h3 className="text-3xl font-bold mt-2">
                    {progressData.length}
                  </h3>
                </Card>

                <Card className="p-4">
                  <p className="text-sm text-zinc-500">
                    Melhor carga
                  </p>

                  <h3 className="text-3xl font-bold text-yellow-300 mt-2">
                    {bestWeight?.maxWeight}kg
                  </h3>
                </Card>

                <Card className="p-4">
                  <p className="text-sm text-zinc-500">
                    Melhor volume
                  </p>

                  <h3 className="text-3xl font-bold text-orange-300 mt-2">
                    {bestVolume?.maxVolume}kg
                  </h3>
                </Card>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card>
                  <h2 className="text-xl font-bold">
                    Evolução de carga
                  </h2>

                  <p className="text-sm text-zinc-500 mt-1">
                    Maior peso usado por treino.
                  </p>

                  <div className="mt-5 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" stroke="#71717a" />
                        <YAxis stroke="#71717a" />
                        <Tooltip
                          contentStyle={{
                            background: '#09090b',
                            border: '1px solid #27272a',
                            borderRadius: '12px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="maxWeight"
                          stroke="#eab308"
                          strokeWidth={3}
                          dot
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card>
                  <h2 className="text-xl font-bold">
                    Evolução de volume
                  </h2>

                  <p className="text-sm text-zinc-500 mt-1">
                    Maior volume em uma série.
                  </p>

                  <div className="mt-5 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" stroke="#71717a" />
                        <YAxis stroke="#71717a" />
                        <Tooltip
                          contentStyle={{
                            background: '#09090b',
                            border: '1px solid #27272a',
                            borderRadius: '12px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="maxVolume"
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
                <h2 className="text-xl font-bold">
                  Histórico detalhado
                </h2>

                <p className="text-sm text-zinc-500 mt-1">
                  Todos os registros encontrados para {selectedExercise}.
                </p>

                <div className="mt-5 space-y-3">
                  {progressData
                    .slice()
                    .reverse()
                    .map((record) => (
                      <div
                        key={record.id}
                        className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-bold">
                              {record.workoutName}
                            </h3>

                            <p className="text-xs text-zinc-500 mt-1">
                              {record.date}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="purple">
                              {record.sets.length} séries
                            </Badge>

                            <Badge>
                              {record.totalReps} reps
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {record.sets.map((set) => (
                            <div
                              key={set.id}
                              className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold">
                                    Série {set.setNumber}
                                  </p>

                                  <p className="text-xs text-zinc-500 mt-1">
                                    {set.plannedDescription}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p className="font-bold">
                                    {set.weight}kg × {set.reps}
                                  </p>

                                  <p className="text-xs text-orange-400">
                                    {Number(set.weight) * Number(set.reps)}kg volume
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
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