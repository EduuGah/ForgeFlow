import {
    ChevronDown,
    Copy,
    Dumbbell,
    Edit3,
    MoreHorizontal,
    Star,
    Trash2,
} from 'lucide-react'

import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import EmptyState from '../../../components/ui/EmptyState'
import { getWorkoutId } from '../../../utils/workoutNormalizers'

function WorkoutExercisePreview({ item, index }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 sm:gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-white">
                {item.exercise.mediaUrl ? (
                    <img
                        src={item.exercise.mediaUrl}
                        alt={item.exercise.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <Dumbbell size={26} className="text-zinc-900" />
                )}
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate font-bold">
                    {item.sets.length} séries • {item.exercise.name}
                </p>

                <p className="text-sm text-zinc-500">
                    {item.exercise.muscleGroup} • {item.exercise.equipment}
                </p>
            </div>

            <span className="text-sm text-zinc-500">#{index + 1}</span>
        </div>
    )
}

function WorkoutCard({
    workout,
    expandedWorkoutId,
    workoutListMetaMap,
    onToggleWorkout,
    onToggleFavorite,
    onStartWorkout,
    onEditWorkout,
    onDuplicateWorkout,
    onDeleteWorkout,
}) {
    const workoutId = getWorkoutId(workout)
    const isExpanded = expandedWorkoutId === workoutId
    const workoutMeta = workoutListMetaMap.get(workoutId) || {
        muscleGroups: [],
        exerciseNames: '',
    }
    const workoutMuscleGroups = workoutMeta.muscleGroups

    return (
        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-[#18181b] transition hover:border-[var(--ff-accent-border)]/30 hover:bg-[#1f1f23]">
            <button
                type="button"
                onClick={() => onToggleWorkout(workoutId)}
                className="w-full p-4 text-left sm:p-5"
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-bold text-white">
                            {workout.name}
                        </h3>

                        {workout.isFavorite && (
                            <div className="mt-2">
                                <Badge>⭐ Favorito</Badge>
                            </div>
                        )}

                        <p className="mt-2 line-clamp-2 text-sm text-zinc-500 sm:truncate">
                            {workoutMeta.exerciseNames}
                        </p>

                        {workoutMuscleGroups.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {workoutMuscleGroups.slice(0, 4).map((group) => (
                                    <Badge key={group} variant="purple">
                                        {group}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <div className="mt-4 grid grid-cols-[44px_1fr] gap-2 sm:hidden">
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation()
                                    onToggleFavorite(workout)
                                }}
                                title={workout.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                                className={
                                    workout.isFavorite
                                        ? 'flex h-10 items-center justify-center rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
                                        : 'flex h-10 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-500'
                                }
                            >
                                <Star
                                    size={18}
                                    fill={workout.isFavorite ? 'currentColor' : 'none'}
                                />
                            </button>

                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation()
                                    onStartWorkout(workout)
                                }}
                                className="inline-flex h-10 w-full items-center justify-center rounded-2xl bg-[var(--ff-accent)] text-sm font-bold text-white transition hover:bg-[var(--ff-accent-hover)]"
                            >
                                Iniciar treino
                            </button>
                        </div>
                    </div>

                    <div className="hidden items-center gap-2 sm:flex">
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation()
                                onToggleFavorite(workout)
                            }}
                            title={workout.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                            className={
                                workout.isFavorite
                                    ? 'flex h-10 w-10 items-center justify-center rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 transition hover:bg-yellow-500/20'
                                    : 'flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-500 transition hover:border-yellow-500/30 hover:bg-yellow-500/10 hover:text-yellow-300'
                            }
                        >
                            <Star
                                size={18}
                                fill={workout.isFavorite ? 'currentColor' : 'none'}
                            />
                        </button>

                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation()
                                onStartWorkout(workout)
                            }}
                            className="h-10 rounded-2xl bg-[var(--ff-accent)] px-4 text-sm font-bold text-white transition hover:bg-[var(--ff-accent-hover)]"
                        >
                            Iniciar
                        </button>

                        <MoreHorizontal size={22} className="text-zinc-400" />
                    </div>
                </div>
            </button>

            {isExpanded && (
                <div className="border-t border-zinc-800 p-4">
                    <div className="space-y-3">
                        {workout.exercises.map((item, index) => (
                            <WorkoutExercisePreview
                                key={item.id}
                                item={item}
                                index={index}
                            />
                        ))}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <button
                            type="button"
                            onClick={() => onStartWorkout(workout)}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] text-sm font-bold text-white transition hover:bg-[var(--ff-accent-hover)]"
                        >
                            <Dumbbell size={17} />
                            Iniciar
                        </button>

                        <button
                            type="button"
                            onClick={() => onEditWorkout(workout)}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)]/10 text-sm font-bold text-[var(--ff-accent-text)] transition hover:bg-[var(--ff-accent-hover)]/20"
                        >
                            <Edit3 size={17} />
                            Editar
                        </button>

                        <button
                            type="button"
                            onClick={() => onDuplicateWorkout(workout)}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 text-sm font-bold text-white transition hover:bg-zinc-800"
                        >
                            <Copy size={17} />
                            Duplicar
                        </button>

                        <button
                            type="button"
                            onClick={() => onDeleteWorkout(workoutId)}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 text-sm font-bold text-red-300 transition hover:bg-red-500/20"
                        >
                            <Trash2 size={17} />
                            Excluir
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function WorkoutsListSection({
    appSettings,
    expandedWorkoutId,
    filteredWorkouts,
    isCollapsed,
    showAllWorkouts,
    visibleWorkouts,
    workoutListMetaMap,
    onCreateWorkout,
    onDeleteWorkout,
    onDuplicateWorkout,
    onEditWorkout,
    onStartWorkout,
    onToggleCollapsed,
    onToggleFavorite,
    onToggleShowAll,
    onToggleWorkout,
}) {
    const visibleLimit = Number(appSettings.workoutsVisibleLimit) || 5

    return (
        <div className="xl:col-span-2">
            <Card>
                <button
                    type="button"
                    onClick={onToggleCollapsed}
                    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-left transition hover:border-[var(--ff-accent-border)]/40 hover:bg-zinc-900"
                >
                    <div className="flex items-center gap-2 text-zinc-300">
                        <ChevronDown
                            size={18}
                            className={
                                isCollapsed
                                    ? '-rotate-90 text-zinc-500 transition'
                                    : 'text-[var(--ff-accent-text)] transition'
                            }
                        />

                        <p className="text-sm font-bold">
                            Os meus treinos ({filteredWorkouts.length})
                        </p>
                    </div>

                    <span className="text-xs font-bold text-zinc-500">
                        {isCollapsed ? 'Abrir' : 'Recolher'}
                    </span>
                </button>

                {!isCollapsed && (
                    <div className="mt-5 space-y-4">
                        {filteredWorkouts.length === 0 && (
                            <EmptyState
                                title="Nenhum treino encontrado"
                                description="Crie seu primeiro treino ou escolha outra pasta."
                                action={<Button onClick={onCreateWorkout}>Novo treino</Button>}
                            />
                        )}

                        {visibleWorkouts.map((workout) => (
                            <WorkoutCard
                                key={getWorkoutId(workout)}
                                workout={workout}
                                expandedWorkoutId={expandedWorkoutId}
                                workoutListMetaMap={workoutListMetaMap}
                                onToggleWorkout={onToggleWorkout}
                                onToggleFavorite={onToggleFavorite}
                                onStartWorkout={onStartWorkout}
                                onEditWorkout={onEditWorkout}
                                onDuplicateWorkout={onDuplicateWorkout}
                                onDeleteWorkout={onDeleteWorkout}
                            />
                        ))}

                        {filteredWorkouts.length > visibleLimit && (
                            <button
                                type="button"
                                onClick={onToggleShowAll}
                                className="flex h-12 w-full items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-sm font-bold text-zinc-300 transition hover:border-[var(--ff-accent-border)] hover:text-white"
                            >
                                {showAllWorkouts
                                    ? 'Mostrar menos'
                                    : `Ver mais ${filteredWorkouts.length - visibleLimit} treino(s)`}
                            </button>
                        )}
                    </div>
                )}
            </Card>
        </div>
    )
}
