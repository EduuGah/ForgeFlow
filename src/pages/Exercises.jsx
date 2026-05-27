import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Dumbbell, Layers3, Target, Star, Search } from 'lucide-react'

import { getInitialExercises } from '../utils/exerciseStorage'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import {
  getUserStorageData,
  saveUserStorageData,
} from '../utils/userStorage'

import PageHeader from '../components/ui/PageHeader'
import Badge from '../components/ui/Badge'
import { StatCard } from '../features/exercises/components/ExerciseLibraryUi'
import ExerciseFiltersSidebar from '../features/exercises/components/ExerciseFiltersSidebar'
import ExerciseFormModal from '../features/exercises/components/ExerciseFormModal'
import ExerciseLibrarySection from '../features/exercises/components/ExerciseLibrarySection'

import {
  INITIAL_VISIBLE_COUNT,
  buildStatsMap,
  defaultEquipmentList,
  getExerciseMedia,
  getSortedUnique,
  getStatsFromMap,
  getSubgroup,
  listToText,
  mergeExercisesWithoutDuplicates,
  muscleGroupOrder,
  normalizeEquipment,
  normalizeExerciseForList,
  normalizeExerciseFromApi,
  normalizeList,
  normalizeMuscleGroup,
  normalizeText,
  textToList,
} from '../features/exercises/exerciseLibraryUtils'

