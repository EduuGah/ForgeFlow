import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  X,
  Dumbbell,
  ImageIcon,
  Edit3,
  Trash2,
  ExternalLink,
  ChevronDown,
  Layers3,
  Filter,
  Search,
  Sparkles,
  Target,
  Activity,
  Wrench,
  Info,
  Upload,
  FileImage,
  LinkIcon,
  HelpCircle,
  Star,
} from 'lucide-react'

import { getInitialExercises } from '../utils/exerciseStorage'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import {
  getUserStorageData,
  saveUserStorageData,
} from '../utils/userStorage'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

const INITIAL_VISIBLE_COUNT = 8
const LOAD_MORE_COUNT = 8

const muscleGroupOrder = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Antebraço',
  'Abdômen',
  'Lombar',
  'Glúteos',
  'Quadríceps',
  'Posterior de coxa',
  'Panturrilhas',
  'Adutores',
  'Abdutores',
  'Cardio',
  'Mobilidade',
  'Alongamento',
  'Corpo inteiro',
]

const defaultEquipmentList = [
  'Barra',
  'Halteres',
  'Máquina',
  'Cabo',
  'Peso corporal',
  'Banco',
  'Paralelas',
  'Máquina Smith',
  'Anilha',
  'Roda abdominal',
  'Barra fixa',
  'Mobilidade',
]

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function normalizeMuscleGroup(group) {
  if (!group) return 'Outros'

  const normalized = String(group).trim()

  const aliases = {
    Core: 'Abdômen',
    Abdomen: 'Abdômen',
    Abs: 'Abdômen',
    Pernas: 'Pernas',
    Ombro: 'Ombros',
    Costas: 'Costas',
    Peito: 'Peito',
    Biceps: 'Bíceps',
    Bíceps: 'Bíceps',
    Triceps: 'Tríceps',
    Tríceps: 'Tríceps',
    'Posterior de Coxa': 'Posterior de coxa',
    'Corpo Inteiro': 'Corpo inteiro',
  }

  const normalizedKey = normalized.toLowerCase()

  if (normalizedKey.includes('barra') && (normalizedKey.includes('w') || normalizedKey.includes('z') || normalizedKey.includes('ez') || normalizedKey.includes('reta') || normalizedKey.includes('curva'))) {
    return 'Barra'
  }

  return aliases[normalized] || aliases[normalizedKey] || normalized
}

function normalizeEquipment(equipment) {
  if (!equipment) return 'Não informado'

  const normalized = String(equipment).trim()

  const aliases = {
    Halter: 'Halteres',
    Dumbbell: 'Halteres',
    Dumbbells: 'Halteres',
    Bodyweight: 'Peso corporal',
    'Peso Corporal': 'Peso corporal',
    Machine: 'Máquina',
    Cable: 'Cabo',
    Barbell: 'Barra',
    Bench: 'Banco',
    'Barra EZ': 'Barra',
    'Barra W': 'Barra',
    'Barra Z': 'Barra',
    'EZ Bar': 'Barra',
    'EZ-bar': 'Barra',
    'W Bar': 'Barra',
    'Z Bar': 'Barra',
    'Barra curva': 'Barra',
    'Barra reta': 'Barra',
  }

  const normalizedKey = normalized.toLowerCase()

  if (normalizedKey.includes('barra') && (normalizedKey.includes('w') || normalizedKey.includes('z') || normalizedKey.includes('ez') || normalizedKey.includes('reta') || normalizedKey.includes('curva'))) {
    return 'Barra'
  }

  return aliases[normalized] || aliases[normalizedKey] || normalized
}

function getSubgroup(exercise) {
  return (
    exercise.targetMuscle ||
    exercise.subgroup ||
    exercise.muscle ||
    exercise.primaryMuscle ||
    normalizeMuscleGroup(exercise.muscleGroup)
  )
}

function getExerciseMedia(exercise) {
  if (exercise.media?.gif) return exercise.media.gif
  if (exercise.media?.image) return exercise.media.image
  if (exercise.gifUrl) return exercise.gifUrl
  if (exercise.mediaUrl) return exercise.mediaUrl

  return ''
}

