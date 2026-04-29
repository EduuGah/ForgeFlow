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

    if (savedExercises) {
      const exercises = JSON.parse(savedExercises)
      const foundExercise = exercises.find((item) => item.id === id)

      setExercise(foundExercise || null)
    }
  }, [id])

  if (!exercise) {
    return (
      <>
        <PageHeader
          title="Exercício não encontrado"
          description="Não encontramos esse exercício na sua biblioteca."
        />

        <EmptyState
          title="Exercício não encontrado"
          description="Volte para a biblioteca e tente abrir outro exercício."
          action={
            <Link to="/exercises">
              <Button>
                Voltar para exercícios
              </Button>
            </Link>
          }
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={exercise.name}
        description="Detalhes, execução, dicas e informações importantes sobre o exercício."
        action={
          <Link to="/exercises">
            <Button variant="secondary">
              Voltar
            </Button>
          </Link>
        }
      />

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <div className="aspect-video rounded-3xl border border-zinc-800 bg-zinc-950 flex items-center justify-center overflow-hidden">
            {exercise.mediaUrl ? (
              <img
                src={exercise.mediaUrl}
                alt={exercise.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-center p-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-500/10 text-3xl">
                  🏋️
                </div>

                <h2 className="text-xl font-bold">
                  Mídia do exercício
                </h2>

                <p className="text-sm text-zinc-500 mt-2">
                  Futuramente você poderá adicionar uma imagem ou GIF demonstrativo.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>

          {exercise.description && (
            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <h2 className="text-xl font-bold">
                Observações
              </h2>

              <p className="text-zinc-300 mt-3 leading-relaxed">
                {exercise.description}
              </p>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-bold">
              Execução correta
            </h2>

            <ul className="mt-4 space-y-3 text-sm text-zinc-300">
              <li>• Controle o movimento do início ao fim.</li>
              <li>• Evite usar impulso excessivo.</li>
              <li>• Mantenha a postura estável durante a série.</li>
              <li>• Priorize amplitude e técnica antes da carga.</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">
              Erros comuns
            </h2>

            <ul className="mt-4 space-y-3 text-sm text-zinc-300">
              <li>• Aumentar carga sacrificando execução.</li>
              <li>• Fazer repetições muito rápidas.</li>
              <li>• Perder controle na fase negativa.</li>
              <li>• Não manter tensão no músculo alvo.</li>
            </ul>
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

              <Badge variant="green">
                Biblioteca
              </Badge>
            </div>
          </Card>
        </div>
      </section>
    </>
  )
}

export default ExerciseDetails