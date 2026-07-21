import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'

import { getInitialExercises } from '../utils/exerciseStorage'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import {
  getUserStorageData,
  saveUserStorageData,
} from '../utils/userStorage'

import ExerciseFiltersSidebar from '../features/exercises/components/ExerciseFiltersSidebar'
import ExerciseFormModal from '../features/exercises/components/ExerciseFormModal'
import ExerciseLibrarySection from '../features/exercises/components/ExerciseLibrarySection'
import AppPageIntro from '../components/app/AppPageIntro'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'

import {
  INITIAL_VISIBLE_COUNT,
  getExerciseMedia,
  getSubgroup,
  listToText,
  mergeExercisesWithoutDuplicates,
  normalizeEquipment,
  normalizeExerciseForList,
  normalizeExerciseFromApi,
  isUserCreatedExercise,
  normalizeList,
  normalizeMuscleGroup,
  normalizeText,
  textToList,
} from '../features/exercises/exerciseLibraryUtils'
import {
  buildExerciseLibraryStats,
  buildExerciseStatsMapFromHistory,
} from '../features/exercises/exerciseStatsUtils'



function Exercises() {
  const { user } = useAuth()

  const [name, setName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [targetMuscle, setTargetMuscle] = useState('')
  const [secondaryMusclesText, setSecondaryMusclesText] = useState('')
  const [equipment, setEquipment] = useState('')
  const [description, setDescription] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const fileInputRef = useRef(null)
  const [execution, setExecution] = useState('')
  const [commonMistakes, setCommonMistakes] = useState('')
  const [variations, setVariations] = useState('')

  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [groupFilter, setGroupFilter] = useState('')
  const [subgroupFilter, setSubgroupFilter] = useState('')
  const [equipmentFilter, setEquipmentFilter] = useState('')
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [groupSearch, setGroupSearch] = useState('')
  const deferredGroupSearch = useDeferredValue(groupSearch)
  const [subgroupSearch, setSubgroupSearch] = useState('')
  const deferredSubgroupSearch = useDeferredValue(subgroupSearch)

  const [expandedExerciseId, setExpandedExerciseId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [dataSource, setDataSource] = useState('local')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [visibleState, setVisibleState] = useState({ key: '', count: INITIAL_VISIBLE_COUNT })
  const [toast, setToast] = useState(null)
  const [exerciseToDeleteId, setExerciseToDeleteId] = useState('')
  const toastTimeoutRef = useRef(null)

  const [exercises, setExercises] = useState([])

  const cachedHistory = useMemo(() => {
    if (!user) return []

    const history = getUserStorageData(user, 'history', getUserStorageData(user, 'workoutHistory', []))

    return Array.isArray(history) ? history : []
  }, [user])

  useEffect(() => {
    if (!user) return undefined

    let isMounted = true

    async function loadExercises() {
      setIsLoaded(false)
      setIsSyncing(true)

      const savedExercises = getUserStorageData(user, 'exercises', null)
      const defaultExercises = getInitialExercises()

      const cachedExercises = Array.isArray(savedExercises)
        ? savedExercises
        : []

      const fallbackExercises = mergeExercisesWithoutDuplicates(
        defaultExercises,
        cachedExercises
      )

      setExercises(fallbackExercises)
      setIsLoaded(true)
      setDataSource(cachedExercises.length > 0 ? 'local' : 'defaults')

      try {
        const exercisesFromApi = await apiFetch('/exercises')

        if (!isMounted) return

        const normalizedFromApi = Array.isArray(exercisesFromApi)
          ? exercisesFromApi.map(normalizeExerciseFromApi)
          : []

        const finalExercises = mergeExercisesWithoutDuplicates(
          defaultExercises,
          cachedExercises,
          normalizedFromApi
        )

        setExercises(finalExercises)
        saveUserStorageData(user, 'exercises', finalExercises)
        setDataSource('database')
      } catch (error) {
        console.error(error)

        if (!isMounted) return

        saveUserStorageData(user, 'exercises', fallbackExercises)
        setDataSource('local')
      } finally {
        if (isMounted) {
          setIsSyncing(false)
          setIsLoaded(true)
        }
      }
    }

    loadExercises()

    return () => {
      isMounted = false
    }
  }, [user])

  useEffect(() => () => {
    window.clearTimeout(toastTimeoutRef.current)
  }, [])

  useEffect(() => {
    if (!isLoaded || !user) return

    saveUserStorageData(user, 'exercises', exercises)
  }, [exercises, isLoaded, user])

  const indexedExercises = useMemo(() => {
    return exercises.map((exercise) => {
      const normalized = normalizeExerciseForList(exercise)
      const secondaryMuscles = normalizeList(normalized.secondaryMuscles)
      const sortTimestamp = Date.parse(normalized.updatedAt || normalized.createdAt || '') || 0

      const searchableText = normalizeText(`
        ${normalized.name || ''}
        ${normalized.originalName || ''}
        ${normalized.normalizedGroup || ''}
        ${normalized.subgroup || ''}
        ${normalized.normalizedEquipment || ''}
        ${normalized.description || ''}
        ${normalizeList(normalized.instructions || normalized.execution).join(' ')}
        ${normalizeList(normalized.commonMistakes).join(' ')}
        ${normalizeList(normalized.tips || normalized.variations).join(' ')}
        ${secondaryMuscles.join(' ')}
      `)

      return {
        ...normalized,
        searchableText,
        sortTimestamp,
      }
    })
  }, [exercises])

  const stats = useMemo(() => buildExerciseLibraryStats(indexedExercises), [indexedExercises])

  const exerciseStatsMap = useMemo(() => buildExerciseStatsMapFromHistory(cachedHistory), [cachedHistory])

  const filteredExercises = useMemo(() => {
    const normalizedSearch = normalizeText(deferredSearch)

    const filtered = indexedExercises.filter((exercise) => {
      const matchesSearch = normalizedSearch
        ? exercise.searchableText.includes(normalizedSearch)
        : true

      const matchesGroup = groupFilter
        ? exercise.normalizedGroup === groupFilter
        : true

      const matchesSubgroup = subgroupFilter
        ? exercise.subgroup === subgroupFilter
        : true

      const matchesEquipment = equipmentFilter
        ? exercise.normalizedEquipment === equipmentFilter
        : true

      const matchesFavorite = showOnlyFavorites
        ? exercise.isFavorite === true
        : true

      return (
        matchesSearch &&
        matchesGroup &&
        matchesSubgroup &&
        matchesEquipment &&
        matchesFavorite
      )
    })

    return filtered.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1
      if (!a.isFavorite && b.isFavorite) return 1

      return (b.sortTimestamp || 0) - (a.sortTimestamp || 0)
    })
  }, [
    indexedExercises,
    deferredSearch,
    groupFilter,
    subgroupFilter,
    equipmentFilter,
    showOnlyFavorites,
  ])

  const filterKey = useMemo(
    () => [deferredSearch, groupFilter, subgroupFilter, equipmentFilter, showOnlyFavorites].join('|'),
    [deferredSearch, groupFilter, subgroupFilter, equipmentFilter, showOnlyFavorites]
  )

  const visibleCount = visibleState.key === filterKey
    ? visibleState.count
    : INITIAL_VISIBLE_COUNT

  const displayedExercises = useMemo(() => {
    return filteredExercises.slice(0, visibleCount)
  }, [filteredExercises, visibleCount])

  const exerciseToDelete = useMemo(() => {
    if (!exerciseToDeleteId) return null

    return exercises.find((exercise) => String(exercise.id || exercise._id || exercise.localId) === String(exerciseToDeleteId)) || null
  }, [exerciseToDeleteId, exercises])

  function showToast(type, title, message = '') {
    window.clearTimeout(toastTimeoutRef.current)
    setToast({ type, title, message })
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null)
    }, 3200)
  }

  const filteredGroupStats = useMemo(() => {
    const term = normalizeText(deferredGroupSearch)

    if (!term) return stats.groupStats

    return stats.groupStats.filter((group) =>
      normalizeText(group.name).includes(term)
    )
  }, [stats.groupStats, deferredGroupSearch])

  const filteredSubgroupStats = useMemo(() => {
    const term = normalizeText(deferredSubgroupSearch)

    if (!term) return stats.subgroupStats

    return stats.subgroupStats.filter((subgroup) =>
      normalizeText(subgroup.name).includes(term)
    )
  }, [stats.subgroupStats, deferredSubgroupSearch])

  function resetForm() {
    setName('')
    setMuscleGroup('')
    setTargetMuscle('')
    setSecondaryMusclesText('')
    setEquipment('')
    setDescription('')
    setMediaUrl('')
    setUploadedFileName('')
    setExecution('')
    setCommonMistakes('')
    setVariations('')
    setEditingId(null)
  }

  function openCreateModal() {
    resetForm()
    setIsModalOpen(true)
  }

  function closeModal() {
    resetForm()
    setIsModalOpen(false)
  }

  function handleMediaUpload(event) {
    const file = event.target.files?.[0]

    if (!file) return

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

    if (!allowedTypes.includes(file.type)) {
      showToast('error', 'Arquivo incompatível', 'Envie apenas arquivos PNG, JPG, WEBP ou GIF.')
      event.target.value = ''
      return
    }

    const maxSizeInMB = 2
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024

    if (file.size > maxSizeInBytes) {
      showToast(
        'error',
        'Arquivo muito grande',
        `Esse arquivo tem ${(file.size / 1024 / 1024).toFixed(2)}MB. Use uma imagem/GIF de até ${maxSizeInMB}MB.`
      )

      event.target.value = ''
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      setMediaUrl(reader.result)
      setUploadedFileName(file.name)
    }

    reader.onerror = () => {
      showToast('error', 'Erro ao carregar', 'Não foi possível carregar esse arquivo.')
    }

    reader.readAsDataURL(file)
  }

  function handleClearMedia() {
    setMediaUrl('')
    setUploadedFileName('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!name.trim() || !muscleGroup || !equipment) {
      showToast('error', 'Dados incompletos', 'Preencha nome, grupo muscular e equipamento.')
      return
    }

    const normalizedPayload = {
      name: name.trim(),
      muscleGroup: normalizeMuscleGroup(muscleGroup),
      targetMuscle: targetMuscle.trim() || normalizeMuscleGroup(muscleGroup),
      secondaryMuscles: textToList(secondaryMusclesText),
      equipment: normalizeEquipment(equipment),
      description,
      mediaUrl,
      uploadedFileName,
      instructions: textToList(execution),
      execution: textToList(execution),
      tips: textToList(variations),
      commonMistakes: textToList(commonMistakes),
      variations: textToList(variations),
      media: {
        gif: mediaUrl,
        image: '',
      },
      gifUrl: mediaUrl,
    }

    if (editingId) {
      setExercises(
        exercises.map((exercise) =>
          exercise.id === editingId
            ? normalizeExerciseForList({
              ...exercise,
              ...normalizedPayload,
              updatedAt: new Date().toISOString(),
            })
            : exercise
        )
      )

      closeModal()
      showToast('success', 'Exercício salvo', 'As alterações ficaram disponíveis na sua biblioteca.')
      return
    }

    const localId = crypto.randomUUID()
    const newExercise = normalizeExerciseForList({
      id: localId,
      localId,
      originalLocalId: localId,
      source: 'user',
      originLabel: 'Criado por você',
      isCustom: true,
      isUserCreated: true,
      createdByUser: true,
      localOnly: true,
      originalName: name.trim(),
      ...normalizedPayload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    setExercises([newExercise, ...exercises])
    closeModal()
    showToast('success', 'Exercício criado', 'Ele já está disponível para montar seus treinos.')
  }

  function handleEdit(exercise) {
    setEditingId(exercise.id)
    setName(exercise.name || '')
    setMuscleGroup(normalizeMuscleGroup(exercise.muscleGroup))
    setTargetMuscle(getSubgroup(exercise) || '')
    setSecondaryMusclesText(listToText(exercise.secondaryMuscles))
    setEquipment(normalizeEquipment(exercise.equipment))
    setDescription(exercise.description || '')
    setMediaUrl(getExerciseMedia(exercise))
    setUploadedFileName(exercise.uploadedFileName || '')
    setExecution(listToText(exercise.instructions || exercise.execution))
    setCommonMistakes(listToText(exercise.commonMistakes))
    setVariations(listToText(exercise.tips || exercise.variations))
    setIsModalOpen(true)
  }

  function handleDelete(id) {
    setExerciseToDeleteId(String(id || ''))
  }

  function confirmDeleteExercise() {
    if (!exerciseToDeleteId) return

    setExercises(exercises.filter((exercise) => String(exercise.id || exercise._id || exercise.localId) !== String(exerciseToDeleteId)))

    if (String(editingId) === String(exerciseToDeleteId)) {
      resetForm()
    }

    setExerciseToDeleteId('')
    showToast('success', 'Exercício excluído', 'A biblioteca foi atualizada.')
  }

  function handleToggleFavorite(exercise, event) {
    event?.stopPropagation()

    const updatedExercises = exercises.map((item) => {
      const sameExercise = [
        item.id,
        item._id,
        item.localId,
        item.originalLocalId,
      ]
        .filter(Boolean)
        .map(String)
        .includes(String(exercise.id || exercise._id || exercise.localId || exercise.originalLocalId))

      if (!sameExercise) return item

      return normalizeExerciseForList({
        ...item,
        isFavorite: !item.isFavorite,
        updatedAt: new Date().toISOString(),
      })
    })

    setExercises(updatedExercises)
    saveUserStorageData(user, 'exercises', updatedExercises)
  }

  function handleToggleExercise(id) {
    setExpandedExerciseId(expandedExerciseId === id ? null : id)
  }

  function clearFilters() {
    setSearch('')
    setGroupFilter('')
    setSubgroupFilter('')
    setEquipmentFilter('')
    setShowOnlyFavorites(false)
  }

  const hasActiveFilters = Boolean(
    search ||
    groupFilter ||
    subgroupFilter ||
    equipmentFilter ||
    showOnlyFavorites
  )

  return (
    <div className="ff-hevy-page ff-hevy-page-exercises ff-exercises-native-page">
      <AppPageIntro
        eyebrow="Biblioteca"
        title="Exercícios"
        description="Sua biblioteca de movimentos organizada por músculo, equipamento, favoritos e histórico de uso."
        metrics={[
          { label: 'Total', value: indexedExercises.length },
          { label: 'Encontrados', value: filteredExercises.length },
          { label: 'Favoritos', value: stats.favoriteExercisesCount },
        ]}
      />

      <section className="ff-page-mobile-main-grid ff-exercises-layout-grid grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="hidden xl:block">
          <ExerciseFiltersSidebar
            groupSearch={groupSearch}
            setGroupSearch={setGroupSearch}
            filteredGroupStats={filteredGroupStats}
            groupFilter={groupFilter}
            setGroupFilter={setGroupFilter}
            subgroupSearch={subgroupSearch}
            setSubgroupSearch={setSubgroupSearch}
            filteredSubgroupStats={filteredSubgroupStats}
            subgroupFilter={subgroupFilter}
            setSubgroupFilter={setSubgroupFilter}
            search={search}
            setSearch={setSearch}
            showOnlyFavorites={showOnlyFavorites}
            setShowOnlyFavorites={setShowOnlyFavorites}
            stats={stats}
            equipmentFilter={equipmentFilter}
            setEquipmentFilter={setEquipmentFilter}
            hasActiveFilters={hasActiveFilters}
            clearFilters={clearFilters}
          />
        </div>

        <ExerciseLibrarySection
          isLoaded={isLoaded}
          filteredExercises={filteredExercises}
          displayedExercises={displayedExercises}
          expandedExerciseId={expandedExerciseId}
          handleToggleExercise={handleToggleExercise}
          handleToggleFavorite={handleToggleFavorite}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          isUserCreatedExercise={isUserCreatedExercise}
          getExerciseMedia={getExerciseMedia}
          exerciseStatsMap={exerciseStatsMap}
          stats={stats}
          groupFilter={groupFilter}
          setGroupFilter={setGroupFilter}
          showOnlyFavorites={showOnlyFavorites}
          setShowOnlyFavorites={setShowOnlyFavorites}
          hasActiveFilters={hasActiveFilters}
          clearFilters={clearFilters}
          search={search}
          setSearch={setSearch}
          openCreateModal={openCreateModal}
          syncLabel={isSyncing ? 'Atualizando' : dataSource === 'database' ? 'Sincronizado' : 'Disponível offline'}
          visibleCount={visibleCount}
          filterKey={filterKey}
          setVisibleState={setVisibleState}
        />
      </section>

      {isModalOpen && (
        <ExerciseFormModal
          editingId={editingId}
          closeModal={closeModal}
          handleSubmit={handleSubmit}
          name={name}
          setName={setName}
          mediaUrl={mediaUrl}
          uploadedFileName={uploadedFileName}
          setMediaUrl={setMediaUrl}
          setUploadedFileName={setUploadedFileName}
          handleMediaUpload={handleMediaUpload}
          handleClearMedia={handleClearMedia}
          muscleGroup={muscleGroup}
          setMuscleGroup={setMuscleGroup}
          targetMuscle={targetMuscle}
          setTargetMuscle={setTargetMuscle}
          equipment={equipment}
          setEquipment={setEquipment}
          equipmentList={stats.equipmentList}
          secondaryMusclesText={secondaryMusclesText}
          setSecondaryMusclesText={setSecondaryMusclesText}
          description={description}
          setDescription={setDescription}
          execution={execution}
          setExecution={setExecution}
          commonMistakes={commonMistakes}
          setCommonMistakes={setCommonMistakes}
          variations={variations}
          setVariations={setVariations}
        />
      )}

      <ConfirmModal
        open={Boolean(exerciseToDeleteId)}
        title="Excluir exercício?"
        description={
          exerciseToDelete?.name
            ? `Você está prestes a remover "${exerciseToDelete.name}" da sua biblioteca.`
            : 'Você está prestes a remover este exercício da sua biblioteca.'
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDeleteExercise}
        onCancel={() => setExerciseToDeleteId('')}
      />

      <Toast
        show={Boolean(toast)}
        type={toast?.type}
        title={toast?.title}
        message={toast?.message}
        onClose={() => setToast(null)}
      />
    </div>
  )
}

export default Exercises
