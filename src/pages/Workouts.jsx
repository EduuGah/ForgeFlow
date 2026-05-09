import { useDeferredValue, useEffect, useMemo, useState } from 'react'
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
    Star,
    Trash2,
    X,
} from 'lucide-react'

import { getAppSettings } from '../utils/settingsUtils'
import { getInitialExercises } from '../utils/exerciseStorage'

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
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import {
    getUserStorageData,
    saveUserStorageData,
    removeUserStorageData,
} from '../utils/userStorage'

import defaultExercises from '../data/defaultExercises'

const MAX_QUICK_EXERCISES_VISIBLE = 80

function getComparableDateValue(item) {
    const date = new Date(item?.updatedAt || item?.createdAt || 0)

    return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function normalizeSearchText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
}

function Workouts() {
    const [workouts, setWorkouts] = useState([])
    const [exercises, setExercises] = useState([])
    const [history, setHistory] = useState([])
    const [workoutTemplates, setWorkoutTemplates] = useState([])

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
    const [isWorkoutsListCollapsed, setIsWorkoutsListCollapsed] = useState(
        getAppSettings().collapseWorkoutsByDefault
    )

    const [expandedWorkoutId, setExpandedWorkoutId] = useState(null)
    const [editingWorkoutId, setEditingWorkoutId] = useState(null)
    const [editingTemplateId, setEditingTemplateId] = useState(null)
    const [builderMode, setBuilderMode] = useState('workout')
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

    function getWorkoutId(workout) {
        return workout?._id || workout?.id
    }

    function normalizeHistoryFromApi(session) {
        return {
            ...session,
            id: session._id || session.id,
            duration: session.durationSeconds ?? session.duration ?? 0,
            workoutName: session.workoutName || session.name || 'Treino',
            exercises: Array.isArray(session.exercises) ? session.exercises : [],
            finishedAt: session.finishedAt || session.createdAt,
        }
    }

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

    function normalizeWorkoutTemplateFromApi(template) {
        return {
            ...template,
            id: template._id || template.id,
            exercises: Array.isArray(template.exercises) ? template.exercises : [],
            isFavorite: Boolean(template.isFavorite),
        }
    }

    function normalizeWorkoutFromApi(workout) {
        return {
            ...workout,
            id: workout._id || workout.id,
            folderId: workout.folderId || null,
            exercises: Array.isArray(workout.exercises) ? workout.exercises : [],
        }
    }

    function buildWorkoutPayload() {
        return {
            name: workoutName.trim(),
            folderId: selectedFolderId,
            exercises: workoutExercises,
        }
    }

    const [showAllWorkouts, setShowAllWorkouts] = useState(false)


    const SMART_DEFAULT_TEMPLATE_BLUEPRINTS = [
        {
            kind: 'push',
            name: 'Push - Peito, Ombros e Tríceps',
            description: 'Treino pronto de empurrar com exercícios para peito, ombros e tríceps.',
            category: 'Push Pull Legs',
            goal: 'Hipertrofia',
            difficulty: 'Intermediário',
            estimatedDuration: 60,
            groups: ['Peito', 'Peito', 'Ombros', 'Ombros', 'Tríceps', 'Tríceps'],
            fallbackKeywords: ['supino', 'peito', 'chest', 'desenvolvimento', 'ombro', 'triceps', 'tríceps'],
            limit: 6,
        },
        {
            kind: 'pull',
            name: 'Pull - Costas e Bíceps',
            description: 'Treino pronto de puxar com exercícios para costas, bíceps e posterior de ombro.',
            category: 'Push Pull Legs',
            goal: 'Hipertrofia',
            difficulty: 'Intermediário',
            estimatedDuration: 60,
            groups: ['Costas', 'Costas', 'Costas', 'Bíceps', 'Bíceps', 'Ombros'],
            fallbackKeywords: ['puxada', 'remada', 'costas', 'back', 'rosca', 'bíceps', 'biceps', 'face pull'],
            limit: 6,
        },
        {
            kind: 'legs',
            name: 'Legs - Pernas completo',
            description: 'Treino pronto de pernas com foco em quadríceps, posterior, glúteos e panturrilhas.',
            category: 'Push Pull Legs',
            goal: 'Hipertrofia',
            difficulty: 'Intermediário',
            estimatedDuration: 70,
            groups: ['Quadríceps', 'Quadríceps', 'Posterior de coxa', 'Glúteos', 'Panturrilhas', 'Abdômen'],
            fallbackKeywords: ['agachamento', 'leg press', 'cadeira', 'mesa', 'posterior', 'panturrilha', 'gluteo', 'glúteo', 'perna'],
            limit: 6,
        },
        {
            kind: 'upper',
            name: 'Upper - Superiores',
            description: 'Treino pronto para membros superiores em divisão Upper/Lower.',
            category: 'Upper Lower',
            goal: 'Força e hipertrofia',
            difficulty: 'Intermediário',
            estimatedDuration: 65,
            groups: ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps'],
            fallbackKeywords: ['supino', 'puxada', 'remada', 'desenvolvimento', 'rosca', 'triceps', 'tríceps'],
            limit: 5,
        },
        {
            kind: 'lower',
            name: 'Lower - Inferiores',
            description: 'Treino pronto para membros inferiores em divisão Upper/Lower.',
            category: 'Upper Lower',
            goal: 'Força e hipertrofia',
            difficulty: 'Intermediário',
            estimatedDuration: 65,
            groups: ['Quadríceps', 'Posterior de coxa', 'Glúteos', 'Panturrilhas', 'Abdômen'],
            fallbackKeywords: ['agachamento', 'leg press', 'posterior', 'panturrilha', 'gluteo', 'glúteo', 'abdomen', 'abdômen'],
            limit: 5,
        },
        {
            kind: 'full-body',
            name: 'Full Body - Corpo inteiro',
            description: 'Treino pronto de corpo inteiro misturando os principais grupos musculares.',
            category: 'Full Body',
            goal: 'Condicionamento geral',
            difficulty: 'Iniciante',
            estimatedDuration: 50,
            groups: ['Peito', 'Costas', 'Quadríceps', 'Ombros', 'Abdômen'],
            fallbackKeywords: ['supino', 'remada', 'agachamento', 'desenvolvimento', 'prancha', 'abdomen', 'abdômen'],
            limit: 5,
        },
    ]

    function normalizeSmartText(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
    }

    function normalizeSmartGroup(group) {
        const normalized = normalizeSmartText(group)

        const aliases = {
            peito: 'peito',
            peitoral: 'peito',
            chest: 'peito',
            costas: 'costas',
            dorsal: 'costas',
            back: 'costas',
            ombro: 'ombros',
            ombros: 'ombros',
            deltoide: 'ombros',
            deltoides: 'ombros',
            shoulder: 'ombros',
            shoulders: 'ombros',
            biceps: 'bíceps',
            triceps: 'tríceps',
            quadriceps: 'quadríceps',
            pernas: 'quadríceps',
            perna: 'quadríceps',
            quads: 'quadríceps',
            posterior: 'posterior de coxa',
            posteriores: 'posterior de coxa',
            hamstrings: 'posterior de coxa',
            posterior_de_coxa: 'posterior de coxa',
            gluteos: 'glúteos',
            glutes: 'glúteos',
            panturrilha: 'panturrilhas',
            panturrilhas: 'panturrilhas',
            calves: 'panturrilhas',
            abdomen: 'abdômen',
            abdomem: 'abdômen',
            abdome: 'abdômen',
            abs: 'abdômen',
            core: 'abdômen',
            lombar: 'lombar',
            lowerback: 'lombar',
            cardio: 'cardio',
            corpo_inteiro: 'corpo inteiro',
            fullbody: 'corpo inteiro',
        }

        return aliases[normalized.replace(/\s+/g, '_')] || aliases[normalized] || normalized
    }

    function getSmartExerciseGroup(exercise) {
        return normalizeSmartGroup(
            exercise?.muscleGroup ||
            exercise?.normalizedGroup ||
            exercise?.group ||
            exercise?.targetMuscle ||
            exercise?.bodyPart
        )
    }

    function getSmartTemplateKind(templateName) {
        const name = normalizeSmartText(templateName)

        if (name.includes('push')) return 'push'
        if (name.includes('pull')) return 'pull'
        if (name.includes('legs')) return 'legs'
        if (name.includes('upper')) return 'upper'
        if (name.includes('lower')) return 'lower'
        if (name.includes('full body') || name.includes('corpo inteiro')) return 'full-body'

        return ''
    }

    function getExerciseUniqueKey(exercise) {
        return String(
            exercise?._id ||
            exercise?.id ||
            `${exercise?.name || ''}-${exercise?.muscleGroup || ''}-${exercise?.equipment || ''}`
        )
    }

    function normalizeExerciseForTemplate(exercise) {
        const id = exercise?._id || exercise?.id || crypto.randomUUID()

        return {
            ...exercise,
            id: String(id),
            _id: exercise?._id,
            isFavorite: Boolean(exercise?.isFavorite),
        }
    }

    function createSmartTemplateExerciseItem(exercise) {
        return {
            id: crypto.randomUUID(),
            exercise: normalizeExerciseForTemplate(exercise),
            sets: ['12 Rep', '10-12 Rep', '8-10 Rep'].map((description) => ({
                id: crypto.randomUUID(),
                description,
                type: 'working',
            })),
            note: '',
            restTimer: appSettings.defaultRestTimer || 'Desligado',
        }
    }

    function buildSmartExerciseLibrary() {
        const map = new Map()
        const localDefaults = Array.isArray(defaultExercises) ? defaultExercises : []

        ;[...exercises, ...localDefaults].forEach((exercise) => {
            if (!exercise?.name) return

            const key = getExerciseUniqueKey(exercise)

            if (!map.has(key)) {
                map.set(key, normalizeExerciseForTemplate(exercise))
            }
        })

        return Array.from(map.values())
    }

    function pickSmartExercisesForTemplate(blueprint, library) {
        const selected = []
        const usedKeys = new Set()
        const targetGroups = blueprint.groups.map(normalizeSmartGroup)

        function addExercise(exercise) {
            if (!exercise || selected.length >= blueprint.limit) return

            const key = getExerciseUniqueKey(exercise)

            if (usedKeys.has(key)) return

            usedKeys.add(key)
            selected.push(exercise)
        }

        targetGroups.forEach((group) => {
            const found = library.find((exercise) => {
                return !usedKeys.has(getExerciseUniqueKey(exercise)) && getSmartExerciseGroup(exercise) === group
            })

            addExercise(found)
        })

        if (selected.length < blueprint.limit) {
            const keywords = blueprint.fallbackKeywords.map(normalizeSmartText)

            library.forEach((exercise) => {
                if (selected.length >= blueprint.limit) return
                if (usedKeys.has(getExerciseUniqueKey(exercise))) return

                const searchable = normalizeSmartText(
                    `${exercise.name} ${exercise.originalName || ''} ${exercise.muscleGroup || ''} ${exercise.targetMuscle || ''} ${exercise.equipment || ''}`
                )

                if (keywords.some((keyword) => searchable.includes(keyword))) {
                    addExercise(exercise)
                }
            })
        }

        if (selected.length < blueprint.limit) {
            library.forEach((exercise) => {
                if (selected.length >= blueprint.limit) return
                addExercise(exercise)
            })
        }

        return selected.slice(0, blueprint.limit)
    }

    function buildSmartDefaultTemplatePayloads() {
        const library = buildSmartExerciseLibrary()

        return SMART_DEFAULT_TEMPLATE_BLUEPRINTS.map((blueprint) => ({
            kind: blueprint.kind,
            name: blueprint.name,
            description: blueprint.description,
            category: blueprint.category,
            goal: blueprint.goal,
            difficulty: blueprint.difficulty,
            estimatedDuration: blueprint.estimatedDuration,
            source: 'ForgeFlow',
            exercises: pickSmartExercisesForTemplate(blueprint, library).map(createSmartTemplateExerciseItem),
        }))
    }

    useEffect(() => {
        const settings = getAppSettings()

        setAppSettings(settings)
        setDefaultSetModel(settings.defaultSetModel)
        setIsWorkoutsListCollapsed(settings.collapseWorkoutsByDefault)
    }, [])

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

            const cachedWorkouts = getUserStorageData(user, 'workouts', [])
            const cachedHistory = getUserStorageData(user, 'history', [])
            const savedExercises = getUserStorageData(user, 'exercises', null)
            const cachedTemplates = getUserStorageData(user, 'workout-templates', [])
            const savedFolders = getUserStorageData(user, 'folders', [])
            const savedSetModels = getUserStorageData(user, 'set-models', [])
            const draft = getUserStorageData(user, 'workout-draft', null)

            const initialExercises =
                Array.isArray(savedExercises) && savedExercises.length > 0
                    ? savedExercises
                    : getInitialExercises()

            setWorkouts(cachedWorkouts)
            setHistory(cachedHistory)
            setExercises(initialExercises)
            setWorkoutTemplates(cachedTemplates)
            setFolders(savedFolders)
            setCustomSetModels(savedSetModels)

            if (draft) {
                setWorkoutName(draft.workoutName || '')
                setSelectedExercise(draft.selectedExercise || '')
                setSetDescription(draft.setDescription || '')
                setExerciseSets(draft.exerciseSets || [])
                setWorkoutExercises(draft.workoutExercises || [])
                setEditingWorkoutId(draft.editingWorkoutId || null)
                setEditingTemplateId(draft.editingTemplateId || null)
                setBuilderMode(draft.builderMode || 'workout')
                setSelectedFolderId(draft.selectedFolderId || null)
                setDefaultSetModel(
                    draft.defaultSetModel || getAppSettings().defaultSetModel
                )
            }

            setIsLoaded(true)
            setIsSyncingData(true)

            const [workoutsResult, exercisesResult, historyResult, templatesResult] = await Promise.allSettled([
                apiFetch('/workouts'),
                apiFetch('/exercises'),
                apiFetch('/workout-history'),
                apiFetch('/workout-templates'),
            ])

            if (!isMounted) return

            const normalizedWorkouts =
                workoutsResult.status === 'fulfilled' && Array.isArray(workoutsResult.value)
                    ? workoutsResult.value.map(normalizeWorkoutFromApi)
                    : cachedWorkouts

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

            const normalizedTemplates =
                templatesResult.status === 'fulfilled' && Array.isArray(templatesResult.value)
                    ? templatesResult.value.map(normalizeWorkoutTemplateFromApi)
                    : cachedTemplates

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
            setWorkoutTemplates(normalizedTemplates)
            setIsSyncingData(false)

            saveUserStorageData(user, 'workouts', normalizedWorkouts)
            saveUserStorageData(user, 'history', normalizedHistory)
            saveUserStorageData(user, 'exercises', finalExercises)
            saveUserStorageData(user, 'workout-templates', normalizedTemplates)

            const allRequestsFailed = [
                workoutsResult,
                exercisesResult,
                historyResult,
                templatesResult,
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
            editingTemplateId,
            builderMode,
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
        editingTemplateId,
        builderMode,
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

    useEffect(() => {
        if (!isLoaded || !user) return

        saveUserStorageData(user, 'workout-templates', workoutTemplates)
    }, [workoutTemplates, isLoaded, user])

    const exerciseLibraryStats = useMemo(() => {
        const groups = new Set()
        const equipment = new Set()
        let favorites = 0
        let hasForgeFlowSource = false

        exercises.forEach((exercise) => {
            if (exercise.muscleGroup) groups.add(exercise.muscleGroup)
            if (exercise.equipment) equipment.add(exercise.equipment)
            if (exercise.isFavorite) favorites += 1
            if (exercise.source === 'ForgeFlow') hasForgeFlowSource = true
        })

        return {
            muscleGroups: Array.from(groups).sort(),
            equipmentList: Array.from(equipment).sort(),
            favoriteExercisesCount: favorites,
            hasImportedLibrary: hasForgeFlowSource,
        }
    }, [exercises])

    const {
        muscleGroups,
        equipmentList,
        favoriteExercisesCount,
        hasImportedLibrary,
    } = exerciseLibraryStats

    const sortedWorkoutTemplates = useMemo(() => {
        return workoutTemplates
            .slice()
            .sort((a, b) => {
                if (a.isFavorite && !b.isFavorite) return -1
                if (!a.isFavorite && b.isFavorite) return 1

                return getComparableDateValue(b) - getComparableDateValue(a)
            })
    }, [workoutTemplates])


    const hasEmptyDefaultTemplates = useMemo(() => {
        return workoutTemplates.some((template) => {
            return (
                template.source === 'ForgeFlow' &&
                (!template.exercises || template.exercises.length === 0)
            )
        })
    }, [workoutTemplates])


    const hasDefaultTemplates = useMemo(() => {
        return workoutTemplates.some((template) => template.source === 'ForgeFlow')
    }, [workoutTemplates])

    const recentExerciseMap = useMemo(() => {
        const map = new Map()

        history.forEach((session) => {
            const finishedAt = session.finishedAt || session.createdAt

            session.exercises?.forEach((item) => {
                const exercise = item.exercise

                if (!exercise?.name) return

                const key = String(exercise.id || exercise._id || exercise.name)
                const current = map.get(key)

                const totalUses = (current?.totalUses || 0) + 1
                const currentDate = current?.lastUsedAt
                    ? new Date(current.lastUsedAt)
                    : null
                const nextDate = finishedAt ? new Date(finishedAt) : null

                map.set(key, {
                    totalUses,
                    lastUsedAt:
                        !currentDate || (nextDate && nextDate > currentDate)
                            ? finishedAt
                            : current?.lastUsedAt,
                })

                const nameKey = String(exercise.name).toLowerCase()
                const currentByName = map.get(nameKey)

                map.set(nameKey, {
                    totalUses: (currentByName?.totalUses || 0) + 1,
                    lastUsedAt:
                        !currentByName?.lastUsedAt ||
                            (nextDate && nextDate > new Date(currentByName.lastUsedAt))
                            ? finishedAt
                            : currentByName.lastUsedAt,
                })
            })
        })

        return map
    }, [history])

    function getRecentExerciseInfo(exercise) {
        const byId = recentExerciseMap.get(String(exercise.id || exercise._id))
        const byName = recentExerciseMap.get(String(exercise.name || '').toLowerCase())

        return byId || byName || null
    }

    function formatRecentExerciseDate(dateString) {
        if (!dateString) return ''

        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
        })
    }

    const deferredQuickSearch = useDeferredValue(quickSearch)

    const indexedExercises = useMemo(() => {
        return exercises.map((exercise) => {
            const recentInfo = getRecentExerciseInfo(exercise)
            const recentTime = recentInfo?.lastUsedAt
                ? new Date(recentInfo.lastUsedAt).getTime()
                : 0

            return {
                ...exercise,
                __recentInfo: recentInfo,
                __recentTime: Number.isNaN(recentTime) ? 0 : recentTime,
                __searchText: normalizeSearchText(
                    `${exercise.name} ${exercise.muscleGroup} ${exercise.equipment} ${exercise.originalName || ''}`
                ),
                __sortName: String(exercise.name || '').toLocaleLowerCase('pt-BR'),
            }
        })
    }, [exercises, recentExerciseMap])

    const sortedExercisesForSelect = useMemo(() => {
        return indexedExercises
            .slice()
            .sort((a, b) => {
                if (a.isFavorite && !b.isFavorite) return -1
                if (!a.isFavorite && b.isFavorite) return 1

                return a.__sortName.localeCompare(b.__sortName, 'pt-BR')
            })
    }, [indexedExercises])

    const filteredQuickExercises = useMemo(() => {
        const normalizedSearch = normalizeSearchText(deferredQuickSearch)

        return indexedExercises
            .filter((exercise) => {
                const matchesSearch = normalizedSearch
                    ? exercise.__searchText.includes(normalizedSearch)
                    : true

                const matchesGroup = quickGroupFilter
                    ? exercise.muscleGroup === quickGroupFilter
                    : true

                const matchesEquipment = quickEquipmentFilter
                    ? exercise.equipment === quickEquipmentFilter
                    : true

                const matchesFavorite = quickFavoritesOnly
                    ? exercise.isFavorite === true
                    : true

                return (
                    matchesSearch &&
                    matchesGroup &&
                    matchesEquipment &&
                    matchesFavorite
                )
            })
            .sort((a, b) => {
                if (a.isFavorite && !b.isFavorite) return -1
                if (!a.isFavorite && b.isFavorite) return 1

                if (a.__recentTime !== b.__recentTime) {
                    return b.__recentTime - a.__recentTime
                }

                return a.__sortName.localeCompare(b.__sortName, 'pt-BR')
            })
    }, [
        indexedExercises,
        deferredQuickSearch,
        quickGroupFilter,
        quickEquipmentFilter,
        quickFavoritesOnly,
    ])

    const visibleQuickExercises = useMemo(() => {
        return filteredQuickExercises.slice(0, MAX_QUICK_EXERCISES_VISIBLE)
    }, [filteredQuickExercises])

    const workoutListMetaMap = useMemo(() => {
        const map = new Map()

        workouts.forEach((workout) => {
            const workoutId = getWorkoutId(workout)
            const groups = new Set()
            const exerciseNames = []

            ;(workout.exercises || []).forEach((item) => {
                const exercise = item.exercise || {}

                if (exercise.muscleGroup) groups.add(exercise.muscleGroup)
                if (exercise.name) {
                    exerciseNames.push(`${exercise.name} (${exercise.equipment || 'sem equipamento'})`)
                }
            })

            map.set(workoutId, {
                muscleGroups: Array.from(groups),
                exerciseNames: exerciseNames.join(', '),
            })
        })

        return map
    }, [workouts])

    const folderWorkoutCounts = useMemo(() => {
        const counts = new Map()

        workouts.forEach((workout) => {
            if (!workout.folderId) return

            counts.set(workout.folderId, (counts.get(workout.folderId) || 0) + 1)
        })

        return counts
    }, [workouts])

    const totalExercisesInSavedWorkouts = useMemo(() => {
        return workouts.reduce((total, workout) => total + (workout.exercises?.length || 0), 0)
    }, [workouts])

    const totalSetsInCurrentWorkout = useMemo(() => {
        return workoutExercises.reduce((total, item) => total + (item.sets?.length || 0), 0)
    }, [workoutExercises])

    const filteredWorkouts = useMemo(() => {
        return workouts
            .filter((workout) =>
                selectedFolderId ? workout.folderId === selectedFolderId : true
            )
            .sort((a, b) => {
                if (a.isFavorite && !b.isFavorite) return -1
                if (!a.isFavorite && b.isFavorite) return 1

                return getComparableDateValue(b) - getComparableDateValue(a)
            })
    }, [workouts, selectedFolderId])

    const visibleWorkouts = useMemo(() => {
        const limit = Number(appSettings.workoutsVisibleLimit) || 5

        if (showAllWorkouts) return filteredWorkouts

        return filteredWorkouts.slice(0, limit)
    }, [filteredWorkouts, showAllWorkouts, appSettings.workoutsVisibleLimit])

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
        setEditingTemplateId(null)
        setBuilderMode('workout')
        setSelectedFolderId(null)
        setQuickSearch('')
        setQuickGroupFilter('')
        setQuickEquipmentFilter('')
        setQuickFavoritesOnly(false)

        if (user) removeUserStorageData(user, 'workout-draft')
    }

    function openCreateBuilder() {
        resetForm()
        setBuilderMode('workout')
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
            restTimer: appSettings.defaultRestTimer || 'Desligado',
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

    async function handleSubmit(event) {
        event.preventDefault()

        if (builderMode === 'template') {
            await handleSubmitTemplate()
            return
        }

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
        setBuilderMode('workout')
        setEditingTemplateId(null)
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

    function handleEditTemplate(template) {
        setBuilderMode('template')
        setEditingTemplateId(template.id)
        setEditingWorkoutId(null)
        setWorkoutName(template.name || '')
        setWorkoutExercises(template.exercises || [])
        setSelectedFolderId(null)
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

    async function handleSeedDefaultTemplates() {
        try {
            const result = await apiFetch('/workout-templates/seed-defaults', {
                method: 'POST',
            })

            const templatesFromApi = Array.isArray(result?.templates)
                ? result.templates.map(normalizeWorkoutTemplateFromApi)
                : []

            setWorkoutTemplates(templatesFromApi)
            saveUserStorageData(user, 'workout-templates', templatesFromApi)

            showToast(
                'success',
                'Templates criados',
                result?.message || 'Templates padrão adicionados.'
            )
        } catch (error) {
            console.error(error)

            showToast(
                'error',
                'Erro ao criar templates',
                error.message || 'Não foi possível criar os templates padrão.'
            )
        }
    }


    async function handleRebuildDefaultTemplates() {
        const templatePayloads = buildSmartDefaultTemplatePayloads()
        const totalExercisesSuggested = templatePayloads.reduce(
            (total, template) => total + template.exercises.length,
            0
        )

        if (totalExercisesSuggested === 0) {
            showToast(
                'error',
                'Biblioteca vazia',
                'Importe ou cadastre exercícios antes de criar templates prontos.'
            )
            return
        }

        try {
            for (const payload of templatePayloads) {
                const existingTemplate = workoutTemplates.find((template) => {
                    return (
                        template.source === 'ForgeFlow' &&
                        getSmartTemplateKind(template.name) === payload.kind
                    )
                })

                const body = JSON.stringify({
                    name: payload.name,
                    description: payload.description,
                    category: payload.category,
                    goal: payload.goal,
                    difficulty: payload.difficulty,
                    estimatedDuration: payload.estimatedDuration,
                    exercises: payload.exercises,
                    source: 'ForgeFlow',
                })

                if (existingTemplate) {
                    await apiFetch(`/workout-templates/${existingTemplate.id}`, {
                        method: 'PUT',
                        body,
                    })
                } else {
                    await apiFetch('/workout-templates', {
                        method: 'POST',
                        body,
                    })
                }
            }

            const templatesFromApi = await apiFetch('/workout-templates')
            const normalizedTemplates = Array.isArray(templatesFromApi)
                ? templatesFromApi.map(normalizeWorkoutTemplateFromApi)
                : []

            setWorkoutTemplates(normalizedTemplates)
            saveUserStorageData(user, 'workout-templates', normalizedTemplates)

            showToast(
                'success',
                'Templates corrigidos',
                'Os 6 templates padrão foram recriados com exercícios sugeridos.'
            )
        } catch (error) {
            console.error(error)

            showToast(
                'error',
                'Erro ao corrigir templates',
                error.message || 'Não foi possível recriar os templates padrão.'
            )
        }
    }

    async function handleCreateWorkoutFromTemplate(template) {
        if (!template.exercises || template.exercises.length === 0) {
            showToast(
                'error',
                'Template vazio',
                'Esse template ainda não possui exercícios. Edite ou crie um template com exercícios primeiro.'
            )

            return
        }

        try {
            const createdWorkoutFromApi = await apiFetch(
                `/workout-templates/${template.id}/create-workout`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        name: template.name,
                        folderId: selectedFolderId || null,
                    }),
                }
            )

            const createdWorkout = normalizeWorkoutFromApi(createdWorkoutFromApi)

            setWorkouts([createdWorkout, ...workouts])

            showToast(
                'success',
                'Treino criado',
                `O template "${template.name}" virou um treino.`
            )
        } catch (error) {
            console.error(error)

            showToast(
                'error',
                'Erro ao usar template',
                error.message || 'Não foi possível criar um treino a partir do template.'
            )
        }
    }

    async function handleToggleTemplateFavorite(template) {
        try {
            const updatedTemplateFromApi = await apiFetch(
                `/workout-templates/${template.id}/favorite`,
                {
                    method: 'PATCH',
                }
            )

            const updatedTemplate = normalizeWorkoutTemplateFromApi(updatedTemplateFromApi)

            setWorkoutTemplates(
                workoutTemplates.map((item) =>
                    item.id === template.id ? updatedTemplate : item
                )
            )

            showToast(
                'success',
                updatedTemplate.isFavorite ? 'Template favoritado' : 'Favorito removido',
                updatedTemplate.isFavorite
                    ? 'O template foi marcado como favorito.'
                    : 'O template saiu dos favoritos.'
            )
        } catch (error) {
            console.error(error)

            showToast(
                'error',
                'Erro ao favoritar',
                error.message || 'Não foi possível atualizar o template.'
            )
        }
    }

    async function handleDeleteTemplate(templateId) {
        const template = workoutTemplates.find((item) => item.id === templateId)

        setConfirmModal({
            title: 'Excluir template?',
            description: `O template "${template?.name || 'selecionado'}" será removido.`,
            confirmText: 'Excluir',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await apiFetch(`/workout-templates/${templateId}`, {
                        method: 'DELETE',
                    })

                    setWorkoutTemplates(
                        workoutTemplates.filter((item) => item.id !== templateId)
                    )

                    setConfirmModal(null)

                    showToast(
                        'success',
                        'Template excluído',
                        'O template foi removido com sucesso.'
                    )
                } catch (error) {
                    console.error(error)

                    showToast(
                        'error',
                        'Erro ao excluir',
                        error.message || 'Não foi possível excluir o template.'
                    )
                }
            },
        })
    }

    async function handleSubmitTemplate() {
        if (!workoutName.trim() || workoutExercises.length === 0) {
            showToast(
                'error',
                'Template incompleto',
                'Informe o nome do template e adicione pelo menos um exercício.'
            )
            return
        }

        try {
            if (editingTemplateId) {
                const currentTemplate = workoutTemplates.find(
                    (item) => item.id === editingTemplateId
                )

                const updatedTemplateFromApi = await apiFetch(
                    `/workout-templates/${editingTemplateId}`,
                    {
                        method: 'PUT',
                        body: JSON.stringify({
                            name: workoutName.trim(),
                            description: currentTemplate?.description || '',
                            category: currentTemplate?.category || 'Personalizado',
                            goal: currentTemplate?.goal || '',
                            difficulty: currentTemplate?.difficulty || '',
                            estimatedDuration: currentTemplate?.estimatedDuration || null,
                            exercises: workoutExercises,
                            source: currentTemplate?.source || 'User',
                        }),
                    }
                )

                const updatedTemplate =
                    normalizeWorkoutTemplateFromApi(updatedTemplateFromApi)

                setWorkoutTemplates(
                    workoutTemplates.map((item) =>
                        item.id === editingTemplateId ? updatedTemplate : item
                    )
                )

                resetForm()
                setIsBuilderOpen(false)

                showToast(
                    'success',
                    'Template atualizado',
                    'As alterações foram salvas no template.'
                )

                return
            }

            const createdTemplateFromApi = await apiFetch('/workout-templates', {
                method: 'POST',
                body: JSON.stringify({
                    name: workoutName.trim(),
                    description: '',
                    category: 'Personalizado',
                    goal: '',
                    difficulty: '',
                    estimatedDuration: null,
                    exercises: workoutExercises,
                    source: 'User',
                }),
            })

            const createdTemplate =
                normalizeWorkoutTemplateFromApi(createdTemplateFromApi)

            setWorkoutTemplates([createdTemplate, ...workoutTemplates])

            resetForm()
            setIsBuilderOpen(false)

            showToast(
                'success',
                'Template criado',
                'O template foi salvo com sucesso.'
            )
        } catch (error) {
            console.error(error)

            showToast(
                'error',
                'Erro ao salvar template',
                error.message || 'Não foi possível salvar o template.'
            )
        }
    }

    async function handleSaveCurrentWorkoutAsTemplate() {
        if (!workoutName.trim() || workoutExercises.length === 0) {
            showToast(
                'error',
                'Template incompleto',
                'Informe o nome do treino e adicione pelo menos um exercício.'
            )
            return
        }

        try {
            const createdTemplateFromApi = await apiFetch('/workout-templates', {
                method: 'POST',
                body: JSON.stringify({
                    name: workoutName.trim(),
                    description: '',
                    category: 'Personalizado',
                    goal: '',
                    difficulty: '',
                    estimatedDuration: null,
                    exercises: workoutExercises,
                    source: 'User',
                }),
            })

            const createdTemplate =
                normalizeWorkoutTemplateFromApi(createdTemplateFromApi)

            setWorkoutTemplates([createdTemplate, ...workoutTemplates])

            showToast(
                'success',
                'Template salvo',
                'Esse treino agora também está salvo como template.'
            )
        } catch (error) {
            console.error(error)

            showToast(
                'error',
                'Erro ao salvar template',
                error.message || 'Não foi possível salvar o template.'
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
                            onClick={openCreateBuilder}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-5 text-sm font-bold text-white shadow-[0_0_20px_var(--ff-accent-shadow)] transition hover:bg-[var(--ff-accent-hover)] hover:shadow-[0_0_20px_var(--ff-accent-shadow)]"
                        >
                            <Plus size={18} />
                            Novo treino
                        </button>
                    </div>
                }
            />

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="p-4">
                    <p className="text-sm text-zinc-500">Treinos salvos</p>
                    <h3 className="mt-2 text-3xl font-bold">{workouts.length}</h3>
                    <p className="mt-2 text-xs text-[var(--ff-accent-text)]
">Treinos disponíveis</p>
                </Card>

                <Card className="p-4">
                    <p className="text-sm text-zinc-500">Biblioteca</p>
                    <h3 className="mt-2 text-3xl font-bold">{exercises.length}</h3>
                    <p className="mt-2 text-xs text-[var(--ff-accent-text)]
">Exercícios cadastrados</p>
                </Card>

                <Card className="p-4">
                    <p className="text-sm text-zinc-500">Itens nos treinos</p>
                    <h3 className="mt-2 text-3xl font-bold text-[var(--ff-accent-text)]
">
                        {totalExercisesInSavedWorkouts}
                    </h3>
                    <p className="mt-2 text-xs text-[var(--ff-accent-text)]
">Exercícios usados</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-zinc-500">Templates</p>

                    <h3 className="mt-2 text-3xl font-bold text-yellow-300">
                        {workoutTemplates.length}
                    </h3>

                    <p className="mt-2 text-xs text-[var(--ff-accent-text)]">
                        modelos salvos
                    </p>
                </Card>
            </section>

            <div className="mt-5 rounded-3xl border border-zinc-800 bg-[#18181b] p-3">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-zinc-300">Pastas</p>

                    <button
                        type="button"
                        onClick={() => setIsFolderModalOpen(true)}
                        className="text-xs font-bold text-[var(--ff-accent-text)]
 transition hover:text-[var(--ff-accent-text)]
"
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
                                ? 'shrink-0 rounded-2xl bg-[var(--ff-accent)] px-4 py-2 text-sm font-bold text-white shadow-[0_0_20px_var(--ff-accent-shadow)]'
                                : 'shrink-0 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-bold text-zinc-400 transition hover:border-[var(--ff-accent-border)]/40 hover:text-white'
                        }
                    >
                        Todas
                        <span className="ml-2 text-xs opacity-70">{workouts.length}</span>
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

            <section className="mt-6 grid grid-cols-1 gap-4 2xl:grid-cols-3 2xl:gap-6">
                <div className="xl:col-span-2">
                    <Card>
                        <button
                            type="button"
                            onClick={() => setIsWorkoutsListCollapsed(!isWorkoutsListCollapsed)}
                            className="flex w-full items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-left transition hover:border-[var(--ff-accent-border)]/40 hover:bg-zinc-900"
                        >
                            <div className="flex items-center gap-2 text-zinc-300">
                                <ChevronDown
                                    size={18}
                                    className={
                                        isWorkoutsListCollapsed
                                            ? '-rotate-90 text-zinc-500 transition'
                                            : 'text-[var(--ff-accent-text)] transition'
                                    }
                                />

                                <p className="text-sm font-bold">
                                    Os meus treinos ({filteredWorkouts.length})
                                </p>
                            </div>

                            <span className="text-xs font-bold text-zinc-500">
                                {isWorkoutsListCollapsed ? 'Abrir' : 'Recolher'}
                            </span>
                        </button>
                        {!isWorkoutsListCollapsed && (
                            <div className="mt-5 space-y-4">
                                {filteredWorkouts.length === 0 && (
                                    <EmptyState
                                        title="Nenhum treino encontrado"
                                        description="Crie seu primeiro treino ou escolha outra pasta."
                                        action={<Button onClick={openCreateBuilder}>Novo treino</Button>}
                                    />
                                )}

                                {visibleWorkouts.map((workout) => {
                                    const workoutId = getWorkoutId(workout)
                                    const isExpanded = expandedWorkoutId === workoutId
                                    const workoutMeta = workoutListMetaMap.get(workoutId) || { muscleGroups: [], exerciseNames: '' }
                                    const workoutMuscleGroups = workoutMeta.muscleGroups

                                    return (
                                        <div
                                            key={workoutId}
                                            className="overflow-hidden rounded-3xl border border-zinc-800 bg-[#18181b] transition hover:border-[var(--ff-accent-border)]/30 hover:bg-[#1f1f23]"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => handleToggleWorkout(workoutId)}
                                                className="w-full p-4 text-left sm:p-5"
                                            >
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="truncate text-lg font-bold text-white">
                                                            {workout.name}
                                                        </h3>
                                                        {workout.isFavorite && (
                                                            <div className="mt-2">
                                                                <Badge>
                                                                    ⭐ Favorito
                                                                </Badge>
                                                            </div>
                                                        )}

                                                        <p className="mt-2 line-clamp-2 text-sm text-zinc-500 sm:truncate">
                                                            {workoutMeta.exerciseNames}
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

                                                        <div className="mt-4 grid grid-cols-[44px_1fr] gap-2 sm:hidden">
                                                            <button
                                                                type="button"
                                                                onClick={(event) => {
                                                                    event.stopPropagation()
                                                                    handleToggleFavorite(workout)
                                                                }}
                                                                title={workout.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                                                                className={
                                                                    workout.isFavorite
                                                                        ? 'flex h-10 items-center justify-center rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
                                                                        : 'flex h-10 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-500'
                                                                }
                                                            >
                                                                <Star
                                                                    size={18}
                                                                    fill={workout.isFavorite ? 'currentColor' : 'none'}
                                                                />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={(event) => {
                                                                    event.stopPropagation()
                                                                    handleStartWorkout(workout)
                                                                }}
                                                                className="inline-flex h-10 w-full items-center justify-center rounded-2xl bg-[var(--ff-accent)] text-sm font-bold text-white transition hover:bg-[var(--ff-accent-hover)]"
                                                            >
                                                                Iniciar treino
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="hidden items-center gap-2 sm:flex">
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation()
                                                                handleToggleFavorite(workout)
                                                            }}
                                                            title={workout.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                                                            className={
                                                                workout.isFavorite
                                                                    ? 'flex h-10 w-10 items-center justify-center rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 transition hover:bg-yellow-500/20'
                                                                    : 'flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-500 transition hover:border-yellow-500/30 hover:bg-yellow-500/10 hover:text-yellow-300'
                                                            }
                                                        >
                                                            <Star
                                                                size={18}
                                                                fill={workout.isFavorite ? 'currentColor' : 'none'}
                                                            />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation()
                                                                handleStartWorkout(workout)
                                                            }}
                                                            className="h-10 rounded-2xl bg-[var(--ff-accent)] px-4 text-sm font-bold text-white transition hover:bg-[var(--ff-accent-hover)]
"
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
                                                                            loading="lazy"
                                                                            decoding="async"
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
                                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] text-sm font-bold text-white transition hover:bg-[var(--ff-accent-hover)]
"
                                                        >
                                                            <Dumbbell size={17} />
                                                            Iniciar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditWorkout(workout)}
                                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)]/10 text-sm font-bold text-[var(--ff-accent-text)]
 transition hover:bg-[var(--ff-accent-hover)]
