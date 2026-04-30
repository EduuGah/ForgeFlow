import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Input from '../components/ui/Input'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

import { useWorkoutSession } from '../context/WorkoutSessionContext'

import {
  getCompletedSets,
  getExercisePRs,
  getHeaviestExercise,
  getMostTrainedExercise,
  getMuscleGroupStats,
  getPRCount,
  getStorageData,
  getTotalVolume,
  getBodyWeightHistory,
} from '../utils/analyticsUtils'

function formatVolume(value) {
  return `${value.toLocaleString('pt-BR')} kg`
}

function Dashboard() {
  const [exercises, setExercises] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [history, setHistory] = useState([])
  const [bodyWeight, setBodyWeight] = useState([])

  const navigate = useNavigate()
  const { startSession } = useWorkoutSession()

  useEffect(() => {
    setExercises(getStorageData('forgeflow:exercises', []))
    setWorkouts(getStorageData('forgeflow:workouts', []))
    setHistory(getStorageData('forgeflow:history', []))
    setBodyWeight(getBodyWeightHistory())
  }, [])

  const completedSets = useMemo(() => getCompletedSets(history), [history])

  const [prSearch, setPrSearch] = useState('')

  const totalVolume = useMemo(() => {
    return getTotalVolume(completedSets)
  }, [completedSets])

  const heaviestExercise = useMemo(() => {
    return getHeaviestExercise(completedSets)
  }, [completedSets])

  const mostTrainedExercise = useMemo(() => {
    return getMostTrainedExercise(completedSets)
  }, [completedSets])

  const muscleStats = useMemo(() => {
    return getMuscleGroupStats(completedSets)
  }, [completedSets])

  const prCount = useMemo(() => {
    return getPRCount(completedSets)
  }, [completedSets])

  const exercisePRs = useMemo(() => {
    return getExercisePRs(completedSets)
      .map((pr) => ({
        ...pr,
        volume: pr.weight * pr.reps,
      }))
      .filter((pr) =>
        `${pr.exerciseName} ${pr.muscleGroup}`
          .toLowerCase()
          .includes(prSearch.toLowerCase())
      )
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 12)
  }, [completedSets, prSearch])

  const recentWorkouts = workouts.slice(0, 5)

  const volumeByWorkout = useMemo(() => {
    return history
      .slice()
      .reverse()
      .slice(-8)
      .map((session) => {
        const sets = getCompletedSets([session])
        const volume = getTotalVolume(sets)

        return {
          name: session.workoutName,
          volume,
        }
      })
  }, [history])

  const radarData = useMemo(() => {
    const mainGroups = {
      Peito: 0,
      Costas: 0,
      Ombros: 0,
      Braços: 0,
      Pernas: 0,
      Core: 0,
    }

    completedSets.forEach((set) => {
      if (set.muscleGroup === 'Peito') mainGroups.Peito += 1
      else if (set.muscleGroup === 'Costas') mainGroups.Costas += 1
      else if (set.muscleGroup === 'Ombros') mainGroups.Ombros += 1
      else if (
        set.muscleGroup === 'Bíceps' ||
        set.muscleGroup === 'Tríceps' ||
        set.muscleGroup === 'Antebraço'
      ) mainGroups.Braços += 1
      else if (
        set.muscleGroup === 'Pernas' ||
        set.muscleGroup === 'Glúteos' ||
        set.muscleGroup === 'Panturrilhas' ||
        set.muscleGroup === 'Quadríceps' ||
        set.muscleGroup === 'Posterior de Coxa'
      ) mainGroups.Pernas += 1
      else if (set.muscleGroup === 'Abdômen' || set.muscleGroup === 'Lombar') mainGroups.Core += 1
    })

    return Object.entries(mainGroups).map(([group, total]) => ({
      group,
      total,
    }))
  }, [completedSets])

  function handleStartWorkout(workout) {
    startSession(workout)
    navigate('/start-workout')
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Visão geral dos seus treinos, cargas, PRs, frequência e evolução."
        action={
          <Link to="/workouts">
            <Button>
              Novo treino
            </Button>
          </Link>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-zinc-500">Treinos concluídos</p>
          <h2 className="text-3xl font-bold mt-2">{history.length}</h2>
          <p className="text-xs text-violet-400 mt-2">Histórico real</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-zinc-500">Volume total</p>
          <h2 className="text-3xl font-bold mt-2 text-violet-400">
            {formatVolume(totalVolume)}
          </h2>
          <p className="text-xs text-violet-400 mt-2">Peso × repetições</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-zinc-500">PRs batidos</p>
          <h2 className="text-3xl font-bold mt-2">🏆 {prCount}</h2>
          <p className="text-xs text-violet-400 mt-2">Recordes pessoais</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-zinc-500">Exercícios cadastrados</p>
          <h2 className="text-3xl font-bold mt-2">{exercises.length}</h2>
          <p className="text-xs text-violet-400 mt-2">Biblioteca ativa</p>
        </Card>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        <Card className="xl:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Treinos salvos</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Inicie rapidamente uma rotina cadastrada.
              </p>
            </div>

            <Badge variant="purple">{workouts.length}</Badge>
          </div>

          <div className="mt-5 max-h-[420px] overflow-y-auto pr-2 space-y-3">
            {recentWorkouts.length === 0 && (
              <EmptyState
                title="Nenhum treino salvo"
                description="Crie um treino para iniciar por aqui."
                action={
                  <Link to="/workouts">
                    <Button>Criar treino</Button>
                  </Link>
                }
              />
            )}

            {recentWorkouts.map((workout) => {
              const groups = [
                ...new Set(
                  workout.exercises.map((item) => item.exercise?.muscleGroup)
                ),
              ].filter(Boolean)

              return (
                <div
                  key={workout.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 transition hover:border-violet-500/30"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="font-bold">{workout.name}</h3>

                      <p className="text-sm text-zinc-500 mt-1">
                        {workout.exercises.length} exercícios
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {groups.slice(0, 5).map((group) => (
                          <Badge key={group} variant="purple">
                            {group}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => handleStartWorkout(workout)}
                        className="py-2 text-sm"
                      >
                        Iniciar
                      </Button>

                      <Link to="/workouts">
                        <Button variant="secondary" className="py-2 text-sm">
                          Ver
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Destaques</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Suas melhores marcas registradas.
          </p>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">Maior carga</p>

              {heaviestExercise ? (
                <>
                  <h3 className="text-xl font-bold mt-1">
                    {heaviestExercise.weight}kg
                  </h3>

                  <p className="text-sm text-zinc-400 mt-1">
                    {heaviestExercise.exerciseName} × {heaviestExercise.reps} reps
                  </p>
                </>
              ) : (
                <p className="text-sm text-zinc-500 mt-2">
                  Sem registro ainda.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">Mais treinado</p>

              {mostTrainedExercise ? (
                <>
                  <h3 className="text-xl font-bold mt-1">
                    {mostTrainedExercise.name}
                  </h3>

                  <p className="text-sm text-zinc-400 mt-1">
                    {mostTrainedExercise.total} séries feitas
                  </p>
                </>
              ) : (
                <p className="text-sm text-zinc-500 mt-2">
                  Sem registro ainda.
                </p>
              )}
            </div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <Card>
          <h2 className="text-xl font-bold">Volume por treino</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Soma de peso × repetições dos últimos treinos.
          </p>

          <div className="mt-5 h-72">
            {volumeByWorkout.length === 0 ? (
              <EmptyState
                title="Sem dados para gráfico"
                description="Finalize treinos para gerar evolução de volume."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeByWorkout}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip
                    contentStyle={{
                      background: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '12px',
                    }}
                  />
                  <Bar dataKey="volume" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Mapa muscular</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Distribuição dos grupos mais treinados.
          </p>

          <div className="mt-5 h-72">
            {completedSets.length === 0 ? (
              <EmptyState
                title="Sem dados musculares"
                description="Finalize treinos para gerar o gráfico."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#3f3f46" />
                  <PolarAngleAxis dataKey="group" stroke="#a1a1aa" />
                  <Radar
                    name="Séries"
                    dataKey="total"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.35}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '12px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Recordes pessoais</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Pesquise seus melhores registros por exercício.
              </p>
            </div>

            <Badge variant="purple">
              {exercisePRs.length}
            </Badge>
          </div>

          <div className="mt-4">
            <Input
              type="text"
              placeholder="Buscar exercício..."
              value={prSearch}
              onChange={(event) => setPrSearch(event.target.value)}
            />
          </div>

          <div className="mt-5 max-h-[460px] overflow-y-auto pr-2 space-y-3">
            {exercisePRs.length === 0 && (
              <EmptyState
                title="Nenhum PR encontrado"
                description="Tente buscar outro exercício ou finalize treinos com peso e reps."
              />
            )}

            {exercisePRs.map((pr, index) => (
              <div
                key={pr.exerciseName}
                className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950 to-zinc-900/80 p-4 transition hover:border-violet-500/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-sm font-bold text-violet-400">
                        #{index + 1}
                      </span>

                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">
                          {pr.exerciseName}
                        </p>

                        <p className="text-xs text-zinc-500 mt-1">
                          {pr.muscleGroup}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Badge variant="purple">
                    🏆 PR
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3">
                    <p className="text-[11px] text-yellow-400">
                      PR de Peso
                    </p>

                    <p className="mt-1 text-lg font-bold text-yellow-300">
                      {pr.weight}kg
                    </p>

                    <p className="text-xs text-zinc-400 mt-1">
                      {pr.reps} repetições
                    </p>
                  </div>

                  <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-3">
                    <p className="text-[11px] text-orange-400">
                      PR de Volume
                    </p>

                    <p className="mt-1 text-lg font-bold text-orange-300">
                      {pr.volume}kg
                    </p>

                    <p className="text-xs text-zinc-400 mt-1">
                      {pr.weight}kg × {pr.reps} reps
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Grupos treinados</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Ranking por séries concluídas.
          </p>

          <div className="mt-5 space-y-3">
            {muscleStats.length === 0 && (
              <EmptyState
                title="Sem dados ainda"
                description="Finalize treinos para gerar estatísticas."
              />
            )}

            {muscleStats
              .sort((a, b) => b.total - a.total)
              .slice(0, 8)
              .map((group, index) => (
                <div
                  key={group.group}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{group.group}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {group.total} séries
                      </p>
                    </div>

                    <Badge variant={index === 0 ? 'purple' : 'default'}>
                      #{index + 1}
                    </Badge>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{
                        width: `${Math.min(group.total * 10, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Peso corporal</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Evolução registrada no perfil.
          </p>

          <div className="mt-5 h-64">
            {bodyWeight.length === 0 ? (
              <EmptyState
                title="Sem peso registrado"
                description="Depois criaremos a área de perfil para registrar peso corporal."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bodyWeight}>
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
                    dataKey="weight"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </section>
    </>
  )
}

export default Dashboard