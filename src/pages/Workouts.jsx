import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Dumbbell,
  Flame,
  Plus,
  Save,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react'

import { getAppSettings } from '../utils/settingsUtils'
import { getInitialExercises } from '../utils/exerciseStorage'

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
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import {
    getUserStorageData,
    saveUserStorageData,
    removeUserStorageData,
    migrateLegacyUserStorageData,
} from '../utils/userStorage'
import {
    getWorkoutId,
    normalizeHistoryFromApi,
    normalizeWorkoutFromApi,
} from '../utils/workoutNormalizers'
import {
    WorkoutsHeader,
    WorkoutStatsGrid,
    WorkoutFolderFilter,
} from '../features/workouts/components/WorkoutsOverview'
import WorkoutsListSection from '../features/workouts/components/WorkoutsListSection'
import WorkoutQuickActionsPanel from '../features/workouts/components/WorkoutQuickActionsPanel'
import { useWorkoutDerivedData } from '../features/workouts/hooks/useWorkoutDerivedData'

import defaultExercises from '../data/defaultExercises'

function Workouts() {
    const [workouts, setWorkouts] = useState([])
    const [exercises, setExercises] = useState([])
    const [history, setHistory] = useState([])

    const [quickSearch, setQuickSearch] = useState('')
    const [quickGroupFilter, setQuickGroupFilter] = useState('')
    const [quickFavoritesOnly, setQuickFavoritesOnly] = useState(false)
    const [quickEquipmentFilter, setQuickEquipmentFilter] = useState('')
    const [appSettings, setAppSettings] = useState(getAppSettings())
    const [defaultSetModel, setDefaultSetModel] = useState(getAppSettings().defaultSetModel)

    const [workoutName, setWorkoutName] = useState('')
    const [selectedExercise, setSelectedExercise] = useState('')
    const [setDescription, setSetDescription] = useState('')
    const [exerciseSets, setExerciseSets] = useState([])
    const [workoutExercises, setWorkoutExercises] = useState([])
    const [isWorkoutsListCollapsed, setIsWorkoutsListCollapsed] = useState(false)

    const [expandedWorkoutId, setExpandedWorkoutId] = useState(null)
    const [editingWorkoutId, setEditingWorkoutId] = useState(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const [isSyncingData, setIsSyncingData] = useState(false)
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
    const { user } = useAuth()
    const navigate = useNavigate()

    async function handleImportDefaultExercises() {
        try {
            const result = await apiFetch('/exercises/import-defaults', {
                method: 'POST',
                body: JSON.stringify({
                    exercises: defaultExercises,
                }),
            })

            const importedExercises = Array.isArray(result?.exercises)
                ? result.exercises.map((exercise) => ({
                    ...exercise,
                    id: exercise._id || exercise.id,
                    isFavorite: Boolean(exercise.isFavorite),
                }))
                : []

            setExercises(importedExercises)
            saveUserStorageData(user, 'exercises', importedExercises)

            showToast(
                'success',
                'Biblioteca importada',
                result?.message || `${result?.imported || 0} exercícios importados.`
            )
        } catch (error) {
            console.error(error)

            showToast(
                'error',
                'Erro ao importar',
                error.message || 'Não foi possível importar a biblioteca padrão.'
            )
        }
    }

    function buildWorkoutPayload() {
        return {
            name: workoutName.trim(),
            folderId: selectedFolderId,
            exercises: workoutExercises,
        }
    }

    function mergeWorkoutsFromCacheAndApi(cachedList = [], apiList = []) {
        const cachedWorkouts = Array.isArray(cachedList) ? cachedList : []
        const apiWorkouts = Array.isArray(apiList) ? apiList : []

        if (apiWorkouts.length === 0) return cachedWorkouts
        if (cachedWorkouts.length === 0) return apiWorkouts

        const map = new Map()

        cachedWorkouts.forEach((workout) => {
            const workoutId = getWorkoutId(workout)
            if (!workoutId) return
            map.set(String(workoutId), workout)
        })

        apiWorkouts.forEach((workout) => {
            const workoutId = getWorkoutId(workout)
            if (!workoutId) return
            map.set(String(workoutId), workout)
        })

        return Array.from(map.values()).sort((a, b) => {
            const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime()
            const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime()

            return (Number.isNaN(bDate) ? 0 : bDate) - (Number.isNaN(aDate) ? 0 : aDate)
        })
    }

    const [showAllWorkouts, setShowAllWorkouts] = useState(false)


    useEffect(() => {
        function handleSettingsChanged(event) {
            const updatedSettings = event.detail || getAppSettings()

            setAppSettings(updatedSettings)
            setDefaultSetModel(updatedSettings.defaultSetModel)
            setIsWorkoutsListCollapsed(updatedSettings.collapseWorkoutsByDefault)
        }

        window.addEventListener('forgeflow:settings-changed', handleSettingsChanged)

        return () => {
            window.removeEventListener('forgeflow:settings-changed', handleSettingsChanged)
        }
    }, [])

    useEffect(() => {
        if (!user) return undefined

        let isMounted = true

        async function loadWorkoutsData() {
            setIsLoaded(false)

            const cachedWorkouts = migrateLegacyUserStorageData(user, 'workouts', [])
            const cachedHistory = migrateLegacyUserStorageData(user, 'history', [])
            const savedExercises = migrateLegacyUserStorageData(user, 'exercises', null)
            const savedFolders = migrateLegacyUserStorageData(user, 'folders', [])
            const savedSetModels = migrateLegacyUserStorageData(user, 'set-models', [])
            const draft = getUserStorageData(user, 'workout-draft', null)

            const initialExercises =
                Array.isArray(savedExercises) && savedExercises.length > 0
                    ? savedExercises
                    : getInitialExercises()

            setWorkouts(cachedWorkouts)
            setHistory(cachedHistory)
            setExercises(initialExercises)
            setFolders(savedFolders)
            setCustomSetModels(savedSetModels)

            if (draft) {
                setWorkoutName(draft.workoutName || '')
                setSelectedExercise(draft.selectedExercise || '')
                setSetDescription(draft.setDescription || '')
                setExerciseSets(draft.exerciseSets || [])
                setWorkoutExercises(draft.workoutExercises || [])
                setEditingWorkoutId(draft.editingWorkoutId || null)
                setSelectedFolderId(draft.selectedFolderId || null)
                setDefaultSetModel(
                    draft.defaultSetModel || getAppSettings().defaultSetModel
                )
            }

            setIsLoaded(true)
            setIsSyncingData(true)

            const [workoutsResult, exercisesResult, historyResult] = await Promise.allSettled([
                apiFetch('/workouts'),
                apiFetch('/exercises'),
                apiFetch('/workout-history'),
            ])

            if (!isMounted) return

            const apiWorkouts =
                workoutsResult.status === 'fulfilled' && Array.isArray(workoutsResult.value)
                    ? workoutsResult.value.map(normalizeWorkoutFromApi)
                    : []

            const normalizedWorkouts = mergeWorkoutsFromCacheAndApi(
                cachedWorkouts,
                apiWorkouts
            )

            const normalizedExercises =
                exercisesResult.status === 'fulfilled' && Array.isArray(exercisesResult.value)
                    ? exercisesResult.value.map((exercise) => ({
                        ...exercise,
                        id: exercise._id || exercise.id,
                        isFavorite: Boolean(exercise.isFavorite),
                    }))
                    : []

            const normalizedHistory =
                historyResult.status === 'fulfilled' && Array.isArray(historyResult.value)
                    ? historyResult.value.map(normalizeHistoryFromApi)
                    : cachedHistory


            const mergedExercisesMap = new Map()

            initialExercises.forEach((exercise) => {
                mergedExercisesMap.set(String(exercise.id), {
                    ...exercise,
                    isFavorite: Boolean(exercise.isFavorite),
                })
            })

            normalizedExercises.forEach((exercise) => {
                const originalLocalId = exercise.originalLocalId || exercise.localId

                if (originalLocalId && mergedExercisesMap.has(String(originalLocalId))) {
                    mergedExercisesMap.delete(String(originalLocalId))
                }

                mergedExercisesMap.set(String(exercise.id), exercise)
            })

            const finalExercises = Array.from(mergedExercisesMap.values())

            setWorkouts(normalizedWorkouts)
            setHistory(normalizedHistory)
            setExercises(finalExercises)
            setIsSyncingData(false)

            saveUserStorageData(user, 'workouts', normalizedWorkouts)
            saveUserStorageData(user, 'history', normalizedHistory)
            saveUserStorageData(user, 'exercises', finalExercises)

            const allRequestsFailed = [
                workoutsResult,
                exercisesResult,
                historyResult,
            ].every((result) => result.status === 'rejected')

            if (allRequestsFailed) {
                showToast(
                    'error',
                    'Usando dados locais',
                    'Não foi possível carregar seus treinos do servidor.'
                )
            }
        }

        loadWorkoutsData().catch((error) => {
            console.error(error)

            if (!isMounted) return

            setIsLoaded(true)
            setIsSyncingData(false)

            showToast(
                'error',
                'Usando dados locais',
                'Não foi possível carregar seus treinos do servidor.'
            )
        })

        return () => {
            isMounted = false
        }
    }, [user])

    useEffect(() => {
        if (!isLoaded || !user) return

        saveUserStorageData(user, 'workouts', workouts)
    }, [workouts, isLoaded, user])

    useEffect(() => {
        if (!isLoaded || !user) return

        saveUserStorageData(user, 'folders', folders)
    }, [folders, isLoaded, user])

    useEffect(() => {
        if (!isLoaded || !user) return

        saveUserStorageData(user, 'set-models', customSetModels)
    }, [customSetModels, isLoaded, user])

    useEffect(() => {
        if (!isLoaded || !user) return

        if (!appSettings.autoSaveWorkout) {
            removeUserStorageData(user, 'workout-draft')
            return
        }

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

        saveUserStorageData(user, 'workout-draft', draft)
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
        appSettings.autoSaveWorkout,
        user,
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


    const {
        muscleGroups,
        equipmentList,
        favoriteExercisesCount,
        hasImportedLibrary,
        sortedExercisesForSelect,
        filteredQuickExercises,
        visibleQuickExercises,
        workoutListMetaMap,
        folderWorkoutCounts,
        totalExercisesInSavedWorkouts,
        totalSetsInCurrentWorkout,
        filteredWorkouts,
        visibleWorkouts,
        formatRecentExerciseDate,
    } = useWorkoutDerivedData({
        exercises,
        history,
        workouts,
        workoutExercises,
        quickSearch,
        quickGroupFilter,
        quickEquipmentFilter,
        quickFavoritesOnly,
        selectedFolderId,
        showAllWorkouts,
        workoutsVisibleLimit: appSettings.workoutsVisibleLimit,
    })
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

    function getInitialManualSet(type = 'working') {
        return {
            id: crypto.randomUUID(),
            description: type === 'warmup' ? 'Aquecimento' : '8-12 Rep',
            type,
        }
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
        setQuickFavoritesOnly(false)

        if (user) removeUserStorageData(user, 'workout-draft')
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
            sets: [getInitialManualSet()],
            note: '',
            restTimer: appSettings.defaultRestTimer || 'Desligado',
        }

        setWorkoutExercises([...workoutExercises, newWorkoutExercise])
    }

    function handleAddExercise() {
        if (!selectedExercise) {
            showToast(
                'error',
                'Exercício incompleto',
                'Selecione um exercício antes de adicionar.'
            )
            return
        }

        const exerciseFound = exercises.find((exercise) => exercise.id === selectedExercise)

        if (!exerciseFound) return

        const newWorkoutExercise = {
            id: crypto.randomUUID(),
            exercise: exerciseFound,
            sets: exerciseSets.length > 0 ? exerciseSets : [getInitialManualSet()],
            note: '',
            restTimer: appSettings.defaultRestTimer || 'Desligado',
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


    function handleAddSetToWorkoutExercise(id, type = 'working') {
        setWorkoutExercises(
            workoutExercises.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        sets: [
                            ...item.sets,
                            getInitialManualSet(type),
                        ],
                    }
                    : item
            )
        )
    }

    function handleToggleWorkoutSetWarmup(exerciseId, setId) {
        setWorkoutExercises(
            workoutExercises.map((item) =>
                item.id === exerciseId
                    ? {
                        ...item,
                        sets: item.sets.map((set) =>
                            set.id === setId
                                ? {
                                    ...set,
                                    type: set.type === 'warmup' ? 'working' : 'warmup',
                                    description:
                                        set.type === 'warmup'
                                            ? (set.description === 'Aquecimento' ? '8-12 Rep' : set.description)
                                            : 'Aquecimento',
                                }
                                : set
                        ),
                    }
                    : item
            )
        )
    }

    function handleUpdateWorkoutSetDescription(exerciseId, setId, value) {
        setWorkoutExercises(
            workoutExercises.map((item) =>
                item.id === exerciseId
                    ? {
                        ...item,
                        sets: item.sets.map((set) =>
                            set.id === setId
                                ? {
                                    ...set,
                                    description: value,
                                }
                                : set
                        ),
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

    async function handleSubmit(event) {
        event.preventDefault()


        if (!workoutName.trim() || workoutExercises.length === 0) {
            showToast(
                'error',
                'Treino incompleto',
                'Informe o nome do treino e adicione pelo menos um exercício.'
            )
            return
        }

        try {
            const payload = buildWorkoutPayload()

            if (editingWorkoutId) {
                const updatedWorkoutFromApi = await apiFetch(`/workouts/${editingWorkoutId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                })

                const updatedWorkout = normalizeWorkoutFromApi(updatedWorkoutFromApi)

                setWorkouts(
                    workouts.map((workout) =>
                        getWorkoutId(workout) === editingWorkoutId
                            ? updatedWorkout
                            : workout
                    )
                )

                resetForm()
                setIsBuilderOpen(false)
                showToast('success', 'Treino atualizado', 'As alterações foram salvas no banco.')
                return
            }

            const createdWorkoutFromApi = await apiFetch('/workouts', {
                method: 'POST',
                body: JSON.stringify(payload),
            })

            const createdWorkout = normalizeWorkoutFromApi(createdWorkoutFromApi)

            setWorkouts([createdWorkout, ...workouts])
            resetForm()
            setIsBuilderOpen(false)
            showToast('success', 'Treino criado', 'Sua nova rotina foi salva no banco.')
        } catch (error) {
            console.error(error)

            showToast(
                'error',
                'Erro ao salvar treino',
                error.message || 'Não foi possível salvar o treino no servidor.'
            )
        }
    }

    function handleEditWorkout(workout) {
        setEditingWorkoutId(getWorkoutId(workout))
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
        const workout = workouts.find((item) => getWorkoutId(item) === id)

        setConfirmModal({
            title: 'Excluir treino?',
            description: `O treino "${workout?.name || 'selecionado'}" será removido. Essa ação não pode ser desfeita.`,
            confirmText: 'Excluir',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await apiFetch(`/workouts/${id}`, {
                        method: 'DELETE',
                    })

                    setWorkouts(workouts.filter((workout) => getWorkoutId(workout) !== id))

                    if (editingWorkoutId === id) {
                        resetForm()
                    }

                    setConfirmModal(null)
                    showToast('success', 'Treino excluído', 'A rotina foi removida do banco.')
                } catch (error) {
                    console.error(error)

                    showToast(
                        'error',
                        'Erro ao excluir',
                        error.message || 'Não foi possível excluir o treino.'
                    )
                }
            },
        })
    }

    async function handleToggleFavorite(workout) {
        const workoutId = getWorkoutId(workout)

        try {
            const updatedWorkoutFromApi = await apiFetch(`/workouts/${workoutId}/favorite`, {
                method: 'PATCH',
            })

            const updatedWorkout = normalizeWorkoutFromApi(updatedWorkoutFromApi)

            setWorkouts(
                workouts.map((item) =>
                    getWorkoutId(item) === workoutId ? updatedWorkout : item
                )
            )

            showToast(
                'success',
                updatedWorkout.isFavorite ? 'Favorito adicionado' : 'Favorito removido',
                updatedWorkout.isFavorite
                    ? 'O treino foi marcado como favorito.'
                    : 'O treino foi removido dos favoritos.'
            )
        } catch (error) {
            console.error(error)

            showToast(
                'error',
                'Erro ao favoritar',
                error.message || 'Não foi possível atualizar o favorito.'
            )
        }
    }

    async function handleDuplicateWorkout(workout) {
        try {
            const payload = {
                name: `${workout.name} - cópia`,
                folderId: workout.folderId || null,
                exercises: workout.exercises || [],
            }

            const duplicatedWorkoutFromApi = await apiFetch('/workouts', {
                method: 'POST',
                body: JSON.stringify(payload),
            })

            const duplicatedWorkout = normalizeWorkoutFromApi(duplicatedWorkoutFromApi)

            setWorkouts([duplicatedWorkout, ...workouts])
            showToast('success', 'Treino duplicado', 'Uma cópia foi salva no banco.')
        } catch (error) {
            console.error(error)

            showToast(
                'error',
                'Erro ao duplicar',
                error.message || 'Não foi possível duplicar o treino.'
            )
        }
    }

    function handleToggleWorkout(id) {
        setExpandedWorkoutId(expandedWorkoutId === id ? null : id)
    }

    async function handleStartWorkout(workout) {
        const workoutId = getWorkoutId(workout)

        try {
            if (workoutId) {
                await apiFetch(`/workouts/${workoutId}/start`, {
                    method: 'POST',
                })
            }
        } catch (error) {
            console.error(error)
        }

        startSession(workout)
        navigate('/start-workout')
    }

    return (
        <>
            <WorkoutsHeader
                isSyncingData={isSyncingData}
                onCreateWorkout={openCreateBuilder}
            />

            <WorkoutStatsGrid
                workoutsCount={workouts.length}
                exercisesCount={exercises.length}
                totalExercisesInSavedWorkouts={totalExercisesInSavedWorkouts}
            />

            <WorkoutFolderFilter
                folders={folders}
                folderWorkoutCounts={folderWorkoutCounts}
                selectedFolderId={selectedFolderId}
                workoutsCount={workouts.length}
                onSelectFolder={setSelectedFolderId}
                onCreateFolder={() => setIsFolderModalOpen(true)}
                onDeleteFolder={handleDeleteFolder}
            />

            <section className="mt-6 grid grid-cols-1 gap-4 2xl:grid-cols-3 2xl:gap-6">
                <WorkoutsListSection
                    appSettings={appSettings}
                    expandedWorkoutId={expandedWorkoutId}
                    filteredWorkouts={filteredWorkouts}
                    isCollapsed={isWorkoutsListCollapsed}
                    showAllWorkouts={showAllWorkouts}
                    visibleWorkouts={visibleWorkouts}
                    workoutListMetaMap={workoutListMetaMap}
                    onCreateWorkout={openCreateBuilder}
                    onDeleteWorkout={handleDeleteWorkout}
                    onDuplicateWorkout={handleDuplicateWorkout}
                    onEditWorkout={handleEditWorkout}
                    onStartWorkout={handleStartWorkout}
                    onToggleCollapsed={() => setIsWorkoutsListCollapsed(!isWorkoutsListCollapsed)}
                    onToggleFavorite={handleToggleFavorite}
                    onToggleShowAll={() => setShowAllWorkouts(!showAllWorkouts)}
                    onToggleWorkout={handleToggleWorkout}
                />

                <WorkoutQuickActionsPanel
                    hasImportedLibrary={hasImportedLibrary}
                    totalExercisesInSavedWorkouts={totalExercisesInSavedWorkouts}
                    workoutsCount={workouts.length}
                    onCreateFolder={() => setIsFolderModalOpen(true)}
                    onCreateWorkout={openCreateBuilder}
                    onImportDefaultExercises={handleImportDefaultExercises}
                />
            </section>


            {!isBuilderOpen && (
                <button
                    type="button"
                    onClick={openCreateBuilder}
                    className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-3xl bg-[var(--ff-accent)] text-white shadow-[0_0_28px_var(--ff-accent-shadow)] transition active:scale-95 sm:hidden"
                    aria-label="Criar novo treino"
                >
                    <Plus size={24} />
                </button>
            )}

            {isBuilderOpen && (
                <div className="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain bg-[#050507] pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-0">
                    <div className="mx-auto max-w-[1180px] px-3 py-3 sm:px-4 sm:py-6">
                        <form onSubmit={handleSubmit}>
                            <div className="sticky top-0 z-20 -mx-3 mb-4 border-b border-zinc-900 bg-black/90 px-3 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:mb-6 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
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
                                            <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-accent-text)]
">
                                                {editingWorkoutId ? 'Editar rotina' : 'Nova rotina'}
                                            </p>

                                            <h1 className="truncate text-2xl font-black sm:text-3xl">
                                                {editingWorkoutId ? 'Editar treino' : 'Criar treino'}
                                            </h1>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">

                                        <button
                                            type="submit"
                                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-5 text-sm font-bold text-white transition hover:bg-[var(--ff-accent-hover)] sm:w-auto"
                                        >
                                            <Save size={18} />
                                            Salvar treino
                                        </button>
                                    </div>
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
                                                            className="text-xs font-bold text-[var(--ff-accent-text)]
 transition hover:text-[var(--ff-accent-text)]
"
                                                        >
                                                            + Criar pasta
                                                        </button>
                                                    </div>

                                                    <select
                                                        value={selectedFolderId || ''}
                                                        onChange={(event) => setSelectedFolderId(event.target.value || null)}
                                                        className="h-12 w-full rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-sm font-bold text-white outline-none transition hover:border-zinc-700 focus:border-[var(--ff-accent-border)] focus:ring-2 focus:ring-violet-500/10"
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
                                                            loading="lazy"
                                                            decoding="async"
                                                        />
                                                    ) : (
                                                        <Dumbbell size={26} className="text-zinc-900" />
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--ff-accent-soft)]/10 text-xs font-bold text-[var(--ff-accent-text)]
">
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

                                                                <div className="min-w-0 space-y-2">
                                                                    <input
                                                                        type="text"
                                                                        value={set.description}
                                                                        onChange={(event) =>
                                                                            handleUpdateWorkoutSetDescription(
                                                                                item.id,
                                                                                set.id,
                                                                                event.target.value
                                                                            )
                                                                        }
                                                                        className="h-10 w-full rounded-xl border border-zinc-800 bg-[#18181b] px-3 text-sm font-bold text-white outline-none transition hover:border-[var(--ff-accent-border)]/40 focus:border-[var(--ff-accent-border)]"
                                                                        placeholder="Ex: 8-12 Rep"
                                                                    />

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleToggleWorkoutSetWarmup(item.id, set.id)}
                                                                        className={isWarmup
                                                                            ? 'rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black text-amber-200'
                                                                            : 'rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-[10px] font-black text-zinc-500'}
                                                                    >
                                                                        {isWarmup ? 'AQUECIMENTO' : 'NORMAL'}
                                                                    </button>
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

                                            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddSetToWorkoutExercise(item.id)}
                                                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-800 text-sm font-bold transition hover:bg-zinc-700"
                                                >
                                                    <Plus size={18} />
                                                    Série
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleAddSetToWorkoutExercise(item.id, 'warmup')}
                                                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/25 bg-amber-500/10 text-sm font-bold text-amber-200 transition hover:bg-amber-500/15"
                                                >
                                                    <Flame size={18} />
                                                    Aquecimento
                                                </button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                <div className="space-y-6 xl:col-span-2">
                                    <Card>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-xl font-bold">Resumo</h2>

                                                <div className="mt-4 grid grid-cols-3 gap-4">
                                                    <div>
                                                        <p className="text-xs text-zinc-500">Exercícios</p>
                                                        <p className="mt-1 text-xl font-bold text-[var(--ff-accent-text)]
">
                                                            {workoutExercises.length}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-zinc-500">Total de séries</p>
                                                        <p className="mt-1 text-xl font-bold">
                                                            {totalSetsInCurrentWorkout}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-zinc-500">Favoritos</p>
                                                        <p className="mt-1 text-xl font-bold text-yellow-300">
                                                            {favoriteExercisesCount}
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
                                                    className="text-xs font-bold text-[var(--ff-accent-text)]
 transition hover:text-[var(--ff-accent-text)]
"
                                                >
                                                    + Criar modelo
                                                </button>
                                            </div>

                                            <select
                                                value={defaultSetModel}
                                                onChange={(event) => setDefaultSetModel(event.target.value)}
                                                className="h-12 w-full rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-sm font-bold text-white outline-none transition hover:border-zinc-700 focus:border-[var(--ff-accent-border)] focus:ring-2 focus:ring-violet-500/10"
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
                                                    Favoritos e exercícios recentes aparecem primeiro para montar treinos mais rápido.
                                                </p>

                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <Badge>
                                                        {filteredQuickExercises.length} encontrados
                                                    </Badge>

                                                    {filteredQuickExercises.length > visibleQuickExercises.length && (
                                                        <Badge>
                                                            exibindo {visibleQuickExercises.length}
                                                        </Badge>
                                                    )}

                                                    {favoriteExercisesCount > 0 && (
                                                        <Badge>
                                                            ⭐ {favoriteExercisesCount} favoritos
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsBuilderOpen(false)
                                                    navigate('/exercises')
                                                }}
                                                className="inline-flex items-center gap-2 text-sm font-bold text-[var(--ff-accent-text)]
 transition hover:text-[var(--ff-accent-text)]
"
                                            >
                                                <Plus size={18} />
                                                Cadastrar
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            <button
                                                type="button"
                                                onClick={() => setQuickFavoritesOnly((current) => !current)}
                                                className={
                                                    quickFavoritesOnly
                                                        ? 'flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-sm font-bold text-yellow-300 transition hover:bg-yellow-500/20'
                                                        : 'flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 text-sm font-bold text-zinc-300 transition hover:border-yellow-500/30 hover:text-yellow-300'
                                                }
                                            >
                                                <Star
                                                    size={17}
                                                    fill={quickFavoritesOnly ? 'currentColor' : 'none'}
                                                />
                                                Somente favoritos
                                            </button>
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

                                            {visibleQuickExercises.map((exercise) => {
                                                const alreadyAdded = isExerciseAlreadyAdded(exercise.id)
                                                const recentInfo = exercise.__recentInfo

                                                return (
                                                    <button
                                                        key={exercise.id}
                                                        type="button"
                                                        onClick={() => handleQuickAddExercise(exercise.id)}
                                                        className={
                                                            exercise.isFavorite
                                                                ? 'flex w-full items-center gap-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-left transition hover:bg-yellow-500/10'
                                                                : 'flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-zinc-900'
                                                        }
                                                    >
                                                        <span
                                                            className={
                                                                alreadyAdded
                                                                    ? 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white'
                                                                    : 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ff-accent)] text-white'
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
                                                                    decoding="async"
                                                                />
                                                            ) : (
                                                                <Dumbbell size={24} className="text-zinc-900" />
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="truncate font-bold">
                                                                    {exercise.name}
                                                                </p>

                                                                {exercise.isFavorite && (
                                                                    <span className="shrink-0 text-yellow-300">
                                                                        ⭐
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <p className="text-sm text-zinc-500">
                                                                {exercise.muscleGroup}
                                                            </p>

                                                            <div className="mt-1 flex flex-wrap gap-1.5">
                                                                {exercise.isFavorite && (
                                                                    <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
                                                                        ⭐ Favorito
                                                                    </span>
                                                                )}

                                                                {recentInfo?.lastUsedAt && (
                                                                    <span className="rounded-full bg-[var(--ff-accent-soft)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--ff-accent-text)]">
                                                                        Recente • {formatRecentExerciseDate(recentInfo.lastUsedAt)}
                                                                    </span>
                                                                )}
                                                            </div>
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

                                                    {sortedExercisesForSelect.map((exercise) => (
                                                            <option key={exercise.id} value={exercise.id}>
                                                                {exercise.isFavorite ? '⭐ ' : ''}{exercise.name}
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

                            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-800 bg-black/90 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl sm:hidden">
                                <div className="grid grid-cols-[48px_1fr] gap-2">
                                    <button
                                        type="button"
                                        onClick={closeBuilder}
                                        className="flex h-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-300 transition active:scale-95"
                                        aria-label="Fechar criação de treino"
                                    >
                                        <X size={20} />
                                    </button>

                                    <button
                                        type="submit"
                                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-5 text-sm font-black text-white shadow-[0_0_20px_var(--ff-accent-shadow)] transition active:scale-[0.98]"
                                    >
                                        <Save size={18} />
                                        Salvar treino
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isFolderModalOpen && (
                <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/80 px-3 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm sm:items-center sm:px-4">
                    <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-t-3xl border border-zinc-800 bg-[#121212] p-6 shadow-2xl shadow-[0_0_20px_var(--ff-accent-shadow)] sm:rounded-3xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-bold text-[var(--ff-accent-text)]
">Nova pasta</p>

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
                <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/80 px-3 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm sm:items-center sm:px-4">
                    <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-zinc-800 bg-[#121212] p-6 shadow-2xl shadow-[0_0_20px_var(--ff-accent-shadow)] sm:rounded-3xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-bold text-[var(--ff-accent-text)]
">
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