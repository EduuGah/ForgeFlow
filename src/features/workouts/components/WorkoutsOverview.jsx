import { Activity, CalendarCheck, Clock3, Dumbbell, Play, Plus, Sparkles, TrendingUp } from 'lucide-react'

import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'


function formatWorkoutLastDate(dateString) {
    if (!dateString) return 'Nunca feito'

    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return 'Sem data'

    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
    })
}

function formatWorkoutDuration(seconds) {
    const totalSeconds = Number(seconds) || 0
    if (totalSeconds <= 0) return 'Sem média'

    const minutes = Math.max(1, Math.round(totalSeconds / 60))
    return `${minutes} min`
}

function formatWorkoutVolume(volume) {
    const numericVolume = Number(volume) || 0
    if (numericVolume <= 0) return 'Sem volume'

    if (numericVolume >= 1000) {
        return `${(numericVolume / 1000).toLocaleString('pt-BR', {
            maximumFractionDigits: 1,
        })}t`
    }

    return `${numericVolume.toLocaleString('pt-BR')}kg`
}

export function getWorkoutPerformanceSummary(performance) {
    return {
        lastDate: formatWorkoutLastDate(performance?.lastFinishedAt),
        avgDuration: formatWorkoutDuration(performance?.avgDurationSeconds),
        avgVolume: formatWorkoutVolume(performance?.avgVolume),
        totalSessions: performance?.totalSessions || 0,
    }
}

export function WorkoutsHeader({ isSyncingData, onCreateWorkout }) {
    return (
        <PageHeader
            title="Treinos"
            description="Monte treinos, organize exercícios e inicie seus treinos salvos."
            action={
                <div className="flex flex-wrap items-center justify-end gap-2">
                    {isSyncingData && (
                        <Badge variant="purple">
                            Sincronizando
                        </Badge>
                    )}

                    <button
                        type="button"
                        onClick={onCreateWorkout}
                        data-tutorial="create-workout-button"
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-5 text-sm font-bold text-white shadow-[0_0_20px_var(--ff-accent-shadow)] transition hover:bg-[var(--ff-accent-hover)] hover:shadow-[0_0_20px_var(--ff-accent-shadow)]"
                    >
                        <Plus size={18} />
                        Novo treino
                    </button>
                </div>
            }
        />
    )
}

export function WorkoutStatsGrid({
    workoutsCount,
    exercisesCount,
    totalExercisesInSavedWorkouts,
}) {
    return (
        <section className="ff-workouts-native-stats grid grid-cols-3 gap-2 sm:gap-3">
            <Card className="ff-workouts-stat-card">
                <p>Treinos</p>
                <h3>{workoutsCount}</h3>
                <p className="mt-2 text-xs text-[var(--ff-accent-text)]">Treinos disponíveis</p>
            </Card>

            <Card className="ff-workouts-stat-card">
                <p>Biblioteca</p>
                <h3>{exercisesCount}</h3>
                <p className="mt-2 text-xs text-[var(--ff-accent-text)]">Exercícios cadastrados</p>
            </Card>

            <Card className="ff-workouts-stat-card is-accent">
                <p>Volume</p>
                <h3>
                    {totalExercisesInSavedWorkouts}
                </h3>
                <p className="mt-2 text-xs text-[var(--ff-accent-text)]">Exercícios usados</p>
            </Card>
        </section>
    )
}

