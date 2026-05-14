import { Plus, Sparkles } from 'lucide-react'

import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'

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
    templatesCount,
}) {
    return (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-4">
                <p className="text-sm text-zinc-500">Treinos salvos</p>
                <h3 className="mt-2 text-3xl font-bold">{workoutsCount}</h3>
                <p className="mt-2 text-xs text-[var(--ff-accent-text)]">Treinos disponíveis</p>
            </Card>

            <Card className="p-4">
                <p className="text-sm text-zinc-500">Biblioteca</p>
                <h3 className="mt-2 text-3xl font-bold">{exercisesCount}</h3>
                <p className="mt-2 text-xs text-[var(--ff-accent-text)]">Exercícios cadastrados</p>
            </Card>

            <Card className="p-4">
                <p className="text-sm text-zinc-500">Itens nos treinos</p>
                <h3 className="mt-2 text-3xl font-bold text-[var(--ff-accent-text)]">
                    {totalExercisesInSavedWorkouts}
                </h3>
                <p className="mt-2 text-xs text-[var(--ff-accent-text)]">Exercícios usados</p>
            </Card>

            <Card className="p-4">
                <p className="text-sm text-zinc-500">Templates</p>
                <h3 className="mt-2 text-3xl font-bold text-yellow-300">{templatesCount}</h3>
                <p className="mt-2 text-xs text-[var(--ff-accent-text)]">modelos salvos</p>
            </Card>
        </section>
    )
}

export function WorkoutTemplatesPreview({
    workoutTemplates,
    onCreateTemplate,
    onCreateWorkoutFromTemplate,
    onEditTemplate,
}) {
    if (workoutTemplates.length === 0) return null

    const highlightedTemplates = workoutTemplates
        .slice()
        .sort((a, b) => Number(Boolean(b.isFavorite)) - Number(Boolean(a.isFavorite)))
        .slice(0, 3)

    return (
        <section className="mt-5 rounded-3xl border border-[var(--ff-border)] bg-[linear-gradient(180deg,var(--ff-card),var(--ff-surface-2))] p-4 shadow-xl shadow-black/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-accent-text)]">
                        Templates avançados
                    </p>
                    <h2 className="mt-1 text-xl font-black text-[var(--ff-text)]">
                        Comece por um modelo pronto
                    </h2>
                    <p className="mt-1 text-sm text-[var(--ff-muted)]">
                        Use favoritos ou modelos recentes para criar uma rotina sem começar do zero.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onCreateTemplate}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm font-black text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]"
                >
                    <Sparkles size={16} />
                    Novo template
                </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {highlightedTemplates.map((template) => (
                    <div
                        key={template.id}
                        className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h3 className="truncate text-base font-black text-[var(--ff-text)]">
                                    {template.name}
                                </h3>
                                <p className="mt-1 text-xs text-[var(--ff-muted)]">
                                    {(template.exercises || []).length} exercícios
                                </p>
                            </div>

                            {template.isFavorite && (
                                <span className="rounded-full border border-yellow-400/30 bg-yellow-500/10 px-2 py-1 text-[10px] font-black uppercase text-yellow-200">
                                    Favorito
                                </span>
                            )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {(template.exercises || []).slice(0, 3).map((item, index) => (
                                <span
                                    key={`${template.id}-${index}`}
                                    className="rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-2.5 py-1 text-[10px] font-bold text-[var(--ff-muted)]"
                                >
                                    {item.exercise?.name || item.name || `Exercício ${index + 1}`}
                                </span>
                            ))}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => onCreateWorkoutFromTemplate(template)}
                                className="h-10 rounded-2xl bg-[var(--ff-accent)] text-xs font-black text-white shadow-[0_0_16px_var(--ff-accent-shadow)]"
                            >
                                Usar
                            </button>

                            <button
                                type="button"
                                onClick={() => onEditTemplate(template)}
                                className="h-10 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-xs font-black text-[var(--ff-text-soft)]"
                            >
                                Editar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
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
        <div className="mt-5 rounded-3xl border border-zinc-800 bg-[#18181b] p-3">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-zinc-300">Pastas</p>

                <button
                    type="button"
                    onClick={onCreateFolder}
                    className="text-xs font-bold text-[var(--ff-accent-text)] transition hover:text-[var(--ff-accent-text)]"
                >
                    + Nova pasta
                </button>
            </div>

            <div className="mt-3 flex gap-2 ff-mobile-chip-scroll overflow-x-auto overscroll-x-contain pb-2">
                <button
                    type="button"
                    onClick={() => onSelectFolder(null)}
                    className={
                        selectedFolderId === null
                            ? 'shrink-0 rounded-2xl bg-[var(--ff-accent)] px-4 py-2 text-sm font-bold text-white shadow-[0_0_20px_var(--ff-accent-shadow)]'
                            : 'shrink-0 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-bold text-zinc-400 transition hover:border-[var(--ff-accent-border)]/40 hover:text-white'
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
                                    : 'group flex shrink-0 items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-bold text-zinc-400 transition hover:border-[var(--ff-accent-border)]/40 hover:text-white'
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
                                className="rounded-full p-1 text-zinc-400 transition hover:bg-red-500/20 hover:text-red-300 sm:opacity-0 sm:group-hover:opacity-100"
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
