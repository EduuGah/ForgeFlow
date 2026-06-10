import { useEffect, useMemo, useRef, useState, useDeferredValue } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'
import {
  ActiveWorkoutHero,
  ExerciseJumpNav,
  InvalidSessionState,
  MobileWorkoutActionBar,
  NoActiveSessionState,
  RestTimerCard,
  FinishWorkoutModal,
  WorkoutSessionSidebar,
} from '../features/startWorkout/components/StartWorkoutSections'
import ActiveExerciseCard from '../features/startWorkout/components/ActiveExerciseCard'

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
} from '../utils/prUtils'

import { getAppSettings } from '../utils/settingsUtils'
import { generateSmartNotifications } from '../utils/notificationUtils'
import { getExerciseMedia } from '../utils/exerciseMediaUtils'
import { getExerciseProgressionSuggestion } from '../utils/progressionSuggestionUtils'
import { SlidersHorizontal } from 'lucide-react'


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

function getExerciseMuscleGroup(exercise = {}) {
  return exercise.muscleGroup || exercise.primaryMuscle || 'Sem grupo'
}

function getExerciseEquipmentLabel(exercise = {}) {
  return exercise.equipment || 'Sem equipamento'
}


function getUniqueExerciseValues(options = [], getter, limit = 14) {
  const values = []
  const seen = new Set()

  options.forEach((exercise) => {
    const value = String(getter(exercise) || '').trim()
    if (!value || seen.has(value)) return
    seen.add(value)
    values.push(value)
  })

  return values.slice(0, limit)
}

function filterExercisesByQuickFilters(options = [], { muscle = '', equipment = '' } = {}) {
  return options.filter((exercise) => {
    if (muscle && getExerciseMuscleGroup(exercise) !== muscle) return false
    if (equipment && getExerciseEquipmentLabel(exercise) !== equipment) return false
    return true
  })
}

function buildExercisePickerSections(options = [], focusExercise = null) {
  const focusMuscle = focusExercise ? getExerciseMuscleGroup(getExerciseData(focusExercise)) : ''
  const recommended = []
  const groups = new Map()

  options.forEach((exercise) => {
    const group = getExerciseMuscleGroup(exercise)
    const isRecommended = focusMuscle && group === focusMuscle

    if (isRecommended && recommended.length < 8) {
      recommended.push(exercise)
      return
    }

    if (!groups.has(group)) groups.set(group, [])
    groups.get(group).push(exercise)
  })

  const sections = []
  if (recommended.length) sections.push({ title: 'Recomendados', items: recommended })

  Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
    .forEach(([title, items]) => sections.push({ title, items }))

  return sections
}

function blurKeyboardOnEnter(event) {
  if (event.key !== 'Enter') return
  event.preventDefault()
  event.currentTarget.blur()
}


function hasValidCompletedWorkoutSet(sessionExercises) {
  return sessionExercises.some((sessionExercise) =>
    (sessionExercise.sets || []).some((set) => {
      const reps = Number(set?.reps || 0)

      return set?.completed && reps > 0
    })
  )
}

