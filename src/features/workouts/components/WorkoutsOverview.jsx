import { Plus } from 'lucide-react'

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
}) {
    return (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
