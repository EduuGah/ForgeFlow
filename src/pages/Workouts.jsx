import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronDown,
  ClipboardList,
  Copy,
  Dumbbell,
  Edit3,
  MoreHorizontal,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'

import { useWorkoutSession } from '../context/WorkoutSessionContext'

function Workouts() {
  const [workouts, setWorkouts] = useState([])
  const [exercises, setExercises] = useState([])

  const [quickSearch, setQuickSearch] = useState('')
  const [quickGroupFilter, setQuickGroupFilter] = useState('')
  const [quickEquipmentFilter, setQuickEquipmentFilter] = useState('')
  const [defaultSetModel, setDefaultSetModel] = useState('hypertrophy')

  const [workoutName, setWorkoutName] = useState('')
  const [selectedExercise, setSelectedExercise] = useState('')
  const [setDescription, setSetDescription] = useState('')
  const [exerciseSets, setExerciseSets] = useState([])
  const [workoutExercises, setWorkoutExercises] = useState([])

  const [expandedWorkoutId, setExpandedWorkoutId] = useState(null)
  const [editingWorkoutId, setEditingWorkoutId] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)

  const [folders, setFolders] = useState([])
  const [selectedFolderId, setSelectedFolderId] = useState(null)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [folderName, setFolderName] = useState('')

  const [customSetModels, setCustomSetModels] = useState([])
  const [isSetModelModalOpen, setIsSetModelModalOpen] = useState(false)
  const [setModelName, setSetModelName] = useState('')
  const [setModelLines, setSetModelLines] = useState('')

  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)

  const { startSession } = useWorkoutSession()
  const navigate = useNavigate()

  useEffect(() => {
    const savedWorkouts = localStorage.getItem('forgeflow:workouts')
    const savedExercises = localStorage.getItem('forgeflow:exercises')
    const savedFolders = localStorage.getItem('forgeflow:folders')
    const savedSetModels = localStorage.getItem('forgeflow:set-models')
    const draft = localStorage.getItem('forgeflow:workout-draft')

    if (savedWorkouts) {
      setWorkouts(JSON.parse(savedWorkouts))
    }

    if (savedExercises) {
      setExercises(JSON.parse(savedExercises))
    }

    if (savedFolders) {
      setFolders(JSON.parse(savedFolders))
    }

    if (savedSetModels) {
      setCustomSetModels(JSON.parse(savedSetModels))
    }

    if (draft) {
      const parsedDraft = JSON.parse(draft)

      setWorkoutName(parsedDraft.workoutName || '')
      setSelectedExercise(parsedDraft.selectedExercise || '')
      setSetDescription(parsedDraft.setDescription || '')
      setExerciseSets(parsedDraft.exerciseSets || [])
      setWorkoutExercises(parsedDraft.workoutExercises || [])
      setEditingWorkoutId(parsedDraft.editingWorkoutId || null)
      setSelectedFolderId(parsedDraft.selectedFolderId || null)
      setDefaultSetModel(parsedDraft.defaultSetModel || 'hypertrophy')
    }

    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return

    localStorage.setItem('forgeflow:workouts', JSON.stringify(workouts))
  }, [workouts, isLoaded])

  useEffect(() => {
    if (!isLoaded) return

    localStorage.setItem('forgeflow:folders', JSON.stringify(folders))
  }, [folders, isLoaded])

  useEffect(() => {
    if (!isLoaded) return

    localStorage.setItem('forgeflow:set-models', JSON.stringify(customSetModels))
  }, [customSetModels, isLoaded])

  useEffect(() => {
    if (!isLoaded) return

    const draft = {
      workoutName,
      selectedExercise,
      setDescription,
      exerciseSets,
      workoutExercises,
      editingWorkoutId,
      selectedFolderId,
      defaultSetModel,
    }

    localStorage.setItem('forgeflow:workout-draft', JSON.stringify(draft))
  }, [
    workoutName,
    selectedExercise,
    setDescription,
    exerciseSets,
    workoutExercises,
    editingWorkoutId,
    selectedFolderId,
    defaultSetModel,
    isLoaded,
  ])

  useEffect(() => {
    const header = document.getElementById('app-header')

    if (!header) return

    if (isBuilderOpen) {
      header.style.display = 'none'
      document.body.style.overflow = 'hidden'
    } else {
      header.style.display = ''
      document.body.style.overflow = ''
    }

    return () => {
      header.style.display = ''
      document.body.style.overflow = ''
    }
  }, [isBuilderOpen])

  const muscleGroups = useMemo(() => {
    return [
      ...new Set(exercises.map((exercise) => exercise.muscleGroup).filter(Boolean)),
    ].sort()
  }, [exercises])

  const equipmentList = useMemo(() => {
    return [
      ...new Set(exercises.map((exercise) => exercise.equipment).filter(Boolean)),
    ].sort()
  }, [exercises])

  const filteredQuickExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const text =
        `${exercise.name} ${exercise.muscleGroup} ${exercise.equipment} ${exercise.originalName || ''}`.toLowerCase()

      const matchesSearch = text.includes(quickSearch.toLowerCase())

      const matchesGroup = quickGroupFilter
        ? exercise.muscleGroup === quickGroupFilter
        : true

      const matchesEquipment = quickEquipmentFilter
        ? exercise.equipment === quickEquipmentFilter
        : true

      return matchesSearch && matchesGroup && matchesEquipment
    })
  }, [exercises, quickSearch, quickGroupFilter, quickEquipmentFilter])

  const totalExercisesInSavedWorkouts = useMemo(() => {
    return workouts.reduce((total, workout) => total + workout.exercises.length, 0)
  }, [workouts])

  const totalSetsInCurrentWorkout = useMemo(() => {
    return workoutExercises.reduce((total, item) => total + item.sets.length, 0)
  }, [workoutExercises])

  const filteredWorkouts = useMemo(() => {
    return workouts.filter((workout) =>
      selectedFolderId ? workout.folderId === selectedFolderId : true
    )
  }, [workouts, selectedFolderId])

  function showToast(type, title, message = '') {
    setToast({
      type,
      title,
      message,
    })

    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  function getDefaultSets(model = defaultSetModel) {
    const fixedModels = {
      hypertrophy: ['12 Rep', '10-12 Rep', '5-8 Rep', '5-8 Rep'],
      beginner: ['12 Rep', '12 Rep', '12 Rep'],
      strength: ['5 Rep', '5 Rep', '5 Rep', '5 Rep', '5 Rep'],
      pyramid: ['15 Rep', '12 Rep', '10 Rep', '8 Rep'],
      custom: ['8-12 Rep'],
    }

    const customModel = customSetModels.find((item) => item.id === model)

    const selectedModel = customModel
      ? customModel.sets
      : fixedModels[model] || fixedModels.hypertrophy

    return selectedModel.map((description) => {
      const normalized = description.toLowerCase()

      const isWarmup =
        normalized.includes('aquecimento') ||
        normalized.includes('warmup') ||
        normalized.includes('warm-up')

      return {
        id: crypto.randomUUID(),
        description,
        type: isWarmup ? 'warmup' : 'working',
      }
    })
  }

  function resetForm() {
    setWorkoutName('')
    setSelectedExercise('')
    setSetDescription('')
    setExerciseSets([])
    setWorkoutExercises([])
    setEditingWorkoutId(null)
    setSelectedFolderId(null)
    setQuickSearch('')
    setQuickGroupFilter('')
    setQuickEquipmentFilter('')
    localStorage.removeItem('forgeflow:workout-draft')
  }

  function openCreateBuilder() {
    resetForm()
    setIsBuilderOpen(true)
  }

  function closeBuilder() {
    resetForm()
    setIsBuilderOpen(false)
  }

  function handleCreateFolder() {
    if (!folderName.trim()) {
      showToast('error', 'Nome obrigatório', 'Informe um nome para a pasta.')
      return
    }

    const newFolder = {
      id: crypto.randomUUID(),
      name: folderName.trim(),
      createdAt: new Date().toISOString(),
    }

    setFolders([newFolder, ...folders])
    setSelectedFolderId(newFolder.id)
    setFolderName('')
    setIsFolderModalOpen(false)
    showToast('success', 'Pasta criada', 'A pasta foi adicionada com sucesso.')
  }

  function handleDeleteFolder(folderId) {
    const folder = folders.find((item) => item.id === folderId)

    setConfirmModal({
      title: 'Excluir pasta?',
      description: `A pasta "${folder?.name || 'selecionada'}" será removida. Os treinos dentro dela não serão apagados, apenas ficarão sem pasta.`,
      confirmText: 'Excluir',
      variant: 'danger',
      onConfirm: () => {
        const updatedFolders = folders.filter((item) => item.id !== folderId)

        const updatedWorkouts = workouts.map((workout) =>
          workout.folderId === folderId
            ? {
                ...workout,
                folderId: null,
              }
            : workout
        )

        setFolders(updatedFolders)
        setWorkouts(updatedWorkouts)

        if (selectedFolderId === folderId) {
          setSelectedFolderId(null)
        }

        setConfirmModal(null)
        showToast('success', 'Pasta excluída', 'Os treinos foram movidos para sem pasta.')
      },
    })
  }

  function handleCreateSetModel() {
    if (!setModelName.trim() || !setModelLines.trim()) {
      showToast(
        'error',
        'Modelo incompleto',
        'Informe o nome do modelo e pelo menos uma série.'
      )
      return
    }

    const sets = setModelLines
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    const newModel = {
      id: crypto.randomUUID(),
      name: setModelName.trim(),
      sets,
      createdAt: new Date().toISOString(),
    }

    setCustomSetModels([newModel, ...customSetModels])
    setDefaultSetModel(newModel.id)
    setSetModelName('')
    setSetModelLines('')
    setIsSetModelModalOpen(false)

    showToast('success', 'Modelo criado', 'O modelo de séries foi salvo.')
  }

  function handleDeleteSetModel(modelId) {
    const model = customSetModels.find((item) => item.id === modelId)

    setConfirmModal({
      title: 'Excluir modelo?',
      description: `O modelo "${model?.name || 'selecionado'}" será removido.`,
      confirmText: 'Excluir',
      variant: 'danger',
      onConfirm: () => {
        setCustomSetModels(customSetModels.filter((item) => item.id !== modelId))

        if (defaultSetModel === modelId) {
          setDefaultSetModel('hypertrophy')
        }

        setConfirmModal(null)
        showToast('success', 'Modelo excluído', 'O modelo de séries foi removido.')
      },
    })
  }

  function handleDefaultSets() {
    setExerciseSets(getDefaultSets())
  }

  function handleAddSet() {
    if (!setDescription.trim()) {
      showToast('error', 'Série vazia', 'Descreva a série antes de adicionar.')
      return
    }

    const normalized = setDescription.toLowerCase()

    const isWarmup =
      normalized.includes('aquecimento') ||
      normalized.includes('warmup') ||
      normalized.includes('warm-up')

    const newSet = {
      id: crypto.randomUUID(),
      description: setDescription.trim(),
      type: isWarmup ? 'warmup' : 'working',
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
      note: '',
      restTimer: 'Desligado',
    }

    setWorkoutExercises([...workoutExercises, newWorkoutExercise])
  }

  function handleAddExercise() {
    if (!selectedExercise || exerciseSets.length === 0) {
      showToast(
        'error',
        'Exercício incompleto',
        'Selecione um exercício e adicione pelo menos uma série.'
      )
      return
    }

    const exerciseFound = exercises.find((exercise) => exercise.id === selectedExercise)

    if (!exerciseFound) return

    const newWorkoutExercise = {
      id: crypto.randomUUID(),
      exercise: exerciseFound,
      sets: exerciseSets,
      note: '',
      restTimer: 'Desligado',
    }

    setWorkoutExercises([...workoutExercises, newWorkoutExercise])
    setSelectedExercise('')
    setSetDescription('')
    setExerciseSets([])
  }

  function handleRemoveExercise(id) {
    setWorkoutExercises(workoutExercises.filter((item) => item.id !== id))
  }

  function handleUpdateExerciseNote(id, value) {
    setWorkoutExercises(
      workoutExercises.map((item) =>
        item.id === id
          ? {
              ...item,
              note: value,
            }
          : item
      )
    )
  }

  function handleUpdateExerciseRest(id, value) {
    setWorkoutExercises(
      workoutExercises.map((item) =>
        item.id === id
          ? {
              ...item,
              restTimer: value,
            }
          : item
      )
    )
  }

  function handleAddSetToWorkoutExercise(id) {
    setWorkoutExercises(
      workoutExercises.map((item) =>
        item.id === id
          ? {
              ...item,
              sets: [
                ...item.sets,
                {
                  id: crypto.randomUUID(),
                  description: '8-12 Rep',
                  type: 'working',
                },
              ],
            }
          : item
      )
    )
  }

  function handleRemoveSetFromWorkoutExercise(exerciseId, setId) {
    setWorkoutExercises(
      workoutExercises.map((item) =>
        item.id === exerciseId
          ? {
              ...item,
              sets: item.sets.filter((set) => set.id !== setId),
            }
          : item
      )
    )
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!workoutName.trim() || workoutExercises.length === 0) {
      showToast(
        'error',
        'Treino incompleto',
        'Informe o nome do treino e adicione pelo menos um exercício.'
      )
      return
    }

    if (editingWorkoutId) {
      setWorkouts(
        workouts.map((workout) =>
          workout.id === editingWorkoutId
            ? {
                ...workout,
                name: workoutName.trim(),
                folderId: selectedFolderId,
                exercises: workoutExercises,
                updatedAt: new Date().toISOString(),
              }
            : workout
        )
      )

      resetForm()
      setIsBuilderOpen(false)
      showToast('success', 'Treino atualizado', 'As alterações foram salvas.')
      return
    }

    const newWorkout = {
      id: crypto.randomUUID(),
      name: workoutName.trim(),
      exercises: workoutExercises,
      folderId: selectedFolderId,
      createdAt: new Date().toISOString(),
    }

    setWorkouts([newWorkout, ...workouts])
    resetForm()
    setIsBuilderOpen(false)
    showToast('success', 'Treino criado', 'Sua nova rotina foi salva.')
  }

  function handleEditWorkout(workout) {
    setEditingWorkoutId(workout.id)
    setWorkoutName(workout.name)
    setWorkoutExercises(workout.exercises || [])
    setSelectedFolderId(workout.folderId || null)
    setSelectedExercise('')
    setSetDescription('')
    setExerciseSets([])
    setExpandedWorkoutId(null)
    setIsBuilderOpen(true)
  }

  function handleDeleteWorkout(id) {
    const workout = workouts.find((item) => item.id === id)

    setConfirmModal({
      title: 'Excluir treino?',
      description: `O treino "${workout?.name || 'selecionado'}" será removido. Essa ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      variant: 'danger',
      onConfirm: () => {
        setWorkouts(workouts.filter((workout) => workout.id !== id))

        if (editingWorkoutId === id) {
          resetForm()
        }

        setConfirmModal(null)
        showToast('success', 'Treino excluído', 'A rotina foi removida.')
      },
    })
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
    showToast('success', 'Treino duplicado', 'Uma cópia foi criada.')
  }

  function handleToggleWorkout(id) {
    setExpandedWorkoutId(expandedWorkoutId === id ? null : id)
  }

  function handleStartWorkout(workout) {
    startSession(workout)
    navigate('/start-workout')
  }

  function getMuscleGroupsFromWorkout(workout) {
    const groups = workout.exercises.map((item) => item.exercise?.muscleGroup)

    return [...new Set(groups)].filter(Boolean)
  }

  function getWorkoutExerciseNames(workout) {
    return workout.exercises
      .map((item) => `${item.exercise?.name} (${item.exercise?.equipment})`)
      .join(', ')
  }

  return (
    <>
      <PageHeader
        title="Treinos"
        description="Monte treinos, organize exercícios e inicie seus treinos salvos."
        action={
          <button
            type="button"
            onClick={openCreateBuilder}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-bold text-white shadow-[0_0_18px_rgba(139,92,246,0.35)] transition hover:bg-violet-500 hover:shadow-[0_0_26px_rgba(139,92,246,0.55)]"
          >
            <Plus size={18} />
            Novo treino
          </button>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-zinc-500">Treinos salvos</p>
          <h3 className="mt-2 text-3xl font-bold">{workouts.length}</h3>
          <p className="mt-2 text-xs text-violet-400">Treinos disponíveis</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-zinc-500">Biblioteca</p>
          <h3 className="mt-2 text-3xl font-bold">{exercises.length}</h3>
          <p className="mt-2 text-xs text-violet-400">Exercícios cadastrados</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-zinc-500">Itens nos treinos</p>
          <h3 className="mt-2 text-3xl font-bold text-violet-400">
            {totalExercisesInSavedWorkouts}
          </h3>
          <p className="mt-2 text-xs text-violet-400">Exercícios usados</p>
        </Card>
      </section>

      <div className="mt-5 rounded-3xl border border-zinc-800 bg-[#18181b] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-zinc-300">Pastas</p>

          <button
            type="button"
            onClick={() => setIsFolderModalOpen(true)}
            className="text-xs font-bold text-violet-400 transition hover:text-violet-300"
          >
            + Nova pasta
          </button>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto overscroll-x-contain pb-2">
          <button
            type="button"
            onClick={() => setSelectedFolderId(null)}
            className={
              selectedFolderId === null
                ? 'shrink-0 rounded-2xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-[0_0_18px_rgba(139,92,246,0.35)]'
                : 'shrink-0 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-bold text-zinc-400 transition hover:border-violet-500/40 hover:text-white'
            }
          >
            Todas
            <span className="ml-2 text-xs opacity-70">{workouts.length}</span>
          </button>

          {folders.map((folder) => {
            const total = workouts.filter((workout) => workout.folderId === folder.id).length

            return (
              <div
                key={folder.id}
                className={
                  selectedFolderId === folder.id
                    ? 'group flex shrink-0 items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-[0_0_18px_rgba(139,92,246,0.35)]'
                    : 'group flex shrink-0 items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-bold text-zinc-400 transition hover:border-violet-500/40 hover:text-white'
                }
              >
                <button
                  type="button"
                  onClick={() => setSelectedFolderId(folder.id)}
                  className="flex items-center gap-2"
                >
                  {folder.name}

                  <span className="text-xs opacity-70">{total}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteFolder(folder.id)}
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

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-zinc-400">
                <ChevronDown size={18} />

                <p className="text-sm">
                  Os meus treinos ({filteredWorkouts.length})
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {filteredWorkouts.length === 0 && (
                <EmptyState
                  title="Nenhum treino encontrado"
                  description="Crie seu primeiro treino ou escolha outra pasta."
                  action={<Button onClick={openCreateBuilder}>Novo treino</Button>}
                />
              )}

              {filteredWorkouts.map((workout) => {
                const isExpanded = expandedWorkoutId === workout.id
                const workoutMuscleGroups = getMuscleGroupsFromWorkout(workout)

                return (
                  <div
                    key={workout.id}
                    className="overflow-hidden rounded-3xl border border-zinc-800 bg-[#18181b] transition hover:border-violet-500/30 hover:bg-[#1f1f23]"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleWorkout(workout.id)}
                      className="w-full p-4 text-left sm:p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-lg font-bold text-white">
                            {workout.name}
                          </h3>

                          <p className="mt-2 line-clamp-2 text-sm text-zinc-500 sm:truncate">
                            {getWorkoutExerciseNames(workout)}
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

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleStartWorkout(workout)
                            }}
                            className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-2xl bg-violet-600 text-sm font-bold text-white transition hover:bg-violet-500 sm:hidden"
                          >
                            Iniciar treino
                          </button>
                        </div>

                        <div className="hidden items-center gap-2 sm:flex">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleStartWorkout(workout)
                            }}
                            className="h-10 rounded-2xl bg-violet-600 px-4 text-sm font-bold text-white transition hover:bg-violet-500"
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
                            <div
                              key={item.id}
                              className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 sm:gap-4"
                            >
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-white">
                                {item.exercise.mediaUrl ? (
                                  <img
                                    src={item.exercise.mediaUrl}
                                    alt={item.exercise.name}
                                    className="h-full w-full object-cover"
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
                          ))}
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <button
                            type="button"
                            onClick={() => handleStartWorkout(workout)}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-violet-600 text-sm font-bold text-white transition hover:bg-violet-500"
                          >
                            <Dumbbell size={17} />
                            Iniciar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEditWorkout(workout)}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-violet-500/30 bg-violet-500/10 text-sm font-bold text-violet-300 transition hover:bg-violet-500/20"
                          >
                            <Edit3 size={17} />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicateWorkout(workout)}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 text-sm font-bold text-white transition hover:bg-zinc-800"
                          >
                            <Copy size={17} />
                            Duplicar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteWorkout(workout.id)}
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
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden p-0">
            <button
              type="button"
              onClick={openCreateBuilder}
              className="group flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[#1f1f23]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white transition group-hover:bg-violet-600 group-hover:shadow-[0_0_16px_rgba(139,92,246,0.4)]">
                  <ClipboardList size={22} />
                </div>

                <p className="font-bold text-white transition group-hover:text-violet-300">
                  Novo treino
                </p>
              </div>

              <ChevronDown
                className="-rotate-90 text-zinc-500 transition group-hover:text-violet-400 group-hover:translate-x-1"
                size={22}
              />
            </button>

            <div className="border-t border-zinc-800" />

            <button
              type="button"
              onClick={() => setIsFolderModalOpen(true)}
              className="group flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[#1f1f23]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white transition group-hover:bg-violet-600 group-hover:shadow-[0_0_16px_rgba(139,92,246,0.4)]">
                  <Plus size={22} />
                </div>

                <p className="font-bold text-white transition group-hover:text-violet-300">
                  Nova pasta
                </p>
              </div>

              <ChevronDown
                className="-rotate-90 text-zinc-500 transition group-hover:text-violet-400 group-hover:translate-x-1"
                size={22}
              />
            </button>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">Resumo</h2>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">Treinos</p>
                <p className="mt-1 text-2xl font-bold text-violet-400">
                  {workouts.length}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">Exercícios</p>
                <p className="mt-1 text-2xl font-bold">
                  {totalExercisesInSavedWorkouts}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {isBuilderOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain bg-black">
          <div className="mx-auto max-w-[1180px] px-4 py-4 sm:py-6">
            <form onSubmit={handleSubmit}>
              <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-zinc-900 bg-black/90 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:mb-6 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={closeBuilder}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                    >
                      <ArrowLeft size={22} />
                    </button>

                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-violet-400">
                        {editingWorkoutId ? 'Editar rotina' : 'Nova rotina'}
                      </p>

                      <h1 className="truncate text-2xl font-black sm:text-3xl">
                        {editingWorkoutId ? 'Editar treino' : 'Criar treino'}
                      </h1>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-bold text-white transition hover:bg-violet-500 sm:w-auto"
                  >
                    <Save size={18} />
                    Salvar treino
                  </button>
                </div>
              </div>

              <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                <div className="space-y-6 xl:col-span-3">
                  <Card>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Input
                        label="Título do treino"
                        placeholder="Ex: Push A, Costas pesado..."
                        value={workoutName}
                        onChange={(event) => setWorkoutName(event.target.value)}
                      />

                      <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <label className="block text-sm font-bold text-zinc-300">
                            Pasta
                          </label>

                          <button
                            type="button"
                            onClick={() => setIsFolderModalOpen(true)}
                            className="text-xs font-bold text-violet-400 transition hover:text-violet-300"
                          >
                            + Criar pasta
                          </button>
                        </div>

                        <select
                          value={selectedFolderId || ''}
                          onChange={(event) => setSelectedFolderId(event.target.value || null)}
                          className="h-12 w-full rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-sm font-bold text-white outline-none transition hover:border-zinc-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
                        >
                          <option value="">Sem pasta</option>

                          {folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                              {folder.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </Card>

                  {workoutExercises.length === 0 && (
                    <EmptyState
                      icon={Dumbbell}
                      title="Nenhum exercício"
                      description="Use a biblioteca para adicionar exercícios ao treino."
                    />
                  )}

                  {workoutExercises.map((item, index) => (
                    <Card key={item.id}>
                      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                        <span className="hidden text-xl text-zinc-500 sm:block">⋮⋮</span>

                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-white">
                          {item.exercise.mediaUrl ? (
                            <img
                              src={item.exercise.mediaUrl}
                              alt={item.exercise.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Dumbbell size={26} className="text-zinc-900" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-xs font-bold text-violet-400">
                              {index + 1}
                            </span>

                            <h3 className="truncate text-lg font-bold">
                              {item.exercise.name}
                            </h3>
                          </div>

                          <p className="mt-1 text-xs text-zinc-500">
                            {item.exercise.muscleGroup} • {item.exercise.equipment}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveExercise(item.id)}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"
                        >
                          <X size={22} />
                        </button>
                      </div>

                      <div className="mt-5">
                        <Textarea
                          label="Nota"
                          placeholder="Adicionar nota"
                          value={item.note || ''}
                          onChange={(event) =>
                            handleUpdateExerciseNote(item.id, event.target.value)
                          }
                          rows={3}
                        />
                      </div>

                      <div className="mt-5">
                        <div className="mb-2 hidden grid-cols-[70px_1fr_80px] gap-3 px-3 text-xs font-bold uppercase tracking-wide text-zinc-500 sm:grid">
                          <span>Série</span>
                          <span>Meta</span>
                          <span></span>
                        </div>

                        <div className="space-y-2">
                          {item.sets.map((set, setIndex) => {
                            const isWarmup = set.type === 'warmup'

                            return (
                              <div
                                key={set.id}
                                className="grid grid-cols-[44px_1fr_40px] items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 sm:grid-cols-[70px_1fr_80px]"
                              >
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-[#18181b] text-sm font-bold">
                                  {isWarmup ? 'A' : setIndex + 1}
                                </span>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold">
                                    {set.description}
                                  </p>

                                  {isWarmup && (
                                    <p className="mt-1 text-[10px] font-bold text-zinc-500">
                                      AQUECIMENTO
                                    </p>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveSetFromWorkoutExercise(item.id, set.id)
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 transition hover:bg-red-500/20 sm:ml-auto"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddSetToWorkoutExercise(item.id)}
                        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-800 text-sm font-bold transition hover:bg-zinc-700"
                      >
                        <Plus size={18} />
                        Adicionar série
                      </button>
                    </Card>
                  ))}
                </div>

                <div className="space-y-6 xl:col-span-2">
                  <Card>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">Resumo</h2>

                        <div className="mt-4 flex gap-8">
                          <div>
                            <p className="text-xs text-zinc-500">Exercícios</p>
                            <p className="mt-1 text-xl font-bold text-violet-400">
                              {workoutExercises.length}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-zinc-500">Total de séries</p>
                            <p className="mt-1 text-xl font-bold">
                              {totalSetsInCurrentWorkout}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Dumbbell size={48} className="text-zinc-600" />
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="block text-sm font-bold text-zinc-300">
                          Modelo padrão de séries
                        </label>

                        <button
                          type="button"
                          onClick={() => setIsSetModelModalOpen(true)}
                          className="text-xs font-bold text-violet-400 transition hover:text-violet-300"
                        >
                          + Criar modelo
                        </button>
                      </div>

                      <select
                        value={defaultSetModel}
                        onChange={(event) => setDefaultSetModel(event.target.value)}
                        className="h-12 w-full rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-sm font-bold text-white outline-none transition hover:border-zinc-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
                      >
                        <option value="hypertrophy">Hipertrofia padrão - 4 séries</option>
                        <option value="beginner">Iniciante - 3 séries</option>
                        <option value="strength">Força - 5 séries</option>
                        <option value="pyramid">Pirâmide - 4 séries</option>
                        <option value="custom">Simples - 1 série</option>

                        {customSetModels.length > 0 && (
                          <option disabled>─ Modelos personalizados ─</option>
                        )}

                        {customSetModels.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name} - {model.sets.length} séries
                          </option>
                        ))}
                      </select>

                      {customSetModels.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                            Modelos personalizados
                          </p>

                          {customSetModels.map((model) => (
                            <div
                              key={model.id}
                              className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-3"
                            >
                              <div>
                                <p className="text-sm font-bold">{model.name}</p>

                                <p className="text-xs text-zinc-500">
                                  {model.sets.length} itens
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteSetModel(model.id)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card>
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-xl font-bold">Biblioteca</h2>

                        <p className="mt-1 text-sm text-zinc-500">
                          Adicione exercícios rapidamente.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsBuilderOpen(false)
                          navigate('/exercises')
                        }}
                        className="inline-flex items-center gap-2 text-sm font-bold text-violet-400 transition hover:text-violet-300"
                      >
                        <Plus size={18} />
                        Cadastrar
                      </button>
                    </div>

                    <div className="space-y-3">
                      <Select
                        value={quickEquipmentFilter}
                        onChange={(event) => setQuickEquipmentFilter(event.target.value)}
                      >
                        <option value="">Todos os equipamentos</option>

                        {equipmentList.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </Select>

                      <Select
                        value={quickGroupFilter}
                        onChange={(event) => setQuickGroupFilter(event.target.value)}
                      >
                        <option value="">Todos os músculos</option>

                        {muscleGroups.map((group) => (
                          <option key={group} value={group}>
                            {group}
                          </option>
                        ))}
                      </Select>

                      <div className="flex h-12 items-center gap-3 rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-zinc-400">
                        <Search size={20} />

                        <input
                          type="text"
                          placeholder="Procurar exercícios"
                          value={quickSearch}
                          onChange={(event) => setQuickSearch(event.target.value)}
                          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
                        />

                        {quickSearch && (
                          <button
                            type="button"
                            onClick={() => setQuickSearch('')}
                            className="text-zinc-500 transition hover:text-white"
                          >
                            <X size={17} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 max-h-[520px] space-y-2 overflow-y-auto overscroll-contain pr-2">
                      {filteredQuickExercises.length === 0 && (
                        <EmptyState
                          title="Nenhum exercício"
                          description="Tente outro filtro ou cadastre um exercício."
                        />
                      )}

                      {filteredQuickExercises.map((exercise) => {
                        const alreadyAdded = isExerciseAlreadyAdded(exercise.id)

                        return (
                          <button
                            key={exercise.id}
                            type="button"
                            onClick={() => handleQuickAddExercise(exercise.id)}
                            className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-zinc-900"
                          >
                            <span
                              className={
                                alreadyAdded
                                  ? 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white'
                                  : 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white'
                              }
                            >
                              {alreadyAdded ? '✓' : '+'}
                            </span>

                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-white">
                              {exercise.mediaUrl ? (
                                <img
                                  src={exercise.mediaUrl}
                                  alt={exercise.name}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <Dumbbell size={24} className="text-zinc-900" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-bold">
                                {exercise.name}
                              </p>

                              <p className="text-sm text-zinc-500">
                                {exercise.muscleGroup}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                      <h3 className="font-bold">Modo personalizado</h3>

                      <p className="mt-1 text-sm text-zinc-500">
                        Monte séries manualmente antes de adicionar.
                      </p>

                      <div className="mt-4 space-y-3">
                        <Select
                          value={selectedExercise}
                          onChange={(event) => setSelectedExercise(event.target.value)}
                        >
                          <option value="">Selecione um exercício</option>

                          {exercises.map((exercise) => (
                            <option key={exercise.id} value={exercise.id}>
                              {exercise.name}
                            </option>
                          ))}
                        </Select>

                        <Input
                          placeholder="Ex: Aquecimento ou 8-12 Rep"
                          value={setDescription}
                          onChange={(event) => setSetDescription(event.target.value)}
                        />

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleAddSet}
                            className="w-full"
                          >
                            Série
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleDefaultSets}
                            className="w-full"
                          >
                            Padrão
                          </Button>

                          <Button
                            type="button"
                            onClick={handleAddExercise}
                            className="w-full"
                          >
                            Adicionar
                          </Button>
                        </div>

                        {exerciseSets.length > 0 && (
                          <div className="space-y-2">
                            {exerciseSets.map((set, index) => (
                              <div
                                key={set.id}
                                className="flex items-center justify-between rounded-xl bg-zinc-900 p-3"
                              >
                                <p className="text-sm">
                                  {set.type === 'warmup' ? 'Aquecimento' : `Série ${index + 1}`}: {set.description}
                                </p>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveSet(set.id)}
                                  className="text-red-400"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </section>
            </form>
          </div>
        </div>
      )}

      {isFolderModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-[#121212] p-6 shadow-2xl shadow-violet-950/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-violet-400">Nova pasta</p>

                <h2 className="mt-1 text-2xl font-black">Criar pasta</h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Organize seus treinos por categoria.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-5">
              <Input
                placeholder="Nome da pasta"
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button onClick={handleCreateFolder} className="w-full">
                Criar
              </Button>

              <Button
                variant="secondary"
                onClick={() => setIsFolderModalOpen(false)}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {isSetModelModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#121212] p-6 shadow-2xl shadow-violet-950/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-violet-400">
                  Novo modelo
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Modelo de séries
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Crie um padrão para aplicar automaticamente nos exercícios adicionados.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsSetModelModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <Input
                label="Nome do modelo"
                placeholder="Ex: Peito pesado"
                value={setModelName}
                onChange={(event) => setSetModelName(event.target.value)}
              />

              <Textarea
                label="Séries"
                placeholder={`Uma série por linha. Ex:\nAquecimento\n12 Rep\n10-12 Rep\n8 Rep`}
                rows={6}
                value={setModelLines}
                onChange={(event) => setSetModelLines(event.target.value)}
              />

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs font-bold text-zinc-400">Exemplo</p>

                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  Cada linha vira uma série. Você pode escrever: “12 Rep”, “8-10 Rep”, “Falha”, “Aquecimento”, etc.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                type="button"
                onClick={handleCreateSetModel}
                className="w-full"
              >
                Criar modelo
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsSetModelModalOpen(false)}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(confirmModal)}
        title={confirmModal?.title}
        description={confirmModal?.description}
        confirmText={confirmModal?.confirmText}
        variant={confirmModal?.variant}
        onConfirm={confirmModal?.onConfirm}
        onCancel={() => setConfirmModal(null)}
      />

      <Toast
        show={Boolean(toast)}
        type={toast?.type}
        title={toast?.title}
        message={toast?.message}
        onClose={() => setToast(null)}
      />
    </>
  )
}

export default Workouts