/20"
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
                                                            onClick={() => handleDeleteWorkout(workoutId)}
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
                                {filteredWorkouts.length > (Number(appSettings.workoutsVisibleLimit) || 5) && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAllWorkouts(!showAllWorkouts)}
                                        className="flex h-12 w-full items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-sm font-bold text-zinc-300 transition hover:border-[var(--ff-accent-border)] hover:text-white"
                                    >
                                        {showAllWorkouts
                                            ? 'Mostrar menos'
                                            : `Ver mais ${filteredWorkouts.length - (Number(appSettings.workoutsVisibleLimit) || 5)
                                            } treino(s)`}
                                    </button>
                                )}
                            </div>
                        )}
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
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white transition group-hover:bg-[var(--ff-accent)] group-hover:shadow-[0_0_20px_var(--ff-accent-shadow)]">
                                    <ClipboardList size={22} />
                                </div>

                                <p className="font-bold text-white transition group-hover:text-[var(--ff-accent-text)]
">
                                    Novo treino
                                </p>
                            </div>

                            <ChevronDown
                                className="-rotate-90 text-zinc-500 transition group-hover:text-[var(--ff-accent-text)]
 group-hover:translate-x-1"
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
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white transition group-hover:bg-[var(--ff-accent)] group-hover:shadow-[0_0_20px_var(--ff-accent-shadow)]">
                                    <Plus size={22} />
                                </div>

                                <p className="font-bold text-white transition group-hover:text-[var(--ff-accent-text)]
