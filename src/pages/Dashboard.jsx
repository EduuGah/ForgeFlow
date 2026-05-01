import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  Flame,
  Medal,
  Play,
  Search,
  Target,
  Trophy,
  UserRound,
  Weight,
  X,
} from 'lucide-react'
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

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

import { useWorkoutSession } from '../context/WorkoutSessionContext'

import {
  getCompletedSets,
  getExercisePRs,
  getExerciseVolumePRs,
  getHeaviestExercise,
  getBestVolumeSet,
  getMostTrainedExercise,
  getMuscleGroupStats,
  getMuscleGroupVolumeStats,
  getPRCount,
  getWeightPRCount,
  getVolumePRCount,
  getRecentPRs,
  getStorageData,
  getTotalVolume,
  getBodyWeightHistory,
} from '../utils/analyticsUtils'

function formatVolume(value) {
  return `${value.toLocaleString('pt-BR')} kg`
}

function formatShortDate(dateString) {
  if (!dateString) return 'Sem data'

  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function getValidSetValue(set) {
  const weight = Number(set.weight) || 0
  const reps = Number(set.reps) || 0

  return {
    weight,
    reps,
    volume: weight * reps,
  }
}

function Dashboard() {
  const [exercises, setExercises] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [history, setHistory] = useState([])
  const [bodyWeight, setBodyWeight] = useState([])
  const [profile, setProfile] = useState({})
  const [prSearch, setPrSearch] = useState('')

  const navigate = useNavigate()
  const { startSession } = useWorkoutSession()

  useEffect(() => {
    setExercises(getStorageData('forgeflow:exercises', []))
    setWorkouts(getStorageData('forgeflow:workouts', []))
    setHistory(getStorageData('forgeflow:history', []))
    setBodyWeight(getBodyWeightHistory())
    setProfile(getStorageData('forgeflow:profile', {}))
  }, [])

  const completedSets = useMemo(() => getCompletedSets(history), [history])

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

  const weightPRCount = useMemo(() => {
    return getWeightPRCount(completedSets)
  }, [completedSets])

  const volumePRCount = useMemo(() => {
    return getVolumePRCount(completedSets)
  }, [completedSets])

  const bestVolumeSet = useMemo(() => {
    return getBestVolumeSet(completedSets)
  }, [completedSets])

  const muscleVolumeStats = useMemo(() => {
    return getMuscleGroupVolumeStats(completedSets)
  }, [completedSets])

  const recentPRs = useMemo(() => {
    return getRecentPRs(completedSets, 6)
  }, [completedSets])

  const volumePRs = useMemo(() => {
    return getExerciseVolumePRs(completedSets)
  }, [completedSets])

  const workoutsByWeek = useMemo(() => {
    const map = new Map()

    history.forEach((session) => {
      if (!session.finishedAt) return

      const date = new Date(session.finishedAt)
      const year = date.getFullYear()

      const firstDayOfYear = new Date(year, 0, 1)
      const pastDaysOfYear = (date - firstDayOfYear) / 86400000
      const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)

      const key = `Sem ${week}`

      map.set(key, (map.get(key) || 0) + 1)
    })

    return Array.from(map.entries()).map(([week, total]) => ({
      week,
      total,
    }))
  }, [history])

  const setsByWorkout = useMemo(() => {
    return history
      .slice()
      .reverse()
      .slice(-8)
      .map((session) => {
        const sets = getCompletedSets([session])

        return {
          name: session.workoutName,
          sets: sets.length,
        }
      })
  }, [history])

  const muscleVolumeChartData = useMemo(() => {
    return muscleVolumeStats
      .slice()
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 8)
  }, [muscleVolumeStats])


  const exercisePRs = useMemo(() => {
    const weightPRs = getExercisePRs(completedSets)

    const volumeMap = new Map()

    completedSets.forEach((set) => {
      const exerciseName = set.exerciseName
      if (!exerciseName) return

      const { weight, reps, volume } = getValidSetValue(set)
      if (!weight || !reps) return

      const current = volumeMap.get(exerciseName)

      if (!current || volume > current.volume) {
        volumeMap.set(exerciseName, {
          exerciseName,
          muscleGroup: set.muscleGroup || 'Sem grupo',
          weight,
          reps,
          volume,
        })
      }
    })

    return weightPRs
      .map((weightPr) => {
        const volumePr = volumeMap.get(weightPr.exerciseName)
        const weightVolume = Number(weightPr.weight) * Number(weightPr.reps)

        return {
          exerciseName: weightPr.exerciseName,
          muscleGroup: weightPr.muscleGroup,
          weightPR: {
            weight: weightPr.weight,
            reps: weightPr.reps,
            volume: weightVolume,
          },
          volumePR: volumePr || {
            weight: weightPr.weight,
            reps: weightPr.reps,
            volume: weightVolume,
          },
        }
      })
      .filter((pr) =>
        `${pr.exerciseName} ${pr.muscleGroup}`
          .toLowerCase()
          .includes(prSearch.toLowerCase())
      )
      .sort((a, b) => Number(b.weightPR.weight) - Number(a.weightPR.weight))
      .slice(0, 12)
  }, [completedSets, prSearch])

  const recentWorkouts = workouts.slice(0, 5)

  const lastSession = history[0] || null

  const currentWeight = bodyWeight.at(-1)?.weight || null

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
      ) {
        mainGroups.Braços += 1
      } else if (
        set.muscleGroup === 'Pernas' ||
        set.muscleGroup === 'Glúteos' ||
        set.muscleGroup === 'Panturrilhas' ||
        set.muscleGroup === 'Quadríceps' ||
        set.muscleGroup === 'Posterior de Coxa'
      ) {
        mainGroups.Pernas += 1
      } else if (
        set.muscleGroup === 'Abdômen' ||
        set.muscleGroup === 'Lombar'
      ) {
        mainGroups.Core += 1
      }
    })

    return Object.entries(mainGroups).map(([group, total]) => ({
      group,
      total,
    }))
  }, [completedSets])

  const strongestMuscleGroup = useMemo(() => {
    return muscleStats.slice().sort((a, b) => b.total - a.total)[0] || null
  }, [muscleStats])

  function handleStartWorkout(workout) {
    startSession(workout)
    navigate('/start-workout')
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Resumo geral da sua evolução, treinos, volume e recordes."
        action={
          <Link to="/workouts">
            <button
              type="button"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-bold text-white shadow-[0_0_18px_rgba(139,92,246,0.35)] transition hover:bg-violet-500 hover:shadow-[0_0_26px_rgba(139,92,246,0.55)]"
            >
              <Play size={18} />
              Novo treino
            </button>
          </Link>
        }
      />

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-600/20 via-[#18181b] to-[#121212]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-300">
                <Activity size={14} />
                ForgeFlow ativo
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight md:text-4xl">
                {profile?.name ? `Olá, ${profile.name}` : 'Bem-vindo ao ForgeFlow'}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
                Acompanhe seus treinos, controle seus recordes e veja sua evolução com base no histórico real.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/workouts">
                  <button
                    type="button"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200"
                  >
                    <Dumbbell size={18} />
                    Iniciar rotina
                  </button>
                </Link>

                <Link to="/progress">
                  <button
                    type="button"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-950/70 px-5 text-sm font-bold text-white transition hover:border-violet-500/40 hover:bg-zinc-900"
                  >
                    <BarChart3 size={18} />
                    Ver evolução
                  </button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:w-[320px]">
              <div className="rounded-3xl border border-zinc-800 bg-black/30 p-4">
                <p className="text-xs text-zinc-500">
                  Último treino
                </p>

                <p className="mt-2 text-lg font-bold">
                  {lastSession ? formatShortDate(lastSession.finishedAt) : '--'}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-black/30 p-4">
                <p className="text-xs text-zinc-500">
                  Peso atual
                </p>

                <p className="mt-2 text-lg font-bold text-violet-300">
                  {currentWeight ? `${currentWeight}kg` : '--'}
                </p>
              </div>

              <div className="col-span-2 rounded-3xl border border-zinc-800 bg-black/30 p-4">
                <p className="text-xs text-zinc-500">
                  Grupo mais treinado
                </p>

                <p className="mt-2 text-lg font-bold">
                  {strongestMuscleGroup
                    ? `${strongestMuscleGroup.group} • ${strongestMuscleGroup.total} séries`
                    : '--'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
              <Target size={24} />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Meta atual
              </h2>

              <p className="text-sm text-zinc-500">
                Dados do perfil
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">
                Objetivo
              </p>

              <p className="mt-1 font-bold">
                {profile?.goal || 'Não definido'}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">
                Meta semanal
              </p>

              <p className="mt-1 font-bold text-violet-300">
                {profile?.weeklyTarget || 'Não definida'}
              </p>
            </div>

            <Link to="/profile">
              <button
                type="button"
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-[#18181b] text-sm font-bold text-white transition hover:border-violet-500/40 hover:bg-zinc-900"
              >
                <UserRound size={18} />
                Editar perfil
              </button>
            </Link>
          </div>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Treinos
            </p>

            <CalendarDays size={20} className="text-violet-400" />
          </div>

          <h2 className="mt-2 text-3xl font-black">
            {history.length}
          </h2>

          <p className="mt-2 text-xs text-violet-400">
            Finalizados
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Volume
            </p>

            <Weight size={20} className="text-violet-400" />
          </div>

          <h2 className="mt-2 text-2xl font-black text-violet-400">
            {formatVolume(totalVolume)}
          </h2>

          <p className="mt-2 text-xs text-violet-400">
            Peso × reps
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              PRs
            </p>

            <Trophy size={20} className="text-yellow-400" />
          </div>

          <h2 className="mt-2 text-3xl font-black">
            {prCount}
          </h2>

          <p className="mt-2 text-xs text-violet-400">
            Recordes
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Exercícios
            </p>

            <Dumbbell size={20} className="text-violet-400" />
          </div>

          <h2 className="mt-2 text-3xl font-black">
            {exercises.length}
          </h2>

          <p className="mt-2 text-xs text-violet-400">
            Biblioteca
          </p>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              PRs de peso
            </p>

            <Trophy size={20} className="text-violet-400" />
          </div>

          <h2 className="mt-2 text-3xl font-black text-violet-300">
            {weightPRCount}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            Recordes por maior carga
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              PRs de volume
            </p>

            <Flame size={20} className="text-orange-400" />
          </div>

          <h2 className="mt-2 text-3xl font-black text-orange-300">
            {volumePRCount}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            Recordes por peso × reps
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Melhor volume em série
            </p>

            <Weight size={20} className="text-violet-400" />
          </div>

          {bestVolumeSet ? (
            <>
              <h2 className="mt-2 text-2xl font-black text-violet-300">
                {bestVolumeSet.volume}kg
              </h2>

              <p className="mt-2 text-xs text-zinc-500">
                {bestVolumeSet.exerciseName} • {bestVolumeSet.weight}kg × {bestVolumeSet.reps}
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-2xl font-black">
                --
              </h2>

              <p className="mt-2 text-xs text-zinc-500">
                Sem dados ainda
              </p>
            </>
          )}
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">
                Rotinas rápidas
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Inicie uma rotina salva em poucos segundos.
              </p>
            </div>

            <Link to="/workouts">
              <button
                type="button"
                className="hidden items-center gap-1 text-sm font-bold text-violet-400 transition hover:text-violet-300 sm:flex"
              >
                Ver todas
                <ChevronRight size={18} />
              </button>
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {recentWorkouts.length === 0 && (
              <EmptyState
                title="Nenhuma rotina salva"
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

              const firstExercise = workout.exercises[0]?.exercise

              return (
                <div
                  key={workout.id}
                  className="rounded-3xl border border-zinc-800 bg-[#18181b] p-4 transition hover:border-violet-500/40 hover:bg-[#1f1f23]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-white">
                        {firstExercise?.mediaUrl ? (
                          <img
                            src={firstExercise.mediaUrl}
                            alt={firstExercise.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Dumbbell size={28} className="text-zinc-900" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-bold text-white">
                          {workout.name}
                        </h3>

                        <p className="mt-1 text-sm text-zinc-500">
                          {workout.exercises.length} exercícios
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {groups.slice(0, 4).map((group) => (
                            <Badge key={group} variant="purple">
                              {group}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartWorkout(workout)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 text-sm font-bold text-white transition hover:bg-violet-500"
                      >
                        <Play size={17} />
                        Iniciar
                      </button>

                      <Link to="/workouts">
                        <button
                          type="button"
                          className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 px-4 text-sm font-bold text-white transition hover:bg-zinc-800"
                        >
                          Ver
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-400">
              <Medal size={24} />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Destaques
              </h2>

              <p className="text-sm text-zinc-500">
                Melhores marcas
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">
                Maior carga
              </p>

              {heaviestExercise ? (
                <>
                  <h3 className="mt-1 text-2xl font-black text-violet-300">
                    {heaviestExercise.weight}kg
                  </h3>

                  <p className="mt-1 text-sm text-zinc-400">
                    {heaviestExercise.exerciseName} × {heaviestExercise.reps} reps
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-zinc-500">
                  Sem registro ainda.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">
                Mais treinado
              </p>

              {mostTrainedExercise ? (
                <>
                  <h3 className="mt-1 text-lg font-bold">
                    {mostTrainedExercise.name}
                  </h3>

                  <p className="mt-1 text-sm text-zinc-400">
                    {mostTrainedExercise.total} séries feitas
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-zinc-500">
                  Sem registro ainda.
                </p>
              )}
            </div>
          </div>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Volume por treino
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Soma de peso × repetições nos últimos treinos.
              </p>
            </div>

            <Flame size={24} className="text-orange-400" />
          </div>

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
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Mapa muscular
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Distribuição dos grupos mais treinados.
              </p>
            </div>

            <Target size={24} className="text-violet-400" />
          </div>

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

      <section className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Treinos por semana
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Frequência semanal registrada no histórico.
              </p>
            </div>

            <CalendarDays size={24} className="text-violet-400" />
          </div>

          <div className="mt-5 h-64">
            {workoutsByWeek.length === 0 ? (
              <EmptyState
                title="Sem frequência"
                description="Finalize treinos para gerar esse gráfico."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workoutsByWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="week" stroke="#71717a" />
                  <YAxis stroke="#71717a" allowDecimals={false} />
                  <Tooltip
                    formatter={(value) => [`${value} treino(s)`, 'Treinos']}
                    contentStyle={{
                      background: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Séries por treino
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Quantidade de séries válidas nos últimos treinos.
              </p>
            </div>

            <BarChart3 size={24} className="text-violet-400" />
          </div>

          <div className="mt-5 h-64">
            {setsByWorkout.length === 0 ? (
              <EmptyState
                title="Sem séries"
                description="Finalize treinos para gerar esse gráfico."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={setsByWorkout}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" />
                  <YAxis stroke="#71717a" allowDecimals={false} />
                  <Tooltip
                    formatter={(value) => [`${value} série(s)`, 'Séries']}
                    contentStyle={{
                      background: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="sets" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Volume por músculo
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Grupos musculares com maior volume acumulado.
              </p>
            </div>

            <Flame size={24} className="text-orange-400" />
          </div>

          <div className="mt-5 h-64">
            {muscleVolumeChartData.length === 0 ? (
              <EmptyState
                title="Sem volume"
                description="Finalize treinos para gerar esse gráfico."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={muscleVolumeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="group" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip
                    formatter={(value) => [`${value.toLocaleString('pt-BR')}kg`, 'Volume']}
                    contentStyle={{
                      background: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="volume" fill="#f97316" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Recordes pessoais
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Peso PR e Volume PR por exercício.
              </p>
            </div>

            <Badge variant="purple">
              {exercisePRs.length}
            </Badge>
          </div>

          <div className="mt-4 flex h-12 items-center gap-3 rounded-xl bg-[#2a2a2c] px-4 text-zinc-400">
            <Search size={20} />

            <input
              type="text"
              placeholder="Buscar exercício..."
              value={prSearch}
              onChange={(event) => setPrSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-400"
            />

            {prSearch && (
              <button
                type="button"
                onClick={() => setPrSearch('')}
                className="text-zinc-500 transition hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="mt-5 max-h-[520px] overflow-y-auto pr-2 space-y-3">
            {exercisePRs.length === 0 && (
              <EmptyState
                title="Nenhum PR encontrado"
                description="Tente buscar outro exercício ou finalize treinos."
              />
            )}

            {exercisePRs.map((pr, index) => (
              <div
                key={pr.exerciseName}
                className="rounded-3xl border border-zinc-800 bg-[#18181b] p-4 transition hover:border-violet-500/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-sm font-bold text-violet-400">
                        #{index + 1}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate font-bold text-white">
                          {pr.exerciseName}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          {pr.muscleGroup}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Trophy size={20} className="text-yellow-400" />
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-3">
                    <p className="text-[11px] font-bold text-violet-300">
                      PESO PR
                    </p>

                    <p className="mt-1 text-lg font-black text-violet-200">
                      {pr.weightPR.weight}kg
                    </p>

                    <p className="mt-1 text-xs text-zinc-400">
                      {pr.weightPR.reps} reps
                    </p>
                  </div>

                  <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-3">
                    <p className="text-[11px] font-bold text-orange-300">
                      VOLUME PR
                    </p>

                    <p className="mt-1 text-lg font-black text-orange-200">
                      {pr.volumePR.volume}kg
                    </p>

                    <p className="mt-1 text-xs text-zinc-400">
                      {pr.volumePR.weight}kg × {pr.volumePR.reps} reps
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">
            Grupos treinados
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
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
              .map((group, index) => {
                const maxTotal = Math.max(...muscleStats.map((item) => item.total))
                const percent = maxTotal ? (group.total / maxTotal) * 100 : 0

                return (
                  <div
                    key={group.group}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold">
                          {group.group}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
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
                          width: `${percent}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">
            Peso corporal
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Evolução registrada no perfil.
          </p>

          <div className="mt-5 h-64">
            {bodyWeight.length === 0 ? (
              <EmptyState
                title="Sem peso registrado"
                description="Registre seu peso na página de perfil para gerar o gráfico."
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

      <section className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                PRs recentes
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Últimos recordes salvos no histórico.
              </p>
            </div>

            <Trophy size={24} className="text-yellow-400" />
          </div>

          <div className="mt-5 space-y-3">
            {recentPRs.length === 0 && (
              <EmptyState
                title="Sem PRs recentes"
                description="Finalize treinos e bata recordes para aparecerem aqui."
              />
            )}

            {recentPRs.map((pr) => (
              <div
                key={`${pr.exerciseName}-${pr.date}-${pr.setNumber}-${pr.weight}-${pr.reps}`}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold">
                      {pr.exerciseName}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {pr.workoutName}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {pr.isWeightPR && (
                      <Badge variant="purple">
                        PESO PR
                      </Badge>
                    )}

                    {pr.isVolumePR && (
                      <Badge variant="orange">
                        VOL PR
                      </Badge>
                    )}

                    <Badge>
                      {pr.weight}kg × {pr.reps}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Top volume por exercício
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Maiores volumes registrados por exercício.
              </p>
            </div>

            <Flame size={24} className="text-orange-400" />
          </div>

          <div className="mt-5 space-y-3">
            {volumePRs.length === 0 && (
              <EmptyState
                title="Sem volume registrado"
                description="Finalize treinos com peso e repetições."
              />
            )}

            {volumePRs
              .slice()
              .sort((a, b) => b.volume - a.volume)
              .slice(0, 8)
              .map((pr, index) => (
                <div
                  key={pr.exerciseName}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-sm font-bold text-orange-300">
                          #{index + 1}
                        </span>

                        <div className="min-w-0">
                          <p className="truncate font-bold">
                            {pr.exerciseName}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            {pr.weight}kg × {pr.reps} reps
                          </p>
                        </div>
                      </div>
                    </div>

                    <Badge variant="orange">
                      {pr.volume}kg
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </section>
    </>
  )
}

export default Dashboard