import AppPageIntro from '../components/app/AppPageIntro'

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

  const [exercises, setExercises] = useState([])

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

  useEffect(() => {
    if (!isLoaded || !user) return

    saveUserStorageData(user, 'exercises', exercises)
  }, [exercises, isLoaded, user])

  const indexedExercises = useMemo(() => {
    return exercises.map((exercise) => {
      const normalized = normalizeExerciseForList(exercise)
      const secondaryMuscles = normalizeList(normalized.secondaryMuscles)

      const searchableText = normalizeText(`
        ${normalized.name || ''}
        ${normalized.originalName || ''}
        ${normalized.normalizedGroup || ''}
        ${normalized.subgroup || ''}
        ${normalized.normalizedEquipment || ''}
        ${normalized.description || ''}
        ${secondaryMuscles.join(' ')}
      `)

      return {
        ...normalized,
        searchableText,
      }
    })
  }, [exercises])

  const stats = useMemo(() => {
    const groupMap = buildStatsMap(indexedExercises, 'normalizedGroup')
    const subgroupMap = buildStatsMap(indexedExercises, 'subgroup')
    const equipmentMap = buildStatsMap(indexedExercises, 'normalizedEquipment')

    const muscleGroups = getStatsFromMap(groupMap, muscleGroupOrder).map((item) => item.name)
    const subgroupList = getStatsFromMap(subgroupMap).map((item) => item.name)

    const equipmentNames = getSortedUnique(
      [
        ...defaultEquipmentList,
        ...Array.from(equipmentMap.keys()),
      ],
      defaultEquipmentList
    )

    const equipmentStats = equipmentNames
      .map((item) => ({
        name: item,
        count: equipmentMap.get(item) || 0,
      }))
      .filter((item) => item.count > 0)

    return {
      groupStats: getStatsFromMap(groupMap, muscleGroupOrder),
      subgroupStats: getStatsFromMap(subgroupMap),
      equipmentStats,
      muscleGroups,
      subgroupList,
      equipmentList: equipmentNames,
      favoriteExercisesCount: indexedExercises.filter((exercise) => exercise.isFavorite).length,
    }
  }, [indexedExercises])

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

      const dateA = new Date(a.updatedAt || a.createdAt || 0)
      const dateB = new Date(b.updatedAt || b.createdAt || 0)

      return dateB - dateA
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
      alert('Envie apenas arquivos PNG, JPG, WEBP ou GIF.')
      event.target.value = ''
      return
    }

    const maxSizeInMB = 2
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024

    if (file.size > maxSizeInBytes) {
      alert(
        `Esse arquivo tem ${(file.size / 1024 / 1024).toFixed(2)}MB. Para salvar no navegador, use uma imagem/GIF de até ${maxSizeInMB}MB.`
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
      alert('Não foi possível carregar esse arquivo.')
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
      alert('Preencha nome, grupo muscular e equipamento.')
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
      return
    }

    const newExercise = normalizeExerciseForList({
      id: crypto.randomUUID(),
      source: 'ForgeFlow',
      originalName: name.trim(),
      ...normalizedPayload,
      createdAt: new Date().toISOString(),
    })

    setExercises([newExercise, ...exercises])
    closeModal()
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
    const confirmDelete = window.confirm(
      'Tem certeza que deseja excluir este exercício?'
    )

    if (!confirmDelete) return

    setExercises(exercises.filter((exercise) => exercise.id !== id))

    if (editingId === id) {
      resetForm()
    }
  }

  function isMongoId(value) {
    return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)
  }

  async function handleToggleFavorite(exercise, event) {
    event?.stopPropagation()

    try {
      if (isMongoId(exercise.id)) {
        const updatedExerciseFromApi = await apiFetch(`/exercises/${exercise.id}/favorite`, {
          method: 'PATCH',
        })

        const updatedExercise = normalizeExerciseFromApi(updatedExerciseFromApi)

        const updatedExercises = exercises.map((item) =>
          item.id === exercise.id ? updatedExercise : item
        )

        setExercises(updatedExercises)
        saveUserStorageData(user, 'exercises', updatedExercises)
        return
      }

      const createdExerciseFromApi = await apiFetch('/exercises', {
        method: 'POST',
        body: JSON.stringify({
          ...exercise,
          localId: exercise.id,
          originalLocalId: exercise.id,
          isFavorite: true,
          source: exercise.source || 'ForgeFlow',
          originalName: exercise.originalName || exercise.name,
        }),
      })

      const createdExercise = normalizeExerciseFromApi(createdExerciseFromApi)

      const updatedExercises = exercises.map((item) =>
        item.id === exercise.id ? createdExercise : item
      )

      setExercises(updatedExercises)
      saveUserStorageData(user, 'exercises', updatedExercises)
    } catch (error) {
      console.error(error)

      alert(
        error.message ||
        'Não foi possível salvar o favorito no servidor.'
      )
    }
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
    <div className="ff-hevy-page ff-hevy-page-exercises">

      <AppPageIntro
        eyebrow="Biblioteca"
        title="Exercícios"
        description="Busque, favorite e abra detalhes dos exercícios em uma lista compacta de app."
        metrics={[
          { label: 'Total', value: indexedExercises.length },
          { label: 'Grupos', value: stats.groupStats.length },
          { label: 'Favoritos', value: stats.favoriteExercisesCount },
        ]}
      />

      <div className="ff-exercise-top-search">
        <Search size={18} />
        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar exercício..." />
      </div>

    <>
      <PageHeader
        title="Exercícios"
        description="Biblioteca premium com grupos, subgrupos, equipamentos, GIFs e detalhes completos."
        action={
          <div className="flex items-center gap-2">
            {(isSyncing || dataSource !== 'database') && (
              <Badge variant={isSyncing ? 'purple' : 'default'}>
                {isSyncing
                  ? 'Sincronizando'
                  : dataSource === 'defaults'
                    ? 'Padrão local'
                    : 'Local'}
              </Badge>
            )}

            <button
              type="button"
              onClick={openCreateModal}
              className="hidden h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-5 text-sm font-bold text-white shadow-[0_0_20px_var(--ff-accent-shadow)] transition hover:bg-[var(--ff-accent-hover)] sm:inline-flex"
            >
              <Plus size={18} />
              Adicionar exercício
            </button>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total"
          value={indexedExercises.length}
          description="Exercícios cadastrados"
          icon={Dumbbell}
        />

        <StatCard
          title="Grupos"
          value={stats.groupStats.length}
          description="Grupos musculares ativos"
          icon={Layers3}
        />

        <StatCard
          title="Subgrupos"
          value={stats.subgroupStats.length}
          description="Músculos-alvo mapeados"
          icon={Target}
        />

        <StatCard
          title="Favoritos"
          value={stats.favoriteExercisesCount}
          description="Exercícios marcados"
          icon={Star}
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
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

        <ExerciseLibrarySection
          isLoaded={isLoaded}
          filteredExercises={filteredExercises}
          displayedExercises={displayedExercises}
          expandedExerciseId={expandedExerciseId}
          handleToggleExercise={handleToggleExercise}
          handleToggleFavorite={handleToggleFavorite}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          getExerciseMedia={getExerciseMedia}
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
          visibleCount={visibleCount}
          filterKey={filterKey}
          setVisibleState={setVisibleState}
        />
      </section>

      <button
        type="button"
        onClick={openCreateModal}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-3xl bg-[var(--ff-accent)] text-white shadow-[0_0_28px_var(--ff-accent-shadow)] transition active:scale-95 sm:hidden"
        aria-label="Adicionar exercício"
      >
        <Plus size={24} />
      </button>

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
    </>
  
    </div>
  )
}

export default Exercises
