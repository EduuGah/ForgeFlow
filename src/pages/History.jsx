import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ChevronDown,
  Clock,
  Dumbbell,
  Flame,
  Medal,
  Search,
  Trash2,
  Trophy,
  X,
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Input from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return [hours, minutes, secs]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

function formatDate(dateString) {
  if (!dateString) return 'Sem data'

  const date = new Date(dateString)

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatShortDate(dateString) {
  if (!dateString) return 'Sem data'

  const date = new Date(dateString)

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function formatHour(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString)

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
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

function getSessionCompletedSets(session) {
  return session.exercises.flatMap((exercise) =>
    exercise.sets
      .filter(isValidWorkingSet)
      .map((set) => ({
        ...set,
        exerciseName: exercise.exercise?.name,
        muscleGroup: exercise.exercise?.muscleGroup,
        equipment: exercise.exercise?.equipment,
      }))
  )
}

function getSessionVolume(session) {
  return getSessionCompletedSets(session).reduce((total, set) => {
    const weight = Number(set.weight) || 0
    const reps = Number(set.reps) || 0

    return total + weight * reps
  }, 0)
}

function getSessionPRs(session) {
  return getSessionCompletedSets(session).filter(
    (set) => set.isPR || set.isWeightPR || set.isVolumePR
  )
}

function getExerciseVolume(exercise) {
  return exercise.sets.reduce((total, set) => {
    if (!set.completed) return total

    const weight = Number(set.weight) || 0
    const reps = Number(set.reps) || 0

    return total + weight * reps
  }, 0)
}

function History() {
  const [history, setHistory] = useState([])
  const [expandedSessionId, setExpandedSessionId] = useState(null)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)

  useEffect(() => {
    const savedHistory = localStorage.getItem('forgeflow:history')

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  const filteredHistory = useMemo(() => {
    return history.filter((session) => {
      const exerciseNames = session.exercises
        .map((item) => item.exercise?.name)
        .join(' ')

      const text = `${session.workoutName} ${exerciseNames}`.toLowerCase()

      return text.includes(search.toLowerCase())
    })
  }, [history, search])

  const totalVolume = useMemo(() => {
    return history.reduce((total, session) => total + getSessionVolume(session), 0)
  }, [history])

  const totalPRs = useMemo(() => {
    return history.reduce((total, session) => total + getSessionPRs(session).length, 0)
  }, [history])

  const totalCompletedSets = useMemo(() => {
    return history.reduce(
      (total, session) => total + getSessionCompletedSets(session).length,
      0
    )
  }, [history])

  function handleToggleSession(id) {
    setExpandedSessionId(
      expandedSessionId === id ? null : id
    )
  }

  function handleClearHistory() {
    localStorage.removeItem('forgeflow:history')
    setHistory([])
    setIsClearModalOpen(false)
  }

  function handleDeleteSession(id) {
    const updatedHistory = history.filter((session) => session.id !== id)

    setHistory(updatedHistory)
    localStorage.setItem('forgeflow:history', JSON.stringify(updatedHistory))
    setDeleteTarget(null)
  }

  return (
    <>
      <PageHeader
        title="Histórico"
        description="Revise seus treinos finalizados, séries, volume e recordes pessoais."
        action={
          <Badge variant="purple">
            {history.length} treinos
          </Badge>
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-zinc-500">
            Treinos
          </p>

          <h3 className="mt-2 text-3xl font-bold">
            {history.length}
          </h3>

          <p className="mt-2 text-xs text-violet-400">
            Finalizados
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-zinc-500">
            Séries concluídas
          </p>

          <h3 className="mt-2 text-3xl font-bold">
            {totalCompletedSets}
          </h3>

          <p className="mt-2 text-xs text-violet-400">
            Registradas
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-zinc-500">
            Volume total
          </p>

          <h3 className="mt-2 text-3xl font-bold text-violet-400">
            {totalVolume.toLocaleString('pt-BR')}kg
          </h3>

          <p className="mt-2 text-xs text-violet-400">
            Peso × reps
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-zinc-500">
            PRs
          </p>

          <h3 className="mt-2 text-3xl font-bold">
            🏆 {totalPRs}
          </h3>

          <p className="mt-2 text-xs text-violet-400">
            Recordes batidos
          </p>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <Card>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-2xl font-black">
                  Treinos finalizados
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  {filteredHistory.length} registros encontrados
                </p>
              </div>

              {history.length > 0 && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => setIsClearModalOpen(true)}
                  className="w-full lg:w-auto"
                >
                  <Trash2 size={17} />
                  Limpar histórico
                </Button>
              )}
            </div>

            <div className="mt-5 flex h-12 items-center gap-3 rounded-xl bg-[#2a2a2c] px-4 text-zinc-400">
              <Search size={20} />

              <input
                type="text"
                placeholder="Buscar por treino ou exercício..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-400"
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

            <div className="mt-6 space-y-4">
              {history.length === 0 && (
                <EmptyState
                  title="Nenhum treino finalizado"
                  description="Finalize um treino para ele aparecer aqui."
                />
              )}

              {history.length > 0 && filteredHistory.length === 0 && (
                <EmptyState
                  title="Nenhum treino encontrado"
                  description="Tente buscar por outro nome de treino ou exercício."
                />
              )}

              {filteredHistory.map((session, sessionIndex) => {
                const isExpanded = expandedSessionId === session.id
                const completedSessionSets = getSessionCompletedSets(session)
                const sessionVolume = getSessionVolume(session)
                const sessionPRs = getSessionPRs(session)

                return (
                  <div
                    key={session.id}
                    className="overflow-hidden rounded-3xl border border-zinc-800 bg-[#18181b] transition hover:border-violet-500/30"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSession(session.id)}
                      className="w-full p-5 text-left"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-sm font-bold text-violet-400">
                              #{history.length - sessionIndex}
                            </span>

                            <div>
                              <h3 className="text-xl font-black text-white">
                                {session.workoutName}
                              </h3>

                              <p className="mt-1 text-sm text-zinc-500">
                                {formatDate(session.finishedAt)} às {formatHour(session.finishedAt)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                              <p className="text-xs text-zinc-500">
                                Duração
                              </p>

                              <p className="mt-1 font-bold text-violet-400">
                                {formatTime(session.duration || 0)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                              <p className="text-xs text-zinc-500">
                                Exercícios
                              </p>

                              <p className="mt-1 font-bold">
                                {session.exercises.length}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                              <p className="text-xs text-zinc-500">
                                Volume
                              </p>

                              <p className="mt-1 font-bold">
                                {sessionVolume.toLocaleString('pt-BR')}kg
                              </p>
                            </div>

                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                              <p className="text-xs text-zinc-500">
                                PRs
                              </p>

                              <p className="mt-1 font-bold text-yellow-300">
                                {sessionPRs.length}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {sessionPRs.length > 0 && (
                            <Badge>
                              🏆 {sessionPRs.length} PR
                            </Badge>
                          )}

                          <ChevronDown
                            size={24}
                            className={
                              isExpanded
                                ? 'rotate-180 text-violet-400 transition'
                                : 'text-zinc-500 transition'
                            }
                          />
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-zinc-800 p-5">
                        <div className="space-y-4">
                          {session.exercises.map((exercise, exerciseIndex) => {
                            const exerciseVolume = getExerciseVolume(exercise)

                            return (
                              <div
                                key={exercise.id}
                                className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-white">
                                    {exercise.exercise?.mediaUrl ? (
                                      <img
                                        src={exercise.exercise.mediaUrl}
                                        alt={exercise.exercise.name}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <Dumbbell size={28} className="text-zinc-900" />
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-xs font-bold text-violet-400">
                                        {exerciseIndex + 1}
                                      </span>

                                      <h3 className="truncate text-lg font-bold">
                                        {exercise.exercise.name}
                                      </h3>
                                    </div>

                                    <p className="mt-1 text-sm text-zinc-500">
                                      {exercise.exercise.muscleGroup} • {exercise.exercise.equipment}
                                    </p>

                                    <div className="mt-2 flex flex-wrap gap-2">
                                      <Badge variant="purple">
                                        {exercise.sets.filter(isValidWorkingSet).length} séries
                                      </Badge>

                                      <Badge>
                                        {exerciseVolume.toLocaleString('pt-BR')}kg volume
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4">
                                  <div className="mb-2 hidden grid-cols-[70px_minmax(90px,1fr)_minmax(90px,1fr)_minmax(90px,1fr)_140px] gap-3 px-3 text-xs font-bold uppercase tracking-wide text-zinc-500 md:grid">
                                    <span>Série</span>
                                    <span>KG</span>
                                    <span>Reps</span>
                                    <span>Volume</span>
                                    <span>Recorde</span>
                                  </div>

                                  <div className="space-y-2">
                                    {exercise.sets.filter(isValidWorkingSet).map((set) => {
                                      const weight = Number(set.weight) || 0
                                      const reps = Number(set.reps) || 0
                                      const volume = weight * reps

                                      return (
                                        <div
                                          key={set.id}
                                          className={
                                            set.completed
                                              ? 'grid grid-cols-1 gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 md:grid-cols-[70px_minmax(90px,1fr)_minmax(90px,1fr)_minmax(90px,1fr)_140px] md:items-center'
                                              : 'grid grid-cols-1 gap-2 rounded-2xl border border-zinc-800 bg-[#18181b] p-3 md:grid-cols-[70px_minmax(90px,1fr)_minmax(90px,1fr)_minmax(90px,1fr)_140px] md:items-center'
                                          }
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
                                              {set.weight || '-'}kg
                                            </p>
                                          </div>

                                          <div>
                                            <p className="text-xs text-zinc-500 md:hidden">
                                              Reps
                                            </p>

                                            <p className="font-semibold">
                                              {set.reps || '-'}
                                            </p>
                                          </div>

                                          <div>
                                            <p className="text-xs text-zinc-500 md:hidden">
                                              Volume
                                            </p>

                                            <p className="font-semibold text-orange-300">
                                              {volume ? `${volume}kg` : '-'}
                                            </p>
                                          </div>

                                          <div className="flex flex-wrap gap-1">
                                            {set.isWeightPR && (
                                              <span className="rounded-lg bg-violet-500/20 px-2 py-1 text-[10px] font-bold text-violet-300">
                                                PESO PR
                                              </span>
                                            )}

                                            {set.isVolumePR && (
                                              <span className="rounded-lg bg-yellow-500/20 px-2 py-1 text-[10px] font-bold text-yellow-300">
                                                VOL PR
                                              </span>
                                            )}

                                            {set.isPR && !set.isWeightPR && !set.isVolumePR && (
                                              <span className="rounded-lg bg-yellow-500/20 px-2 py-1 text-[10px] font-bold text-yellow-300">
                                                PR
                                              </span>
                                            )}

                                            {!set.isPR && !set.isWeightPR && !set.isVolumePR && (
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
                            )
                          })}
                        </div>

                        {session.notes && (
                          <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
                            <h3 className="font-bold">
                              Observações finais
                            </h3>

                            <p className="mt-3 leading-relaxed text-zinc-300">
                              {session.notes}
                            </p>
                          </div>
                        )}

                        <div className="mt-5 rounded-3xl border border-red-500/20 bg-red-500/5 p-5">
                          <h3 className="font-bold text-red-400">
                            Zona de perigo
                          </h3>

                          <p className="mt-1 text-sm text-zinc-500">
                            Remova este treino específico do histórico.
                          </p>

                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => setDeleteTarget(session)}
                            className="mt-4"
                          >
                            <Trash2 size={17} />
                            Excluir este treino
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-bold">
              Resumo geral
            </h2>

            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
                  <CalendarDays size={22} />
                </div>

                <div>
                  <p className="text-xs text-zinc-500">
                    Último treino
                  </p>

                  <p className="font-bold">
                    {history[0] ? formatShortDate(history[0].finishedAt) : 'Sem dados'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                  <Flame size={22} />
                </div>

                <div>
                  <p className="text-xs text-zinc-500">
                    Volume acumulado
                  </p>

                  <p className="font-bold">
                    {totalVolume.toLocaleString('pt-BR')}kg
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-400">
                  <Trophy size={22} />
                </div>

                <div>
                  <p className="text-xs text-zinc-500">
                    Recordes
                  </p>

                  <p className="font-bold">
                    {totalPRs} PRs
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <Medal size={22} />
                </div>

                <div>
                  <p className="text-xs text-zinc-500">
                    Séries concluídas
                  </p>

                  <p className="font-bold">
                    {totalCompletedSets}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">
              Dica
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Use a página de evolução para acompanhar um exercício específico ao longo do tempo.
            </p>
          </Card>
        </div>
      </section>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#121212] p-6 shadow-2xl shadow-red-950/30">
            <p className="text-sm font-bold text-red-400">
              Excluir treino
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Tem certeza?
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              O treino "{deleteTarget.workoutName}" será removido permanentemente do histórico.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="danger"
                onClick={() => handleDeleteSession(deleteTarget.id)}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#121212] p-6 shadow-2xl shadow-red-950/30">
            <p className="text-sm font-bold text-red-400">
              Limpar histórico
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Apagar tudo?
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Essa ação remove todos os treinos salvos no histórico e não pode ser desfeita.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsClearModalOpen(false)}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="danger"
                onClick={handleClearHistory}
              >
                Limpar tudo
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default History