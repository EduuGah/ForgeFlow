import { ChevronDown, ClipboardList, Dumbbell, Plus } from 'lucide-react'

import Card from '../../../components/ui/Card'

function QuickActionButton({ icon: Icon, label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[#1f1f23]"
        >
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white transition group-hover:bg-[var(--ff-accent)] group-hover:shadow-[0_0_20px_var(--ff-accent-shadow)]">
                    <Icon size={22} />
                </div>

                <p className="font-bold text-white transition group-hover:text-[var(--ff-accent-text)]">
                    {label}
                </p>
            </div>

            <ChevronDown
                className="-rotate-90 text-zinc-500 transition group-hover:translate-x-1 group-hover:text-[var(--ff-accent-text)]"
                size={22}
            />
        </button>
    )
}

function WorkoutQuickActionsPanel({
    hasImportedLibrary,
    totalExercisesInSavedWorkouts,
    workoutsCount,
    onCreateFolder,
    onCreateWorkout,
    onImportDefaultExercises,
}) {
    return (
        <div className="ff-hevy-workouts space-y-5 sm:space-y-6">
            <Card className="overflow-hidden p-0">
                <QuickActionButton
                    icon={ClipboardList}
                    label="Novo treino"
                    onClick={onCreateWorkout}
                />

                <div className="border-t border-zinc-800" />

                <QuickActionButton
                    icon={Plus}
                    label="Nova pasta"
                    onClick={onCreateFolder}
                />
            </Card>

            <Card>
                <h2 className="text-xl font-bold">Resumo</h2>

                <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                        <p className="text-xs text-zinc-500">Treinos</p>
                        <p className="mt-1 text-2xl font-bold text-[var(--ff-accent-text)]">
                            {workoutsCount}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                        <p className="text-xs text-zinc-500">Exercícios</p>
                        <p className="mt-1 text-2xl font-bold">
                            {totalExercisesInSavedWorkouts}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onImportDefaultExercises}
                        className="ff-theme-button-fix mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--ff-accent-border)]/35 bg-[var(--ff-accent-soft)] px-4 py-3 text-sm font-black text-[var(--ff-accent)] transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-accent-soft)]/80 md:col-span-2"
                    >
                        <Dumbbell size={18} />
                        {hasImportedLibrary ? 'Atualizar biblioteca padrão' : 'Importar biblioteca padrão'}
                    </button>
                </div>
            </Card>
        </div>
    )
}

export default WorkoutQuickActionsPanel
