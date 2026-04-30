import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Dumbbell,
  AlertTriangle,
  CheckCircle2,
  Repeat,
  ImageOff,
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

function ExerciseDetails() {
  const { id } = useParams()
  const [exercise, setExercise] = useState(null)

  useEffect(() => {
    const savedExercises = localStorage.getItem('forgeflow:exercises')

    if (!savedExercises) return

    const exercises = JSON.parse(savedExercises)
    const foundExercise = exercises.find((item) => item.id === id)

    setExercise(foundExercise || null)
  }, [id])

  if (!exercise) {
    return (
      <>
        <PageHeader
          title="Exercício não encontrado"
          description="Não foi possível localizar esse exercício."
        />

        <EmptyState
          title="Exercício não encontrado"
          description="Volte para a biblioteca e selecione outro exercício."
          action={
            <Link to="/exercises">
              <Button>
                Voltar
              </Button>
            </Link>
          }
        />
      </>
    )
  }

  const executionList = Array.isArray(exercise.execution)
    ? exercise.execution
    : []

  const mistakesList = Array.isArray(exercise.commonMistakes)
    ? exercise.commonMistakes
    : []

  const variationsList = Array.isArray(exercise.variations)
    ? exercise.variations
    : []

  return (
    <>
      <div className="mb-6">
        <Link
          to="/exercises"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={18} />
          Voltar para exercícios
        </Link>
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="overflow-hidden p-0">
            <div className="relative min-h-[320px] bg-white">
              {exercise.mediaUrl ? (
                <img
                  src={exercise.mediaUrl}
                  alt={exercise.name}
                  className="h-[320px] w-full object-contain"
                />
              ) : (
                <div className="flex h-[320px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100 text-zinc-900">
                      <Dumbbell size={44} />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-zinc-500">
                      Imagem do exercício
                    </p>

                    <p className="mt-1 text-xs text-zinc-400">
                      Adicione uma URL de imagem/GIF depois
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-3xl font-black tracking-tight">
                    {exercise.name}
                  </h1>

                  {exercise.originalName && exercise.originalName !== exercise.name && (
                    <p className="mt-1 text-sm text-zinc-500">
                      {exercise.originalName}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="purple">
                      {exercise.muscleGroup}
                    </Badge>

                    <Badge>
                      {exercise.equipment}
                    </Badge>

                    {exercise.mediaUrl ? (
                      <Badge variant="green">
                        Com mídia
                      </Badge>
                    ) : (
                      <Badge>
                        Sem mídia
                      </Badge>
                    )}
                  </div>
                </div>

                <Link to="/exercises">
                  <Button variant="secondary">
                    Editar na biblioteca
                  </Button>
                </Link>
              </div>

              {exercise.description && (
                <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Observações
                  </p>

                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                    {exercise.description}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Execução correta
                </h2>

                <p className="text-sm text-zinc-500">
                  Pontos importantes para executar melhor.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {executionList.length > 0 ? (
                executionList.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-3 rounded-2xl border border-zinc-800 bg-[#18181b] p-4"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-400">
                      {index + 1}
                    </span>

                    <p className="text-sm text-zinc-300">
                      {item}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Nenhuma dica cadastrada"
                  description="Edite o exercício para adicionar instruções de execução."
                />
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                <AlertTriangle size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Erros comuns
                </h2>

                <p className="text-sm text-zinc-500">
                  Coisas para evitar durante o movimento.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {mistakesList.length > 0 ? (
                mistakesList.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-3 rounded-2xl border border-zinc-800 bg-[#18181b] p-4"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-xs font-bold text-red-400">
                      !
                    </span>

                    <p className="text-sm text-zinc-300">
                      {item}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Nenhum erro comum cadastrado"
                  description="Adicione erros comuns para deixar a biblioteca mais completa."
                />
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-bold">
              Resumo
            </h2>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-zinc-800 bg-[#18181b] p-4">
                <p className="text-xs text-zinc-500">
                  Grupo muscular
                </p>

                <p className="mt-1 font-bold">
                  {exercise.muscleGroup}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-[#18181b] p-4">
                <p className="text-xs text-zinc-500">
                  Equipamento
                </p>

                <p className="mt-1 font-bold">
                  {exercise.equipment}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-[#18181b] p-4">
                <p className="text-xs text-zinc-500">
                  Mídia
                </p>

                <div className="mt-1 flex items-center gap-2 font-bold">
                  {exercise.mediaUrl ? (
                    <>
                      <Dumbbell size={18} className="text-violet-400" />
                      Disponível
                    </>
                  ) : (
                    <>
                      <ImageOff size={18} className="text-zinc-500" />
                      Não cadastrada
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
                <Repeat size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Variações
                </h2>

                <p className="text-sm text-zinc-500">
                  Alternativas parecidas.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {variationsList.length > 0 ? (
                variationsList.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-zinc-800 bg-[#18181b] p-4"
                  >
                    <p className="text-sm font-semibold text-zinc-300">
                      {item}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">
                  Nenhuma variação cadastrada.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">
              Tags
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="purple">
                {exercise.muscleGroup}
              </Badge>

              <Badge>
                {exercise.equipment}
              </Badge>

              {exercise.mediaUrl && (
                <Badge variant="green">
                  GIF
                </Badge>
              )}
            </div>
          </Card>
        </div>
      </section>
    </>
  )
}

export default ExerciseDetails