function getExerciseIdentityKey(exercise = {}) {
  const possibleId = exercise.originalLocalId || exercise.localId

  if (possibleId) {
    return `local:${String(possibleId)}`
  }

  const name = normalizeText(exercise.originalName || exercise.name)
  const group = normalizeText(exercise.muscleGroup || exercise.normalizedGroup)
  const equipment = normalizeText(exercise.equipment || exercise.normalizedEquipment)

  if (name) {
    return `exercise:${name}:${group}:${equipment}`
  }

  return `id:${String(exercise.id || exercise._id || crypto.randomUUID())}`
}

function isApiExercise(exercise = {}) {
  return typeof (exercise._id || exercise.id) === 'string' && /^[a-f\d]{24}$/i.test(exercise._id || exercise.id)
}

function normalizeExerciseFromApi(exercise) {
  const normalizedGroup = normalizeMuscleGroup(exercise.muscleGroup)
  const normalizedEquipment = normalizeEquipment(exercise.equipment)
  const subgroup = getSubgroup({
    ...exercise,
    muscleGroup: normalizedGroup,
  })

  return {
    ...exercise,
    id: exercise._id || exercise.id,
    normalizedGroup,
    normalizedEquipment,
    subgroup,
    isFavorite: Boolean(exercise.isFavorite),
  }
}

function normalizeExerciseForList(exercise) {
  const normalizedGroup = normalizeMuscleGroup(exercise.muscleGroup || exercise.normalizedGroup)
  const normalizedEquipment = normalizeEquipment(exercise.equipment || exercise.normalizedEquipment)
  const subgroup = getSubgroup({
    ...exercise,
    muscleGroup: normalizedGroup,
  })

  return {
    ...exercise,
    id: exercise._id || exercise.id || crypto.randomUUID(),
    normalizedGroup,
    normalizedEquipment,
    subgroup,
    isFavorite: Boolean(exercise.isFavorite),
  }
}

function mergeExercisesWithoutDuplicates(...lists) {
  const merged = new Map()

  lists.flat().filter(Boolean).forEach((exercise) => {
    const normalized = normalizeExerciseForList(exercise)
    const identityKey = getExerciseIdentityKey(normalized)
    const current = merged.get(identityKey)

    if (!current) {
      merged.set(identityKey, normalized)
      return
    }

    const shouldReplace =
      isApiExercise(normalized) ||
      (!isApiExercise(current) && new Date(normalized.updatedAt || 0) > new Date(current.updatedAt || 0)) ||
      (normalized.isFavorite && !current.isFavorite)

    if (shouldReplace) {
      merged.set(identityKey, {
        ...current,
        ...normalized,
        isFavorite: Boolean(current.isFavorite || normalized.isFavorite),
      })
    }
  })

  return Array.from(merged.values())
}

function normalizeList(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) return [value]

  return []
}

function textToList(text) {
  return text
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function listToText(list) {
  if (Array.isArray(list)) return list.join('\n')
  return list || ''
}

function getSortedUnique(values, preferredOrder = []) {
  const uniqueValues = [...new Set(values.filter(Boolean))]

  return uniqueValues.sort((a, b) => {
    const indexA = preferredOrder.indexOf(a)
    const indexB = preferredOrder.indexOf(b)

    if (indexA !== -1 && indexB !== -1) return indexA - indexB
    if (indexA !== -1) return -1
    if (indexB !== -1) return 1

    return String(a).localeCompare(String(b))
  })
}

function buildStatsMap(items, key) {
  const map = new Map()

  items.forEach((item) => {
    const value = item[key]

    if (!value) return

    map.set(value, (map.get(value) || 0) + 1)
  })

  return map
}

function getStatsFromMap(map, preferredOrder = []) {
  return Array.from(map.entries())
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => {
      const indexA = preferredOrder.indexOf(a.name)
      const indexB = preferredOrder.indexOf(b.name)

      if (indexA !== -1 && indexB !== -1) return indexA - indexB
      if (indexA !== -1) return -1
      if (indexB !== -1) return 1

      return a.name.localeCompare(b.name)
    })
}

