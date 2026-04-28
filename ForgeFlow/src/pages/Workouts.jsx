import { useEffect, useState } from 'react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

function Workouts() {
    const [workouts, setWorkouts] = useState([])
    const [exercises, setExercises] = useState([])

    const [quickSearch, setQuickSearch] = useState('')
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(true)

    const [workoutName, setWorkoutName] = useState('')
    const [selectedExercise, setSelectedExercise] = useState('')
    const [setDescription, setSetDescription] = useState('')
    const [exerciseSets, setExerciseSets] = useState([])
    const [workoutExercises, setWorkoutExercises] = useState([])

    const [expandedWorkoutId, setExpandedWorkoutId] = useState(null)
    const [editingWorkoutId, setEditingWorkoutId] = useState(null)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        const savedWorkouts = localStorage.getItem('forgeflow:workouts')
        const savedExercises = localStorage.getItem('forgeflow:exercises')
        const draft = localStorage.getItem('forgeflow:workout-draft')

        if (savedWorkouts) {
            setWorkouts(JSON.parse(savedWorkouts))
        }

        if (savedExercises) {
            setExercises(JSON.parse(savedExercises))
        }

        if (draft) {
            const parsedDraft = JSON.parse(draft)

            setWorkoutName(parsedDraft.workoutName || '')
            setSelectedExercise(parsedDraft.selectedExercise || '')
            setSetDescription(parsedDraft.setDescription || '')
            setExerciseSets(parsedDraft.exerciseSets || [])
            setWorkoutExercises(parsedDraft.workoutExercises || [])
            setEditingWorkoutId(parsedDraft.editingWorkoutId || null)
        }

        setIsLoaded(true)
    }, [])

    useEffect(() => {
        if (!isLoaded) return

        localStorage.setItem('forgeflow:workouts', JSON.stringify(workouts))
    }, [workouts, isLoaded])

    useEffect(() => {
        if (!isLoaded) return

        const draft = {
            workoutName,
            selectedExercise,
            setDescription,
            exerciseSets,
            workoutExercises,
            editingWorkoutId,
        }

        localStorage.setItem('forgeflow:workout-draft', JSON.stringify(draft))
    }, [
        workoutName,
        selectedExercise,
        setDescription,
        exerciseSets,
        workoutExercises,
        editingWorkoutId,
        isLoaded,
    ])

    const filteredQuickExercises = exercises.filter((exercise) => {
        const text = `${exercise.name} ${exercise.muscleGroup} ${exercise.equipment}`.toLowerCase()

        return text.includes(quickSearch.toLowerCase())
    })

    function isExerciseAlreadyAdded(exerciseId) {
        return workoutExercises.some(
            (item) => item.exercise.id === exerciseId
        )
    }

    function getDefaultSets() {
        return [
            { id: crypto.randomUUID(), description: '12 Rep' },
            { id: crypto.randomUUID(), description: '10-12 Rep' },
            { id: crypto.randomUUID(), description: '5-8 Rep' },
            { id: crypto.randomUUID(), description: '5-8 Rep' },
        ]
    }

    function resetForm() {
        setWorkoutName('')
        setSelectedExercise('')
        setSetDescription('')
        setExerciseSets([])
        setWorkoutExercises([])
        setEditingWorkoutId(null)
        localStorage.removeItem('forgeflow:workout-draft')
    }

    function handleDefaultSets() {
        setExerciseSets(getDefaultSets())
    }

    function handleAddSet() {
        if (!setDescription.trim()) {
            alert('Descreva a série.')
            return
        }

        const newSet = {
            id: crypto.randomUUID(),
            description: setDescription,
        }

        setExerciseSets([...exerciseSets, newSet])
        setSetDescription('')
    }

    function handleRemoveSet(id) {
        setExerciseSets(exerciseSets.filter((set) => set.id !== id))
    }

    function handleQuickAddExercise(exerciseId) {
        const exerciseFound = exercises.find((exercise) => exercise.id === exerciseId)

        if (!exerciseFound) return

        const newWorkoutExercise = {
            id: crypto.randomUUID(),
            exercise: exerciseFound,
            sets: getDefaultSets(),
        }

        setWorkoutExercises([...workoutExercises, newWorkoutExercise])
    }

    function handleAddExercise() {
        if (!selectedExercise || exerciseSets.length === 0) {
            alert('Selecione um exercício e adicione pelo menos uma série.')
            return
        }

        const exerciseFound = exercises.find((exercise) => exercise.id === selectedExercise)

        if (!exerciseFound) return

        const newWorkoutExercise = {
            id: crypto.randomUUID(),
            exercise: exerciseFound,
            sets: exerciseSets,
        }

        setWorkoutExercises([...workoutExercises, newWorkoutExercise])

        setSelectedExercise('')
        setSetDescription('')
        setExerciseSets([])
    }

    function handleRemoveExercise(id) {
        setWorkoutExercises(workoutExercises.filter((item) => item.id !== id))
    }

    function handleSubmit(event) {
        event.preventDefault()

        if (!workoutName.trim() || workoutExercises.length === 0) {
            alert('Informe o nome do treino e adicione pelo menos um exercício.')
            return
        }

        if (editingWorkoutId) {
            setWorkouts(
                workouts.map((workout) =>
                    workout.id === editingWorkoutId
                        ? {
                            ...workout,
                            name: workoutName,
                            exercises: workoutExercises,
                            updatedAt: new Date().toISOString(),
                        }
                        : workout
                )
            )

            resetForm()
            return
        }

        const newWorkout = {
            id: crypto.randomUUID(),
            name: workoutName,
            exercises: workoutExercises,
            createdAt: new Date().toISOString(),
        }

        setWorkouts([newWorkout, ...workouts])
        resetForm()
    }

    function handleEditWorkout(workout) {
        setEditingWorkoutId(workout.id)
        setWorkoutName(workout.name)
        setWorkoutExercises(workout.exercises || [])
        setSelectedExercise('')
        setSetDescription('')
        setExerciseSets([])
        setExpandedWorkoutId(null)

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    function handleCancelEdit() {
        resetForm()
    }

    function handleDeleteWorkout(id) {
        setWorkouts(workouts.filter((workout) => workout.id !== id))

        if (editingWorkoutId === id) {
            resetForm()
        }
    }

    function handleDuplicateWorkout(workout) {
        const duplicatedWorkout = {
            ...workout,
            id: crypto.randomUUID(),
            name: `${workout.name} - cópia`,
            createdAt: new Date().toISOString(),
            updatedAt: undefined,
        }

        setWorkouts([duplicatedWorkout, ...workouts])
    }

    function handleToggleWorkout(id) {
        setExpandedWorkoutId(expandedWorkoutId === id ? null : id)
    }

    function getMuscleGroupsFromWorkout(workout) {
        const groups = workout.exercises.map((item) => item.exercise?.muscleGroup)

        return [...new Set(groups)].filter(Boolean).join(', ')
    }

    function getCurrentMuscleGroups() {
        const groups = workoutExercises.map((item) => item.exercise?.muscleGroup)

        return [...new Set(groups)].filter(Boolean).join(', ')
    }

    return (
        <>
            <PageHeader
                title="Treinos"
                description="Monte seus treinos com séries padrão, adição rápida e rascunho automático."
                action={
                    <Badge variant="purple">
                        {workouts.length} treinos
                    </Badge>
                }
            />

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card className="xl:col-span-2">
                    <form onSubmit={handleSubmit}>
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-xl font-bold">
                                    {editingWorkoutId ? 'Editar treino' : 'Novo treino'}
                                </h2>

                                <p className="text-sm text-zinc-400 mt-1">
                                    {editingWorkoutId
                                        ? 'Altere os exercícios e salve as mudanças.'
                                        : 'Seu progresso é salvo automaticamente como rascunho.'}
                                </p>
                            </div>

                            <Badge variant="purple">
                                {editingWorkoutId ? 'Editando' : 'Auto save'}
                            </Badge>
                        </div>

                        <div className="space-y-5">
                            <Input
                                label="Nome do treino"
                                type="text"
                                placeholder="Ex: Treino A - Peito e tríceps"
                                value={workoutName}
                                onChange={(event) => setWorkoutName(event.target.value)}
                            />

                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
                                <div className="flex items-center justify-between gap-4 mb-4">
                                    <div>
                                        <h3 className="font-bold">
                                            Adição rápida
                                        </h3>

                                        <p className="text-sm text-zinc-500">
                                            Clique em um exercício para adicionar com o padrão 12 / 10-12 / 5-8 / 5-8.
                                        </p>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
                                        className="py-2 text-sm"
                                    >
                                        {isQuickAddOpen ? 'Minimizar' : 'Abrir'}
                                    </Button>
                                </div>

                                {isQuickAddOpen && (
                                    <>
                                        <Input
                                            type="text"
                                            placeholder="Pesquisar exercício, grupo ou equipamento..."
                                            value={quickSearch}
                                            onChange={(event) => setQuickSearch(event.target.value)}
                                        />

                                        <div className="mt-4 max-h-64 overflow-y-auto pr-2">
                                            {exercises.length === 0 && (
                                                <EmptyState
                                                    title="Nenhum exercício cadastrado"
                                                    description="Cadastre exercícios primeiro para usar a adição rápida."
                                                />
                                            )}

                                            {exercises.length > 0 && filteredQuickExercises.length === 0 && (
                                                <EmptyState
                                                    title="Nenhum exercício encontrado"
                                                    description="Tente buscar por outro nome, grupo ou equipamento."
                                                />
                                            )}

                                            {filteredQuickExercises.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {filteredQuickExercises.map((exercise) => (
                                                        <button
                                                            key={exercise.id}
                                                            type="button"
                                                            onClick={() => handleQuickAddExercise(exercise.id)}
                                                            className={
                                                                isExerciseAlreadyAdded(exercise.id)
                                                                    ? 'rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-sm font-semibold text-emerald-400 transition'
                                                                    : 'rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 hover:scale-[1.02] active:scale-95'
                                                            }
                                                        >
                                                            {isExerciseAlreadyAdded(exercise.id) ? '✓ ' : '+ '}
                                                            {exercise.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950 to-zinc-900/80 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold">
                                            Resumo do treino atual
                                        </h3>

                                        <p className="text-sm text-zinc-500 mt-1">
                                            {workoutExercises.length} exercícios adicionados
                                        </p>

                                        {getCurrentMuscleGroups() && (
                                            <p className="text-sm text-violet-400 mt-1">
                                                Grupos: {getCurrentMuscleGroups()}
                                            </p>
                                        )}
                                    </div>

                                    <Badge variant="purple">
                                        {workoutExercises.length}
                                    </Badge>
                                </div>

                                {workoutExercises.length === 0 && (
                                    <div className="mt-4">
                                        <EmptyState
                                            title="Nenhum exercício no treino"
                                            description="Use a adição rápida ou o modo personalizado para montar o treino."
                                        />
                                    </div>
                                )}

                                {workoutExercises.length > 0 && (
                                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {workoutExercises.map((item, index) => (
                                            <div
                                                key={item.id}
                                                className="group rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 transition hover:border-violet-500/40 hover:bg-zinc-900"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-xs font-bold text-violet-400 border border-violet-500/20">
                                                                {index + 1}
                                                            </span>

                                                            <p className="font-bold text-white truncate">
                                                                {item.exercise.name}
                                                            </p>
                                                        </div>

                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            <Badge>
                                                                {item.exercise.muscleGroup}
                                                            </Badge>

                                                            <Badge variant="purple">
                                                                {item.sets.length} séries
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveExercise(item.id)}
                                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400 transition hover:bg-red-500 hover:text-white"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Button type="submit" className="w-full py-4 text-lg">
                                    {editingWorkoutId ? 'Salvar alterações' : 'Salvar treino completo'}
                                </Button>

                                {editingWorkoutId && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleCancelEdit}
                                        className="w-full py-4 text-lg"
                                    >
                                        Cancelar edição
                                    </Button>
                                )}
                            </div>
                        </div>
                    </form>
                </Card>

                <Card className="h-fit">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold">
                                Treinos cadastrados
                            </h2>

                            <p className="text-xs text-zinc-500 mt-1">
                                Total: {workouts.length}
                            </p>
                        </div>

                        <Badge variant="purple">
                            {workouts.length}
                        </Badge>
                    </div>

                    <div className="mt-5 max-h-[720px] overflow-y-auto pr-2 space-y-3">
                        {workouts.length === 0 && (
                            <EmptyState
                                title="Nenhum treino cadastrado"
                                description="Monte seu primeiro treino usando os exercícios cadastrados."
                            />
                        )}

                        {workouts.map((workout) => {
                            const isExpanded = expandedWorkoutId === workout.id

                            return (
                                <div
                                    key={workout.id}
                                    className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 transition hover:border-zinc-700"
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleToggleWorkout(workout.id)}
                                        className="w-full px-4 py-3 text-left transition hover:bg-zinc-900"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="font-bold">
                                                    {workout.name}
                                                </h3>

                                                <p className="text-sm text-zinc-500 mt-1">
                                                    {workout.exercises.length} exercícios
                                                </p>

                                                <p className="text-xs text-violet-400 mt-1">
                                                    {getMuscleGroupsFromWorkout(workout)}
                                                </p>
                                            </div>

                                            <span className="text-xl text-zinc-500">
                                                {isExpanded ? '−' : '+'}
                                            </span>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="border-t border-zinc-800 p-4 space-y-3">
                                            {workout.exercises.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                                                >
                                                    <p className="font-medium">
                                                        {item.exercise.name}
                                                    </p>

                                                    <p className="text-xs text-zinc-500 mt-1">
                                                        {item.exercise.muscleGroup} • {item.exercise.equipment}
                                                    </p>

                                                    <div className="mt-3 space-y-1">
                                                        {item.sets.map((set, index) => (
                                                            <p
                                                                key={set.id}
                                                                className="text-sm text-zinc-400"
                                                            >
                                                                Série {index + 1}: {set.description}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}

                                            <div className="grid grid-cols-1 gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => handleEditWorkout(workout)}
                                                    className="w-full"
                                                >
                                                    Editar treino
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    onClick={() => handleDuplicateWorkout(workout)}
                                                    className="w-full"
                                                >
                                                    Duplicar treino
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    onClick={() => handleDeleteWorkout(workout.id)}
                                                    className="w-full"
                                                >
                                                    Excluir treino
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </Card>
            </section>
        </>
    )
}

export default Workouts