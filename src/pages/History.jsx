import { useEffect, useState } from 'react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
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

function formatHour(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString)

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function History() {
  const [history, setHistory] = useState([])
  const [expandedSessionId, setExpandedSessionId] = useState(null)

  useEffect(() => {
    const savedHistory = localStorage.getItem('forgeflow:history')

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  function handleToggleSession(id) {
    setExpandedSessionId(
      expandedSessionId === id ? null : id
    )
  }

  function handleClearHistory() {
    const confirmClear = window.confirm(
      'Tem certeza que deseja apagar todo o histórico? Essa ação não pode ser desfeita.'
    )

    if (!confirmClear) return

    localStorage.removeItem('forgeflow:history')
    setHistory([])
  }

  function handleDeleteSession(id) {
    const confirmDelete = window.confirm(
      'Tem certeza que deseja apagar este treino do histórico?'
    )

    if (!confirmDelete) return

    const updatedHistory = history.filter((session) => session.id !== id)

    setHistory(updatedHistory)
    localStorage.setItem('forgeflow:history', JSON.stringify(updatedHistory))
  }

  return (
    <>
      <PageHeader
        title="Histórico de Treinos"
        description="Acompanhe sua evolução, PRs e todos os treinos finalizados."
        action={
          <Badge variant="purple">
            {history.length} treinos
          </Badge>
        }
      />

      {history.length > 0 && (
        <div className="mb-6">
          <Button
            type="button"
            variant="danger"
            onClick={handleClearHistory}
          >
            Limpar histórico
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {history.length === 0 && (
          <EmptyState
            title="Nenhum treino finalizado"
            description="Finalize um treino para ele aparecer aqui."
          />
        )}

        {history.map((session, sessionIndex) => {
          const isExpanded = expandedSessionId === session.id

          const totalPRs = session.exercises.reduce((total, exercise) => {
            return (
              total +
              exercise.sets.filter((set) => set.isPR).length
            )
          }, 0)

          return (
            <Card
              key={session.id}
              className="overflow-hidden"
            >
              <button
                type="button"
                onClick={() => handleToggleSession(session.id)}
                className="w-full text-left"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="purple">
                        #{history.length - sessionIndex}
                      </Badge>

                      <h2 className="text-xl font-bold">
                        {session.workoutName}
                      </h2>

                      {totalPRs > 0 && (
                        <Badge>
                          🏆 {totalPRs} PR
                        </Badge>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2">
                        <p className="text-xs text-zinc-500">
                          Data
                        </p>

                        <p className="font-semibold mt-1">
                          {formatDate(session.finishedAt)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2">
                        <p className="text-xs text-zinc-500">
                          Horário
                        </p>

                        <p className="font-semibold mt-1">
                          {formatHour(session.finishedAt)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2">
                        <p className="text-xs text-zinc-500">
                          Duração
                        </p>

                        <p className="font-semibold mt-1 text-violet-400">
                          {formatTime(session.duration || 0)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2">
                        <p className="text-xs text-zinc-500">
                          Exercícios
                        </p>

                        <p className="font-semibold mt-1">
                          {session.exercises.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-2xl text-zinc-500">
                    {isExpanded ? '−' : '+'}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="mt-6 border-t border-zinc-800 pt-6 space-y-5">
                  {session.exercises.map((exercise, exerciseIndex) => (
                    <div
                      key={exercise.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-sm font-bold text-violet-400">
                          {exerciseIndex + 1}
                        </span>

                        <div className="flex-1">
                          <h3 className="font-bold text-lg">
                            {exercise.exercise.name}
                          </h3>

                          <p className="text-sm text-zinc-500 mt-1">
                            {exercise.exercise.muscleGroup} • {exercise.exercise.equipment}
                          </p>

                          <div className="mt-4 space-y-2">
                            {exercise.sets.map((set) => (
                              <div
                                key={set.id}
                                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
                              >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <Badge>
                                      Série {set.setNumber}
                                    </Badge>

                                    <span className="text-sm text-zinc-400">
                                      {set.plannedDescription}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-3">
                                    <span className="font-semibold">
                                      {set.weight || '-'}kg × {set.reps || '-'} reps
                                    </span>

                                    {set.completed && (
                                      <Badge variant="purple">
                                        ✓ concluída
                                      </Badge>
                                    )}

                                    {set.isPR && (
                                      <Badge>
                                        🏆 PR
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {session.notes && (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                      <h3 className="font-bold">
                        Observações finais
                      </h3>

                      <p className="text-zinc-300 mt-3 leading-relaxed">
                        {session.notes}
                      </p>
                    </div>
                  )}
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                    <h3 className="font-bold text-red-400">
                      Zona de perigo
                    </h3>

                    <p className="text-sm text-zinc-500 mt-1">
                      Remova este treino específico do histórico.
                    </p>

                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => handleDeleteSession(session.id)}
                      className="mt-4"
                    >
                      Excluir este treino
                    </Button>
                  </div>
                </div>

              )}

            </Card>
          )
        })}
      </div>
    </>
  )
}

export default History