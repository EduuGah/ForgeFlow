import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  X,
  Dumbbell,
  ImageIcon,
  Edit3,
  Trash2,
  ExternalLink,
  ChevronDown,
  Layers3,
  Filter,
  Sparkles,
  Target,
  Activity,
  Wrench,
  Info,
  Upload,
  FileImage,
  LinkIcon,
  HelpCircle,
  ListChecks,
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
  'Barra EZ',
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

  return aliases[normalized] || normalized
}

function normalizeExerciseFromApi(exercise) {
  return {
    ...exercise,
    id: exercise._id || exercise.id,
    normalizedGroup: normalizeMuscleGroup(exercise.muscleGroup),
    normalizedEquipment: normalizeEquipment(exercise.equipment),
    subgroup: getSubgroup(exercise),
    isFavorite: Boolean(exercise.isFavorite),
  }
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
  }

  return aliases[normalized] || normalized
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

    return a.localeCompare(b)
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

          <div className="space-y-3">
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
              Observação: imagens/GIFs muito grandes podem não salvar bem no navegador. Para arquivos grandes, prefira uma URL ou, futuramente, um storage como Cloudinary, Firebase ou backend próprio.
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
  const [groupFilter, setGroupFilter] = useState('')
  const [subgroupFilter, setSubgroupFilter] = useState('')
  const [equipmentFilter, setEquipmentFilter] = useState('')
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [groupSearch, setGroupSearch] = useState('')
  const [subgroupSearch, setSubgroupSearch] = useState('')

  const [expandedExerciseId, setExpandedExerciseId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(80)

  const [exercises, setExercises] = useState([])

  useEffect(() => {
    if (!user) return

    async function loadExercises() {
      setIsLoaded(false)

      const savedExercises = getUserStorageData(user, 'exercises', null)

      const fallbackExercises = Array.isArray(savedExercises)
        ? savedExercises
        : getInitialExercises()

      try {
        const exercisesFromApi = await apiFetch('/exercises')

        const normalizedFromApi = Array.isArray(exercisesFromApi)
          ? exercisesFromApi.map(normalizeExerciseFromApi)
          : []

        const finalExercises =
          normalizedFromApi.length > 0 ? normalizedFromApi : fallbackExercises

        setExercises(finalExercises)
        saveUserStorageData(user, 'exercises', finalExercises)
      } catch (error) {
        console.error(error)
        setExercises(fallbackExercises)
      } finally {
        setIsLoaded(true)
      }
    }

    loadExercises()
  }, [user])

  useEffect(() => {
    if (!isLoaded || !user) return

    saveUserStorageData(user, 'exercises', exercises)
  }, [exercises, isLoaded, user])

  useEffect(() => {
    setVisibleCount(80)
    setExpandedExerciseId(null)
  }, [search, groupFilter, subgroupFilter, equipmentFilter, showOnlyFavorites])

  const normalizedExercises = useMemo(() => {
    return exercises.map((exercise) => {
      const normalizedGroup = normalizeMuscleGroup(exercise.muscleGroup)
      const normalizedEquipment = normalizeEquipment(exercise.equipment)
      const subgroup = getSubgroup(exercise)

      return {
        ...exercise,
        normalizedGroup,
        normalizedEquipment,
        subgroup,
      }
    })
  }, [exercises])

  const muscleGroups = useMemo(() => {
    return getSortedUnique(
      normalizedExercises.map((exercise) => exercise.normalizedGroup),
      muscleGroupOrder
    )
  }, [normalizedExercises])

  const subgroupList = useMemo(() => {
    return getSortedUnique(
      normalizedExercises.map((exercise) => exercise.subgroup)
    )
  }, [normalizedExercises])

  const equipmentList = useMemo(() => {
    return getSortedUnique(
      [
        ...defaultEquipmentList,
        ...normalizedExercises.map((exercise) => exercise.normalizedEquipment),
      ],
      defaultEquipmentList
    )
  }, [normalizedExercises])

  const filteredExercises = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim()

    const filtered = normalizedExercises.filter((exercise) => {
      const text = `
      ${exercise.name || ''}
      ${exercise.originalName || ''}
      ${exercise.normalizedGroup || ''}
      ${exercise.subgroup || ''}
      ${exercise.normalizedEquipment || ''}
      ${exercise.description || ''}
      ${normalizeList(exercise.secondaryMuscles).join(' ')}
    `.toLowerCase()

      const matchesSearch = normalizedSearch
        ? text.includes(normalizedSearch)
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
    normalizedExercises,
    search,
    groupFilter,
    subgroupFilter,
    equipmentFilter,
    showOnlyFavorites,
  ])

  const displayedExercises = useMemo(() => {
    return filteredExercises.slice(0, visibleCount)
  }, [filteredExercises, visibleCount])

  const groupStats = useMemo(() => {
    return muscleGroups
      .map((group) => ({
        name: group,
        count: normalizedExercises.filter(
          (exercise) => exercise.normalizedGroup === group
        ).length,
      }))
      .filter((group) => group.count > 0)
  }, [muscleGroups, normalizedExercises])

  const subgroupStats = useMemo(() => {
    return subgroupList
      .map((subgroup) => ({
        name: subgroup,
        count: normalizedExercises.filter(
          (exercise) => exercise.subgroup === subgroup
        ).length,
      }))
      .filter((subgroup) => subgroup.count > 0)
  }, [subgroupList, normalizedExercises])

  const equipmentStats = useMemo(() => {
    return equipmentList
      .map((item) => ({
        name: item,
        count: normalizedExercises.filter(
          (exercise) => exercise.normalizedEquipment === item
        ).length,
      }))
      .filter((item) => item.count > 0)
  }, [equipmentList, normalizedExercises])

  const filteredGroupStats = useMemo(() => {
    const term = groupSearch.toLowerCase().trim()

    if (!term) return groupStats

    return groupStats.filter((group) =>
      group.name.toLowerCase().includes(term)
    )
  }, [groupStats, groupSearch])

  const filteredSubgroupStats = useMemo(() => {
    const term = subgroupSearch.toLowerCase().trim()

    if (!term) return subgroupStats

    return subgroupStats.filter((subgroup) =>
      subgroup.name.toLowerCase().includes(term)
    )
  }, [subgroupStats, subgroupSearch])

  function renderInfoList(title, items, variant = 'default') {
    const normalizedItems = normalizeList(items)
    if (normalizedItems.length === 0) return null

    const isDanger = variant === 'danger'

    return (
      <div
        className={
          isDanger
            ? 'rounded-2xl border border-red-500/20 bg-red-500/5 p-4'
            : 'rounded-2xl border border-zinc-800 bg-zinc-950 p-4'
        }
      >
        <p
          className={
            isDanger
              ? 'text-xs font-semibold uppercase tracking-wide text-red-300'
              : 'text-xs font-semibold uppercase tracking-wide text-zinc-500'
          }
        >
          {title}
        </p>

        <ul className="mt-3 space-y-2">
          {normalizedItems.map((item, index) => (
            <li
              key={`${title}-${index}`}
              className={
                isDanger
                  ? 'text-sm leading-relaxed text-red-100'
                  : 'text-sm leading-relaxed text-zinc-300'
              }
            >
              <span className="mr-2 font-bold text-[var(--ff-accent-text)]">
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
            ? {
              ...exercise,
              ...normalizedPayload,
              updatedAt: new Date().toISOString(),
            }
            : exercise
        )
      )

      closeModal()
      return
    }

    const newExercise = {
      id: crypto.randomUUID(),
      source: 'ForgeFlow',
      originalName: name.trim(),
      ...normalizedPayload,
      createdAt: new Date().toISOString(),
    }

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

    const updatedExercisesLocal = exercises.map((item) =>
      item.id === exercise.id
        ? {
          ...item,
          isFavorite: !item.isFavorite,
        }
        : item
    )

    const saveLocalFavorite = () => {
      setExercises(updatedExercisesLocal)
      saveUserStorageData(user, 'exercises', updatedExercisesLocal)
    }

    if (!isMongoId(exercise.id)) {
      saveLocalFavorite()
      return
    }

    try {
      const updatedExerciseFromApi = await apiFetch(
        `/exercises/${exercise.id}/favorite`,
        {
          method: 'PATCH',
        }
      )

      const updatedExercise = normalizeExerciseFromApi(updatedExerciseFromApi)

      const updatedExercises = exercises.map((item) =>
        item.id === exercise.id ? updatedExercise : item
      )

      setExercises(updatedExercises)
      saveUserStorageData(user, 'exercises', updatedExercises)
    } catch (error) {
      console.error(error)

      saveLocalFavorite()
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

  const favoriteExercisesCount = normalizedExercises.filter(
    (exercise) => exercise.isFavorite
  ).length

  return (
    <>
      <PageHeader
        title="Exercícios"
        description="Biblioteca premium com grupos, subgrupos, equipamentos, GIFs e detalhes completos."
        action={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-5 text-sm font-bold text-white shadow-[0_0_20px_var(--ff-accent-shadow)] transition hover:bg-[var(--ff-accent-hover)]"
          >
            <Plus size={18} />
            Adicionar exercício
          </button>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total"
          value={normalizedExercises.length}
          description="Exercícios cadastrados"
          icon={Dumbbell}
        />

        <StatCard
          title="Grupos"
          value={groupStats.length}
          description="Grupos musculares ativos"
          icon={Layers3}
        />

        <StatCard
          title="Subgrupos"
          value={subgroupStats.length}
          description="Músculos-alvo mapeados"
          icon={Target}
        />

        <StatCard
          title="Favoritos"
          value={favoriteExercisesCount}
          description="Exercícios marcados"
          icon={Star}
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <Card className="overflow-hidden border border-zinc-800 bg-gradient-to-b from-[#17171b] to-[#121216]">
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

            <div className="max-h-[330px] space-y-2 overflow-y-auto p-4 pt-4">
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

          <Card className="overflow-hidden border border-zinc-800 bg-gradient-to-b from-[#17171b] to-[#121216]">
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

            <div className="max-h-[350px] space-y-2 overflow-y-auto p-4 pt-4">
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
                type="text"
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

                {muscleGroups.map((group) => (
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

                {subgroupList.map((subgroup) => (
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

                {equipmentList.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>

              {(search || groupFilter || subgroupFilter || equipmentFilter || showOnlyFavorites) && (
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

          <Card className="border border-zinc-800 bg-gradient-to-b from-[#17171b] to-[#121216]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
                <Wrench size={22} />
              </div>

              <div>
                <h2 className="text-lg font-black">
                  Equipamentos
                </h2>

                <p className="text-sm text-zinc-500">
                  Veja por ferramenta utilizada.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {equipmentStats.map((item) => (
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
                      ? 'rounded-2xl border border-[var(--ff-accent-border)]/40 bg-[var(--ff-accent-soft)]/10 p-3 text-left shadow-[0_0_14px_var(--ff-accent-shadow)]/10'
                      : 'rounded-2xl border border-zinc-800 bg-[#18181b] p-3 text-left transition hover:border-[var(--ff-accent-border)]/30'
                  }
                >
                  <p className="text-sm font-semibold">
                    {item.name}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {item.count}
                  </p>
                </button>
              ))}
            </div>
          </Card>
        </aside>

        <main>
          <Card className="overflow-hidden border border-zinc-800 bg-gradient-to-b from-[#17171b] to-[#121216]">
            <div className="border-b border-zinc-800 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
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

            <div className="max-h-[900px] overflow-y-auto p-4">
              {filteredExercises.length === 0 && (
                <EmptyState
                  title="Nenhum exercício encontrado"
                  description="Tente limpar os filtros ou buscar por outro termo."
                />
              )}

              {displayedExercises.length > 0 && (
                <div className="space-y-3">
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
                          className="w-full p-4 text-left"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-700 bg-white shadow-inner">
                              {media ? (
                                <img
                                  src={media}
                                  alt={exercise.name}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <Dumbbell size={30} className="text-zinc-900" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-base font-black text-white">
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

                              <div className="mt-3 flex flex-wrap gap-2">
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
                                  ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 transition hover:bg-yellow-500/20'
                                  : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-500 transition hover:border-yellow-500/30 hover:bg-yellow-500/10 hover:text-yellow-300'
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
                                  ? 'shrink-0 rotate-180 text-[var(--ff-accent-text)] transition'
                                  : 'shrink-0 text-zinc-500 transition'
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
                        onClick={() => setVisibleCount((current) => current + 80)}
                        className="w-full"
                      >
                        Carregar mais exercícios
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </main>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-zinc-800 bg-[#121212] p-6 shadow-2xl shadow-[0_0_20px_var(--ff-accent-shadow)]">
            <div className="mb-6 flex items-start justify-between gap-4">
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

            <form onSubmit={handleSubmit}>
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

                  {equipmentList.map((item) => (
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

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button type="submit" className="w-full">
                  {editingId ? 'Salvar alterações' : 'Cadastrar exercício'}
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
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Exercises