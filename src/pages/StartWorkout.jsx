import { useEffect, useMemo, useRef, useState, useDeferredValue } from 'react'
import {
  ChevronDown,
  Trophy,
  CheckCircle2,
  Repeat2,
  SkipForward,
  Trash2,
  ImageIcon,
  Weight,
  Hash,
  Plus,
  ClipboardCheck,
  Minus,
  Award,
  Zap,
  TrendingUp,
  ArrowDown,
  ArrowUp,
  GripVertical,
  Flame,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'
import {
  ActiveWorkoutHero,
  ExerciseJumpNav,
  FinishWorkoutModal,
  InvalidSessionState,
  MobileWorkoutActionBar,
  NoActiveSessionState,
  RestTimerCard,
  WorkoutSessionSidebar,
} from '../features/startWorkout/components/StartWorkoutSections'

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
  formatPerformance,
} from '../utils/prUtils'

import { getAppSettings } from '../utils/settingsUtils'
import { generateSmartNotifications } from '../utils/notificationUtils'
import { getExerciseMedia } from '../utils/exerciseMediaUtils'
import {
  getExerciseProgressionSuggestion,
  getProgressionToneClasses,
} from '../utils/progressionSuggestionUtils'

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



function getLiveSetPrStatus(set, performance) {
  const weight = Number(set.weight || 0)
  const reps = Number(set.reps || 0)
  const volume = weight * reps

  const bestWeight = Number(performance?.bestWeightPerformance?.weight || 0)
  const bestVolume = Number(performance?.bestVolumePerformance?.volume || 0)

  const hasPreviousWeightRecord = Boolean(performance?.bestWeightPerformance?.weight)
  const hasPreviousVolumeRecord = Boolean(performance?.bestVolumePerformance?.volume)
  const hasValidSet = Boolean(set.completed) && set.type !== 'warmup' && weight > 0 && reps > 0

  return {
    isWeightPR:
      Boolean(set.isWeightPR) ||
      (hasValidSet &&
        hasPreviousWeightRecord &&
        performance?.weightPRSetId === set.id &&
        weight > bestWeight),
    isVolumePR:
      Boolean(set.isVolumePR) ||
      (hasValidSet &&
        hasPreviousVolumeRecord &&
        performance?.volumePRSetId === set.id &&
        volume > bestVolume),
  }
}

