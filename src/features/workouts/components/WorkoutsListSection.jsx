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
import EmptyState from '../../../components/ui/EmptyState'
import { getWorkoutId } from '../../../utils/workoutNormalizers'
import { getWorkoutPerformanceSummary } from './WorkoutsOverview'

function WorkoutExercisePreview({ item, index }) {
    return (
        <div className="ff-workout-exercise-preview">
            <div className="ff-workout-exercise-preview__media">
                {item.exercise.mediaUrl ? (
                    <img
                        src={item.exercise.mediaUrl}
                        alt={item.exercise.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <Dumbbell size={22} className="text-zinc-900" />
                )}
            </div>

            <div className="min-w-0 flex-1">
                <p>{item.sets.length} series - {item.exercise.name}</p>
                <small>{item.exercise.muscleGroup} - {item.exercise.equipment}</small>
            </div>

            <span>#{index + 1}</span>
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
    const performanceSummary = getWorkoutPerformanceSummary(workoutMeta.performance)
    const volumeSignal = workoutMeta.volumeSignal
    const exercises = Array.isArray(workout.exercises) ? workout.exercises : []
    const workoutMuscleGroups = workoutMeta.muscleGroups || []
    const totalSets = exercises.reduce(
        (total, item) => total + (Array.isArray(item.sets) ? item.sets.length : 0),
        0,
    )

    return (
        <article data-tutorial="workout-card" className={workout.isFavorite ? 'ff-workout-native-card is-favorite' : 'ff-workout-native-card'}>
            <button
                type="button"
                onClick={() => onToggleWorkout(workoutId)}
                className="ff-workout-native-card__main"
            >
                <div className="ff-workout-native-card__top">
                    <div className="ff-workout-native-card__icon">
                        <Dumbbell size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="ff-workout-native-card__titleline">
                            <h3>{workout.name}</h3>
                            {workout.isFavorite && <Badge>Favorito</Badge>}
                            {volumeSignal && (
                                <span className={`ff-workout-volume-badge is-${volumeSignal.tone}`}>
                                    {volumeSignal.label}
                                </span>
                            )}
                        </div>

                        <p className="ff-workout-native-card__subtitle">
                            {workoutMeta.exerciseNames || 'Nenhum exercicio adicionado.'}
                        </p>

                        {workoutMuscleGroups.length > 0 && (
                            <div className="ff-workout-native-card__chips">
                                {workoutMuscleGroups.slice(0, 4).map((group) => (
                                    <Badge key={group} variant="purple">
                                        {group}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <div className="ff-workout-native-card__meta">
                            <span>{exercises.length} exercicios</span>
                            <span>{totalSets} series</span>
                            <span>{workoutMeta.estimatedMinutes || 15} min estimados</span>
                        </div>

                        <div className="ff-workout-native-card__history-meta">
                            <span><small>Último</small>{performanceSummary.lastDate}</span>
                            <span><small>Média</small>{performanceSummary.avgDuration}</span>
                            <span><small>Volume</small>{performanceSummary.avgVolume}</span>
                        </div>
                    </div>

                    <MoreHorizontal size={20} className="ff-workout-native-card__more" />
                </div>
            </button>

            <div className="ff-workout-native-card__actions">
                <button
                    type="button"
                    onClick={() => onToggleFavorite(workout)}
                    className={workout.isFavorite ? 'is-favorite' : ''}
                    title={workout.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                    <Star size={17} fill={workout.isFavorite ? 'currentColor' : 'none'} />
                </button>

                <button type="button" onClick={() => onEditWorkout(workout)}>
                    <Edit3 size={17} />
                    Editar
                </button>

                <button type="button" className="is-primary" data-tutorial="workout-start-button" onClick={() => onStartWorkout(workout)}>
                    <Dumbbell size={17} />
                    Iniciar
                </button>
            </div>

            {isExpanded && (
                <div className="ff-workout-native-card__expanded">
                    <div className="ff-workout-expanded-summary">
                        <span>{performanceSummary.totalSessions} execuções registradas</span>
                        <span>{volumeSignal?.detail || 'Sem alerta de volume para esta rotina.'}</span>
                    </div>

                    <div className="ff-workout-exercise-preview-list">
                        {exercises.map((item, index) => (
                            <WorkoutExercisePreview
                                key={item.id || `${workoutId}-${index}`}
                                item={item}
                                index={index}
                            />
                        ))}
                    </div>

                    <div className="ff-workout-expanded-actions">
                        <button type="button" className="is-primary" data-tutorial="workout-start-button" onClick={() => onStartWorkout(workout)}>
                            <Dumbbell size={17} />
                            Iniciar
                        </button>

                        <button type="button" className="is-edit" onClick={() => onEditWorkout(workout)}>
                            <Edit3 size={17} />
                            Editar
                        </button>

                        <button type="button" className="is-secondary" onClick={() => onDuplicateWorkout(workout)}>
                            <Copy size={17} />
                            Duplicar
                        </button>

                        <button type="button" className="is-delete" onClick={() => onDeleteWorkout(workoutId)}>
                            <Trash2 size={17} />
                            Excluir
                        </button>
                    </div>
                </div>
            )}
        </article>
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
        <section className="ff-workouts-list-panel xl:col-span-2" data-tutorial="workouts-list">
            <button
                type="button"
                onClick={onToggleCollapsed}
                className="ff-workouts-list-panel__toggle"
            >
                <div>
                    <ChevronDown
                        size={18}
                        className={isCollapsed ? 'is-collapsed' : ''}
                    />
                    <p>Meus treinos</p>
                </div>

                <span>{filteredWorkouts.length}</span>
            </button>

            {!isCollapsed && (
                <div className="ff-workouts-native-list">
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
                            className="ff-workouts-show-more"
                        >
                            {showAllWorkouts
                                ? 'Mostrar menos'
                                : `Ver mais ${filteredWorkouts.length - visibleLimit} treino(s)`}
                        </button>
                    )}
                </div>
            )}
        </section>
    )
}
