import { useEffect, useMemo, useState } from 'react'

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
  const [selectedWorkoutView, setSelectedWorkoutView] = useState(null)
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

  const filteredQuickExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const text = `${exercise.name} ${exercise.muscleGroup} ${exercise.equipment}`.toLowerCase()

      return text.includes(quickSearch.toLowerCase())
    })
  }, [exercises, quickSearch])

  const currentMuscleGroups = useMemo(() => {
    const groups = workoutExercises.map((item) => item.exercise?.muscleGroup)

    return [...new Set(groups)].filter(Boolean)
  }, [workoutExercises])

  const totalExercisesInSavedWorkouts = useMemo(() => {
    return workouts.reduce((total, workout) => total + workout.exercises.length, 0)
  }, [workouts])

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

  function isExerciseAlreadyAdded(exerciseId) {
    return workoutExercises.some((item) => item.exercise.id === exerciseId)
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

    return [...new Set(groups)].filter(Boolean)
  }

  return (
    <>
      <PageHeader
        title="Construtor de Treinos"
        description="Monte, edite e organize seus treinos com adição rápida, séries padrão e modo personalizado."
        action={
          <Badge variant="purple">
            {workouts.length} treinos
          </Badge>
        }
      />

      <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-sm text-zinc-500">
                Treinos salvos
              </p>

              <h3 className="text-2xl font-bold mt-1">
                {workouts.length}
              </h3>
            </Card>

            <Card className="p-4">
              <p className="text-sm text-zinc-500">
                Exercícios na biblioteca
              </p>

              <h3 className="text-2xl font-bold mt-1">
                {exercises.length}
              </h3>
            </Card>

            <Card className="p-4">
              <p className="text-sm text-zinc-500">
                Itens em treinos
              </p>

              <h3 className="text-2xl font-bold mt-1 text-violet-400">
                {totalExercisesInSavedWorkouts}
              </h3>
            </Card>
          </div>

          <Card>
            <form onSubmit={handleSubmit}>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    {editingWorkoutId ? 'Editar treino' : 'Novo treino'}
                  </h2>

                  <p className="text-sm text-zinc-400 mt-1">
                    {editingWorkoutId
                      ? 'Atualize o treino selecionado e salve as alterações.'
                      : 'Crie um treino usando a biblioteca de exercícios.'}
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
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-bold">
                        Adição rápida
                      </h3>

                      <p className="text-sm text-zinc-500 mt-1">
                        Pesquise e clique para adicionar com o padrão 12 / 10-12 / 5-8 / 5-8.
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
                    <div className="mt-4">
                      <Input
                        type="text"
                        placeholder="Pesquisar por nome, grupo ou equipamento..."
                        value={quickSearch}
                        onChange={(event) => setQuickSearch(event.target.value)}
                      />

                      <div className="mt-4 max-h-64 overflow-y-auto pr-2">
                        {exercises.length === 0 && (
                          <EmptyState
                            title="Nenhum exercício cadastrado"
                            description="Cadastre exercícios antes de montar um treino."
                          />
                        )}

                        {exercises.length > 0 && filteredQuickExercises.length === 0 && (
                          <EmptyState
                            title="Nenhum exercício encontrado"
                            description="Tente buscar por outro nome, grupo ou equipamento."
                          />
                        )}

                        {filteredQuickExercises.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {filteredQuickExercises.map((exercise) => {
                              const alreadyAdded = isExerciseAlreadyAdded(exercise.id)

                              return (
                                <button
                                  key={exercise.id}
                                  type="button"
                                  onClick={() => handleQuickAddExercise(exercise.id)}
                                  className={
                                    alreadyAdded
                                      ? 'rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-left transition hover:bg-emerald-500/15'
                                      : 'rounded-2xl border border-violet-500/20 bg-violet-600/90 p-3 text-left text-white transition hover:-translate-y-0.5 hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-950/40 active:scale-[0.98]'
                                  }
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p
                                        className={
                                          alreadyAdded
                                            ? 'font-bold text-emerald-400 truncate'
                                            : 'font-bold text-white truncate'
                                        }
                                      >
                                        {alreadyAdded ? '✓ ' : '+ '}
                                        {exercise.name}
                                      </p>

                                      <p
                                        className={
                                          alreadyAdded
                                            ? 'text-xs text-emerald-500/80 mt-1'
                                            : 'text-xs text-violet-100/80 mt-1'
                                        }
                                      >
                                        {exercise.muscleGroup} • {exercise.equipment}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
                  <h3 className="font-bold">
                    Modo personalizado
                  </h3>

                  <p className="text-sm text-zinc-500 mt-1">
                    Use quando quiser definir séries diferentes antes de adicionar o exercício.
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    <Select
                      label="Exercício"
                      value={selectedExercise}
                      onChange={(event) => setSelectedExercise(event.target.value)}
                    >
                      <option value="">Selecione</option>

                      {exercises.map((exercise) => (
                        <option key={exercise.id} value={exercise.id}>
                          {exercise.name}
                        </option>
                      ))}
                    </Select>

                    <Input
                      label="Descrição da série"
                      type="text"
                      placeholder="Ex: 50% da carga - 12 reps"
                      value={setDescription}
                      onChange={(event) => setSetDescription(event.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleAddSet}
                      className="w-full"
                    >
                      Adicionar série
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleDefaultSets}
                      className="w-full"
                    >
                      Usar padrão
                    </Button>

                    <Button
                      type="button"
                      onClick={handleAddExercise}
                      className="w-full"
                    >
                      Adicionar ao treino
                    </Button>
                  </div>

                  {exerciseSets.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {exerciseSets.map((set, index) => (
                        <div
                          key={set.id}
                          className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              Série {index + 1}
                            </p>

                            <p className="text-xs text-zinc-500">
                              {set.description}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveSet(set.id)}
                            className="h-8 w-8 rounded-lg bg-red-500/10 text-red-400 transition hover:bg-red-500 hover:text-white"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950 to-zinc-900/80 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-bold">
                        Resumo do treino atual
                      </h3>

                      <p className="text-sm text-zinc-500 mt-1">
                        {workoutExercises.length} exercícios adicionados
                      </p>

                      {currentMuscleGroups.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {currentMuscleGroups.map((group) => (
                            <Badge key={group} variant="purple">
                              {group}
                            </Badge>
                          ))}
                        </div>
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
        </div>

        <div className="xl:col-span-1 space-y-6">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  Treinos salvos
                </h2>

                <p className="text-xs text-zinc-500 mt-1">
                  Total: {workouts.length}
                </p>
              </div>

              <Badge variant="purple">
                {workouts.length}
              </Badge>
            </div>

            <div className="mt-5 max-h-[760px] overflow-y-auto pr-2 space-y-3">
              {workouts.length === 0 && (
                <EmptyState
                  title="Nenhum treino cadastrado"
                  description="Monte seu primeiro treino usando os exercícios cadastrados."
                />
              )}

              {workouts.map((workout) => {
                const isExpanded = expandedWorkoutId === workout.id
                const muscleGroups = getMuscleGroupsFromWorkout(workout)
                const isSelected = selectedWorkoutView === workout.id

                return (
                  <div
                    key={workout.id}
                    className={
                      isSelected
                        ? 'overflow-hidden rounded-2xl border border-violet-500/40 bg-violet-500/10 transition'
                        : 'overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 transition hover:border-violet-500/30'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleWorkout(workout.id)
                        setSelectedWorkoutView(isSelected ? null : workout.id)
                      }}
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

                          {muscleGroups.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {muscleGroups.slice(0, 3).map((group) => (
                                <span
                                  key={group}
                                  className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-400"
                                >
                                  {group}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <span className="text-xl text-zinc-500">
                          {isExpanded ? '−' : '+'}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-zinc-800 p-4 space-y-3">
                        {workout.exercises.map((item, index) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                          >
                            <div className="flex items-start gap-2">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-xs font-bold text-violet-400">
                                {index + 1}
                              </span>

                              <div>
                                <p className="font-medium">
                                  {item.exercise.name}
                                </p>

                                <p className="text-xs text-zinc-500 mt-1">
                                  {item.exercise.muscleGroup} • {item.exercise.equipment}
                                </p>

                                <div className="mt-2 space-y-1">
                                  {item.sets.map((set, setIndex) => (
                                    <p
                                      key={set.id}
                                      className="text-xs text-zinc-400"
                                    >
                                      Série {setIndex + 1}: {set.description}
                                    </p>
                                  ))}
                                </div>
                              </div>
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
        </div>
      </section>
    </>
  )
}

export default Workouts