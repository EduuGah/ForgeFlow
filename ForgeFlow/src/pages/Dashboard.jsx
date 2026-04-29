import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

function Dashboard() {
  const [exercises, setExercises] = useState([])
  const [workouts, setWorkouts] = useState([])

  useEffect(() => {
    const savedExercises = localStorage.getItem('forgeflow:exercises')
    const savedWorkouts = localStorage.getItem('forgeflow:workouts')

    if (savedExercises) {
      setExercises(JSON.parse(savedExercises))
    }

    if (savedWorkouts) {
      setWorkouts(JSON.parse(savedWorkouts))
    }
  }, [])

  const activeMuscleGroups = useMemo(() => {
    const groups = exercises.map((exercise) => exercise.muscleGroup)
    return [...new Set(groups)].filter(Boolean)
  }, [exercises])

  const totalWorkoutExercises = useMemo(() => {
    return workouts.reduce(
      (total, workout) => total + workout.exercises.length,
      0
    )
  }, [workouts])

  const recentWorkouts = workouts.slice(0, 3)

  const mostUsedGroups = useMemo(() => {
    const count = {}

    workouts.forEach((workout) => {
      workout.exercises.forEach((item) => {
        const group = item.exercise?.muscleGroup

        if (group) {
          count[group] = (count[group] || 0) + 1
        }
      })
    })

    return Object.entries(count)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [workouts])

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Acompanhe sua biblioteca, seus treinos montados e a evolução geral do ForgeFlow."
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
          <p className="text-sm text-zinc-500">
            Exercícios cadastrados
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {exercises.length}
          </h2>

          <p className="text-xs text-violet-400 mt-2">
            Biblioteca ativa
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-zinc-500">
            Treinos salvos
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {workouts.length}
          </h2>

          <p className="text-xs text-violet-400 mt-2">
            Rotinas montadas
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-zinc-500">
            Grupos musculares
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {activeMuscleGroups.length}
          </h2>

          <p className="text-xs text-violet-400 mt-2">
            Grupos cadastrados
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-zinc-500">
            Exercícios em treinos
          </p>

          <h2 className="text-3xl font-bold mt-2 text-violet-400">
            {totalWorkoutExercises}
          </h2>

          <p className="text-xs text-violet-400 mt-2">
            Volume planejado
          </p>
        </Card>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        <Card className="xl:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Treinos recentes
              </h2>

              <p className="text-sm text-zinc-500 mt-1">
                Últimos treinos criados no sistema.
              </p>
            </div>

            <Badge variant="purple">
              {workouts.length}
            </Badge>
          </div>

          <div className="mt-5 space-y-3">
            {recentWorkouts.length === 0 && (
              <EmptyState
                title="Nenhum treino criado"
                description="Crie seu primeiro treino para ele aparecer aqui."
                action={
                  <Link to="/workouts">
                    <Button>
                      Criar treino
                    </Button>
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-bold">
                        {workout.name}
                      </h3>

                      <p className="text-sm text-zinc-500 mt-1">
                        {workout.exercises.length} exercícios adicionados
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {groups.slice(0, 4).map((group) => (
                          <Badge key={group} variant="purple">
                            {group}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Link to="/workouts">
                      <Button variant="secondary" className="py-2 text-sm">
                        Ver treino
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">
            Ações rápidas
          </h2>

          <p className="text-sm text-zinc-500 mt-1">
            Atalhos para continuar montando seu sistema.
          </p>

          <div className="mt-5 space-y-3">
            <Link to="/workouts" className="block">
              <Button className="w-full">
                Criar novo treino
              </Button>
            </Link>

            <Link to="/exercises" className="block">
              <Button variant="secondary" className="w-full">
                Cadastrar exercício
              </Button>
            </Link>

            <Link to="/history" className="block">
              <Button variant="ghost" className="w-full">
                Ver histórico
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        <Card>
          <h2 className="text-xl font-bold">
            Grupos mais usados
          </h2>

          <p className="text-sm text-zinc-500 mt-1">
            Baseado nos exercícios adicionados aos treinos.
          </p>

          <div className="mt-5 space-y-3">
            {mostUsedGroups.length === 0 && (
              <EmptyState
                title="Sem dados ainda"
                description="Monte treinos para gerar estatísticas."
              />
            )}

            {mostUsedGroups.map((group, index) => (
              <div
                key={group.name}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {group.name}
                    </p>

                    <p className="text-xs text-zinc-500 mt-1">
                      {group.total} exercícios usados
                    </p>
                  </div>

                  <Badge variant={index === 0 ? 'purple' : 'default'}>
                    #{index + 1}
                  </Badge>
                </div>

                <div className="mt-3 h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{
                      width: `${Math.min(group.total * 15, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <h2 className="text-xl font-bold">
            Próximas melhorias
          </h2>

          <p className="text-sm text-zinc-500 mt-1">
            O ForgeFlow ainda pode evoluir para registrar treinos reais, cargas e histórico.
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <Badge variant="purple">
                Em breve
              </Badge>

              <h3 className="font-bold mt-3">
                Executar treino
              </h3>

              <p className="text-sm text-zinc-500 mt-1">
                Registrar peso, reps, falha e séries concluídas.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <Badge variant="purple">
                Em breve
              </Badge>

              <h3 className="font-bold mt-3">
                Histórico real
              </h3>

              <p className="text-sm text-zinc-500 mt-1">
                Guardar treinos finalizados e acompanhar evolução.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <Badge variant="purple">
                Em breve
              </Badge>

              <h3 className="font-bold mt-3">
                Progressão de carga
              </h3>

              <p className="text-sm text-zinc-500 mt-1">
                Comparar pesos usados ao longo das semanas.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <Badge variant="purple">
                Em breve
              </Badge>

              <h3 className="font-bold mt-3">
                Dashboard com gráficos
              </h3>

              <p className="text-sm text-zinc-500 mt-1">
                Visualizar volume, frequência e grupos treinados.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </>
  )
}

export default Dashboard