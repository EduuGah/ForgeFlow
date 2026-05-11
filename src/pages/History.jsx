import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  ChevronDown,
  Dumbbell,
  Flame,
  Medal,
  Search,
  Trash2,
  Trophy,
  X,
} from 'lucide-react'

import { getAppSettings } from '../utils/settingsUtils'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import {
  getUserStorageData,
  saveUserStorageData,
  removeUserStorageData,
} from '../utils/userStorage'

const INITIAL_VISIBLE_SESSIONS = 10
const LOAD_MORE_SESSIONS = 10

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
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

function formatTime(seconds) {
  const safeSeconds = Number(seconds) || 0
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const secs = safeSeconds % 60

  return [hours, minutes, secs]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

function formatDate(dateString) {
  if (!dateString) return 'Sem data'

  const date = new Date(dateString)

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatShortDate(dateString) {
  if (!dateString) return 'Sem data'

  const date = new Date(dateString)

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function formatHour(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString)

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatVolume(value) {
  return `${Number(value || 0).toLocaleString('pt-BR')}kg`
}

function isValidWorkingSet(set) {
  return (
    set.type !== 'warmup' &&
    set.completed &&
    set.weight &&
    set.reps &&
    Number(set.weight) > 0 &&
    Number(set.reps) > 0
  )
}

function getSessionCompletedSets(session) {
  return session.exercises.flatMap((exercise) =>
    (exercise.sets || [])
      .filter(isValidWorkingSet)
      .map((set) => ({
        ...set,
        exerciseName: exercise.exercise?.name,
        muscleGroup: exercise.exercise?.muscleGroup,
        equipment: exercise.exercise?.equipment,
      }))
  )
}

function getSessionVolumeFromSets(sets = []) {
  return sets.reduce((total, set) => {
    const weight = Number(set.weight) || 0
    const reps = Number(set.reps) || 0

    return total + weight * reps
  }, 0)
}

function getSessionPRsFromSets(sets = []) {
  return sets.filter((set) => set.isPR || set.isWeightPR || set.isVolumePR)
}

function getExerciseVolume(exercise) {
  return (exercise.sets || []).reduce((total, set) => {
    if (!set.completed) return total

    const weight = Number(set.weight) || 0
    const reps = Number(set.reps) || 0

    return total + weight * reps
  }, 0)
}

function buildSessionMeta(session, index, totalSessions) {
  const completedSets = getSessionCompletedSets(session)
  const sessionVolume = getSessionVolumeFromSets(completedSets)
  const sessionPRs = getSessionPRsFromSets(completedSets)
  const exerciseNames = session.exercises
    .map((item) => item.exercise?.name)
    .filter(Boolean)
    .join(' ')

  const searchableText = normalizeText(`${session.workoutName} ${exerciseNames}`)

  return {
    id: session.id,
    indexLabel: totalSessions - index,
    completedSets,
    sessionVolume,
    sessionPRs,
    searchableText,
    finishedDate: session.finishedAt ? new Date(session.finishedAt) : null,
  }
}

function StatCard({ title, value, description, icon: Icon, accent = false }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">
            {title}
          </p>

          <h3
            className={
              accent
                ? 'mt-2 text-3xl font-black text-[var(--ff-accent-text)]'
                : 'mt-2 text-3xl font-black text-[var(--ff-text)]'
            }
          >
            {value}
          </h3>

          <p className="mt-2 text-xs text-[var(--ff-accent-text)]">
            {description}
          </p>
        </div>

        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
            <Icon size={21} />
          </div>
        )}
      </div>
    </Card>
  )
}