">
                                    Nova pasta
                                </p>
                            </div>

                            <ChevronDown
                                className="-rotate-90 text-zinc-500 transition group-hover:text-[var(--ff-accent-text)]
 group-hover:translate-x-1"
                                size={22}
                            />
                        </button>
                    </Card>

                    <Card>
                        <h2 className="text-xl font-bold">Resumo</h2>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                                <p className="text-xs text-zinc-500">Treinos</p>
                                <p className="mt-1 text-2xl font-bold text-[var(--ff-accent-text)]
">
                                    {workouts.length}
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
                                onClick={handleImportDefaultExercises}
                                className="ff-theme-button-fix mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--ff-accent-border)]/35 bg-[var(--ff-accent-soft)] px-4 py-3 text-sm font-black text-[var(--ff-accent)] transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-accent-soft)]/80 md:col-span-2"
                            >
                                <Dumbbell size={18} />
                                {hasImportedLibrary ? 'Atualizar biblioteca padrão' : 'Importar biblioteca padrão'}
                            </button>
                        </div>
                    </Card>
                </div>
            </section>


            <section className="mt-6">
                <Card>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-black">
                                Templates de treino
                            </h2>

                            <p className="mt-1 text-sm text-zinc-500">
                                Use modelos prontos para criar treinos mais rápido.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Badge>
                                {workoutTemplates.length} template(s)
                            </Badge>

                            <Button variant="secondary" onClick={handleRebuildDefaultTemplates}>
                                Recriar padrões
                            </Button>
                        </div>
                    </div>

                    {(hasEmptyDefaultTemplates || !hasDefaultTemplates) && (
                        <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-bold text-yellow-300">
                                        Templates padrão precisam ser corrigidos
                                    </p>

                                    <p className="mt-1 text-xs text-yellow-100/70">
                                        Use esta opção para criar ou recriar os 6 modelos padrão já com exercícios sugeridos. Ela corrige templates vazios ou incompletos.
                                    </p>
                                </div>

                                <Button onClick={handleRebuildDefaultTemplates}>
                                    Corrigir templates padrão
                                </Button>
                            </div>
                        </div>
                    )}


                    <div className="mt-5">
                        {sortedWorkoutTemplates.length === 0 ? (
                            <EmptyState
                                title="Nenhum template salvo"
                                description="Crie templates próprios ou gere alguns modelos padrão do ForgeFlow."
                                action={
                                    <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center sm:justify-center">
                                        <Button onClick={handleRebuildDefaultTemplates}>
                                            Criar templates prontos
                                        </Button>

                                        <Button variant="secondary" onClick={openCreateBuilder}>
                                            Criar treino
                                        </Button>
                                    </div>
                                }
                            />
                        ) : (
                            <div className="grid max-h-[760px] grid-cols-1 gap-3 overflow-y-auto pr-1 lg:grid-cols-2">
                                {sortedWorkoutTemplates.map((template) => (
                                    <div
                                        key={template.id}
                                        className="rounded-3xl border border-zinc-800 bg-[#18181b] p-4 transition hover:border-[var(--ff-accent-border)]/40 hover:bg-[#1f1f23]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="line-clamp-2 text-lg font-black text-white">
                                                        {template.name}
                                                    </h3>

                                                    {template.isFavorite && (
                                                        <Badge>
                                                            ⭐ Favorito
                                                        </Badge>
                                                    )}
                                                </div>

                                                <p className="mt-2 text-sm text-zinc-500">
                                                    {template.category || 'Personalizado'} •{' '}
                                                    {template.exercises.length > 0
                                                        ? `${template.exercises.length} exercício(s)`
                                                        : 'sem exercícios'}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleToggleTemplateFavorite(template)}
                                                title={
                                                    template.isFavorite
                                                        ? 'Remover dos favoritos'
                                                        : 'Adicionar aos favoritos'
                                                }
                                                className={
                                                    template.isFavorite
                                                        ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 transition hover:bg-yellow-500/20'
                                                        : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-500 transition hover:border-yellow-500/30 hover:bg-yellow-500/10 hover:text-yellow-300'
                                                }
                                            >
                                                <Star
                                                    size={18}
                                                    fill={template.isFavorite ? 'currentColor' : 'none'}
                                                />
                                            </button>
                                        </div>

                                        {template.description && (
                                            <p className="mt-3 line-clamp-2 text-sm text-zinc-500">
                                                {template.description}
                                            </p>
                                        )}

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {template.goal && (
                                                <Badge variant="purple">
                                                    {template.goal}
                                                </Badge>
                                            )}

                                            {template.difficulty && (
                                                <Badge>
                                                    {template.difficulty}
                                                </Badge>
                                            )}

                                            {template.source === 'ForgeFlow' && (
                                                <Badge>
                                                    ForgeFlow
                                                </Badge>
                                            )}
                                        </div>

                                        {template.exercises.length === 0 && (
                                            <p className="mt-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs font-bold text-yellow-300">
                                                Template vazio ou incompleto. Use "Corrigir templates padrão" para preencher automaticamente.
                                            </p>
                                        )}

                                        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                            <button
                                                type="button"
                                                onClick={() => handleCreateWorkoutFromTemplate(template)}
                                                className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] text-sm font-bold text-white transition hover:bg-[var(--ff-accent-hover)]"
                                            >
                                                <Plus size={17} />
                                                Usar
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleEditTemplate(template)}
                                                className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)]/10 text-sm font-bold text-[var(--ff-accent-text)] transition hover:bg-[var(--ff-accent-soft)]/20"
                                            >
                                                <Edit3 size={17} />
                                                Editar
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteTemplate(template.id)}
                                                className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 text-sm font-bold text-red-300 transition hover:bg-red-500/20"
                                            >
                                                <Trash2 size={17} />
                                                Excluir
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
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
                                                {builderMode === 'template'
                                                    ? editingTemplateId
                                                        ? 'Editar template'
                                                        : 'Novo template'
                                                    : editingWorkoutId
                                                        ? 'Editar rotina'
                                                        : 'Nova rotina'}
                                            </p>

                                            <h1 className="truncate text-2xl font-black sm:text-3xl">
                                                {builderMode === 'template'
                                                    ? editingTemplateId
                                                        ? 'Editar template'
                                                        : 'Criar template'
                                                    : editingWorkoutId
                                                        ? 'Editar treino'
                                                        : 'Criar treino'}
                                            </h1>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">
                                        {builderMode === 'workout' && (
                                            <button
                                                type="button"
                                                onClick={handleSaveCurrentWorkoutAsTemplate}
                                                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-5 text-sm font-bold text-yellow-300 transition hover:bg-yellow-500/20 sm:w-auto"
                                            >
                                                <Star size={18} />
                                                Salvar template
                                            </button>
                                        )}

                                        <button
                                            type="submit"
                                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-5 text-sm font-bold text-white transition hover:bg-[var(--ff-accent-hover)] sm:w-auto"
                                        >
                                            <Save size={18} />
                                            {builderMode === 'template' ? 'Salvar template' : 'Salvar treino'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                                <div className="space-y-6 xl:col-span-3">
                                    <Card>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <Input
                                                label={builderMode === 'template' ? 'Título do template' : 'Título do treino'}
                                                placeholder={builderMode === 'template' ? 'Ex: Push, Pull, Upper...' : 'Ex: Push A, Costas pesado...'}
                                                value={workoutName}
                                                onChange={(event) => setWorkoutName(event.target.value)}
                                            />

                                            {builderMode === 'workout' ? (
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
                                            ) : (
                                                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                                                    <p className="text-sm font-bold text-yellow-300">
                                                        Editando template
                                                    </p>

                                                    <p className="mt-1 text-xs text-yellow-100/70">
                                                        Templates não usam pasta. Adicione os exercícios e salve o modelo.
                                                    </p>
                                                </div>
                                            )}
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
                                        {builderMode === 'template' ? 'Salvar template' : 'Salvar treino'}
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