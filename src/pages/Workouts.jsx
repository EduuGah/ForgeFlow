import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

import { getAppSettings } from '../utils/settingsUtils'
import { getInitialExercises } from '../utils/exerciseStorage'

import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'

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
import WorkoutBuilderModal from '../features/workouts/components/WorkoutBuilderModal'
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

            <WorkoutBuilderModal
                isOpen={isBuilderOpen}
                editingWorkoutId={editingWorkoutId}
                workoutName={workoutName}
                setWorkoutName={setWorkoutName}
                selectedFolderId={selectedFolderId}
                setSelectedFolderId={setSelectedFolderId}
                folders={folders}
                defaultSetModel={defaultSetModel}
                setDefaultSetModel={setDefaultSetModel}
                customSetModels={customSetModels}
                workoutExercises={workoutExercises}
                totalSetsInCurrentWorkout={totalSetsInCurrentWorkout}
                quickFavoritesOnly={quickFavoritesOnly}
                setQuickFavoritesOnly={setQuickFavoritesOnly}
                quickEquipmentFilter={quickEquipmentFilter}
                setQuickEquipmentFilter={setQuickEquipmentFilter}
                equipmentList={equipmentList}
                quickGroupFilter={quickGroupFilter}
                setQuickGroupFilter={setQuickGroupFilter}
                muscleGroups={muscleGroups}
                quickSearch={quickSearch}
                setQuickSearch={setQuickSearch}
                filteredQuickExercises={filteredQuickExercises}
                visibleQuickExercises={visibleQuickExercises}
                favoriteExercisesCount={favoriteExercisesCount}
                selectedExercise={selectedExercise}
                setSelectedExercise={setSelectedExercise}
                sortedExercisesForSelect={sortedExercisesForSelect}
                setDescription={setDescription}
                setSetDescription={setSetDescription}
                exerciseSets={exerciseSets}
                handleSubmit={handleSubmit}
                closeBuilder={closeBuilder}
                setIsFolderModalOpen={setIsFolderModalOpen}
                setIsSetModelModalOpen={setIsSetModelModalOpen}
                handleDeleteSetModel={handleDeleteSetModel}
                handleUpdateExerciseNote={handleUpdateExerciseNote}
                handleUpdateWorkoutSetDescription={handleUpdateWorkoutSetDescription}
                handleRemoveExercise={handleRemoveExercise}
                handleAddSetToWorkoutExercise={handleAddSetToWorkoutExercise}
                handleToggleWorkoutSetWarmup={handleToggleWorkoutSetWarmup}
                handleRemoveSetFromWorkoutExercise={handleRemoveSetFromWorkoutExercise}
                isExerciseAlreadyAdded={isExerciseAlreadyAdded}
                formatRecentExerciseDate={formatRecentExerciseDate}
                handleQuickAddExercise={handleQuickAddExercise}
                handleAddSet={handleAddSet}
                handleDefaultSets={handleDefaultSets}
                handleAddExercise={handleAddExercise}
                handleRemoveSet={handleRemoveSet}
                onGoToExercises={() => {
                    setIsBuilderOpen(false)
                    navigate('/exercises')
                }}
            />

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