const EMPTY_WORKOUT_ERROR =
  'Você ainda não concluiu nenhuma série válida. Preencha as repetições e marque pelo menos uma série como concluída antes de finalizar.'



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
    addExerciseToSession,
    removeExercise,
    skipExercise,
    replaceExercise,
    updateNotes,
    cancelSession,
    finishSession,
  } = useWorkoutSession()

  const [exercises, setExercises] = useState([])
  const navigate = useNavigate()

  const [replaceExerciseId, setReplaceExerciseId] = useState(null)
  const [replaceSearch, setReplaceSearch] = useState('')
  const [addExerciseOpen, setAddExerciseOpen] = useState(false)
  const [finishWorkoutModalOpen, setFinishWorkoutModalOpen] = useState(false)
  const [addExerciseSearch, setAddExerciseSearch] = useState('')
  const [addMuscleFilter, setAddMuscleFilter] = useState('')
  const [addEquipmentFilter, setAddEquipmentFilter] = useState('')
  const deferredReplaceSearch = useDeferredValue(replaceSearch)
  const deferredAddExerciseSearch = useDeferredValue(addExerciseSearch)

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

  const hasValidCompletedSet = useMemo(() => {
    return hasValidCompletedWorkoutSet(sessionExercises)
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

  const addExerciseBaseOptions = useMemo(() => {
    const selectedOriginalIds = new Set(
      sessionExercises
        .map((exercise) => String(exercise.originalExerciseId || exercise.exercise?.id || exercise.exercise?._id || ''))
        .filter(Boolean)
    )
    const search = String(deferredAddExerciseSearch || '').toLowerCase().trim()

    return exercises
      .filter((exercise) => {
        const id = String(getExerciseId(exercise))
        if (id && selectedOriginalIds.has(id)) return false
        if (!search) return true

        const searchable = `${exercise.name || ''} ${exercise.muscleGroup || ''} ${exercise.equipment || ''}`.toLowerCase()

        return searchable.includes(search)
      })
  }, [deferredAddExerciseSearch, exercises, sessionExercises])

  const addMuscleOptions = useMemo(
    () => getUniqueExerciseValues(addExerciseBaseOptions, getExerciseMuscleGroup),
    [addExerciseBaseOptions]
  )

  const addEquipmentOptions = useMemo(
    () => getUniqueExerciseValues(addExerciseBaseOptions, getExerciseEquipmentLabel),
    [addExerciseBaseOptions]
  )

  const addExerciseOptions = useMemo(() => {
    return filterExercisesByQuickFilters(addExerciseBaseOptions, {
      muscle: addMuscleFilter,
      equipment: addEquipmentFilter,
    }).slice(0, 80)
  }, [addEquipmentFilter, addExerciseBaseOptions, addMuscleFilter])

  const addExerciseSections = useMemo(() => {
    return buildExercisePickerSections(addExerciseOptions, focusExercise)
  }, [addExerciseOptions, focusExercise])

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

  function handleRequestFinishWorkout() {
    if (!hasValidCompletedSet) {
      showToast(
        'error',
        'Treino incompleto',
        EMPTY_WORKOUT_ERROR
      )
      return
    }

    setFinishWorkoutModalOpen(true)
  }

  async function getWorkoutLocation(options = {}) {
    const label = String(options.locationLabel || '').trim()

    if (options?.manualOnly) {
      return label ? { label, source: 'manual' } : null
    }

    if (!options?.saveLocation) return null

    if (!navigator?.geolocation) {
      return label ? { label, source: 'manual' } : null
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          maximumAge: 60000,
          timeout: 8000,
        })
      })

      return {
        label: label || 'Local do treino',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        capturedAt: new Date().toISOString(),
        source: 'device',
      }
    } catch (error) {
      console.error(error)
      return label ? { label, source: 'manual' } : null
    }
  }

  async function handleFinishWorkout(options = {}) {
    if (savingWorkout) return

    if (!hasValidCompletedSet) {
      showToast(
        'error',
        'Treino incompleto',
        EMPTY_WORKOUT_ERROR
      )
      return
    }

    setSavingWorkout(true)

    try {
      const location = await getWorkoutLocation(options)

      const savedSession = await finishSession({ location })
      setFinishWorkoutModalOpen(false)

      if (savedSession?.skippedHistorySave) {
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

      showToast(
        'success',
        'Treino salvo',
        savedSession?.location ? 'O treino foi salvo com localização.' : 'O treino foi salvo no histórico.'
      )
    } catch (error) {
      console.error(error)

      showToast(
        'error',
        'Erro ao finalizar',
        error?.message || 'Não foi possível finalizar o treino.'
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

  function handleAddExerciseToSession(newExerciseId) {
    const newExercise = exercises.find(
      (exercise) => getExerciseId(exercise) === String(newExerciseId)
    )

    if (!newExercise) return

    const newSessionExerciseId = addExerciseToSession(newExercise)
    setAddExerciseOpen(false)
    setAddExerciseSearch('')
    setAddMuscleFilter('')
    setAddEquipmentFilter('')

    showToast('success', 'Exercício adicionado', `${newExercise.name || 'Exercício'} entrou no treino ativo.`)

    window.setTimeout(() => {
      if (newSessionExerciseId) focusExerciseCard(newSessionExerciseId)
    }, 120)
  }

  function handleOpenExerciseDetails(sessionExercise) {
    const exercise = getExerciseData(sessionExercise)
    const exerciseId = getExerciseId(exercise) || String(sessionExercise?.originalExerciseId || '')

    if (!exerciseId) {
      showToast('error', 'Exercício sem detalhe', 'Não encontrei uma página de detalhes para este exercício.')
      return
    }

    navigate(`/exercises/${exerciseId}`)
  }

  function handleRemoveExerciseFromSession(sessionExerciseId) {
    if (sessionExercises.length <= 1) {
      showToast('error', 'Não é possível excluir', 'O treino ativo precisa ter pelo menos um exercício.')
      return
    }

    removeExercise(sessionExerciseId)
    setReplaceExerciseId(null)
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
    if (!addExerciseOpen || typeof document === 'undefined') return undefined

    const shell = document.querySelector('.ff-page-scroll-shell')
    const previousShellOverflow = shell?.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    shell?.classList.add('ff-scroll-locked-by-workout-modal')
    document.body.classList.add('ff-scroll-locked-by-workout-modal')
    document.documentElement.classList.add('ff-scroll-locked-by-workout-modal')

    if (shell) shell.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      shell?.classList.remove('ff-scroll-locked-by-workout-modal')
      document.body.classList.remove('ff-scroll-locked-by-workout-modal')
      document.documentElement.classList.remove('ff-scroll-locked-by-workout-modal')

      if (shell) shell.style.overflow = previousShellOverflow || ''
      document.body.style.overflow = previousBodyOverflow || ''
      document.documentElement.style.overflow = previousHtmlOverflow || ''
    }
  }, [addExerciseOpen])

  useEffect(() => {
    if (!activeSession) return

    if (!selectedExerciseId && focusExercise?.id) {
      // Mantém o foco inicial alinhado com o primeiro exercício pendente.
       
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
    <div className="ff-hevy-page ff-hevy-page-startworkout ff-start-workout-native-page">
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
        onRequestFinish={handleRequestFinishWorkout}
        onFinishWorkout={handleFinishWorkout}
        onFocusExercise={focusExerciseCard}
        onBack={() => navigate('/workouts')}
      />

      <ExerciseJumpNav
        sessionExercises={sessionExercises}
        selectedExercise={selectedExercise}
        exercisePerformanceMap={exercisePerformanceMap}
        getExerciseName={getExerciseName}
        getExerciseSubtitle={getExerciseSubtitle}
        getSessionExerciseMedia={getSessionExerciseMedia}
        onFocusExercise={focusExerciseCard}
        onAddExercise={() => setAddExerciseOpen(true)}
      />

      <section className="ff-start-workout-main-grid ff-page-mobile-main-grid grid grid-cols-1 gap-4 xl:grid-cols-4 xl:gap-6">
        <div className="ff-workout-input-polish ff-active-workout-exercise-flow space-y-4 pb-40 xl:col-span-3 xl:pb-6">
          {sessionExercises.map((sessionExercise, exerciseIndex) => (
            <ActiveExerciseCard
              key={sessionExercise.id}
              sessionExercise={sessionExercise}
              exerciseIndex={exerciseIndex}
              performance={exercisePerformanceMap.get(sessionExercise.id) || {}}
              appSettings={appSettings}
              selectedExercise={selectedExercise}
              focusExercise={focusExercise}
              isCollapsed={collapsedExerciseIds.includes(sessionExercise.id)}
              replaceExerciseId={replaceExerciseId}
              replaceSearch={replaceSearch}
              replacementOptions={replacementOptions}
              exercises={exercises}
              getExerciseId={getExerciseId}
              getExerciseName={getExerciseName}
              getExerciseSubtitle={getExerciseSubtitle}
              getSessionExerciseMedia={getSessionExerciseMedia}
              onRegisterCardRef={(exerciseId, node) => {
                if (node) exerciseCardRefs.current[exerciseId] = node
              }}
              onToggleCollapse={toggleExerciseCollapse}
              onToggleReplace={(exerciseId) =>
                setReplaceExerciseId(replaceExerciseId === exerciseId ? null : exerciseId)
              }
              onReplaceSearchChange={setReplaceSearch}
              onReplaceExercise={handleReplaceExercise}
              onSkipExercise={skipExercise}
              onRemoveExercise={handleRemoveExerciseFromSession}
              onOpenExerciseDetails={handleOpenExerciseDetails}
              onCloseOptions={() => setReplaceExerciseId(null)}
              onUpdateSet={updateSet}
              onToggleSetWarmup={toggleSetWarmup}
              onMoveSet={moveSet}
              onCompleteSet={handleCompleteSet}
              onAddSet={addSet}
              onRemoveSet={removeSet}
            />
          ))}
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
          onRequestFinish={handleRequestFinishWorkout}
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
        onRequestFinish={handleRequestFinishWorkout}
        hidden={finishWorkoutModalOpen || Boolean(confirmModal) || addExerciseOpen || Boolean(replaceExerciseId)}
      />

      <RestTimerCard
        restTimer={restTimer}
        formatTime={formatTime}
        onTogglePause={toggleRestTimerPaused}
        onRestart={restartRestTimer}
        onClose={() => setRestTimer(null)}
      />


      {addExerciseOpen && (
        <div className="ff-active-add-exercise-sheet" role="dialog" aria-modal="true" aria-label="Adicionar exercício ao treino">
          <div className="ff-active-add-exercise-sheet__panel">
            <div className="ff-active-add-exercise-sheet__header">
              <div>
                <span>Treino ativo</span>
                <strong>Adicionar exercício</strong>
              </div>
              <button type="button" onClick={() => {
                setAddExerciseOpen(false)
                setAddMuscleFilter('')
                setAddEquipmentFilter('')
              }} aria-label="Fechar">×</button>
            </div>

            <label className="ff-active-add-exercise-sheet__search">
              <span>Buscar</span>
              <input
                type="search"
                value={addExerciseSearch}
                onChange={(event) => setAddExerciseSearch(event.target.value)}
                onKeyDown={blurKeyboardOnEnter}
                enterKeyHint="done"
                placeholder="Nome, músculo ou equipamento"
              />
            </label>

            <div className="ff-exercise-picker-filters" aria-label="Filtros rápidos para adicionar exercício">
              <span><SlidersHorizontal size={14} /> Filtros</span>
              <button type="button" className={!addMuscleFilter ? 'is-active' : ''} onClick={() => setAddMuscleFilter('')}>Todos</button>
              {addMuscleOptions.map((muscle) => (
                <button key={muscle} type="button" className={addMuscleFilter === muscle ? 'is-active' : ''} onClick={() => setAddMuscleFilter(muscle)}>
                  {muscle}
                </button>
              ))}
            </div>

            <div className="ff-exercise-picker-filters ff-exercise-picker-filters--equipment" aria-label="Filtros rápidos por equipamento">
              <button type="button" className={!addEquipmentFilter ? 'is-active' : ''} onClick={() => setAddEquipmentFilter('')}>Todos equipamentos</button>
              {addEquipmentOptions.map((equipment) => (
                <button key={equipment} type="button" className={addEquipmentFilter === equipment ? 'is-active' : ''} onClick={() => setAddEquipmentFilter(equipment)}>
                  {equipment}
                </button>
              ))}
            </div>

            <div className="ff-active-add-exercise-sheet__list">
              {addExerciseOptions.length === 0 ? (
                <p className="ff-active-add-exercise-sheet__empty">Nenhum exercício encontrado.</p>
              ) : (
                addExerciseSections.map((section) => (
                  <section key={section.title} className="ff-exercise-picker-section ff-exercise-picker-section--add">
                    <h4>{section.title}</h4>
                    <div className="ff-exercise-picker-section__list">
                      {section.items.map((exercise) => {
                        const mediaUrl = getExerciseMedia(exercise)

                        return (
                          <button
                            key={getExerciseId(exercise)}
                            type="button"
                            onClick={() => handleAddExerciseToSession(getExerciseId(exercise))}
                          >
                            <span className="ff-active-add-exercise-sheet__media">
                              {mediaUrl ? (
                                <img src={mediaUrl} alt="" loading="lazy" decoding="async" />
                              ) : (
                                getExerciseId(exercise).slice(-2) || '+'
                              )}
                            </span>
                            <span className="ff-active-add-exercise-sheet__copy">
                              <strong>{exercise.name || 'Exercício sem nome'}</strong>
                              <small>{getExerciseMuscleGroup(exercise)} · {getExerciseEquipmentLabel(exercise)}</small>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </section>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <FinishWorkoutModal
        open={finishWorkoutModalOpen}
        activeSession={activeSession}
        elapsedSeconds={elapsedSeconds}
        completedSets={completedSets}
        totalSets={totalSets}
        workoutSummary={workoutSummary}
        savingWorkout={savingWorkout}
        formatTime={formatTime}
        onClose={() => setFinishWorkoutModalOpen(false)}
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
    </div>
  )
}

export default StartWorkout