function History() {
  const { user } = useAuth()

  const [history, setHistory] = useState([])
  const [expandedSessionId, setExpandedSessionId] = useState(null)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_SESSIONS)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [source, setSource] = useState('local')

  const startDateRef = useRef(null)
  const endDateRef = useRef(null)

  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)

  const settings = getAppSettings()

  useEffect(() => {
    if (!user) return undefined

    let isMounted = true

    async function loadHistory() {
      const cachedHistory = getUserStorageData(user, 'history', [])

      setHistory(cachedHistory)
      setSource(cachedHistory.length > 0 ? 'local' : 'empty')
      setLoading(false)
      setSyncing(true)

      try {
        const historyFromApi = await apiFetch('/workout-history')

        if (!isMounted) return

        const normalizedHistory = Array.isArray(historyFromApi)
          ? historyFromApi.map(normalizeHistoryFromApi)
          : []

        setHistory(normalizedHistory)
        saveUserStorageData(user, 'history', normalizedHistory)
        setSource('database')
      } catch (error) {
        console.error(error)

        if (!isMounted) return

        setHistory(cachedHistory)
        setSource('local')

        if (cachedHistory.length > 0) {
          showToast(
            'error',
            'Usando histórico local',
            'Não foi possível carregar o histórico do servidor.'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
          setSyncing(false)
        }
      }
    }

    loadHistory()

    return () => {
      isMounted = false
    }
  }, [user])

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_SESSIONS)
    setExpandedSessionId(null)
  }, [deferredSearch, startDate, endDate])

  const historyMetaMap = useMemo(() => {
    const map = new Map()

    history.forEach((session, index) => {
      map.set(session.id, buildSessionMeta(session, index, history.length))
    })

    return map
  }, [history])

  const filteredHistory = useMemo(() => {
    const normalizedSearch = normalizeText(deferredSearch)

    return history.filter((session) => {
      const meta = historyMetaMap.get(session.id)

      const matchesSearch = normalizedSearch
        ? meta?.searchableText?.includes(normalizedSearch)
        : true

      let matchesDate = true

      if (meta?.finishedDate && startDate) {
        const start = new Date(`${startDate}T00:00:00`)
        matchesDate = matchesDate && meta.finishedDate >= start
      }

      if (meta?.finishedDate && endDate) {
        const end = new Date(`${endDate}T23:59:59`)
        matchesDate = matchesDate && meta.finishedDate <= end
      }

      return matchesSearch && matchesDate
    })
  }, [history, historyMetaMap, deferredSearch, startDate, endDate])

  const visibleHistory = useMemo(() => {
    return filteredHistory.slice(0, visibleCount)
  }, [filteredHistory, visibleCount])

  const summary = useMemo(() => {
    let totalVolume = 0
    let totalPRs = 0
    let totalCompletedSets = 0

    history.forEach((session) => {
      const meta = historyMetaMap.get(session.id)

      totalVolume += meta?.sessionVolume || 0
      totalPRs += meta?.sessionPRs?.length || 0
      totalCompletedSets += meta?.completedSets?.length || 0
    })

    return {
      totalVolume,
      totalPRs,
      totalCompletedSets,
      lastWorkout: history[0] || null,
    }
  }, [history, historyMetaMap])

  function handleToggleSession(id) {
    setExpandedSessionId(
      expandedSessionId === id ? null : id
    )
  }

  function showToast(type, title, message = '') {
    setToast({
      type,
      title,
      message,
    })

    window.setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  function clearFilters() {
    setSearch('')
    setStartDate('')
    setEndDate('')
  }

  function handleClearHistory() {
    setConfirmModal({
      title: 'Limpar histórico?',
      description: 'Todos os treinos finalizados serão removidos do histórico. Essa ação não pode ser desfeita.',
      confirmText: 'Limpar tudo',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await apiFetch('/workout-history', {
            method: 'DELETE',
          })

          removeUserStorageData(user, 'history')
          setHistory([])
          setConfirmModal(null)

          showToast(
            'success',
            'Histórico limpo',
            'Todos os treinos foram removidos.'
          )
        } catch (error) {
          console.error(error)

          showToast(
            'error',
            'Erro ao limpar',
            error.message || 'Não foi possível limpar o histórico.'
          )
        }
      },
    })
  }

  function handleDeleteSession(id) {
    const session = history.find((item) => item.id === id)

    setConfirmModal({
      title: 'Excluir treino?',
      description: `O treino "${session?.workoutName || 'selecionado'}" será removido permanentemente do histórico.`,
      confirmText: 'Excluir',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await apiFetch(`/workout-history/${id}`, {
            method: 'DELETE',
          })

          const updatedHistory = history.filter((session) => session.id !== id)

          setHistory(updatedHistory)
          saveUserStorageData(user, 'history', updatedHistory)
          setConfirmModal(null)

          showToast(
            'success',
            'Treino excluído',
            'O registro foi removido do histórico.'
          )
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

  const hasActiveFilters = Boolean(search || startDate || endDate)

  return (
    <>
      <PageHeader
        title="Histórico"
        description="Revise seus treinos finalizados, séries, volume e recordes pessoais."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={source === 'database' ? 'purple' : 'default'}>
              {syncing || loading
                ? 'Sincronizando...'
                : source === 'database'
                  ? 'Sincronizado'
                  : source === 'empty'
                    ? 'Sem histórico'
                    : 'Local'}
            </Badge>

            <Badge variant="purple">
              {history.length} treinos
            </Badge>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Treinos"
          value={history.length}
          description="Finalizados"
          icon={CalendarDays}
        />

        <StatCard
          title="Séries concluídas"
          value={summary.totalCompletedSets}
          description="Registradas"
          icon={Medal}
        />

        <StatCard
          title="Volume total"
          value={formatVolume(summary.totalVolume)}
          description="Peso × reps"
          icon={Flame}
          accent
        />

        <StatCard
          title="PRs"
          value={`🏆 ${summary.totalPRs}`}
          description="Recordes batidos"
          icon={Trophy}
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_340px] 2xl:gap-6">
        <div>
          <Card>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-2xl font-black">
                  Treinos finalizados
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  {filteredHistory.length} de {history.length} registros encontrados
                </p>
              </div>

              {history.length > 0 && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleClearHistory}
                  className="w-full lg:w-auto"
                >
                  <Trash2 size={17} />
                  Limpar histórico
                </Button>
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 2xl:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500">
                  Buscar
                </label>

                <div className="flex h-12 items-center gap-3 rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-zinc-400">
                  <Search size={20} />

                  <input
                    type="search"
                    placeholder="Treino ou exercício..."
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
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500">
                  Data inicial
                </label>

                <input
                  ref={startDateRef}
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="h-12 w-full cursor-pointer rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-sm font-bold text-white outline-none transition hover:border-zinc-700 focus:border-[var(--ff-accent-border)] focus:ring-2 focus:ring-violet-500/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500">
                  Data final
                </label>

                <input
                  ref={endDateRef}
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-12 w-full cursor-pointer rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-sm font-bold text-white outline-none transition hover:border-zinc-700 focus:border-[var(--ff-accent-border)] focus:ring-2 focus:ring-violet-500/10"
                />
              </div>

              <div className="flex items-end">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-sm font-bold text-zinc-300 transition hover:border-[var(--ff-accent-border)]/40 hover:text-white"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {loading && history.length === 0 && (
                <EmptyState
                  title="Carregando histórico"
                  description="Buscando seus treinos finalizados."
                />
              )}

              {!loading && history.length === 0 && (
                <EmptyState
                  title="Nenhum treino finalizado"
                  description="Finalize um treino para ele aparecer aqui."
                />
              )}

              {history.length > 0 && filteredHistory.length === 0 && (
                <EmptyState
                  title="Nenhum treino encontrado"
                  description="Tente buscar por outro nome de treino ou exercício."
                />
              )}

              {visibleHistory.map((session) => {
                const meta = historyMetaMap.get(session.id)
                const isExpanded = expandedSessionId === session.id
                const sessionVolume = meta?.sessionVolume || 0
                const sessionPRs = meta?.sessionPRs || []
                const indexLabel = meta?.indexLabel || ''

                return (
                  <div
                    key={session.id}
                    className="overflow-hidden rounded-3xl border border-zinc-800 bg-[#18181b] transition hover:border-[var(--ff-accent-border)]/30"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSession(session.id)}
                      className="w-full p-4 text-left sm:p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--ff-accent-border)]/20 bg-[var(--ff-accent-soft)]/10 text-sm font-bold text-[var(--ff-accent-text)]">
                              #{indexLabel}
                            </span>

                            <div className="min-w-0">
                              <h3 className="line-clamp-2 text-xl font-black text-white">
                                {session.workoutName}
                              </h3>

                              <p className="mt-1 text-sm text-zinc-500">
                                {formatDate(session.finishedAt)} às {formatHour(session.finishedAt)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                              <p className="text-xs text-zinc-500">
                                Duração
                              </p>

                              <p className="mt-1 font-bold text-[var(--ff-accent-text)]">
                                {formatTime(session.duration || 0)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                              <p className="text-xs text-zinc-500">
                                Exercícios
                              </p>

                              <p className="mt-1 font-bold">
                                {session.exercises.length}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                              <p className="text-xs text-zinc-500">
                                Volume
                              </p>

                              <p className="mt-1 font-bold">
                                {formatVolume(sessionVolume)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                              <p className="text-xs text-zinc-500">
                                PRs
                              </p>

                              <p className="mt-1 font-bold text-yellow-300">
                                {sessionPRs.length}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {sessionPRs.length > 0 && (
                            <Badge>
                              🏆 {sessionPRs.length} PR
                            </Badge>
                          )}

                          <ChevronDown
                            size={24}
                            className={
                              isExpanded
                                ? 'rotate-180 text-[var(--ff-accent-text)] transition'
                                : 'text-zinc-500 transition'
                            }
                          />
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-zinc-800 p-4 sm:p-5">
                        <div className="max-h-[520px] space-y-4 overflow-y-auto pr-1">
                          {session.exercises.map((exercise, exerciseIndex) => {
                            const exerciseVolume = getExerciseVolume(exercise)
                            const validSets = (exercise.sets || []).filter(isValidWorkingSet)

                            return (
                              <div
                                key={exercise.id}
                                className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-700 bg-white sm:h-16 sm:w-16 sm:rounded-full">
                                    {exercise.exercise?.mediaUrl ? (
                                      <img
                                        src={exercise.exercise.mediaUrl}
                                        alt={exercise.exercise.name}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                        decoding="async"
                                      />
                                    ) : (
                                      <Dumbbell size={28} className="text-zinc-900" />
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--ff-accent-soft)]/10 text-xs font-bold text-[var(--ff-accent-text)]">
                                        {exerciseIndex + 1}
                                      </span>

                                      <h3 className="truncate text-lg font-bold">
                                        {exercise.exercise.name}
                                      </h3>
                                    </div>

                                    <p className="mt-1 text-sm text-zinc-500">
                                      {exercise.exercise.muscleGroup} • {exercise.exercise.equipment}
                                    </p>

                                    <div className="mt-2 flex flex-wrap gap-2">
                                      <Badge variant="purple">
                                        {validSets.length} séries
                                      </Badge>

                                      <Badge>
                                        {formatVolume(exerciseVolume)} volume
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4">
                                  <div className="mb-2 hidden grid-cols-[70px_minmax(90px,1fr)_minmax(90px,1fr)_minmax(90px,1fr)_140px] gap-3 px-3 text-xs font-bold uppercase tracking-wide text-zinc-500 md:grid">
                                    <span>Série</span>
                                    <span>KG</span>
                                    <span>Reps</span>
                                    <span>Volume</span>
                                    <span>Recorde</span>
                                  </div>

                                  <div className="space-y-2">
                                    {validSets.map((set) => {
                                      const weight = Number(set.weight) || 0
                                      const reps = Number(set.reps) || 0
                                      const volume = weight * reps

                                      return (
                                        <div
                                          key={set.id}
                                          className="grid grid-cols-2 gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 md:grid-cols-[70px_minmax(90px,1fr)_minmax(90px,1fr)_minmax(90px,1fr)_140px] md:items-center"
                                        >
                                          <div>
                                            <p className="text-xs text-zinc-500 md:hidden">
                                              Série
                                            </p>

                                            <p className="font-bold">
                                              {set.setNumber}
                                            </p>
                                          </div>

                                          <div>
                                            <p className="text-xs text-zinc-500 md:hidden">
                                              KG
                                            </p>

                                            <p className="font-semibold">
                                              {set.weight || '-'}kg
                                            </p>
                                          </div>

                                          <div>
                                            <p className="text-xs text-zinc-500 md:hidden">
                                              Reps
                                            </p>

                                            <p className="font-semibold">
                                              {set.reps || '-'}
                                            </p>
                                          </div>

                                          <div>
                                            <p className="text-xs text-zinc-500 md:hidden">
                                              Volume
                                            </p>

                                            <p className="font-semibold text-orange-300">
                                              {volume ? `${volume}kg` : '-'}
                                            </p>
                                          </div>

                                          <div className="col-span-2 flex flex-wrap gap-1 md:col-span-1">
                                            {set.isWeightPR && (
                                              <span className="rounded-lg bg-[var(--ff-accent-soft)]/20 px-2 py-1 text-[10px] font-bold text-[var(--ff-accent-text)]">
                                                PESO PR
                                              </span>
                                            )}

                                            {set.isVolumePR && (
                                              <span className="rounded-lg bg-yellow-500/20 px-2 py-1 text-[10px] font-bold text-yellow-300">
                                                VOL PR
                                              </span>
                                            )}

                                            {set.isPR && !set.isWeightPR && !set.isVolumePR && (
                                              <span className="rounded-lg bg-yellow-500/20 px-2 py-1 text-[10px] font-bold text-yellow-300">
                                                PR
                                              </span>
                                            )}

                                            {!set.isPR && !set.isWeightPR && !set.isVolumePR && (
                                              <span className="text-xs text-zinc-600">
                                                —
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {session.notes && (
                          <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
                            <h3 className="font-bold">
                              Observações finais
                            </h3>

                            <p className="mt-3 leading-relaxed text-zinc-300">
                              {session.notes}
                            </p>
                          </div>
                        )}

                        <div className="mt-5 rounded-3xl border border-red-500/20 bg-red-500/5 p-5">
                          <h3 className="font-bold text-red-400">
                            Zona de perigo
                          </h3>

                          <p className="mt-1 text-sm text-zinc-500">
                            Remova este treino específico do histórico.
                          </p>

                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => handleDeleteSession(session.id)}
                            className="mt-4 w-full sm:w-auto"
                          >
                            <Trash2 size={17} />
                            Excluir este treino
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {visibleCount < filteredHistory.length && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setVisibleCount((current) => current + LOAD_MORE_SESSIONS)}
                  className="w-full"
                >
                  Carregar mais treinos
                </Button>
              )}
            </div>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <h2 className="text-xl font-bold">
              Resumo geral
            </h2>

            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
                  <CalendarDays size={22} />
                </div>

                <div>
                  <p className="text-xs text-zinc-500">
                    Último treino
                  </p>

                  <p className="font-bold">
                    {summary.lastWorkout ? formatShortDate(summary.lastWorkout.finishedAt) : 'Sem dados'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                  <Flame size={22} />
                </div>

                <div>
                  <p className="text-xs text-zinc-500">
                    Volume acumulado
                  </p>

                  <p className="font-bold">
                    {formatVolume(summary.totalVolume)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-400">
                  <Trophy size={22} />
                </div>

                <div>
                  <p className="text-xs text-zinc-500">
                    Recordes
                  </p>

                  <p className="font-bold">
                    {summary.totalPRs} PRs
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <Medal size={22} />
                </div>

                <div>
                  <p className="text-xs text-zinc-500">
                    Séries concluídas
                  </p>

                  <p className="font-bold">
                    {summary.totalCompletedSets}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">
              Dica
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Use a página de evolução para acompanhar um exercício específico ao longo do tempo.
            </p>
          </Card>
        </aside>
      </section>

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

export default History
