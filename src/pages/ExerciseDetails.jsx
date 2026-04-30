import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

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
      <PageHeader
        title={exercise.name}
        description="Detalhes completos do exercício"
        action={
          <Link to="/exercises">
            <Button variant="secondary">
              Voltar
            </Button>
          </Link>
        }
      />

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <div className="aspect-video rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden flex items-center justify-center">
              {exercise.mediaUrl ? (
                <img
                  src={exercise.mediaUrl}
                  alt={exercise.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center px-6">
                  <div className="text-5xl mb-4">
                    🏋️
                  </div>

                  <h2 className="text-xl font-bold">
                    Sem mídia cadastrada
                  </h2>

                  <p className="text-sm text-zinc-500 mt-2">
                    Você pode adicionar um GIF ou imagem na edição do exercício.
                  </p>
                </div>
              )}
            </div>

            {exercise.description && (
              <div className="mt-6">
                <h2 className="text-xl font-bold">
                  Observações
                </h2>

                <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-zinc-300 leading-relaxed">
                    {exercise.description}
                  </p>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-bold">
              Execução correta
            </h2>

            <div className="mt-4 space-y-3">
              {executionList.length > 0 ? (
                executionList.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                  >
                    <p className="text-sm text-zinc-300">
                      • {item}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">
                  Nenhuma dica cadastrada.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">
              Erros comuns
            </h2>

            <div className="mt-4 space-y-3">
              {mistakesList.length > 0 ? (
                mistakesList.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                  >
                    <p className="text-sm text-zinc-300">
                      • {item}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">
                  Nenhum erro comum cadastrado.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">
              Variações
            </h2>

            <div className="mt-4 space-y-3">
              {variationsList.length > 0 ? (
                variationsList.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                  >
                    <p className="text-sm text-zinc-300">
                      • {item}
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
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-bold">
              Informações rápidas
            </h2>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">
                  Grupo muscular
                </p>

                <p className="font-bold mt-1">
                  {exercise.muscleGroup}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">
                  Equipamento
                </p>

                <p className="font-bold mt-1">
                  {exercise.equipment}
                </p>
              </div>

              {exercise.originalName && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-xs text-zinc-500">
                    Nome original
                  </p>

                  <p className="font-bold mt-1">
                    {exercise.originalName}
                  </p>
                </div>
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
                  GIF disponível
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