export function WorkoutFolderFilter({
    folders,
    folderWorkoutCounts,
    selectedFolderId,
    workoutsCount,
    onSelectFolder,
    onCreateFolder,
    onDeleteFolder,
}) {
    return (
        <div className="ff-workouts-folder-bar" data-tutorial="workout-folder">
            <div className="ff-workouts-folder-bar__head">
                <p>Pastas</p>

                <button
                    type="button"
                    onClick={onCreateFolder}
                    className="ff-workouts-folder-new"
                >
                    Nova
                </button>
            </div>

            <div className="ff-workouts-folder-scroll ff-mobile-chip-scroll">
                <button
                    type="button"
                    onClick={() => onSelectFolder(null)}
                    className={
                        selectedFolderId === null
                            ? 'shrink-0 rounded-2xl bg-[var(--ff-accent)] px-4 py-2 text-sm font-bold text-white shadow-[0_0_20px_var(--ff-accent-shadow)]'
                            : 'shrink-0 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] px-4 py-2 text-sm font-bold text-[var(--ff-muted)] transition hover:border-[var(--ff-accent-border)]/40 hover:text-[var(--ff-text)]'
                    }
                >
                    Todas
                    <span className="ml-2 text-xs opacity-70">{workoutsCount}</span>
                </button>

                {folders.map((folder) => {
                    const total = folderWorkoutCounts.get(folder.id) || 0

                    return (
                        <div
                            key={folder.id}
                            className={
                                selectedFolderId === folder.id
                                    ? 'group flex shrink-0 items-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-4 py-2 text-sm font-bold text-white shadow-[0_0_20px_var(--ff-accent-shadow)]'
                                    : 'group flex shrink-0 items-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] px-4 py-2 text-sm font-bold text-[var(--ff-muted)] transition hover:border-[var(--ff-accent-border)]/40 hover:text-[var(--ff-text)]'
                            }
                        >
                            <button
                                type="button"
                                onClick={() => onSelectFolder(folder.id)}
                                className="flex items-center gap-2"
                            >
                                {folder.name}
                                <span className="text-xs opacity-70">{total}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => onDeleteFolder(folder.id)}
                                className="rounded-full p-1 text-[var(--ff-muted)] transition hover:bg-red-500/20 hover:text-red-300 sm:opacity-0 sm:group-hover:opacity-100"
                                title="Excluir pasta"
                            >
                                ×
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}


export function WorkoutNextActionCard({ workout, workoutListMetaMap, onCreateWorkout, onStartWorkout }) {
    const workoutId = workout?._id || workout?.id
    const meta = workoutListMetaMap.get(workoutId) || {}
    const performance = getWorkoutPerformanceSummary(meta.performance)

    if (!workout) {
        return (
            <section className="ff-workouts-next-action-card is-empty" data-tutorial="create-workout-button">
                <div className="ff-workouts-next-action-card__icon">
                    <Sparkles size={22} />
                </div>

                <div className="min-w-0 flex-1">
                    <span>Próxima ação</span>
                    <h2>Crie sua primeira rotina</h2>
                    <p>Comece com um treino simples e depois ajuste séries, descanso e exercícios.</p>
                </div>

                <button type="button" onClick={onCreateWorkout}>
                    <Plus size={18} />
                    Criar
                </button>
            </section>
        )
    }

    return (
        <section className="ff-workouts-next-action-card" data-tutorial="workout-start-button">
            <div className="ff-workouts-next-action-card__icon">
                <Sparkles size={22} />
            </div>

            <div className="min-w-0 flex-1">
                <span>Próxima ação</span>
                <h2>{workout.name}</h2>
                <p>
                    {meta.volumeSignal?.detail || 'Rotina pronta para iniciar pelo celular.'}
                </p>

                <div className="ff-workouts-next-action-card__metrics">
                    <small><CalendarCheck size={13} /> {performance.lastDate}</small>
                    <small><Clock3 size={13} /> {performance.avgDuration}</small>
                    <small><TrendingUp size={13} /> {performance.avgVolume}</small>
                </div>
            </div>

            <button type="button" onClick={() => onStartWorkout(workout)}>
                <Play size={18} />
                Iniciar
            </button>
        </section>
    )
}

export function WorkoutHighlightsRail({ workouts, workoutListMetaMap, onStartWorkout }) {
    if (!workouts.length) return null

    return (
        <section className="ff-workouts-highlight-rail" aria-label="Rotinas em destaque">
            <div className="ff-workouts-section-headline">
                <div>
                    <span>Atalhos</span>
                    <h2>Rotinas em destaque</h2>
                </div>
                <small>{workouts.length} rápidas</small>
            </div>

            <div className="ff-workouts-highlight-scroll ff-mobile-chip-scroll">
                {workouts.map((workout) => {
                    const workoutId = workout?._id || workout?.id
                    const meta = workoutListMetaMap.get(workoutId) || {}
                    const performance = getWorkoutPerformanceSummary(meta.performance)

                    return (
                        <article className="ff-workouts-highlight-card" key={workoutId || workout.name}>
                            <div className="ff-workouts-highlight-card__top">
                                <span><Dumbbell size={16} /></span>
                                <button type="button" onClick={() => onStartWorkout(workout)}>
                                    <Play size={14} />
                                </button>
                            </div>

                            <h3>{workout.name}</h3>
                            <p>{meta.muscleGroups?.slice(0, 2).join(' + ') || 'Sem grupos'}</p>

                            <div className="ff-workouts-highlight-card__stats">
                                <small><Activity size={12} /> {meta.totalSets || 0} séries</small>
                                <small><Clock3 size={12} /> {performance.avgDuration}</small>
                            </div>
                        </article>
                    )
                })}
            </div>
        </section>
    )
}
