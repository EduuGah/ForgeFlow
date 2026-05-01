import { useEffect, useState } from 'react'
import { Timer, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

import { useWorkoutSession } from '../context/WorkoutSessionContext'

import {
  getLastExercisePerformance,
  getBestWeightPerformance,
  getBestVolumePerformance,
  getSessionPRTypes,
  getExerciseComparison,
  formatPerformance,
  formatDiff,
} from '../utils/prUtils'

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return [hours, minutes, secs]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

function getFirstCompletedSet(performance) {
  if (!performance?.sets) return null

  return (
    performance.sets.find((set) => set.completed && set.weight && set.reps) ||
    performance.sets.find((set) => set.weight && set.reps) ||
    performance.sets[0]
  )
}

function StartWorkout() {
  const {
    activeSession,
    elapsedSeconds,
    completedSets,
    totalSets,
    updateSet,
    toggleSetCompleted,
    addSet,
    removeExercise,
    skipExercise,
    replaceExercise,
    updateNotes,
    cancelSession,
    finishSession,
  } = useWorkoutSession()

  const [exercises, setExercises] = useState([])
  const [replaceExerciseId, setReplaceExerciseId] = useState(null)
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false)
  const [restTimer, setRestTimer] = useState(null)

  useEffect(() => {
    const savedExercises = localStorage.getItem('forgeflow:exercises')

    if (savedExercises) {
      setExercises(JSON.parse(savedExercises))
    }
  }, [])

  useEffect(() => {
    if (!restTimer) return
    if (restTimer.secondsLeft <= 0) return

    const interval = setInterval(() => {
      setRestTimer((current) => {
        if (!current) return null

        if (current.secondsLeft <= 1) {
          return {
            ...current,
            secondsLeft: 0,
          }
        }

        return {
          ...current,
          secondsLeft: current.secondsLeft - 1,
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [restTimer])

  if (!activeSession) {
    return (
      <>
        <PageHeader
          title="Executar treino"
          description="Nenhum treino está em andamento no momento."
        />

        <EmptyState
          title="Nenhum treino ativo"
          description="Vá até a página de Treinos e inicie uma rotina salva."
          action={
            <Link to="/workouts">
              <Button>
                Ir para treinos
              </Button>
            </Link>
          }
        />
      </>
    )
  }

  const totalExercises = activeSession.exercises.length

  const skippedExercises = activeSession.exercises.filter(
    (exercise) => exercise.skipped
  ).length

  const totalPRs = activeSession.exercises.reduce((total, exercise) => {
    return total + exercise.sets.filter(
      (set) => set.isPR || set.isWeightPR || set.isVolumePR
    ).length
  }, 0)

  function getRestSeconds(restTimerText) {
    if (!restTimerText || restTimerText === 'Desligado') return 0

    const number = Number(restTimerText.replace(/\D/g, ''))

    return Number.isNaN(number) ? 0 : number
  }

  function handleCompleteSet(sessionExercise, setId) {
    toggleSetCompleted(sessionExercise.id, setId)

    const seconds = getRestSeconds(sessionExercise.restTimer)

    if (seconds > 0) {
      setRestTimer({
        exerciseName: sessionExercise.exercise.name,
        secondsLeft: seconds,
        totalSeconds: seconds,
      })
    }
  }

  return (
    <>
      <PageHeader
        title={activeSession.workoutName}
        description={`${completedSets}/${totalSets} séries concluídas`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant="purple">
              {formatTime(elapsedSeconds)}
            </Badge>

            <button
              type="button"
              onClick={() => setIsFinishModalOpen(true)}
              className="h-10 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white shadow-[0_0_18px_rgba(139,92,246,0.35)] transition hover:bg-violet-500 hover:shadow-[0_0_24px_rgba(139,92,246,0.55)]"
            >
              Finalizar
            </button>
          </div>
        }
      />

      <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-4 pb-32">
          {activeSession.exercises.map((sessionExercise, exerciseIndex) => {
            const lastPerformance = getLastExercisePerformance(
              sessionExercise.exercise.name
            )

            const bestWeightPerformance = getBestWeightPerformance(
              sessionExercise.exercise.name
            )

            const bestVolumePerformance = getBestVolumePerformance(
              sessionExercise.exercise.name
            )

            const lastSet = getFirstCompletedSet(lastPerformance)

            const { weightPRSetId, volumePRSetId } = getSessionPRTypes(
              sessionExercise.exercise.name,
              sessionExercise.sets
            )

            return (
              <Card
                key={sessionExercise.id}
                className={sessionExercise.skipped ? 'opacity-50' : ''}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-sm font-bold text-violet-400">
                        {exerciseIndex + 1}
                      </span>

                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-bold">
                          {sessionExercise.exercise.name}
                        </h2>

                        <p className="text-sm text-zinc-500">
                          {sessionExercise.exercise.muscleGroup} • {sessionExercise.exercise.equipment}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                        <p className="text-xs text-zinc-500">
                          Último treino
                        </p>

                        <p className="text-sm font-semibold text-zinc-300 mt-1">
                          {lastSet
                            ? formatPerformance(lastSet)
                            : 'Sem registro anterior'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3">
                        <p className="text-xs text-violet-400">
                          Melhores marcas
                        </p>

                        <p className="text-sm font-semibold text-violet-300 mt-1">
                          Peso:{' '}
                          {bestWeightPerformance
                            ? `${bestWeightPerformance.weight}kg x ${bestWeightPerformance.reps} reps`
                            : 'Sem registro'}
                        </p>

                        <p className="text-sm font-semibold text-violet-300 mt-1">
                          Volume:{' '}
                          {bestVolumePerformance
                            ? `${bestVolumePerformance.volume}kg total`
                            : 'Sem registro'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        setReplaceExerciseId(
                          replaceExerciseId === sessionExercise.id
                            ? null
                            : sessionExercise.id
                        )
                      }
                      className="py-2 text-sm"
                    >
                      Substituir
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => skipExercise(sessionExercise.id)}
                      className="py-2 text-sm"
                    >
                      {sessionExercise.skipped ? 'Retomar' : 'Pular'}
                    </Button>

                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => removeExercise(sessionExercise.id)}
                      className="py-2 text-sm"
                    >
                      Excluir
                    </Button>
                  </div>
                </div>

                {replaceExerciseId === sessionExercise.id && (
                  <div className="mt-4">
                    <Select
                      label="Substituir por"
                      defaultValue=""
                      onChange={(event) => {
                        const newExercise = exercises.find(
                          (exercise) => exercise.id === event.target.value
                        )

                        if (newExercise) {
                          replaceExercise(sessionExercise.id, newExercise)
                          setReplaceExerciseId(null)
                        }
                      }}
                    >
                      <option value="">Selecione um exercício</option>

                      {exercises.map((exercise) => (
                        <option key={exercise.id} value={exercise.id}>
                          {exercise.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                <div className="mt-5">
                  <div className="mb-2 hidden grid-cols-[52px_minmax(120px,1fr)_minmax(120px,1fr)_150px_52px] gap-3 px-3 text-xs font-bold uppercase tracking-wide text-zinc-500 md:grid">
                    <span>Série</span>
                    <span>KG</span>
                    <span>Reps</span>
                    <span>Recordes</span>
                    <span>Status</span>
                  </div>

                  <div className="space-y-3">
                    {sessionExercise.sets.map((set) => {
                      const isWarmup = set.type === 'warmup'

                      const isWeightPR = !isWarmup && set.id === weightPRSetId
                      const isVolumePR = !isWarmup && set.id === volumePRSetId

                      const comparison = getExerciseComparison(
                        sessionExercise.exercise.name,
                        set
                      )

                      return (
                        <div
                          key={set.id}
                          className={`grid w-full grid-cols-[52px_minmax(120px,1fr)_minmax(120px,1fr)_150px_52px] items-center gap-3 rounded-2xl border p-3 transition max-md:grid-cols-[44px_1fr_1fr_44px] ${set.completed
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-zinc-800 bg-zinc-950'
                            }`}
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#18181b] font-bold">
                            {isWarmup ? 'A' : set.setNumber}
                          </div>

                          <Input
                            type="number"
                            placeholder="kg"
                            value={set.weight}
                            onChange={(event) =>
                              updateSet(
                                sessionExercise.id,
                                set.id,
                                'weight',
                                event.target.value
                              )
                            }
                            className="h-11 w-full"
                          />

                          <Input
                            type="number"
                            placeholder="reps"
                            value={set.reps}
                            onChange={(event) =>
                              updateSet(
                                sessionExercise.id,
                                set.id,
                                'reps',
                                event.target.value
                              )
                            }
                            className="h-11 w-full"
                          />

                          <div className="flex min-h-11 flex-col justify-center gap-1 max-md:col-span-4 max-md:flex-row max-md:justify-start">
                            {isWarmup && (
                              <span className="w-fit rounded-lg bg-zinc-700/40 px-2 py-1 text-[10px] font-bold text-zinc-300">
                                AQUECIMENTO
                              </span>
                            )}
                            {isWeightPR && (
                              <span className="w-fit rounded-lg bg-violet-500/20 px-2 py-1 text-[10px] font-bold text-violet-300">
                                PESO PR
                              </span>
                            )}

                            {isVolumePR && (
                              <span className="w-fit rounded-lg bg-yellow-500/20 px-2 py-1 text-[10px] font-bold text-yellow-300">
                                VOL PR
                              </span>
                            )}

                            {!isWarmup && !isWeightPR && !isVolumePR && (
                              <span className="hidden text-xs text-zinc-600 md:block">
                                —
                              </span>
                            )}

                            {comparison.hasData && comparison.last && set.completed && (
                              <div className="mt-1 hidden text-[10px] leading-tight text-zinc-500 lg:block">
                                <p>
                                  Peso: {formatDiff(comparison.weightDiffFromLast, 'kg')}
                                </p>

                                <p>
                                  Reps: {formatDiff(comparison.repsDiffFromLast)}
                                </p>

                                <p>
                                  Volume: {formatDiff(comparison.volumeDiffFromLast, 'kg')}
                                </p>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCompleteSet(sessionExercise, set.id)}
                            className={
                              set.completed
                                ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white'
                                : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-400 transition hover:border-violet-500 hover:text-white'
                            }
                          >
                            {set.completed ? '✓' : '○'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => addSet(sessionExercise.id)}
                  className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 text-sm font-bold transition hover:bg-zinc-700"
                >
                  + Adicionar Série
                </button>
              </Card>
            )
          })}
        </div>

        <div className="xl:col-span-1 space-y-4">
          <Card>
            <h2 className="text-xl font-bold">
              Treino ativo
            </h2>

            <p className="mt-2 text-3xl font-bold text-violet-400">
              {formatTime(elapsedSeconds)}
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              {completedSets}/{totalSets} séries concluídas
            </p>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-violet-500"
                style={{
                  width: totalSets
                    ? `${(completedSets / totalSets) * 100}%`
                    : '0%',
                }}
              />
            </div>
          </Card>

          <Card>
            <Textarea
              label="Observações finais"
              placeholder="Ex: treino pesado, ombro incomodou, aumentei carga no supino..."
              value={activeSession.notes}
              onChange={(event) => updateNotes(event.target.value)}
              rows={5}
            />
          </Card>

          <Card>
            <div className="space-y-3">
              <Button
                type="button"
                onClick={() => setIsFinishModalOpen(true)}
                className="w-full"
              >
                Finalizar treino
              </Button>

              <Button
                type="button"
                variant="danger"
                onClick={cancelSession}
                className="w-full"
              >
                Cancelar treino
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {restTimer && (
        <div className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-3xl border border-violet-500/30 bg-[#121212] p-4 shadow-2xl shadow-violet-950/50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
                <Timer size={24} />
              </div>

              <div>
                <p className="text-sm font-bold text-white">
                  Descanso
                </p>

                <p className="text-xs text-zinc-500">
                  {restTimer.exerciseName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <p className="text-2xl font-black text-violet-400">
                {formatTime(restTimer.secondsLeft)}
              </p>

              <button
                type="button"
                onClick={() => setRestTimer(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-violet-500 transition-all"
              style={{
                width: `${restTimer.totalSeconds
                  ? ((restTimer.totalSeconds - restTimer.secondsLeft) /
                    restTimer.totalSeconds) *
                  100
                  : 0
                  }%`,
              }}
            />
          </div>

          {restTimer.secondsLeft === 0 && (
            <p className="mt-3 text-center text-sm font-bold text-emerald-400">
              Descanso finalizado
            </p>
          )}
        </div>
      )}

      {isFinishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-violet-950/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-violet-400">
                  Confirmar finalização
                </p>

                <h2 className="mt-1 text-2xl font-bold text-white">
                  Finalizar treino?
                </h2>

                <p className="mt-2 text-sm text-zinc-400">
                  Confira o resumo antes de salvar este treino no histórico.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsFinishModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs text-zinc-500">
                  Duração
                </p>

                <p className="mt-1 text-xl font-bold text-violet-400">
                  {formatTime(elapsedSeconds)}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs text-zinc-500">
                  Séries concluídas
                </p>

                <p className="mt-1 text-xl font-bold">
                  {completedSets}/{totalSets}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs text-zinc-500">
                  Exercícios
                </p>

                <p className="mt-1 text-xl font-bold">
                  {totalExercises}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs text-zinc-500">
                  Pulados
                </p>

                <p className="mt-1 text-xl font-bold">
                  {skippedExercises}
                </p>
              </div>
            </div>

            {totalPRs > 0 && (
              <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                <p className="text-sm font-bold text-yellow-400">
                  🏆 {totalPRs} novo(s) PR(s) neste treino
                </p>
              </div>
            )}

            {activeSession.notes && (
              <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs text-zinc-500">
                  Observações
                </p>

                <p className="mt-2 text-sm text-zinc-300">
                  {activeSession.notes}
                </p>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsFinishModalOpen(false)}
                className="w-full"
              >
                Continuar treino
              </Button>

              <Button
                type="button"
                onClick={() => {
                  setIsFinishModalOpen(false)
                  finishSession()
                }}
                className="w-full"
              >
                Salvar no histórico
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default StartWorkout