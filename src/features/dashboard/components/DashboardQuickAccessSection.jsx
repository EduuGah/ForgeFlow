import { Link } from 'react-router-dom'
import { ChevronRight, Dumbbell, Medal, Play } from 'lucide-react'

import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import EmptyState from '../../../components/ui/EmptyState'

function DashboardQuickAccessSection({
  recentWorkouts,
  favoriteWorkouts,
  favoriteExercises,
  exercises,
  heaviestExercise,
  mostTrainedExercise,
  handleStartWorkout,
  formatShortDate,
}) {
  return (
    <>
      <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        <Card className="">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Rotinas rápidas</h2>
              <p className="mt-1 text-sm text-[var(--ff-muted-2)]">
                Favoritos aparecem primeiro para você iniciar mais rápido.
              </p>
            </div>

            <Link to="/workouts">
              <button
                type="button"
                className="hidden items-center gap-1 text-sm font-bold text-[var(--ff-accent-text)] transition hover:text-[var(--ff-accent-text)] sm:flex"
              >
                Ver todas
                <ChevronRight size={18} />
              </button>
            </Link>
          </div>

          {favoriteWorkouts.length > 0 && (
            <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
              <p className="text-sm font-bold text-[var(--ff-warning-text)]">
                ⭐ {favoriteWorkouts.length} treino(s) favorito(s)
              </p>

              <p className="mt-1 text-xs leading-relaxed text-[var(--ff-muted)]">
                Eles aparecem primeiro nesta lista para facilitar o início do treino.
              </p>
            </div>
          )}

          <div className="mt-5 space-y-3">
            {recentWorkouts.length === 0 && (
              <EmptyState
                title="Nenhuma rotina salva"
                description="Crie um treino e marque seus favoritos para aparecerem aqui."
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
              const media =
                firstExercise?.media?.gif ||
                firstExercise?.mediaUrl ||
                firstExercise?.gifUrl ||
                ''

              const lastStartedLabel = workout.lastStartedAt
                ? `Último início: ${formatShortDate(workout.lastStartedAt)}`
                : `${workout.exercises.length} exercícios`

              return (
                <div
                  key={workout.id}
                  className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 transition hover:border-[var(--ff-accent-border)]/40 hover:bg-[var(--ff-card-hover)]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--ff-border)] bg-white">
                        {media ? (
                          <img
                            src={media}
                            loading="lazy"
                            decoding="async"
                            alt={firstExercise?.name || workout.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Dumbbell size={28} className="text-zinc-900" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-[var(--ff-text)]">
                          {workout.name}
                        </h3>
                        {workout.isFavorite && (
                          <div className="mt-2">
                            <Badge>
                              ⭐ Favorito
                            </Badge>
                          </div>
                        )}

                        <p className="mt-1 text-sm text-[var(--ff-muted-2)]">
                          {lastStartedLabel}
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

                    <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">
                      <button
                        type="button"
                        onClick={() => handleStartWorkout(workout)}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-4 text-sm font-bold text-white transition hover:bg-[var(--ff-accent-hover)] sm:w-auto"
                      >
                        <Play size={17} />
                        Iniciar
                      </button>

                      <Link to="/workouts">
                        <button
                          type="button"
                          className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] px-4 text-sm font-bold text-[var(--ff-text)] transition hover:bg-[var(--ff-surface-2)] sm:w-auto"
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
              <h2 className="text-xl font-bold">Destaques</h2>
              <p className="text-sm text-[var(--ff-muted-2)]">Melhores marcas</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4">
              <p className="text-xs text-[var(--ff-muted-2)]">Maior carga</p>

              {heaviestExercise ? (
                <>
                  <h3 className="mt-1 text-2xl font-black text-[var(--ff-accent-text)]">
                    {heaviestExercise.weight}kg
                  </h3>

                  <p className="mt-1 text-sm text-[var(--ff-muted)]">
                    {heaviestExercise.exerciseName} × {heaviestExercise.reps} reps
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-[var(--ff-muted-2)]">Sem registro ainda.</p>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4">
              <p className="text-xs text-[var(--ff-muted-2)]">Mais treinado</p>

              {mostTrainedExercise ? (
                <>
                  <h3 className="mt-1 text-lg font-bold">
                    {mostTrainedExercise.name}
                  </h3>

                  <p className="mt-1 text-sm text-[var(--ff-muted)]">
                    {mostTrainedExercise.total} séries feitas
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-[var(--ff-muted-2)]">Sem registro ainda.</p>
              )}
            </div>
          </div>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        <Card className="">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Exercícios favoritos
              </h2>

              <p className="mt-1 text-sm text-[var(--ff-muted-2)]">
                Atalhos para os exercícios que você mais usa na montagem de treino.
              </p>
            </div>

            <Badge>
              ⭐ {favoriteExercises.length}
            </Badge>
          </div>

          <div className="mt-5">
            {favoriteExercises.length === 0 ? (
              <EmptyState
                title="Nenhum exercício favorito"
                description="Marque exercícios como favoritos na biblioteca para aparecerem aqui."
                action={
                  <Link to="/exercises">
                    <Button variant="secondary">
                      Ver exercícios
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {favoriteExercises.slice(0, 6).map((exercise) => {
                  const media =
                    exercise.media?.gif ||
                    exercise.media?.image ||
                    exercise.mediaUrl ||
                    exercise.gifUrl ||
                    ''

                  return (
                    <Link
                      key={exercise.id}
                      to={`/exercises/${exercise.id}`}
                      className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 transition hover:-translate-y-0.5 hover:border-yellow-500/30 hover:bg-[var(--ff-card-hover)]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--ff-border)] bg-white">
                          {media ? (
                            <img
                              src={media}
                              loading="lazy"
                              decoding="async"
                              alt={exercise.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Dumbbell size={24} className="text-zinc-900" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 font-bold leading-snug text-[var(--ff-text)]">
                            {exercise.name}
                          </h3>

                          <p className="mt-1 text-xs text-[var(--ff-muted-2)]">
                            {exercise.muscleGroup || 'Sem grupo'} • {exercise.equipment || 'Sem equipamento'}
                          </p>
                        </div>

                        <span className="text-yellow-300">
                          ⭐
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">
            Biblioteca
          </h2>

          <p className="mt-1 text-sm text-[var(--ff-muted-2)]">
            Resumo dos exercícios cadastrados.
          </p>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4">
              <p className="text-xs text-[var(--ff-muted-2)]">
                Total de exercícios
              </p>

              <p className="mt-1 text-2xl font-black">
                {exercises.length}
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
              <p className="text-xs text-yellow-200/70">
                Favoritos
              </p>

              <p className="mt-1 text-2xl font-black text-yellow-300">
                {favoriteExercises.length}
              </p>
            </div>

            <Link to="/exercises">
              <button
                type="button"
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] text-sm font-bold text-[var(--ff-text)] transition hover:border-[var(--ff-accent-border)]/40 hover:bg-[var(--ff-surface)]"
              >
                <Dumbbell size={18} />
                Abrir biblioteca
              </button>
            </Link>
          </div>
        </Card>
      </section>
    </>
  )
}

export default DashboardQuickAccessSection
