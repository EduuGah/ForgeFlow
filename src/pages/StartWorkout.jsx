import { useEffect, useState } from 'react'
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

  useEffect(() => {
    const savedExercises = localStorage.getItem('forgeflow:exercises')

    if (savedExercises) {
      setExercises(JSON.parse(savedExercises))
    }
  }, [])

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

  return (
    <>
      <PageHeader
        title={activeSession.workoutName}
        description="Registre peso, repetições e conclua suas séries."
        action={
          <Badge variant="purple">
            {formatTime(elapsedSeconds)}
          </Badge>
        }
      />

      <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-4">
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
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-sm font-bold text-violet-400">
                        {exerciseIndex + 1}
                      </span>

                      <div>
                        <h2 className="text-xl font-bold">
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

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[620px] border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-left text-xs text-zinc-500">
                        <th className="px-3">Série</th>
                        <th className="px-3">Planejado</th>
                        <th className="px-3">Peso</th>
                        <th className="px-3">Reps</th>
                        <th className="px-3">Status</th>
                        <th className="px-3">PR</th>
                      </tr>
                    </thead>

                    <tbody>
                      {sessionExercise.sets.map((set) => {
                        const isWeightPR = set.id === weightPRSetId
                        const isVolumePR = set.id === volumePRSetId

                        const comparison = getExerciseComparison(
                          sessionExercise.exercise.name,
                          set
                        )

                        return (
                          <tr
                            key={set.id}
                            className="rounded-xl bg-zinc-950"
                          >
                            <td className="rounded-l-xl px-3 py-3 text-sm font-bold">
                              {set.setNumber}
                            </td>

                            <td className="px-3 py-3 text-xs text-zinc-500">
                              {set.plannedDescription}
                            </td>

                            <td className="px-3 py-3">
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
                              />
                            </td>

                            <td className="px-3 py-3">
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
                              />
                            </td>

                            <td className="px-3 py-3">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleSetCompleted(sessionExercise.id, set.id)
                                }
                                className={
                                  set.completed
                                    ? 'rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-white'
                                    : 'rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-bold text-zinc-400 hover:border-violet-500 hover:text-white'
                                }
                              >
                                {set.completed ? '✓' : '○'}
                              </button>
                            </td>

                            <td className="rounded-r-xl px-3 py-3">
                              <div className="flex flex-wrap gap-2">
                                {isWeightPR && (
                                  <span className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 text-xs font-bold text-yellow-400">
                                    🏋️ Peso PR
                                  </span>
                                )}

                                {isVolumePR && (
                                  <span className="rounded-xl bg-orange-500/10 border border-orange-500/30 px-3 py-2 text-xs font-bold text-orange-400">
                                    🔥 Volume PR
                                  </span>
                                )}

                                {!isWeightPR && !isVolumePR && (
                                  <span className="text-xs text-zinc-600">
                                    —
                                  </span>
                                )}
                              </div>

                              {comparison.hasData && comparison.last && set.completed && (
                                <div className="mt-2 space-y-1 text-[11px] text-zinc-500">
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
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => addSet(sessionExercise.id)}
                  className="mt-4 w-full"
                >
                  Adicionar série
                </Button>
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