function StatCard({ title, value, description, icon: Icon }) {
  return (
    <Card className="group overflow-hidden border border-zinc-800 bg-gradient-to-br from-[#17171b] to-[#101014] p-4 transition hover:border-[var(--ff-accent-border)]/30 hover:shadow-[0_0_24px_var(--ff-accent-shadow)]/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-black text-white">
            {value}
          </h3>

          <p className="mt-2 text-xs font-semibold tracking-wide text-[var(--ff-accent-text)]">
            {description}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)]/20 bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)] transition group-hover:scale-105">
          <Icon size={22} />
        </div>
      </div>
    </Card>
  )
}

function FilterListButton({ active, title, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'w-full rounded-2xl border border-[var(--ff-accent-border)]/50 bg-[var(--ff-accent-soft)]/15 p-3 text-left shadow-[0_0_16px_var(--ff-accent-shadow)]/15'
          : 'w-full rounded-2xl border border-zinc-800 bg-[#18181b] p-3 text-left transition hover:border-[var(--ff-accent-border)]/30 hover:bg-[#1f1f23]'
      }
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={
            active
              ? 'font-bold text-[var(--ff-accent-text)]'
              : 'font-bold text-white'
          }
        >
          {title}
        </span>

        <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px] font-bold text-zinc-500">
          {count}
        </span>
      </div>
    </button>
  )
}

function DetailMiniCard({ icon: Icon, title, value, accent = false }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-center gap-2">
        <div
          className={
            accent
              ? 'flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]'
              : 'flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400'
          }
        >
          <Icon size={16} />
        </div>

        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {title}
        </p>
      </div>

      <p className={accent ? 'mt-3 text-sm font-bold text-[var(--ff-accent-text)]' : 'mt-3 text-sm font-bold text-white'}>
        {value}
      </p>
    </div>
  )
}

function HelperTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  helper,
  examples = [],
}) {
  return (
    <div>
      <Textarea
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
      />

      <div className="mt-2 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
        <div className="flex items-start gap-2">
          <HelpCircle
            size={16}
            className="mt-0.5 shrink-0 text-[var(--ff-accent-text)]"
          />

          <div>
            <p className="text-xs leading-relaxed text-zinc-400">
              {helper}
            </p>

            {examples.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {examples.map((example) => (
                  <span
                    key={example}
                    className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-zinc-400"
                  >
                    {example}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MediaUploader({
  mediaUrl,
  uploadedFileName,
  onUrlChange,
  onFileChange,
  onClear,
}) {
  return (
    <div className="md:col-span-2">
      <label className="mb-2 block text-sm font-semibold text-zinc-300">
        Imagem ou GIF do exercício
      </label>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
          <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-white">
            {mediaUrl ? (
              <img
                src={mediaUrl}
                alt="Preview do exercício"
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="text-center text-zinc-900">
                <FileImage size={34} className="mx-auto" />

                <p className="mt-2 text-xs font-bold">
                  Preview
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--ff-accent-border)]/40 bg-[var(--ff-accent-soft)]/10 p-5 text-center transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-accent-soft)]/20">
              <Upload size={24} className="text-[var(--ff-accent-text)]" />

              <span className="mt-2 text-sm font-bold text-white">
                Enviar imagem ou GIF
              </span>

              <span className="mt-1 text-xs leading-relaxed text-zinc-500">
                Funciona no computador e no celular. Use PNG, JPG, WEBP ou GIF.
              </span>

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={onFileChange}
                className="hidden"
              />
            </label>

            {uploadedFileName && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-xs text-zinc-500">
                  Arquivo selecionado
                </p>

                <p className="mt-1 truncate text-sm font-bold text-[var(--ff-accent-text)]">
                  {uploadedFileName}
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <LinkIcon size={14} />
                Ou use uma URL
              </div>

              <Input
                placeholder="/exercise-media/chest/exemplo.gif ou https://..."
                value={mediaUrl}
                onChange={onUrlChange}
              />
            </div>

            {mediaUrl && (
              <button
                type="button"
                onClick={onClear}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 text-sm font-bold text-red-300 transition hover:bg-red-500/20"
              >
                <X size={16} />
                Remover mídia
              </button>
            )}

            <p className="text-xs leading-relaxed text-zinc-500">
              Para melhor performance no app, prefira URLs externas ou imagens leves. Base64 grande pesa no LocalStorage e deixa a biblioteca mais lenta.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT)

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

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT)
    setExpandedExerciseId(null)
  }, [deferredSearch, groupFilter, subgroupFilter, equipmentFilter, showOnlyFavorites])

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

  function renderInfoList(title, items, variant = 'default') {
    const normalizedItems = normalizeList(items)
    if (normalizedItems.length === 0) return null

    const isDanger = variant === 'danger'

    return (
      <div
        className={
          isDanger
            ? 'ff-danger-panel rounded-2xl border p-4'
            : 'rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4'
        }
      >
        <p
          className={
            isDanger
              ? 'ff-danger-title text-xs font-semibold uppercase tracking-wide'
              : 'text-xs font-semibold uppercase tracking-wide text-[var(--ff-muted)]'
          }
        >
          {title}
        </p>

        <ul className="ff-exercise-library-card mt-3 space-y-2">
          {normalizedItems.map((item, index) => (
            <li
              key={`${title}-${index}`}
              className={
                isDanger
                  ? 'text-sm font-medium leading-relaxed'
                  : 'text-sm leading-relaxed text-[var(--ff-text)]'
              }
            >
              <span className={isDanger ? 'ff-danger-index mr-2 font-black' : 'mr-2 font-bold text-[var(--ff-accent-text)]'}>
                {index + 1}.
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    )
  }

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
        <aside className="order-2 space-y-6 xl:order-1">
          <Card className="overflow-visible border border-zinc-800 bg-gradient-to-b from-[#17171b] to-[#121216]">
            <div className="border-b border-zinc-800 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
                  <Layers3 size={22} />
                </div>

                <div>
                  <h2 className="text-lg font-black">
                    Grupos musculares
                  </h2>

                  <p className="text-sm text-zinc-500">
                    Filtre pelas categorias principais.
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <Input
                  type="text"
                  placeholder="Buscar grupo..."
                  value={groupSearch}
                  onChange={(event) => setGroupSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="max-h-[55vh] space-y-2 overflow-y-auto overscroll-contain p-4 pt-4">
              {filteredGroupStats.map((group) => (
                <FilterListButton
                  key={group.name}
                  title={group.name}
                  count={group.count}
                  active={groupFilter === group.name}
                  onClick={() =>
                    setGroupFilter(groupFilter === group.name ? '' : group.name)
                  }
                />
              ))}

              {filteredGroupStats.length === 0 && (
                <p className="text-sm text-zinc-500">
                  Nenhum grupo encontrado.
                </p>
              )}
            </div>
          </Card>

          <Card className="overflow-visible border border-zinc-800 bg-gradient-to-b from-[#17171b] to-[#121216]">
            <div className="border-b border-zinc-800 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
                  <Target size={22} />
                </div>

                <div>
                  <h2 className="text-lg font-black">
                    Subgrupos
                  </h2>

                  <p className="text-sm text-zinc-500">
                    Ex.: Trapézio, Dorsal, Oblíquos.
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <Input
                  type="text"
                  placeholder="Buscar subgrupo..."
                  value={subgroupSearch}
                  onChange={(event) => setSubgroupSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="max-h-[55vh] space-y-2 overflow-y-auto overscroll-contain p-4 pt-4">
              {filteredSubgroupStats.map((subgroup) => (
                <FilterListButton
                  key={subgroup.name}
                  title={subgroup.name}
                  count={subgroup.count}
                  active={subgroupFilter === subgroup.name}
                  onClick={() =>
                    setSubgroupFilter(
                      subgroupFilter === subgroup.name ? '' : subgroup.name
                    )
                  }
                />
              ))}

              {filteredSubgroupStats.length === 0 && (
                <p className="text-sm text-zinc-500">
                  Nenhum subgrupo encontrado.
                </p>
              )}
            </div>
          </Card>

          <Card className="border border-zinc-800 bg-gradient-to-b from-[#17171b] to-[#121216]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
                <Filter size={22} />
              </div>

              <div>
                <h2 className="text-lg font-black">
                  Filtros rápidos
                </h2>

                <p className="text-sm text-zinc-500">
                  Refine a biblioteca rapidamente.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <Input
                type="search"
                placeholder="Buscar por nome, grupo, equipamento..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowOnlyFavorites((current) => !current)}
                className={
                  showOnlyFavorites
                    ? 'flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-sm font-bold text-yellow-300 transition hover:bg-yellow-500/20'
                    : 'flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 text-sm font-bold text-zinc-300 transition hover:border-yellow-500/30 hover:text-yellow-300'
                }
              >
                <Star
                  size={17}
                  fill={showOnlyFavorites ? 'currentColor' : 'none'}
                />
                Somente favoritos
              </button>

              <Select
                value={groupFilter}
                onChange={(event) => setGroupFilter(event.target.value)}
              >
                <option value="">Todos os grupos</option>

                {stats.muscleGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </Select>

              <Select
                value={subgroupFilter}
                onChange={(event) => setSubgroupFilter(event.target.value)}
              >
                <option value="">Todos os subgrupos</option>

                {stats.subgroupList.map((subgroup) => (
                  <option key={subgroup} value={subgroup}>
                    {subgroup}
                  </option>
                ))}
              </Select>

              <Select
                value={equipmentFilter}
                onChange={(event) => setEquipmentFilter(event.target.value)}
              >
                <option value="">Todos os equipamentos</option>

                {stats.equipmentList.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </Card>

          <Card className="hidden border border-zinc-800 bg-[#151518] xl:block">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
                <Wrench size={18} />
              </div>

              <div>
                <h2 className="text-base font-black">
                  Equipamentos
                </h2>


              </div>
            </div>

            <div className="mt-4 grid max-h-[150px] grid-cols-2 gap-2 overflow-y-auto pr-1">
              {stats.equipmentStats.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() =>
                    setEquipmentFilter(
                      equipmentFilter === item.name ? '' : item.name
                    )
                  }
                  className={
                    equipmentFilter === item.name
                      ? 'rounded-xl border border-[var(--ff-accent-border)]/40 bg-[var(--ff-accent-soft)]/10 p-2.5 text-left shadow-[0_0_14px_var(--ff-accent-shadow)]/10'
                      : 'rounded-xl border border-zinc-800 bg-[#18181b] p-2.5 text-left transition hover:border-[var(--ff-accent-border)]/30'
                  }
                >
                  <p className="line-clamp-1 text-xs font-semibold">
                    {item.name}
                  </p>

                  <p className="mt-1 text-[11px] text-zinc-500">
                    {item.count} ex.
                  </p>
                </button>
              ))}
            </div>
          </Card>
        </aside>

        <main className="order-1 xl:order-2">
          <Card className="overflow-visible border border-zinc-800 bg-gradient-to-b from-[#17171b] to-[#121216]">
            <div className="border-b border-zinc-800 p-5">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black">
                      Biblioteca
                    </h2>

                    <Badge variant="purple">
                      {filteredExercises.length}
                    </Badge>
                  </div>

                  <p className="mt-1 text-sm text-zinc-500">
                    {filteredExercises.length} exercícios encontrados • exibindo {displayedExercises.length}
                  </p>

                  <div className="mt-4 hidden min-w-0 max-w-full xl:block">
                    <div className="ff-filter-chips ff-exercise-quick-filter flex min-w-0 max-w-full gap-2 pb-2 pr-1">
                      <button
                        type="button"
                        onClick={clearFilters}
                        className={!hasActiveFilters ? 'shrink-0 rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-4 py-2 text-xs font-black text-[var(--ff-accent-text)]' : 'shrink-0 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-bold text-zinc-400'}
                      >
                        Todos
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowOnlyFavorites((current) => !current)}
                        className={showOnlyFavorites ? 'shrink-0 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs font-black text-yellow-300' : 'shrink-0 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-bold text-zinc-400'}
                      >
                        Favoritos
                      </button>

                      {stats.groupStats.map((group) => (
                        <button
                          key={group.name}
                          type="button"
                          onClick={() => setGroupFilter(groupFilter === group.name ? '' : group.name)}
                          className={groupFilter === group.name ? 'shrink-0 rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-4 py-2 text-xs font-black text-[var(--ff-accent-text)]' : 'shrink-0 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-bold text-zinc-400'}
                        >
                          {group.name}
                        </button>
                      ))}
                    </div>
                  </div>


                <div className="mt-4 space-y-3 xl:hidden">
                  <div className="flex h-12 items-center gap-3 rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-zinc-400">
                    <Search size={18} />

                    <input
                      type="search"
                      placeholder="Buscar exercício..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
                    />

                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="text-zinc-500 transition hover:text-white"
                        aria-label="Limpar busca"
                      >
                        <X size={17} />
                      </button>
                    )}
                  </div>

                  <div className="ff-filter-chips -mx-1 flex max-w-full gap-2 ff-mobile-chip-scroll overflow-x-auto overscroll-x-contain px-1 pb-2 pr-8 [scrollbar-width:none]">
                    <button
                      type="button"
                      onClick={() => {
                        setGroupFilter('')
                        setSubgroupFilter('')
                        setEquipmentFilter('')
                        setShowOnlyFavorites(false)
                      }}
                      className={
                        !hasActiveFilters
                          ? 'shrink-0 rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-4 py-2 text-xs font-black text-[var(--ff-accent-text)]'
                          : 'shrink-0 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-bold text-zinc-400'
                      }
                    >
                      Todos
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowOnlyFavorites((current) => !current)}
                      className={
                        showOnlyFavorites
                          ? 'shrink-0 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs font-black text-yellow-300'
                          : 'shrink-0 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-bold text-zinc-400'
                      }
                    >
                      Favoritos
                    </button>

                    {stats.groupStats.slice(0, 8).map((group) => (
                      <button
                        key={group.name}
                        type="button"
                        onClick={() => setGroupFilter(groupFilter === group.name ? '' : group.name)}
                        className={
                          groupFilter === group.name
                            ? 'shrink-0 rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-4 py-2 text-xs font-black text-[var(--ff-accent-text)]'
                            : 'shrink-0 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-bold text-zinc-400'
                        }
                      >
                        {group.name}
                      </button>
                    ))}
                  </div>
                </div>

                </div>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-5 text-sm font-bold text-white shadow-[0_0_20px_var(--ff-accent-shadow)] transition hover:bg-[var(--ff-accent-hover)]"
                >
                  <Plus size={18} />
                  Adicionar exercício
                </button>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto overscroll-contain p-4 xl:max-h-[900px]">
              {!isLoaded && (
                <EmptyState
                  title="Carregando biblioteca"
                  description="Preparando seus exercícios."
                />
              )}

              {isLoaded && filteredExercises.length === 0 && (
                <EmptyState
                  title="Nenhum exercício encontrado"
                  description="Tente limpar os filtros ou buscar por outro termo."
                />
              )}

              {displayedExercises.length > 0 && (
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
                  {displayedExercises.map((exercise) => {
                    const isExpanded = expandedExerciseId === exercise.id
                    const media = getExerciseMedia(exercise)
                    const secondaryMuscles = normalizeList(exercise.secondaryMuscles)

                    return (
                      <div
                        key={exercise.id}
                        className="overflow-hidden rounded-3xl border border-zinc-800 bg-[#18181b] transition hover:border-[var(--ff-accent-border)]/40 hover:bg-[#1f1f23]"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleExercise(exercise.id)}
                          className="relative w-full p-3 text-left sm:p-4"
                        >
                          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-4">
                            <div className="flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-700 bg-white shadow-inner xl:h-20 xl:w-20">
                              {media ? (
                                <img
                                  src={media}
                                  alt={exercise.name}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : (
                                <Dumbbell size={30} className="text-zinc-900" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="line-clamp-2 text-sm font-black leading-tight text-white xl:truncate xl:text-base">
                                  {exercise.name}
                                </h3>

                                {exercise.source === 'ForgeFlow' && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ff-accent-soft)]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--ff-accent-text)]">
                                    <Sparkles size={11} />
                                    Padrão
                                  </span>
                                )}
                              </div>

                              {exercise.originalName && exercise.originalName !== exercise.name && (
                                <p className="mt-0.5 truncate text-xs text-zinc-600">
                                  {exercise.originalName}
                                </p>
                              )}

                              <div className="mt-2 flex flex-wrap gap-1.5 xl:mt-3 xl:gap-2">
                                <Badge variant="purple">
                                  {exercise.normalizedGroup}
                                </Badge>

                                <Badge>
                                  {exercise.subgroup}
                                </Badge>

                                <Badge>
                                  {exercise.normalizedEquipment}
                                </Badge>

                                {media ? (
                                  <Badge variant="green">
                                    <ImageIcon size={13} />
                                    Mídia
                                  </Badge>
                                ) : (
                                  <Badge>
                                    Sem mídia
                                  </Badge>
                                )}
                                {exercise.isFavorite && (
                                  <Badge>
                                    ⭐ Favorito
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(event) => handleToggleFavorite(exercise, event)}
                              title={
                                exercise.isFavorite
                                  ? 'Remover dos favoritos'
                                  : 'Adicionar aos favoritos'
                              }
                              className={
                                exercise.isFavorite
                                  ? 'absolute right-2 top-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 backdrop-blur transition hover:bg-yellow-500/20 xl:static xl:h-10 xl:w-10'
                                  : 'absolute right-2 top-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/90 text-zinc-500 backdrop-blur transition hover:border-yellow-500/30 hover:bg-yellow-500/10 hover:text-yellow-300 xl:static xl:h-10 xl:w-10'
                              }
                            >
                              <Star
                                size={18}
                                fill={exercise.isFavorite ? 'currentColor' : 'none'}
                              />
                            </button>

                            <ChevronDown
                              size={22}
                              className={
                                isExpanded
                                  ? 'hidden shrink-0 rotate-180 text-[var(--ff-accent-text)] transition sm:block'
                                  : 'hidden shrink-0 text-zinc-500 transition sm:block'
                              }
                            />
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-zinc-800 px-4 pb-4">
                            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                              <DetailMiniCard
                                icon={Layers3}
                                title="Grupo"
                                value={exercise.normalizedGroup}
                              />

                              <DetailMiniCard
                                icon={Target}
                                title="Músculo alvo"
                                value={exercise.subgroup}
                                accent
                              />

                              <DetailMiniCard
                                icon={Wrench}
                                title="Equipamento"
                                value={exercise.normalizedEquipment}
                              />

                              <DetailMiniCard
                                icon={Activity}
                                title="Músculos secundários"
                                value={
                                  secondaryMuscles.length > 0
                                    ? secondaryMuscles.join(', ')
                                    : 'Não informado'
                                }
                              />
                            </div>

                            {exercise.description ? (
                              <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400">
                                    <Info size={16} />
                                  </div>

                                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                    Observações
                                  </p>
                                </div>

                                <p className="mt-3 text-sm text-zinc-300">
                                  {exercise.description}
                                </p>
                              </div>
                            ) : null}

                            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                              {renderInfoList(
                                'Execução correta',
                                exercise.instructions || exercise.execution
                              )}

                              {renderInfoList(
                                'Dicas',
                                exercise.tips
                              )}

                              {renderInfoList(
                                'Erros comuns',
                                exercise.commonMistakes,
                                'danger'
                              )}
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                              <Link
                                to={`/exercises/${exercise.id}`}
                                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 text-sm font-bold text-white transition hover:border-[var(--ff-accent-border)]/40 hover:bg-zinc-800"
                              >
                                <ExternalLink size={17} />
                                Detalhes
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleEdit(exercise)}
                                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)]/10 text-sm font-bold text-[var(--ff-accent-text)] transition hover:border-violet-400 hover:bg-[var(--ff-accent-hover)]/20"
                              >
                                <Edit3 size={17} />
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(exercise.id)}
                                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 text-sm font-bold text-red-300 transition hover:border-red-400/40 hover:bg-red-500/20"
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

                  {visibleCount < filteredExercises.length && (
                    <div className="pt-4">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setVisibleCount((current) => current + LOAD_MORE_COUNT)}
                        className="w-full"
                      >
                        Carregar mais 8 exercícios
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </main>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-zinc-800 bg-[#121212] shadow-2xl shadow-[0_0_20px_var(--ff-accent-shadow)]">
            <div className="sticky top-0 z-10 border-b border-zinc-800 bg-[#121212]/95 p-5 backdrop-blur-xl sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--ff-accent-text)]">
                    {editingId ? 'Editar exercício' : 'Novo exercício'}
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    {editingId ? 'Atualizar exercício' : 'Cadastrar exercício'}
                  </h2>

                  <p className="mt-2 text-sm text-zinc-500">
                    Adicione grupo, subgrupo, músculos secundários, mídia e instruções.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="max-h-[calc(92vh-120px)] overflow-y-auto p-5 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Nome"
                  type="text"
                  placeholder="Ex: Supino reto"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />

                <MediaUploader
                  mediaUrl={mediaUrl}
                  uploadedFileName={uploadedFileName}
                  onUrlChange={(event) => {
                    setMediaUrl(event.target.value)
                    setUploadedFileName('')
                  }}
                  onFileChange={handleMediaUpload}
                  onClear={handleClearMedia}
                />

                <Select
                  label="Grupo muscular"
                  value={muscleGroup}
                  onChange={(event) => setMuscleGroup(event.target.value)}
                >
                  <option value="">Selecione</option>

                  {muscleGroupOrder.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Subgrupo / músculo alvo"
                  placeholder="Ex: Trapézio, Dorsal, Oblíquos..."
                  value={targetMuscle}
                  onChange={(event) => setTargetMuscle(event.target.value)}
                />

                <Select
                  label="Equipamento"
                  value={equipment}
                  onChange={(event) => setEquipment(event.target.value)}
                >
                  <option value="">Selecione</option>

                  {stats.equipmentList.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="mt-4 space-y-4">
                <HelperTextarea
                  label="Músculos secundários"
                  placeholder={`Exemplo:
Tríceps
Ombros
Core`}
                  value={secondaryMusclesText}
                  onChange={(event) => setSecondaryMusclesText(event.target.value)}
                  rows={4}
                  helper="Escreva um item em cada linha. Cada linha vira um item separado na tela de detalhes."
                  examples={['Tríceps', 'Ombros', 'Core']}
                />

                <Textarea
                  label="Observações"
                  placeholder="Ex: bom exercício para progressão de carga, ideal para iniciar o treino de peito..."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                />

                <HelperTextarea
                  label="Execução correta"
                  placeholder={`Exemplo:
Deite no banco com os pés firmes no chão.
Segure a barra um pouco mais aberta que os ombros.
Desça a barra com controle até próximo ao peito.
Empurre a barra para cima sem tirar o quadril do banco.`}
                  value={execution}
                  onChange={(event) => setExecution(event.target.value)}
                  rows={5}
                  helper="Escreva o passo a passo da execução. Separe cada etapa em uma nova linha para o app organizar em lista."
                  examples={['1 etapa por linha', 'passo a passo', 'execução guiada']}
                />

                <HelperTextarea
                  label="Erros comuns"
                  placeholder={`Exemplo:
Quicar a barra no peito.
Abrir demais os cotovelos.
Tirar o quadril do banco.`}
                  value={commonMistakes}
                  onChange={(event) => setCommonMistakes(event.target.value)}
                  rows={4}
                  helper="Liste os erros que a pessoa deve evitar. Cada erro em uma linha."
                  examples={['erro por linha', 'evitar', 'alertas']}
                />

                <HelperTextarea
                  label="Dicas"
                  placeholder={`Exemplo:
Mantenha as escápulas retraídas.
Controle a descida.
Mantenha os pés firmes no chão.`}
                  value={variations}
                  onChange={(event) => setVariations(event.target.value)}
                  rows={4}
                  helper="Use este campo para dicas rápidas de melhoria, segurança ou foco muscular. Cada dica em uma linha."
                  examples={['dica por linha', 'segurança', 'foco muscular']}
                />
              </div>
            </form>

            <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-zinc-800 bg-[#121212]/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl sm:absolute">
              <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-3">
                <Button type="submit" onClick={handleSubmit} className="w-full">
                  {editingId ? 'Salvar' : 'Cadastrar'}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeModal}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Exercises
