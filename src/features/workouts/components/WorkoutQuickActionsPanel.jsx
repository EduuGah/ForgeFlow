import { ChevronDown, ClipboardList, Dumbbell, Plus } from 'lucide-react'

import Card from '../../../components/ui/Card'

function QuickActionButton({ icon: Icon, label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="ff-workouts-quick-action"
        >
            <div>
                <span>
                    <Icon size={20} />
                </span>
                <p>{label}</p>
            </div>

            <ChevronDown className="-rotate-90" size={20} />
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
        <aside className="ff-workouts-side-panel">
            <Card className="ff-workouts-quick-card">
                <QuickActionButton
                    icon={ClipboardList}
                    label="Novo treino"
                    onClick={onCreateWorkout}
                />

                <QuickActionButton
                    icon={Plus}
                    label="Nova pasta"
                    onClick={onCreateFolder}
                />
            </Card>

            <Card className="ff-workouts-library-card">
                <h2>Biblioteca</h2>

                <div className="ff-workouts-library-card__stats">
                    <div>
                        <p>Treinos</p>
                        <strong>{workoutsCount}</strong>
                    </div>

                    <div>
                        <p>Itens</p>
                        <strong>{totalExercisesInSavedWorkouts}</strong>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onImportDefaultExercises}
                    className="ff-workouts-import-button"
                >
                    <Dumbbell size={18} />
                    {hasImportedLibrary ? 'Atualizar biblioteca' : 'Importar biblioteca'}
                </button>
            </Card>
        </aside>
    )
}

export default WorkoutQuickActionsPanel
