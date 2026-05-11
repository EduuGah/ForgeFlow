import { useEffect, useMemo, useState, useDeferredValue } from 'react'
import { Timer, X, ChevronDown, StickyNote, Trophy, CheckCircle2, Repeat2, SkipForward, Trash2, ImageIcon, Weight, Hash, Plus, BarChart3, ClipboardCheck, Minus,
  Award,
  Zap} from 'lucide-react'
import { Link } from 'react-router-dom'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import EmptyState from '../components/ui/EmptyState'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'

import { useWorkoutSession } from '../context/WorkoutSessionContext'
import { useAuth } from '../context/AuthContext'
import {
  getUserStorageData,
  removeUserStorageData,
} from '../utils/userStorage'

import {
  getLastExercisePerformance,
  getBestWeightPerformance,
  getBestVolumePerformance,
  getSessionPRTypes,
  getExerciseComparison,
  formatPerformance,
  formatDiff,
} from '../utils/prUtils'

import { getAppSettings } from '../utils/settingsUtils'
import { generateSmartNotifications } from '../utils/notificationUtils'
import { getExerciseMedia } from '../utils/exerciseMediaUtils'

function formatTime(seconds) {
  const safeSeconds = Number(seconds) || 0
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const secs = safeSeconds % 60

  return [hours, minutes, secs]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

function getFirstCompletedSet(performance) {
  if (!performance?.sets) return null

  return (
    performance.sets.find((set) => set.completed && set.weight && set.reps) ||
    performance.sets.find((set) => set.weight && set.reps) ||
    performance.sets[0]
  )
}

function isValidActiveSession(session) {
  return (
    session &&
    Array.isArray(session.exercises) &&
    session.exercises.length > 0
  )
}

function getRestSeconds(restTimerText) {
  if (!restTimerText || restTimerText === 'Desligado') return 0

  const number = Number(String(restTimerText).replace(/\D/g, ''))

  return Number.isNaN(number) ? 0 : number
}

function getExerciseId(exercise) {
  return String(exercise?.id || exercise?._id || '')
}

function getExerciseData(sessionExercise) {
  if (sessionExercise?.exercise && typeof sessionExercise.exercise === 'object') {
    return sessionExercise.exercise
  }

  return sessionExercise || {}
}

function getExerciseName(sessionExercise) {
  const exercise = getExerciseData(sessionExercise)

  return (
    exercise.name ||
    exercise.exerciseName ||
    exercise.title ||
    sessionExercise?.exerciseName ||
    sessionExercise?.name ||
    'Exercício sem nome'
  )
}

function getExerciseSubtitle(sessionExercise) {
  const exercise = getExerciseData(sessionExercise)
  const muscleGroup = exercise.muscleGroup || sessionExercise?.muscleGroup || 'Sem grupo'
  const equipment = exercise.equipment || sessionExercise?.equipment || 'Sem equipamento'

  return `${muscleGroup} • ${equipment}`
}

function getSessionExerciseMedia(sessionExercise) {
  return getExerciseMedia(getExerciseData(sessionExercise))
}


function SetPrBadges({ set, compact = false }) {
  const badges = []

  if (set.isWeightPR) {
    badges.push({
      key: 'weight',
      label: 'Peso PR',
      icon: Award,
      className:
        'border-sky-400/30 bg-sky-500/10 text-sky-200 shadow-[0_0_14px_rgba(14,165,233,0.18)]',
    })
  }

  if (set.isVolumePR) {
    badges.push({
      key: 'volume',
      label: 'Volume PR',
      icon: Zap,
      className:
        'border-amber-400/30 bg-amber-500/10 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.18)]',
    })
  }

  if (badges.length === 0) {
    return compact ? null : (
      <span className="text-xs font-bold text-[var(--ff-muted)]">—</span>
    )
  }

  return (
    <div className={compact ? 'flex flex-wrap gap-2' : 'flex flex-col items-start gap-1.5'}>
      {badges.map((badge) => {
        const Icon = badge.icon

        return (
          <span
            key={badge.key}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${badge.className}`}
          >
            <Icon size={12} />
            {badge.label}
          </span>
        )
      })}
    </div>
  )
}


function WorkoutSetInput({
  icon: Icon,
  label,
  unit,
  value,
  min,
  inputMode,
  onChange,
}) {
  return (
    <label className="group block">
      <span className="mb-1.5 hidden text-[10px] font-black uppercase tracking-[0.18em] text-[var(--ff-muted)] sm:block">
        {label}
      </span>

      <div className="flex h-14 items-center overflow-hidden rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] transition group-focus-within:border-[var(--ff-accent-border)] group-focus-within:shadow-[0_0_18px_var(--ff-accent-shadow)]/20">
        <div className="flex h-full w-11 shrink-0 items-center justify-center border-r border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-accent-text)]">
          <Icon size={18} />
        </div>

        <input
          type="number"
          min={min}
          inputMode={inputMode}
          value={value}
          onChange={onChange}
          placeholder="0"
          className="min-w-0 flex-1 bg-transparent px-2 text-center text-xl font-black tabular-nums text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted-2)]"
        />

        <div className="flex h-full min-w-12 shrink-0 items-center justify-center border-l border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-2 text-xs font-black uppercase text-[var(--ff-muted)]">
          {unit}
        </div>
      </div>
    </label>
  )
}


function StartWorkout() {
  const { user } = useAuth()

  const {
    activeSession,
    elapsedSeconds,
    completedSets,
    totalSets,
    updateSet,
    toggleSetCompleted,
    addSet,
    removeExercise,
    skipExercise,
    replaceExercise,
    updateNotes,
    cancelSession,
    finishSession,
  } = useWorkoutSession()

  const [exercises, setExercises] = useState([])
  const [replaceExerciseId, setReplaceExerciseId] = useState(null)
  const [replaceSearch, setReplaceSearch] = useState('')
  const deferredReplaceSearch = useDeferredValue(replaceSearch)

  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false)
  const [restTimer, setRestTimer] = useState(null)
  const [collapsedExerciseIds, setCollapsedExerciseIds] = useState([])
  const [savingWorkout, setSavingWorkout] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [appSettings, setAppSettings] = useState(getAppSettings())

  const sessionIsInvalid = activeSession && !isValidActiveSession(activeSession)

  const sessionExercises = useMemo(() => {
    return Array.isArray(activeSession?.exercises) ? activeSession.exercises : []
  }, [activeSession?.exercises])

  const progressPercent = useMemo(() => {
    if (!totalSets) return 0

    return Math.min(100, Math.round((completedSets / totalSets) * 100))
  }, [completedSets, totalSets])

  const workoutSummary = useMemo(() => {
    const totalExercises = sessionExercises.length

    const skippedExercises = sessionExercises.filter(
      (exercise) => exercise.skipped
    ).length

    const totalPRs = sessionExercises.reduce((total, exercise) => {
      return total + exercise.sets.filter(
        (set) => set.isPR || set.isWeightPR || set.isVolumePR
      ).length
    }, 0)

    return {
      totalExercises,
      skippedExercises,
      totalPRs,
    }
  }, [sessionExercises])

  const exercisePerformanceMap = useMemo(() => {
    if (!user || sessionExercises.length === 0) return new Map()

    const map = new Map()

    sessionExercises.forEach((sessionExercise) => {
      const name = getExerciseName(sessionExercise)

      const lastPerformance = getLastExercisePerformance(name, user)
      const bestWeightPerformance = getBestWeightPerformance(name, user)
      const bestVolumePerformance = getBestVolumePerformance(name, user)
      const prTypes = getSessionPRTypes(name, sessionExercise.sets, user)

      map.set(sessionExercise.id, {
        lastSet: getFirstCompletedSet(lastPerformance),
        bestWeightPerformance,
        bestVolumePerformance,
        weightPRSetId: prTypes.weightPRSetId,
        volumePRSetId: prTypes.volumePRSetId,
      })
    })

    return map
  }, [sessionExercises, user])

  const replacementOptions = useMemo(() => {
    const search = String(deferredReplaceSearch || '').toLowerCase().trim()

    return exercises
      .filter((exercise) => {
        if (!search) return true

        const searchable = `${exercise.name || ''} ${exercise.muscleGroup || ''} ${exercise.equipment || ''}`.toLowerCase()

        return searchable.includes(search)
      })
      .slice(0, 80)
  }, [exercises, deferredReplaceSearch])

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

  function handleClearBrokenSession() {
    removeUserStorageData(user, 'active-session')
    cancelSession()
    window.location.href = '/workouts'
  }

  async function handleFinishWorkout() {
    if (savingWorkout) return

    setSavingWorkout(true)

    try {
      await finishSession()

      generateSmartNotifications({
        user,
        reason: 'workout-finished',
        force: true,
      }).catch((error) => {
        console.error(error)
      })

      setIsFinishModalOpen(false)

      showToast(
        'success',
        'Treino salvo',
        'O treino foi salvo no histórico.'
      )
    } catch (error) {
      console.error(error)

      showToast(
        'error',
        'Erro ao finalizar',
        'Não foi possível finalizar o treino.'
      )
    } finally {
      setSavingWorkout(false)
    }
  }

  function handleCancelWorkout() {
    if (!appSettings.confirmBeforeCancelWorkout) {
      cancelSession()
      showToast('success', 'Treino cancelado', 'A sessão ativa foi encerrada.')
      return
    }

    setConfirmModal({
      title: 'Cancelar treino?',
      description: 'O treino em andamento será descartado e não será salvo no histórico.',
      confirmText: 'Cancelar treino',
      variant: 'danger',
      onConfirm: () => {
        cancelSession()
        setConfirmModal(null)
        showToast('success', 'Treino cancelado', 'A sessão ativa foi encerrada.')
      },
    })
  }

  function handleCompleteSet(sessionExercise, setId) {
    toggleSetCompleted(sessionExercise.id, setId)

    if (!appSettings.autoStartRestTimer) return

    const seconds = getRestSeconds(sessionExercise.restTimer)

    if (seconds > 0) {
      setRestTimer({
        exerciseName: getExerciseName(sessionExercise),
        secondsLeft: seconds,
        totalSeconds: seconds,
      })
    }
  }

  function toggleExerciseCollapse(exerciseId) {
    setCollapsedExerciseIds((current) =>
      current.includes(exerciseId)
        ? current.filter((id) => id !== exerciseId)
        : [...current, exerciseId]
    )
  }

  function handleReplaceExercise(sessionExerciseId, newExerciseId) {
    const newExercise = exercises.find(
      (exercise) => getExerciseId(exercise) === String(newExerciseId)
    )

    if (!newExercise) return

    replaceExercise(sessionExerciseId, newExercise)
    setReplaceExerciseId(null)
    setReplaceSearch('')
  }

  useEffect(() => {
    function handleSettingsChanged(event) {
      setAppSettings(event.detail || getAppSettings())
    }

    window.addEventListener('forgeflow:settings-changed', handleSettingsChanged)

    return () => {
      window.removeEventListener('forgeflow:settings-changed', handleSettingsChanged)
    }
  }, [])

  useEffect(() => {
    if (!user) return

    setExercises(getUserStorageData(user, 'exercises', []))
  }, [user])

  useEffect(() => {
    if (!restTimer) return
    if (restTimer.secondsLeft <= 0) return undefined

    const interval = window.setInterval(() => {
      setRestTimer((current) => {
        if (!current) return null

        if (current.secondsLeft <= 1) {
          return {
            ...current,
            secondsLeft: 0,
          }
        }

        return {
          ...current,
          secondsLeft: current.secondsLeft - 1,
        }
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [restTimer])

  useEffect(() => {
    if (!activeSession) return

    if (appSettings.collapseSeriesByDefault) {
      setCollapsedExerciseIds(sessionExercises.map((exercise) => exercise.id))
    }
  }, [activeSession?.id, appSettings.collapseSeriesByDefault, sessionExercises])

  if (sessionIsInvalid) {
    return (
      <>
        <PageHeader
          title="Executar treino"
          description="Encontramos uma sessão ativa incompleta ou corrompida."
        />

        <EmptyState
          title="Sessão de treino inválida"
          description="Isso pode acontecer após mudanças no formato dos dados. Limpe a sessão ativa e inicie o treino novamente."
          action={
            <Button
              type="button"
              variant="danger"
              onClick={handleClearBrokenSession}
            >
              Limpar sessão ativa
            </Button>
          }
        />
      </>
    )
  }

  if (!activeSession) {
    return (
      <>
        <PageHeader
          title="Executar treino"
          description="Nenhum treino está em andamento no momento."
        />

        <EmptyState
          title="Nenhum treino ativo"
          description="Vá até a página de Treinos e inicie uma rotina salva."
          action={
            <Link to="/workouts">
              <Button>
                Ir para treinos
              </Button>
            </Link>
          }
        />
      </>
    )
  }

  return (
    <>
      <div className="sticky top-0 z-30 -mx-4 mb-5 border-b border-[var(--ff-border)] bg-[var(--ff-bg)]/92 px-4 pb-3 pt-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:static xl:mx-0 xl:border-0 xl:bg-transparent xl:p-0 xl:backdrop-blur-none">
        <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.22)] sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-accent-text)]">
                Treino ativo
              </p>

              <h1 className="mt-1 truncate text-2xl font-black text-[var(--ff-text)] sm:text-3xl">
                {activeSession.workoutName}
              </h1>

              <p className="mt-1 text-sm text-[var(--ff-muted)]">
                {completedSets}/{totalSets} séries concluídas • {progressPercent}%
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <div className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)]/10 px-4 text-sm font-black text-[var(--ff-accent-text)] sm:h-11">
                <Timer size={18} />
                {formatTime(elapsedSeconds)}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (appSettings.confirmBeforeFinishWorkout) {
                    setIsFinishModalOpen(true)
                  } else {
                    handleFinishWorkout()
                  }
                }}
                disabled={savingWorkout}
                className="h-12 rounded-2xl bg-[var(--ff-accent)] px-4 text-sm font-bold text-white shadow-[0_0_20px_var(--ff-accent-shadow)] transition hover:bg-[var(--ff-accent-hover)] hover:shadow-[0_0_20px_var(--ff-accent-shadow)] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11"
              >
                {savingWorkout ? 'Salvando...' : 'Finalizar'}
              </button>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--ff-surface-3)]">
            <div
              className="h-full rounded-full bg-[var(--ff-accent)] transition-all"
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4 xl:gap-6">
        <div className="space-y-4 pb-40 xl:col-span-3 xl:pb-6">
          {sessionExercises.map((sessionExercise, exerciseIndex) => {
            const performance = exercisePerformanceMap.get(sessionExercise.id) || {}
            const isCollapsed = collapsedExerciseIds.includes(sessionExercise.id)

            const exerciseCompletedSets = sessionExercise.sets.filter(
              (set) => set.completed && set.type !== 'warmup'
            ).length

            const exerciseTotalSets = sessionExercise.sets.filter(
              (set) => set.type !== 'warmup'
            ).length

            const exerciseProgressPercent = exerciseTotalSets
              ? Math.min(100, Math.round((exerciseCompletedSets / exerciseTotalSets) * 100))
              : 0

            return (
              <Card
                key={sessionExercise.id}
                className={`overflow-hidden ${sessionExercise.skipped ? 'opacity-50' : ''}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-4">
                      <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-[var(--ff-border)] bg-white shadow-inner sm:h-28 sm:w-28">
                        {getSessionExerciseMedia(sessionExercise) ? (
                          <img
                            src={getSessionExerciseMedia(sessionExercise)}
                            alt={getExerciseName(sessionExercise)}
                            className="h-full w-full object-contain"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <ImageIcon size={30} className="text-zinc-500" />
                        )}

                        <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-xl bg-black/70 text-xs font-black text-white backdrop-blur">
                          {exerciseIndex + 1}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExerciseCollapse(sessionExercise.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="line-clamp-2 text-2xl font-black leading-tight text-[var(--ff-text)]">
                              {getExerciseName(sessionExercise)}
                            </h2>

                            <p className="mt-1 text-sm text-[var(--ff-muted)]">
                              {getExerciseSubtitle(sessionExercise)}
                            </p>
                          </div>

                          <ChevronDown
                            size={20}
                            className={`mt-1 shrink-0 text-[var(--ff-muted)] transition ${isCollapsed ? '-rotate-90' : ''}`}
                          />
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--ff-surface-3)]">
                          <div
                            className="h-full rounded-full bg-[var(--ff-accent)] transition-all"
                            style={{ width: `${exerciseProgressPercent}%` }}
                          />
                        </div>

                        <p className="mt-2 text-xs font-bold text-[var(--ff-muted)]">
                          {exerciseCompletedSets}/{exerciseTotalSets} séries concluídas
                        </p>
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-2">
                      <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
                        <div className="flex items-center gap-2 text-xs text-[var(--ff-muted)]">
                          <ClipboardCheck size={15} />
                          Último treino
                        </div>

                        <p className="mt-1 text-sm font-semibold text-[var(--ff-text-soft)]">
                          {performance.lastSet
                            ? formatPerformance(performance.lastSet)
                            : 'Sem registro anterior'}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[var(--ff-accent-border)]/20 bg-[var(--ff-accent-soft)]/10 p-3">
                        <div className="flex items-center gap-2 text-xs text-[var(--ff-accent-text)]">
                          <Trophy size={15} />
                          Melhores marcas
                        </div>

                        <p className="mt-1 text-sm font-semibold text-[var(--ff-accent-text)]">
                          Peso:{' '}
                          {performance.bestWeightPerformance
                            ? `${performance.bestWeightPerformance.weight}kg x ${performance.bestWeightPerformance.reps} reps`
                            : 'Sem registro'}
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[var(--ff-accent-text)]">
                          Volume:{' '}
                          {performance.bestVolumePerformance
                            ? `${performance.bestVolumePerformance.volume}kg total`
                            : 'Sem registro'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:flex lg:justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setReplaceExerciseId(
                          replaceExerciseId === sessionExercise.id
                            ? null
                            : sessionExercise.id
                        )
                      }
                      className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 text-xs font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)]/40 hover:bg-zinc-900 hover:text-[var(--ff-text)] lg:px-4 lg:text-sm"
                    >
                      <Repeat2 size={15} />
                      Trocar
                    </button>

                    <button
                      type="button"
                      onClick={() => skipExercise(sessionExercise.id)}
                      className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 text-xs font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)]/40 hover:bg-zinc-900 hover:text-[var(--ff-text)] lg:px-4 lg:text-sm"
                    >
                      <SkipForward size={15} />
                      {sessionExercise.skipped ? 'Retomar' : 'Pular'}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeExercise(sessionExercise.id)}
                      className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 text-xs font-bold text-red-300 transition hover:border-red-400/40 hover:bg-red-500/20 lg:px-4 lg:text-sm"
                    >
                      <Trash2 size={15} />
                      Excluir
                    </button>
                  </div>
                </div>

                {isCollapsed && (
                  <div className="mt-4 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-[var(--ff-text)]">
                          Séries ocultas
                        </p>

                        <p className="mt-1 text-xs text-[var(--ff-muted)]">
                          {exerciseCompletedSets}/{exerciseTotalSets} séries concluídas
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExerciseCollapse(sessionExercise.id)}
                        className="rounded-2xl bg-[var(--ff-accent)] px-4 py-2 text-xs font-bold text-white transition hover:bg-[var(--ff-accent-hover)]"
                      >
                        Ver séries
                      </button>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--ff-surface-3)]">
                      <div
                        className="h-full rounded-full bg-[var(--ff-accent)] transition-all"
                        style={{
                          width: `${exerciseProgressPercent}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {replaceExerciseId === sessionExercise.id && (
                  <div className="mt-4 rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                    <Input
                      label="Buscar substituto"
                      placeholder="Pesquisar exercício..."
                      value={replaceSearch}
                      onChange={(event) => setReplaceSearch(event.target.value)}
                    />

                    <div className="mt-3">
                      <Select
                        label="Substituir por"
                        defaultValue=""
                        onChange={(event) => handleReplaceExercise(sessionExercise.id, event.target.value)}
                      >
                        <option value="">Selecione um exercício</option>

                        {replacementOptions.map((exercise) => (
                          <option key={getExerciseId(exercise)} value={getExerciseId(exercise)}>
                            {exercise.name}
                          </option>
                        ))}
                      </Select>

                      {exercises.length > replacementOptions.length && (
                        <p className="mt-2 text-xs text-[var(--ff-muted)]">
                          Exibindo até {replacementOptions.length} opções. Use a busca para filtrar melhor.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!isCollapsed && (
                  <div className="mt-5">
                    <div className="mb-3 hidden grid-cols-[58px_minmax(170px,1fr)_minmax(170px,1fr)_150px_54px] gap-3 px-3 text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)] lg:grid">
                      <span>Série</span>
                      <span>KG</span>
                      <span>Reps</span>
                      <span>Recordes</span>
                      <span>Status</span>
                    </div>

                    <div className="ff-sets-scroll space-y-3 pb-2">
                      {(sessionExercise.sets || []).map((set) => {
                        const isWarmup = set?.type === 'warmup'

                        const isWeightPR =
                          appSettings.showPRDuringWorkout &&
                          !isWarmup &&
                          set.id === performance.weightPRSetId

                        const isVolumePR =
                          appSettings.showPRDuringWorkout &&
                          !isWarmup &&
                          set.id === performance.volumePRSetId

                        const comparison = getExerciseComparison(
                          getExerciseName(sessionExercise),
                          set,
                          user
                        )

                        return (
                          <div
                            key={set.id}
                            className={`grid w-full grid-cols-[52px_minmax(0,1fr)_52px] gap-3 rounded-3xl border p-3.5 transition sm:grid-cols-[56px_minmax(0,1fr)_minmax(0,1fr)_56px] lg:grid-cols-[58px_minmax(170px,1fr)_minmax(170px,1fr)_150px_54px] lg:items-center lg:gap-3 ${
                              set.completed
                                ? 'border-emerald-500/30 bg-emerald-500/5'
                                : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)]'
                            }`}
                          >
                            <div className="col-start-1 row-start-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#18181b] text-sm font-black lg:w-12">
                              {isWarmup ? 'A' : set.setNumber}
                            </div>

                            <div className="col-span-3 row-start-2 min-w-0 sm:col-span-1 sm:row-start-1 lg:col-span-1">
                            <WorkoutSetInput
                              icon={Weight}
                              label="Carga"
                              unit={appSettings.weightUnit || 'kg'}
                              min="0"
                              inputMode="decimal"
                              value={set.weight}
                              onChange={(event) =>
                                updateSet(
                                  sessionExercise.id,
                                  set.id,
                                  'weight',
                                  event.target.value
                                )
                              }
                            />
                          </div>

                          <div className="col-span-3 row-start-3 min-w-0 sm:col-span-1 sm:row-start-1 lg:col-span-1">
                            <WorkoutSetInput
                              icon={Hash}
                              label="Reps"
                              unit="reps"
                              min="1"
                              inputMode="numeric"
                              value={set.reps}
                              onChange={(event) =>
                                updateSet(
                                  sessionExercise.id,
                                  set.id,
                                  'reps',
                                  event.target.value
                                )
                              }
                            />
                          </div>

                            <div className="col-span-3 row-start-4 min-w-0 lg:hidden">
                              <SetPrBadges set={set} compact />
                            </div>

                            <div className="hidden min-h-11 flex-col items-start justify-center gap-1 overflow-hidden lg:flex">
                              <SetPrBadges set={set} />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCompleteSet(sessionExercise, set.id)}
                              className={
                                set.completed
                                  ? 'col-start-3 row-start-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-[0_0_18px_rgba(16,185,129,0.35)] lg:col-auto lg:row-auto'
                                  : 'col-start-3 row-start-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 text-zinc-400 transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)] lg:col-auto lg:row-auto'
                              }
                              aria-label={set.completed ? 'Desmarcar série' : 'Concluir série'}
                            >
                              {set.completed ? <CheckCircle2 size={22} /> : <span className="h-3 w-3 rounded-full border-2 border-current" />}
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => addSet(sessionExercise.id)}
                      className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ff-surface-3)] text-sm font-bold transition hover:bg-zinc-700"
                    >
                      <Plus size={17} />
                      Adicionar série
                    </button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        <aside className="space-y-4 xl:col-span-1">
          <Card className="hidden xl:block">
            <h2 className="text-xl font-bold">
              Treino ativo
            </h2>

            <p className="mt-2 text-3xl font-black text-[var(--ff-accent-text)]">
              {formatTime(elapsedSeconds)}
            </p>

            <p className="mt-1 text-sm text-[var(--ff-muted)]">
              {completedSets}/{totalSets} séries concluídas
            </p>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--ff-surface-3)]">
              <div
                className="h-full rounded-full bg-[var(--ff-accent)]"
                style={{
                  width: `${progressPercent}%`,
                }}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
                <p className="text-xs text-[var(--ff-muted)]">Exercícios</p>
                <p className="mt-1 text-xl font-black">{workoutSummary.totalExercises}</p>
              </div>

              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-3">
                <p className="text-xs text-yellow-200/70">PRs</p>
                <p className="mt-1 text-xl font-black text-yellow-300">{workoutSummary.totalPRs}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-3 flex items-center gap-2">
              <StickyNote size={18} className="text-[var(--ff-accent-text)]" />
              <h2 className="text-lg font-black">Observações</h2>
            </div>

            <Textarea
              label="Observações finais"
              placeholder="Ex: treino pesado, ombro incomodou, aumentei carga no supino..."
              value={activeSession.notes}
              onChange={(event) => updateNotes(event.target.value)}
              rows={4}
            />
          </Card>

          <Card className="hidden xl:block">
            <div className="grid grid-cols-1 gap-3">
              <Button
                type="button"
                onClick={() => setIsFinishModalOpen(true)}
                className="w-full"
              >
                Finalizar treino
              </Button>

              <Button
                type="button"
                variant="danger"
                onClick={handleCancelWorkout}
                className="w-full"
              >
                Cancelar treino
              </Button>
            </div>
          </Card>
        </aside>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--ff-border)] bg-[var(--ff-bg)]/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl xl:hidden">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3">
          <button
            type="button"
            onClick={handleCancelWorkout}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300"
            aria-label="Cancelar treino"
          >
            <X size={20} />
          </button>

          <div className="min-w-0 flex-1 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 py-2">
            <p className="truncate text-xs font-bold text-[var(--ff-muted)]">
              {completedSets}/{totalSets} séries • {progressPercent}%
            </p>

            <p className="truncate text-sm font-black text-[var(--ff-accent-text)]">
              {formatTime(elapsedSeconds)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsFinishModalOpen(true)}
            disabled={savingWorkout}
            className="h-12 shrink-0 rounded-2xl bg-[var(--ff-accent)] px-5 text-sm font-black text-white shadow-[0_0_20px_var(--ff-accent-shadow)] disabled:opacity-60"
          >
            Finalizar
          </button>
        </div>
      </div>

      {restTimer && (
        <div className="fixed bottom-[88px] left-3 right-3 z-50 rounded-3xl border border-[var(--ff-accent-border)]/30 bg-[#121212]/95 p-3 shadow-2xl shadow-[0_0_20px_var(--ff-accent-shadow)] backdrop-blur-xl sm:left-1/2 sm:right-auto sm:w-[calc(100%-32px)] sm:max-w-md sm:-translate-x-1/2 sm:p-4 xl:bottom-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)] sm:h-12 sm:w-12">
                <Timer size={22} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--ff-text)]">
                  Descanso
                </p>

                <p className="truncate text-xs text-[var(--ff-muted)]">
                  {restTimer.exerciseName}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <p className="text-xl font-black text-[var(--ff-accent-text)] sm:text-2xl">
                {formatTime(restTimer.secondsLeft)}
              </p>

              <button
                type="button"
                onClick={() => setRestTimer(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 transition hover:bg-[var(--ff-surface-3)] hover:text-[var(--ff-text)]"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--ff-surface-3)] sm:mt-4 sm:h-2">
            <div
              className="h-full rounded-full bg-[var(--ff-accent)] transition-all"
              style={{
                width: `${restTimer.totalSeconds
                  ? ((restTimer.totalSeconds - restTimer.secondsLeft) /
                    restTimer.totalSeconds) *
                  100
                  : 0
                  }%`,
              }}
            />
          </div>

          {restTimer.secondsLeft === 0 && (
            <p className="mt-3 text-center text-sm font-bold text-emerald-400">
              Descanso finalizado
            </p>
          )}
        </div>
      )}

      {isFinishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5 shadow-2xl shadow-[0_0_20px_var(--ff-accent-shadow)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--ff-accent-text)]">
                  Confirmar finalização
                </p>

                <h2 className="mt-1 text-2xl font-black text-[var(--ff-text)]">
                  Finalizar treino?
                </h2>

                <p className="mt-2 text-sm text-zinc-400">
                  Confira o resumo antes de salvar este treino no histórico.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsFinishModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 transition hover:bg-[var(--ff-surface-3)] hover:text-[var(--ff-text)]"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[var(--ff-border)] bg-zinc-900 p-4">
                <p className="text-xs text-[var(--ff-muted)]">
                  Duração
                </p>

                <p className="mt-1 text-xl font-black text-[var(--ff-accent-text)]">
                  {formatTime(elapsedSeconds)}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--ff-border)] bg-zinc-900 p-4">
                <p className="text-xs text-[var(--ff-muted)]">
                  Séries
                </p>

                <p className="mt-1 text-xl font-black">
                  {completedSets}/{totalSets}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--ff-border)] bg-zinc-900 p-4">
                <p className="text-xs text-[var(--ff-muted)]">
                  Exercícios
                </p>

                <p className="mt-1 text-xl font-black">
                  {workoutSummary.totalExercises}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--ff-border)] bg-zinc-900 p-4">
                <p className="text-xs text-[var(--ff-muted)]">
                  Pulados
                </p>

                <p className="mt-1 text-xl font-black">
                  {workoutSummary.skippedExercises}
                </p>
              </div>
            </div>

            {workoutSummary.totalPRs > 0 && (
              <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-yellow-400">
                  <Trophy size={17} />
                  {workoutSummary.totalPRs} novo(s) PR(s) neste treino
                </p>
              </div>
            )}

            {activeSession.notes && (
              <div className="mt-4 rounded-2xl border border-[var(--ff-border)] bg-zinc-900 p-4">
                <p className="text-xs text-[var(--ff-muted)]">
                  Observações
                </p>

                <p className="mt-2 text-sm text-[var(--ff-text-soft)]">
                  {activeSession.notes}
                </p>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsFinishModalOpen(false)}
                className="w-full"
              >
                Continuar treino
              </Button>

              <Button
                type="button"
                onClick={handleFinishWorkout}
                disabled={savingWorkout}
                className="w-full"
              >
                {savingWorkout ? 'Salvando...' : 'Salvar no histórico'}
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

export default StartWorkout