function SetPrBadges({ set, performance, compact = false }) {
  const { isWeightPR, isVolumePR } = getLiveSetPrStatus(set, performance)
  const badges = []

  if (isWeightPR) {
    badges.push({
      key: 'weight',
      label: 'Peso PR',
      icon: Award,
      className:
        'border-sky-400/30 bg-sky-500/10 text-sky-200 shadow-[0_0_14px_rgba(14,165,233,0.18)]',
    })
  }

  if (isVolumePR) {
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
  suggestedValue = '',
  suggestionLabel = '',
}) {
  const hasSuggestion = suggestedValue !== '' && suggestedValue !== null && suggestedValue !== undefined

  return (
    <label className="group block">
      <span className="mb-1.5 hidden items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--ff-muted)] sm:flex">
        <span>{label}</span>
        {hasSuggestion && (
          <span className="max-w-[110px] truncate rounded-full border border-[var(--ff-accent-border)]/20 bg-[var(--ff-accent-soft)]/10 px-2 py-0.5 text-[9px] text-[var(--ff-accent-text)] opacity-70 transition group-hover:opacity-100">
            {suggestionLabel || `Último: ${suggestedValue}`}
          </span>
        )}
      </span>

      <div className={`flex h-14 items-center overflow-hidden rounded-2xl border bg-[var(--ff-card)] transition group-focus-within:border-[var(--ff-accent-border)] group-focus-within:shadow-[0_0_18px_var(--ff-accent-shadow)]/20 ${hasSuggestion ? 'border-[var(--ff-accent-border)]/20 group-hover:border-[var(--ff-accent-border)]/45' : 'border-[var(--ff-border)]'}`}>
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
    removeSet,
    toggleSetWarmup,
    moveSet,
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
  const [manualRestSeconds, setManualRestSeconds] = useState(90)
  const [collapsedExerciseIds, setCollapsedExerciseIds] = useState([])
  const [savingWorkout, setSavingWorkout] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [appSettings, setAppSettings] = useState(getAppSettings())
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const exerciseCardRefs = useRef({})

  const sessionIsInvalid = activeSession && !isValidActiveSession(activeSession)

  const sessionExercises = useMemo(() => {
    return Array.isArray(activeSession?.exercises) ? activeSession.exercises : []
  }, [activeSession])

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

  const focusExercise = useMemo(() => {
    return (
      sessionExercises.find((exercise) =>
        (exercise.sets || []).some((set) => !set.completed && set.type !== 'warmup')
      ) ||
      sessionExercises.find((exercise) => !exercise.skipped) ||
      sessionExercises[0] ||
      null
    )
  }, [sessionExercises])

  const focusExerciseProgress = useMemo(() => {
    if (!focusExercise) return 0

    const sets = (focusExercise.sets || []).filter((set) => set.type !== 'warmup')
    if (!sets.length) return 0

    const completed = sets.filter((set) => set.completed).length
    return Math.min(100, Math.round((completed / sets.length) * 100))
  }, [focusExercise])

  const selectedExercise = useMemo(() => {
    return (
      sessionExercises.find((exercise) => exercise.id === selectedExerciseId) ||
      focusExercise ||
      sessionExercises[0] ||
      null
    )
  }, [focusExercise, selectedExerciseId, sessionExercises])

  function focusExerciseCard(exerciseId) {
    if (!exerciseId) return

    setSelectedExerciseId(exerciseId)

    window.requestAnimationFrame(() => {
      exerciseCardRefs.current?.[exerciseId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }


  const exercisePerformanceMap = useMemo(() => {
    if (!user || sessionExercises.length === 0) return new Map()

    const map = new Map()

    sessionExercises.forEach((sessionExercise) => {
      const name = getExerciseName(sessionExercise)

      const lastPerformance = getLastExercisePerformance(name, user)
      const bestWeightPerformance = getBestWeightPerformance(name, user)
      const bestVolumePerformance = getBestVolumePerformance(name, user)
      const prTypes = getSessionPRTypes(name, sessionExercise.sets, user)

      const progressionSuggestion = getExerciseProgressionSuggestion({
        lastPerformance,
        currentSets: sessionExercise.sets,
      })

      map.set(sessionExercise.id, {
        lastSet: getFirstCompletedSet(lastPerformance),
        lastPerformance,
        progressionSuggestion,
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
      const savedSession = await finishSession()

      if (savedSession?.skippedHistorySave) {
        setIsFinishModalOpen(false)
        showToast('success', 'Tutorial encerrado', 'O treino de teste foi descartado e não entrou no histórico.')
        return
      }

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

  function startManualRestTimer(seconds = manualRestSeconds, exerciseName = 'Descanso manual') {
    const safeSeconds = Math.max(15, Number(seconds) || 90)

    setManualRestSeconds(safeSeconds)
    setRestTimer({
      exerciseName,
      secondsLeft: safeSeconds,
      totalSeconds: safeSeconds,
      isPaused: false,
      source: 'manual',
    })
  }

  function toggleRestTimerPaused() {
    setRestTimer((current) => {
      if (!current) return current
      if (current.secondsLeft <= 0) return current

      return {
        ...current,
        isPaused: !current.isPaused,
      }
    })
  }

  function restartRestTimer() {
    setRestTimer((current) => {
      if (!current) return current

      return {
        ...current,
        secondsLeft: current.totalSeconds || manualRestSeconds || 90,
        isPaused: false,
      }
    })
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

    // Hidrata a biblioteca local quando o usuário muda.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExercises(getUserStorageData(user, 'exercises', []))
  }, [user])

  useEffect(() => {
    if (!restTimer) return
    if (restTimer.isPaused) return undefined
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

    if (!selectedExerciseId && focusExercise?.id) {
      // Mantém o foco inicial alinhado com o primeiro exercício pendente.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedExerciseId(focusExercise.id)
    }

    if (appSettings.collapseSeriesByDefault) {
      // Aplica a preferência visual somente ao iniciar/alternar sessão.
      setCollapsedExerciseIds(sessionExercises.map((exercise) => exercise.id))
    }
  }, [activeSession, activeSession?.id, appSettings.collapseSeriesByDefault, focusExercise?.id, selectedExerciseId, sessionExercises])

  if (sessionIsInvalid) {
    return <InvalidSessionState onClear={handleClearBrokenSession} />
  }

  if (!activeSession) {
    return <NoActiveSessionState />
  }

  return (
    <>
      <ActiveWorkoutHero
        activeSession={activeSession}
        completedSets={completedSets}
        totalSets={totalSets}
        progressPercent={progressPercent}
        elapsedSeconds={elapsedSeconds}
        focusExercise={focusExercise}
        focusExerciseProgress={focusExerciseProgress}
        savingWorkout={savingWorkout}
        appSettings={appSettings}
        formatTime={formatTime}
        getExerciseName={getExerciseName}
        getExerciseSubtitle={getExerciseSubtitle}
        onStartRestTimer={startManualRestTimer}
        onRequestFinish={() => setIsFinishModalOpen(true)}
        onFinishWorkout={handleFinishWorkout}
        onFocusExercise={focusExerciseCard}
      />

      <ExerciseJumpNav
        sessionExercises={sessionExercises}
        selectedExercise={selectedExercise}
        getExerciseName={getExerciseName}
        onFocusExercise={focusExerciseCard}
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4 xl:gap-6">
        <div className="ff-workout-input-polish space-y-4 pb-40 xl:col-span-3 xl:pb-6">
          {sessionExercises.map((sessionExercise, exerciseIndex) => {
            const performance = exercisePerformanceMap.get(sessionExercise.id) || {}
            const progressionSuggestion = performance.progressionSuggestion
            const progressionTone = getProgressionToneClasses(progressionSuggestion?.tone)
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
                ref={(node) => {
                  if (node) exerciseCardRefs.current[sessionExercise.id] = node
                }}
                className={`ff-active-exercise-card scroll-mt-32 overflow-hidden ${selectedExercise?.id === sessionExercise.id || focusExercise?.id === sessionExercise.id ? 'ring-1 ring-[var(--ff-accent-border)] shadow-[0_0_28px_var(--ff-accent-shadow)]' : ''} ${sessionExercise.skipped ? 'opacity-50' : ''}`}
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

                            {focusExercise?.id === sessionExercise.id && (
                              <span className="mt-2 inline-flex rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--ff-accent-text)]">
                                Exercício atual
                              </span>
                            )}
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

                    {progressionSuggestion && (
                      <div className={`ff-progression-glow mt-3 rounded-3xl border p-4 ${progressionTone.card}`}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${progressionTone.icon}`}>
                              <TrendingUp size={19} />
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-black">
                                  {progressionSuggestion.title}
                                </p>

                                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${progressionTone.badge}`}>
                                  {progressionSuggestion.badge}
                                </span>
                              </div>

                              <p className="mt-1 text-sm leading-relaxed opacity-85">
                                {progressionSuggestion.description}
                              </p>

                              <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] opacity-70">
                                {progressionSuggestion.nextTarget}
                              </p>
                            </div>
                          </div>

                          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-[150px] sm:max-w-[170px]">
                            <div className="min-w-0 rounded-2xl border border-white/10 bg-black/10 px-2 py-2 text-center">
                              <p className="truncate text-[9px] font-black uppercase opacity-60">
                                Anterior
                              </p>
                              <p className="truncate text-xs font-black sm:text-sm">
                                {progressionSuggestion.lastVolume || 0} kg
                              </p>
                            </div>

                            <div className="min-w-0 rounded-2xl border border-white/10 bg-black/10 px-2 py-2 text-center">
                              <p className="truncate text-[9px] font-black uppercase opacity-60">
                                Atual
                              </p>
                              <p className="truncate text-xs font-black sm:text-sm">
                                {progressionSuggestion.currentVolume || 0} kg
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
                    <div className="mb-3 hidden grid-cols-[58px_minmax(170px,1fr)_minmax(170px,1fr)_150px_92px_54px] gap-3 px-3 text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)] lg:grid">
                      <span>Série</span>
                      <span>KG</span>
                      <span>Reps</span>
                      <span>Recordes</span>
                      <span>Ordem</span>
                      <span>Status</span>
                    </div>

                    <div className="ff-sets-scroll space-y-3 pb-2">
                      {(sessionExercise.sets || []).map((set, setIndex) => {
                        const isWarmup = set?.type === 'warmup'
                        const canMoveUp = setIndex > 0
                        const canMoveDown = setIndex < (sessionExercise.sets || []).length - 1

                        return (
                          <div
                            key={set.id}
                            className={`grid w-full grid-cols-[52px_minmax(0,1fr)_52px] gap-3 rounded-[1.75rem] border p-4 shadow-lg shadow-black/10 transition sm:grid-cols-[56px_minmax(0,1fr)_minmax(0,1fr)_56px] lg:grid-cols-[58px_minmax(170px,1fr)_minmax(170px,1fr)_150px_92px_54px] lg:items-center lg:gap-3 lg:p-3 ${
                              set.completed
                                ? 'border-emerald-400/35 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.10)]'
                                : 'border-[var(--ff-border)] bg-[linear-gradient(180deg,var(--ff-card),var(--ff-surface-2))]'
                            }`}
                          >
                            <div className="col-start-1 row-start-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-3)] text-sm font-black text-[var(--ff-text)] shadow-inner shadow-black/20 lg:w-12">
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
                              suggestedValue={performance.lastSet?.weight || ''}
                              suggestionLabel={performance.lastSet?.weight ? `Último: ${performance.lastSet.weight}${appSettings.weightUnit || 'kg'}` : ''}
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
                              suggestedValue={performance.lastSet?.reps || ''}
                              suggestionLabel={performance.lastSet?.reps ? `Último: ${performance.lastSet.reps} reps` : ''}
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

                            <div className="col-span-3 row-start-4 flex flex-wrap items-center gap-2 lg:hidden">
                              <div className="min-w-0 flex-1 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)]/70 p-2">
                                <SetPrBadges set={set} performance={performance} compact />
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleSetWarmup(sessionExercise.id, set.id)}
                                className={set.type === 'warmup'
                                  ? 'rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black text-amber-200'
                                  : 'rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-2.5 py-1 text-[10px] font-black text-[var(--ff-muted)]'}
                              >
                                {set.type === 'warmup' ? 'Aquec.' : 'Normal'}
                              </button>
                            </div>

                            <div className="hidden min-h-11 flex-col items-start justify-center gap-1 overflow-hidden lg:flex">
                              <SetPrBadges set={set} performance={performance} />

                              <button
                                type="button"
                                onClick={() => toggleSetWarmup(sessionExercise.id, set.id)}
                                className={set.type === 'warmup'
                                  ? 'rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black text-amber-200'
                                  : 'rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-2 py-0.5 text-[9px] font-black text-[var(--ff-muted)]'}
                              >
                                {set.type === 'warmup' ? 'Aquec.' : 'Normal'}
                              </button>
                            </div>

                            <div className="col-span-3 row-start-5 flex items-center justify-between gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-2 py-2 lg:col-auto lg:row-auto lg:justify-center lg:bg-transparent lg:border-transparent lg:p-0">
                              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--ff-muted)] lg:hidden">
                                <GripVertical size={14} />
                                Ordem
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveSet(sessionExercise.id, set.id, 'up')}
                                  disabled={!canMoveUp}
                                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--ff-border)] bg-[var(--ff-card)] text-[var(--ff-muted)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)] disabled:cursor-not-allowed disabled:opacity-35"
                                  aria-label="Mover série para cima"
                                >
                                  <ArrowUp size={15} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => moveSet(sessionExercise.id, set.id, 'down')}
                                  disabled={!canMoveDown}
                                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--ff-border)] bg-[var(--ff-card)] text-[var(--ff-muted)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)] disabled:cursor-not-allowed disabled:opacity-35"
                                  aria-label="Mover série para baixo"
                                >
                                  <ArrowDown size={15} />
                                </button>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCompleteSet(sessionExercise, set.id)}
                              className={
                                set.completed
                                  ? 'col-start-3 row-start-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-500 text-white shadow-[0_0_22px_rgba(16,185,129,0.42)] transition active:scale-95 lg:col-auto lg:row-auto'
                                  : 'col-start-3 row-start-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-3)] text-[var(--ff-muted)] shadow-inner shadow-black/20 transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)] active:scale-95 lg:col-auto lg:row-auto'
                              }
                              aria-label={set.completed ? 'Desmarcar série' : 'Concluir série'}
                            >
                              {set.completed ? <CheckCircle2 size={22} /> : <span className="h-3 w-3 rounded-full border-2 border-current" />}
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => addSet(sessionExercise.id)}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ff-surface-3)] text-sm font-bold transition hover:bg-zinc-700"
                      >
                        <Plus size={17} />
                        Série
                      </button>

                      <button
                        type="button"
                        onClick={() => addSet(sessionExercise.id, { type: 'warmup' })}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/25 bg-amber-500/10 text-sm font-bold text-amber-200 transition hover:bg-amber-500/15"
                      >
                        <Flame size={17} />
                        Aquecimento
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const lastSet = [...(sessionExercise.sets || [])].reverse().find(Boolean)
                          if (lastSet) removeSet(sessionExercise.id, lastSet.id)
                        }}
                        disabled={(sessionExercise.sets || []).length <= 1}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 text-sm font-bold text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Minus size={17} />
                        Remover
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        <WorkoutSessionSidebar
          elapsedSeconds={elapsedSeconds}
          completedSets={completedSets}
          totalSets={totalSets}
          progressPercent={progressPercent}
          workoutSummary={workoutSummary}
          activeSession={activeSession}
          formatTime={formatTime}
          onStartRestTimer={startManualRestTimer}
          onUpdateNotes={updateNotes}
          onRequestFinish={() => setIsFinishModalOpen(true)}
          onCancelWorkout={handleCancelWorkout}
        />
      </section>

      <MobileWorkoutActionBar
        completedSets={completedSets}
        totalSets={totalSets}
        progressPercent={progressPercent}
        elapsedSeconds={elapsedSeconds}
        savingWorkout={savingWorkout}
        formatTime={formatTime}
        onCancelWorkout={handleCancelWorkout}
        onStartRestTimer={startManualRestTimer}
        onRequestFinish={() => setIsFinishModalOpen(true)}
      />

      <RestTimerCard
        restTimer={restTimer}
        formatTime={formatTime}
        onTogglePause={toggleRestTimerPaused}
        onRestart={restartRestTimer}
        onClose={() => setRestTimer(null)}
      />

      <FinishWorkoutModal
        open={isFinishModalOpen}
        activeSession={activeSession}
        elapsedSeconds={elapsedSeconds}
        completedSets={completedSets}
        totalSets={totalSets}
        workoutSummary={workoutSummary}
        savingWorkout={savingWorkout}
        formatTime={formatTime}
        onClose={() => setIsFinishModalOpen(false)}
        onFinishWorkout={handleFinishWorkout}
      />

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
