import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from './AuthContext'
import { useWorkoutSession } from './WorkoutSessionContext'
import { apiFetch } from '../services/api'
import {
  clearWelcomeTutorialPending,
  getFlowForPath,
  getTutorialSection,
  getTutorialSections,
  getTutorialState,
  FIRST_STEPS_MISSIONS,
  FIRST_STEPS_MISSION_IDS,
  resetTutorialState,
  saveTutorialState,
  shouldShowWelcomeTutorial,
  tutorialFlows,
  tutorialSections,
} from '../utils/tutorialUtils'
import { getTutorialStepActionText, isTutorialStepActionComplete } from '../utils/tutorialActions'
import { unlockGlobalScroll } from '../utils/scrollLockUtils'

const TutorialContext = createContext(null)

const NON_TUTORIAL_PATHS = [
  '/login',
  '/register',
  '/verify-email',
  '/complete-profile',
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/privacy',
  '/delete-account',
  '/data-safety',
  '/admin',
]

function canShowTutorialOnPath(pathname = '/') {
  return !NON_TUTORIAL_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

function uniqueValues(values = []) {
  return Array.from(new Set(values.filter(Boolean)))
}

function nowIso() {
  return new Date().toISOString()
}

function isTutorialWorkoutSession(session) {
  return Boolean(session?.isTutorialDemo || session?.isTutorial || session?.tutorialOnly || session?.demo)
}

function hasGuidedRegisterSet(session) {
  return (session?.exercises || []).some((exercise) =>
    exercise?.tutorialRole === 'register-set' &&
    (exercise.sets || []).some((set) => set?.tutorialTarget === 'register-set')
  )
}

function getStepSection(step) {
  return step?.section || 'welcome'
}

function getInitialStepIndex(flow, preferredStep = 0) {
  if (!flow?.steps?.length) return 0
  const numericStep = Number(preferredStep)
  if (!Number.isFinite(numericStep)) return 0
  return Math.min(Math.max(0, numericStep), flow.steps.length - 1)
}

function getMissionRoute(mission, activeSession) {
  if (!mission) return '/'
  if ((mission.id === 'register-set' || mission.id === 'finish-workout') && activeSession) return '/start-workout'
  return mission.route || '/'
}

function getStepIndexById(flow, stepId, fallbackIndex = 0) {
  if (!flow?.steps?.length) return 0
  const foundIndex = flow.steps.findIndex((step) => step.id === stepId)
  return foundIndex >= 0 ? foundIndex : getInitialStepIndex(flow, fallbackIndex)
}

function getFirstIncompleteMission(completedMissions = {}) {
  return FIRST_STEPS_MISSIONS.find((mission) => !completedMissions[mission.id]) || FIRST_STEPS_MISSIONS[0]
}

const TUTORIAL_WORKOUT_COPY = {
  'tutorial-exercise-bench-press': {
    instructions: 'Preencha carga, repeticoes e conclua a serie quando terminar.',
    tips: 'Escolha valores simples para praticar o registro.',
  },
  'tutorial-exercise-lat-pulldown': {
    instructions: 'Use a navegacao do treino ativo para alternar entre exercicios.',
    tips: 'Mantenha o foco no proximo exercicio pendente.',
  },
}

function sanitizeTutorialWorkout(workout) {
  return {
    ...workout,
    name: 'Treino guiado',
    exercises: workout.exercises.map((item) => {
      const copy = TUTORIAL_WORKOUT_COPY[item.exercise?.id] || {}

      return {
        ...item,
        exercise: {
          ...item.exercise,
          ...copy,
        },
      }
    }),
  }
}

function createTutorialWorkout() {
  return sanitizeTutorialWorkout({
    id: 'tutorial-workout-demo',
    name: 'Treino guiado',
    isTutorial: true,
    tutorialOnly: true,
    isTutorialDemo: true,
    exercises: [
      {
        id: 'tutorial-bench-press',
        tutorialRole: 'register-set',
        exercise: {
          id: 'tutorial-exercise-bench-press',
          name: 'Supino reto',
          muscleGroup: 'Peito',
          equipment: 'Barra',
          instructions: 'Use esta etapa para preencher carga, reps e concluir uma série.',
          tips: 'Pode digitar valores simples. Nada é salvo como treino real.',
        },
        restTimer: '90s',
        sets: [
          { id: 'tutorial-bench-1', description: 'Série guiada', type: 'working', weight: '', reps: '', tutorialTarget: 'register-set' },
          { id: 'tutorial-bench-2', description: 'Opcional', type: 'working', weight: '', reps: '' },
        ],
      },
      {
        id: 'tutorial-lat-pulldown',
        exercise: {
          id: 'tutorial-exercise-lat-pulldown',
          name: 'Puxada alta',
          muscleGroup: 'Costas',
          equipment: 'Máquina',
          instructions: 'Exercício de demonstração para mostrar troca e navegação entre exercícios.',
          tips: 'Use a navegação do treino ativo para ir direto ao exercício que quiser.',
        },
        restTimer: '75s',
        sets: [
          { id: 'tutorial-pulldown-1', description: 'Opcional', type: 'working' },
        ],
      },
    ],
  })
}

export function TutorialProvider({ children }) {
  const { user, loadingUser } = useAuth()
  const { activeSession, startSession, completedSets, finishSession, cancelSession } = useWorkoutSession()
  const navigate = useNavigate()
  const location = useLocation()

  const [state, setState] = useState(() => getTutorialState(user))
  const [activeFlowId, setActiveFlowId] = useState('')
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [welcomePromptVisible, setWelcomePromptVisible] = useState(false)
  const remoteSyncTimeoutRef = useRef(null)
  const lastRemotePayloadRef = useRef('')
  const suppressAutoAdvanceStepRef = useRef('')

  const activeFlow = activeFlowId ? tutorialFlows[activeFlowId] : null
  const activeStep = activeFlow?.steps?.[activeStepIndex] || null
  const isRunning = Boolean(activeFlow && activeStep)
  const canShowTutorial = Boolean(user?.profileCompleted) && canShowTutorialOnPath(location.pathname)

  const updateState = useCallback(
    (updater, { syncRemote = true } = {}) => {
      let savedState = null

      setState((current) => {
        const nextState = typeof updater === 'function' ? updater(current) : updater
        savedState = saveTutorialState(user, nextState)
        return savedState
      })

      if (syncRemote && savedState) {
        window.clearTimeout(remoteSyncTimeoutRef.current)
        remoteSyncTimeoutRef.current = window.setTimeout(() => {
          const payload = {
            tutorialVersion: savedState.tutorialVersion,
            tutorialCompleted: savedState.tutorialCompleted,
            tutorialCurrentFlow: savedState.tutorialCurrentFlow,
            tutorialCurrentStep: savedState.tutorialCurrentStep,
            tutorialSkipped: savedState.tutorialSkipped,
            tutorialPaused: savedState.tutorialPaused,
            tutorialSeenSections: savedState.tutorialSeenSections,
            tutorialAutoStartEnabled: savedState.tutorialAutoStartEnabled,
            firstStepsStarted: savedState.firstStepsStarted,
            firstStepsPaused: savedState.firstStepsPaused,
            firstStepsDismissed: savedState.firstStepsDismissed,
            firstStepsCompleted: savedState.firstStepsCompleted,
            firstStepsCompletedAt: savedState.firstStepsCompletedAt,
          }
          const hash = JSON.stringify(payload)
          if (!user || hash === lastRemotePayloadRef.current) return

          lastRemotePayloadRef.current = hash
          ;(async () => {
            let currentRemoteSettings

            try {
              const settingsFromApi = await apiFetch('/settings', { timeoutMs: 5000 })
              currentRemoteSettings = settingsFromApi && typeof settingsFromApi === 'object' ? settingsFromApi : {}
            } catch {
              currentRemoteSettings = {}
            }

            await apiFetch('/settings', {
              method: 'PUT',
              body: JSON.stringify({ ...currentRemoteSettings, ...payload }),
              timeoutMs: 5000,
            })
          })().catch(() => {
            lastRemotePayloadRef.current = ''
          })
        }, 700)
      }

      return savedState
    },
    [user]
  )

  const ensureTutorialWorkoutSession = useCallback(() => {
    if (activeSession && !isTutorialWorkoutSession(activeSession)) {
      return false
    }

    if (isTutorialWorkoutSession(activeSession) && hasGuidedRegisterSet(activeSession)) {
      return true
    }

    startSession(createTutorialWorkout())
    return true
  }, [activeSession, startSession])

  const stopTutorialUi = useCallback(() => {
    setActiveFlowId('')
    setActiveStepIndex(0)
    setWelcomePromptVisible(false)
    unlockGlobalScroll()
  }, [])

  const cleanupTutorialWorkoutSession = useCallback(
    (reason = 'completed') => {
      if (!isTutorialWorkoutSession(activeSession)) return

      finishSession({ durationSeconds: 0, tutorialCleanupReason: reason }).catch(() => {
        cancelSession()
      })
    },
    [activeSession, cancelSession, finishSession]
  )


  const firstStepsCompletedMap = useMemo(
    () => (state.firstStepsCompleted && typeof state.firstStepsCompleted === 'object' ? state.firstStepsCompleted : {}),
    [state.firstStepsCompleted]
  )

  const firstStepsCompletedIds = useMemo(
    () => FIRST_STEPS_MISSION_IDS.filter((missionId) => Boolean(firstStepsCompletedMap[missionId])),
    [firstStepsCompletedMap]
  )

  const firstStepsProgress = useMemo(() => {
    const total = FIRST_STEPS_MISSIONS.length
    const completed = firstStepsCompletedIds.length

    return {
      total,
      completed,
      remaining: Math.max(0, total - completed),
      percentage: total ? Math.round((completed / total) * 100) : 0,
      completedIds: firstStepsCompletedIds,
      isCompleted: total > 0 && completed >= total,
    }
  }, [firstStepsCompletedIds])

  const completeFirstStepMission = useCallback(
    (missionId) => {
      if (!FIRST_STEPS_MISSION_IDS.includes(missionId)) return

      updateState((current) => {
        const currentCompleted = current.firstStepsCompleted && typeof current.firstStepsCompleted === 'object'
          ? current.firstStepsCompleted
          : {}

        if (currentCompleted[missionId]) return current

        const nextCompleted = {
          ...currentCompleted,
          [missionId]: nowIso(),
        }
        const allCompleted = FIRST_STEPS_MISSION_IDS.every((id) => Boolean(nextCompleted[id]))

        return {
          ...current,
          firstStepsStarted: true,
          firstStepsPaused: false,
          firstStepsCompleted: nextCompleted,
          firstStepsCompletedAt: allCompleted ? nowIso() : current.firstStepsCompletedAt,
          tutorialCompleted: allCompleted ? true : current.tutorialCompleted,
          tutorialCompletedAt: allCompleted ? nowIso() : current.tutorialCompletedAt,
          tutorialSeenSections: uniqueValues([...(current.tutorialSeenSections || []), 'firstSteps']),
          completedSections: allCompleted
            ? uniqueValues([...(current.completedSections || []), 'firstSteps', 'workouts', 'workout', 'history'])
            : current.completedSections,
        }
      })
    },
    [updateState]
  )

  const focusFirstStepMission = useCallback(
    (missionId) => {
      if (!FIRST_STEPS_MISSION_IDS.includes(missionId)) return

      updateState((current) => ({
        ...current,
        firstStepsStarted: true,
        firstStepsPaused: false,
        firstStepsDismissed: false,
        firstStepsLastFocusedMission: missionId,
        hasSeenWelcome: true,
        dismissedWelcome: true,
        tutorialStartedAt: current.tutorialStartedAt || nowIso(),
      }))
    },
    [updateState]
  )

  const pauseFirstSteps = useCallback(() => {
    updateState((current) => ({
      ...current,
      firstStepsPaused: true,
      firstStepsStarted: true,
      hasSeenWelcome: true,
      dismissedWelcome: true,
    }))
  }, [updateState])

  const resumeFirstSteps = useCallback(() => {
    const flow = tutorialFlows['first-steps']
    const completedMissions = state.firstStepsCompleted && typeof state.firstStepsCompleted === 'object'
      ? state.firstStepsCompleted
      : {}
    const nextMission = getFirstIncompleteMission(completedMissions)
    let nextIndex = getStepIndexById(flow, state.firstStepsLastFocusedMission || nextMission?.startStepId || nextMission?.id, 0)
    if (nextMission?.id === 'finish-workout' && !activeSession) {
      nextIndex = getStepIndexById(flow, 'set-weight', nextIndex)
    }

    updateState((current) => ({
      ...current,
      firstStepsStarted: true,
      firstStepsPaused: false,
      firstStepsDismissed: false,
      hasSeenWelcome: true,
      dismissedWelcome: true,
      tutorialStartedAt: current.tutorialStartedAt || nowIso(),
      tutorialCurrentFlow: 'first-steps',
      tutorialCurrentStep: nextIndex,
      firstStepsLastFocusedMission: flow.steps[nextIndex]?.id || nextMission?.id || current.firstStepsLastFocusedMission || '',
    }))
    setActiveFlowId('first-steps')
    setActiveStepIndex(nextIndex)

    const nextRoute = flow.steps[nextIndex]?.route || getMissionRoute(nextMission, activeSession)
    if (nextRoute && canShowTutorialOnPath(location.pathname) && location.pathname !== nextRoute) {
      navigate(nextRoute)
    }
  }, [activeSession, location.pathname, navigate, state.firstStepsCompleted, state.firstStepsLastFocusedMission, updateState])

  const dismissFirstSteps = useCallback(() => {
    updateState((current) => ({
      ...current,
      firstStepsStarted: true,
      firstStepsPaused: false,
      firstStepsDismissed: true,
      hasSeenWelcome: true,
      dismissedWelcome: true,
    }))
  }, [updateState])

  const persistCurrentPosition = useCallback(
    (flowId, stepIndex, options = {}) => {
      const flow = tutorialFlows[flowId]
      const step = flow?.steps?.[stepIndex]
      const sectionId = getStepSection(step)

      updateState((current) => ({
        ...current,
        tutorialCurrentFlow: flowId || current.tutorialCurrentFlow || 'welcome',
        tutorialCurrentStep: getInitialStepIndex(flow, stepIndex),
        tutorialPaused: Boolean(options.paused),
        tutorialStartedAt: current.tutorialStartedAt || nowIso(),
        tutorialSeenSections: uniqueValues([...(current.tutorialSeenSections || []), sectionId]),
      }))
    },
    [updateState]
  )

  const startTutorial = useCallback(
    (flowIdOrOptions = 'welcome', options = {}) => {
      const requestedFlowId = typeof flowIdOrOptions === 'string' ? flowIdOrOptions : 'first-steps'
      const flow = tutorialFlows[requestedFlowId] || tutorialFlows['first-steps']
      const startOptions = flowIdOrOptions && typeof flowIdOrOptions === 'object' ? flowIdOrOptions : options

      if (!user || !user.profileCompleted || !canShowTutorialOnPath(location.pathname)) {
        stopTutorialUi()
        return false
      }

      const completedMissions = state.firstStepsCompleted && typeof state.firstStepsCompleted === 'object'
        ? state.firstStepsCompleted
        : {}
      const requestedMission = startOptions.missionId
        ? FIRST_STEPS_MISSIONS.find((mission) => mission.id === startOptions.missionId)
        : null
      const nextMission = requestedMission || (startOptions.resume ? getFirstIncompleteMission(completedMissions) : null)
      let nextStep = nextMission || flow.steps?.[0] || FIRST_STEPS_MISSIONS[0]
      if (nextMission?.id === 'finish-workout' && !activeSession) {
        nextStep = flow.steps?.find((item) => item.id === 'set-weight') || nextStep
      }
      const nextStepIndex = getStepIndexById(flow, nextStep?.startStepId || nextStep?.id, 0)

      clearWelcomeTutorialPending(user)
      setWelcomePromptVisible(false)
      stopTutorialUi()
      setActiveFlowId(flow.id)
      setActiveStepIndex(nextStepIndex)

      updateState((current) => ({
        ...current,
        tutorialCurrentFlow: flow.id,
        tutorialCurrentStep: nextStepIndex,
        tutorialPaused: false,
        tutorialSkipped: false,
        tutorialStartedAt: current.tutorialStartedAt || nowIso(),
        hasSeenWelcome: true,
        dismissedWelcome: true,
        firstStepsStarted: true,
        firstStepsPaused: false,
        firstStepsDismissed: false,
        firstStepsLastFocusedMission: nextStep?.id || current.firstStepsLastFocusedMission || '',
        tutorialSeenSections: uniqueValues([...(current.tutorialSeenSections || []), 'firstSteps', nextStep?.section].filter(Boolean)),
      }))

      if (nextStep?.createDemoSession) {
        ensureTutorialWorkoutSession()
      }

      const nextRoute = nextStep?.route || getMissionRoute(nextMission, activeSession)

      if (nextRoute && canShowTutorialOnPath(location.pathname) && location.pathname !== nextRoute) {
        navigate(nextRoute)
      }

      return true
    },
    [activeSession, ensureTutorialWorkoutSession, location.pathname, navigate, state.firstStepsCompleted, stopTutorialUi, updateState, user]
  )

  const completeTutorial = useCallback(
    (options = {}) => {
      if (!activeFlow) {
        cleanupTutorialWorkoutSession('completed')
        stopTutorialUi()
        return
      }

      const completedAt = nowIso()
      const flowMissionIds = (activeFlow.steps || []).map((step) => step.id)
      const finishesFullTour = Boolean(
        options.full || FIRST_STEPS_MISSION_IDS.every((missionId) => flowMissionIds.includes(missionId))
      )
      const completedSections = finishesFullTour
        ? uniqueValues(Object.keys(tutorialSections))
        : uniqueValues([
          ...(state.completedSections || []),
          ...(activeFlow.sections || []),
          getStepSection(activeStep),
        ])

      updateState((current) => {
        const existingFirstStepsCompleted = current.firstStepsCompleted && typeof current.firstStepsCompleted === 'object'
          ? current.firstStepsCompleted
          : {}
        const completedFirstSteps = finishesFullTour
          ? FIRST_STEPS_MISSION_IDS.reduce(
            (acc, missionId) => ({ ...acc, [missionId]: acc[missionId] || completedAt }),
            { ...existingFirstStepsCompleted }
          )
          : current.firstStepsCompleted

        return {
          ...current,
          tutorialCompleted: finishesFullTour ? true : current.tutorialCompleted,
          tutorialCompletedAt: finishesFullTour ? completedAt : current.tutorialCompletedAt,
          tutorialPaused: false,
          tutorialSkipped: Boolean(options.skipped || current.tutorialSkipped),
          hasSeenWelcome: finishesFullTour || activeFlow.id === 'welcome' || options.full ? true : current.hasSeenWelcome,
          dismissedWelcome: finishesFullTour || activeFlow.id === 'welcome' || options.full ? true : current.dismissedWelcome,
          tutorialSeenSections: uniqueValues([...(current.tutorialSeenSections || []), ...completedSections]),
          firstStepsStarted: finishesFullTour ? true : current.firstStepsStarted,
          firstStepsPaused: finishesFullTour ? false : current.firstStepsPaused,
          firstStepsDismissed: finishesFullTour ? true : current.firstStepsDismissed,
          firstStepsCompleted: completedFirstSteps,
          firstStepsCompletedAt: finishesFullTour ? current.firstStepsCompletedAt || completedAt : current.firstStepsCompletedAt,
          completedFlows: finishesFullTour
            ? Object.keys(tutorialFlows).reduce((acc, flowId) => ({ ...acc, [flowId]: true }), {})
            : {
              ...(current.completedFlows || {}),
              [activeFlow.id]: true,
            },
          completedSections,
        }
      })

      cleanupTutorialWorkoutSession('completed')
      stopTutorialUi()
    },
    [activeFlow, activeStep, cleanupTutorialWorkoutSession, state.completedSections, stopTutorialUi, updateState]
  )

  const nextStep = useCallback(() => {
    if (!activeFlow) return

    if (activeStepIndex >= activeFlow.steps.length - 1) {
      completeTutorial()
      return
    }

    const nextIndex = activeStepIndex + 1
    setActiveStepIndex(nextIndex)
    persistCurrentPosition(activeFlow.id, nextIndex)
  }, [activeFlow, activeStepIndex, completeTutorial, persistCurrentPosition])

  const requestNextStep = useCallback((actionContext = {}) => {
    if (!activeStep) {
      return { advanced: false, message: 'Etapa indisponível.' }
    }

    const actionCompleted = isTutorialStepActionComplete(activeStep, {
      firstStepsCompleted: firstStepsCompletedMap,
      location,
      ...actionContext,
    })

    if (!actionCompleted) {
      return {
        advanced: false,
        message: getTutorialStepActionText(activeStep),
      }
    }

    nextStep()
    return { advanced: true }
  }, [activeStep, firstStepsCompletedMap, location, nextStep])

  const previousStep = useCallback(() => {
    if (!activeFlow) return
    const nextIndex = Math.max(0, activeStepIndex - 1)
    suppressAutoAdvanceStepRef.current = `${activeFlow.id}:${nextIndex}`
    setActiveStepIndex(nextIndex)
    persistCurrentPosition(activeFlow.id, nextIndex)
  }, [activeFlow, activeStepIndex, persistCurrentPosition])

  const skipStep = useCallback(() => {
    nextStep()
  }, [nextStep])

  const pauseTutorial = useCallback(() => {
    if (activeFlow) {
      persistCurrentPosition(activeFlow.id, activeStepIndex, { paused: true })
    } else {
      updateState((current) => ({ ...current, tutorialPaused: true }))
    }

    cleanupTutorialWorkoutSession('paused')
    stopTutorialUi()
  }, [activeFlow, activeStepIndex, cleanupTutorialWorkoutSession, persistCurrentPosition, stopTutorialUi, updateState])

  const skipAll = useCallback(() => {
    updateState((current) => ({
      ...current,
      tutorialCompleted: true,
      tutorialCompletedAt: nowIso(),
      tutorialSkipped: true,
      tutorialPaused: false,
      hasSeenWelcome: true,
      dismissedWelcome: true,
      tutorialAutoStartEnabled: false,
      tutorialSeenSections: uniqueValues(Object.keys(tutorialSections)),
      firstStepsStarted: true,
      firstStepsPaused: false,
      firstStepsDismissed: true,
      firstStepsCompleted: FIRST_STEPS_MISSION_IDS.reduce((acc, missionId) => ({ ...acc, [missionId]: nowIso() }), {}),
      firstStepsCompletedAt: nowIso(),
      completedFlows: Object.keys(tutorialFlows).reduce((acc, flowId) => ({ ...acc, [flowId]: true }), {}),
      completedSections: uniqueValues(Object.keys(tutorialSections)),
    }))

    clearWelcomeTutorialPending(user)
    cleanupTutorialWorkoutSession('skipped')
    stopTutorialUi()
  }, [cleanupTutorialWorkoutSession, stopTutorialUi, updateState, user])

  const closeWelcomePrompt = useCallback(
    ({ dontShowAgain = false, pause = false } = {}) => {
      setWelcomePromptVisible(false)

      if (dontShowAgain) {
        clearWelcomeTutorialPending(user)
        updateState((current) => ({
          ...current,
          hasSeenWelcome: true,
          dismissedWelcome: true,
          tutorialAutoStartEnabled: false,
        }))
        return
      }

      if (pause) {
        updateState((current) => ({
          ...current,
          tutorialPaused: true,
          firstStepsStarted: true,
          firstStepsPaused: true,
          hasSeenWelcome: true,
          dismissedWelcome: true,
          tutorialCurrentFlow: current.tutorialCurrentFlow || 'welcome',
          tutorialCurrentStep: current.tutorialCurrentStep || 0,
        }))
      }
    },
    [updateState, user]
  )

  const continueTutorial = useCallback(() => {
    return startTutorial('first-steps', { resume: true })
  }, [startTutorial])

  const openTutorialSection = useCallback(
    (sectionId) => {
      const missionBySection = FIRST_STEPS_MISSIONS.find((mission) => mission.section === sectionId) || FIRST_STEPS_MISSIONS[0]
      startTutorial('welcome', { missionId: missionBySection?.id })
      if (missionBySection?.route && canShowTutorialOnPath(location.pathname)) {
        navigate(missionBySection.route)
      }
      return true
    },
    [location.pathname, navigate, startTutorial]
  )

  const restartTutorial = useCallback(() => {
    cleanupTutorialWorkoutSession('restarted')
    resetTutorialState(user)
    const nextState = getTutorialState(user)
    const startedAt = nowIso()
    const firstStep = tutorialFlows['first-steps']?.steps?.[0] || FIRST_STEPS_MISSIONS[0]
    const restartedState = {
      ...nextState,
      firstStepsStarted: true,
      firstStepsPaused: false,
      firstStepsDismissed: false,
      hasSeenWelcome: true,
      dismissedWelcome: true,
      tutorialStartedAt: startedAt,
      tutorialCurrentFlow: 'first-steps',
      tutorialCurrentStep: 0,
      firstStepsLastFocusedMission: firstStep?.id || '',
    }

    setState(saveTutorialState(user, restartedState))
    setWelcomePromptVisible(false)
    setActiveFlowId('first-steps')
    setActiveStepIndex(0)
    unlockGlobalScroll()
    navigate(firstStep?.route || getMissionRoute(FIRST_STEPS_MISSIONS[0], activeSession))
  }, [activeSession, cleanupTutorialWorkoutSession, navigate, user])

  const resetAllTutorials = useCallback(() => {
    restartTutorial()
  }, [restartTutorial])

  const skipTutorial = useCallback(() => {
    skipAll()
  }, [skipAll])

  const toggleContextualTips = useCallback(() => {
    updateState((current) => ({
      ...current,
      contextualTipsEnabled: !current.contextualTipsEnabled,
    }))
  }, [updateState])

  const setAutoStartEnabled = useCallback(
    (enabled) => {
      updateState((current) => ({
        ...current,
        tutorialAutoStartEnabled: Boolean(enabled),
        dismissedWelcome: !enabled ? true : current.dismissedWelcome,
      }))
    },
    [updateState]
  )

  const toggleAutoStart = useCallback(() => {
    setAutoStartEnabled(!state.tutorialAutoStartEnabled)
  }, [setAutoStartEnabled, state.tutorialAutoStartEnabled])

  useEffect(() => {
    setState(getTutorialState(user))
  }, [user])

  useEffect(() => () => {
    window.clearTimeout(remoteSyncTimeoutRef.current)
  }, [])

  useEffect(() => {
    if (!user || !user.profileCompleted || loadingUser) {
      stopTutorialUi()
      return
    }

    if (!canShowTutorialOnPath(location.pathname)) {
      setWelcomePromptVisible(false)
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      const nextState = getTutorialState(user)
      const shouldStartInline = shouldShowWelcomeTutorial(user, nextState)
      const inlineState = shouldStartInline
        ? saveTutorialState(user, {
          ...nextState,
          firstStepsStarted: true,
          firstStepsPaused: false,
          firstStepsDismissed: false,
          hasSeenWelcome: true,
          dismissedWelcome: true,
          tutorialStartedAt: nextState.tutorialStartedAt || nowIso(),
          tutorialCurrentFlow: 'first-steps',
          firstStepsLastFocusedMission: FIRST_STEPS_MISSIONS[0]?.id || '',
        })
        : nextState

      setState(inlineState)
      setWelcomePromptVisible(false)

      if (shouldStartInline) {
        setActiveFlowId('first-steps')
        setActiveStepIndex(0)
        const firstStep = tutorialFlows['first-steps']?.steps?.[0]
        if (firstStep?.route && location.pathname !== firstStep.route) {
          navigate(firstStep.route)
        }
      }
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [loadingUser, location.pathname, navigate, stopTutorialUi, user])

  useEffect(() => {
    function handleOpenTutorial(event) {
      const flowId = event.detail?.flowId || event.detail?.sectionId || 'welcome'
      startTutorial(flowId)
    }

    function handleResetTutorial() {
      restartTutorial()
    }

    function handleContinueTutorial() {
      continueTutorial()
    }

    function handleOpenSection(event) {
      openTutorialSection(event.detail?.sectionId || event.detail?.flowId || getFlowForPath(location.pathname))
    }

    window.addEventListener('forgeflow:start-tutorial', handleOpenTutorial)
    window.addEventListener('forgeflow:reset-tutorial', handleResetTutorial)
    window.addEventListener('forgeflow:continue-tutorial', handleContinueTutorial)
    window.addEventListener('forgeflow:open-tutorial-section', handleOpenSection)

    return () => {
      window.removeEventListener('forgeflow:start-tutorial', handleOpenTutorial)
      window.removeEventListener('forgeflow:reset-tutorial', handleResetTutorial)
      window.removeEventListener('forgeflow:continue-tutorial', handleContinueTutorial)
      window.removeEventListener('forgeflow:open-tutorial-section', handleOpenSection)
    }
  }, [continueTutorial, location.pathname, openTutorialSection, restartTutorial, startTutorial])

  useEffect(() => {
    if (!isRunning || !activeStep?.route) return

    if (!user || !user.profileCompleted || !canShowTutorialOnPath(location.pathname)) {
      stopTutorialUi()
      return
    }

    if (location.pathname !== activeStep.route) {
      navigate(activeStep.route)
    }
  }, [activeStep?.route, isRunning, location.pathname, navigate, stopTutorialUi, user])

  useEffect(() => {
    if (!isRunning || activeStep?.createDemoSession !== true) return
    ensureTutorialWorkoutSession()
  }, [activeStep?.createDemoSession, ensureTutorialWorkoutSession, isRunning])

  useEffect(() => {
    if (!isRunning || !activeFlow) return
    persistCurrentPosition(activeFlow.id, activeStepIndex)
  }, [activeFlow, activeStepIndex, isRunning, persistCurrentPosition])

  useEffect(() => {
    if (!isRunning || !activeStep || activeStep.requiresAction === false) return

    const activeStepKey = `${activeFlow?.id || ''}:${activeStepIndex}`
    if (suppressAutoAdvanceStepRef.current === activeStepKey) {
      suppressAutoAdvanceStepRef.current = ''
      return
    }

    if (!isTutorialStepActionComplete(activeStep, { firstStepsCompleted: firstStepsCompletedMap, location })) return

    const frameId = window.requestAnimationFrame(() => {
      nextStep()
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [activeFlow?.id, activeStep, activeStepIndex, firstStepsCompletedMap, isRunning, location, nextStep])

  useEffect(() => {
    if (!state.firstStepsStarted || state.firstStepsDismissed) return

    if (activeSession && !isTutorialWorkoutSession(activeSession)) {
      completeFirstStepMission('start-workout')
    }

    if (Number(completedSets || 0) > 0) {
      completeFirstStepMission('register-set')
    }
  }, [activeSession, completeFirstStepMission, completedSets, state.firstStepsDismissed, state.firstStepsStarted])

  useEffect(() => {
    if (!state.firstStepsStarted || state.firstStepsDismissed) return
    if (location.pathname === '/history' || location.pathname.startsWith('/history/')) {
      completeFirstStepMission('view-history')
    }
  }, [completeFirstStepMission, location.pathname, state.firstStepsDismissed, state.firstStepsStarted])

  const currentPageFlowId = getFlowForPath(location.pathname)
  const currentPageFlow = tutorialFlows[currentPageFlowId] || tutorialFlows.welcome
  const currentSection = getTutorialSection(activeStep?.section || currentPageFlowId)

  const sections = useMemo(() => getTutorialSections(), [])
  const completedSectionCount = uniqueValues(state.completedSections || []).length
  const progress = useMemo(() => {
    const totalSteps = activeFlow?.steps?.length || 0
    const currentStepNumber = totalSteps ? activeStepIndex + 1 : 0
    const percentage = totalSteps ? Math.round((currentStepNumber / totalSteps) * 100) : 0

    return {
      currentStep: currentStepNumber,
      totalSteps,
      percentage,
      completedSections: Math.max(completedSectionCount, firstStepsProgress.completed),
      totalSections: Math.max(1, firstStepsProgress.total),
      currentSectionId: currentSection?.id || 'firstSteps',
      currentSectionTitle: currentSection?.shortTitle || currentSection?.title || 'Primeiros passos',
      missionsCompleted: firstStepsProgress.completed,
      missionsTotal: firstStepsProgress.total,
      missionsPercentage: firstStepsProgress.percentage,
    }
  }, [activeFlow?.steps?.length, activeStepIndex, completedSectionCount, currentSection, firstStepsProgress.completed, firstStepsProgress.percentage, firstStepsProgress.total, sections.length])

  const value = useMemo(
    () => ({
      state,
      flows: tutorialFlows,
      sections,
      currentPageFlow,
      currentPageFlowId,
      activeFlow,
      activeFlowId,
      activeStep,
      currentStep: activeStep,
      activeStepIndex,
      isRunning,
      isTutorialOpen: isRunning,
      welcomePromptVisible,
      canShowTutorial,
      currentSection,
      progress,
      firstStepMissions: FIRST_STEPS_MISSIONS,
      firstStepsCompleted: firstStepsCompletedMap,
      firstStepsProgress,
      completeFirstStepMission,
      focusFirstStepMission,
      pauseFirstSteps,
      resumeFirstSteps,
      dismissFirstSteps,
      startTutorial,
      continueTutorial,
      nextStep,
      requestNextStep,
      previousStep,
      skipStep,
      skipAll,
      skipTutorial,
      pauseTutorial,
      completeTutorial,
      restartTutorial,
      resetAllTutorials,
      openTutorialSection,
      closeWelcomePrompt,
      toggleContextualTips,
      toggleAutoStart,
      setAutoStartEnabled,
    }),
    [
      activeFlow,
      activeFlowId,
      activeStep,
      activeStepIndex,
      canShowTutorial,
      closeWelcomePrompt,
      completeFirstStepMission,
      dismissFirstSteps,
      completeTutorial,
      continueTutorial,
      currentPageFlow,
      currentPageFlowId,
      currentSection,
      isRunning,
      firstStepsCompletedMap,
      firstStepsProgress,
      focusFirstStepMission,
      nextStep,
      requestNextStep,
      openTutorialSection,
      pauseTutorial,
      previousStep,
      progress,
      pauseFirstSteps,
      resetAllTutorials,
      restartTutorial,
      resumeFirstSteps,
      sections,
      setAutoStartEnabled,
      skipAll,
      skipStep,
      skipTutorial,
      startTutorial,
      state,
      toggleAutoStart,
      toggleContextualTips,
      welcomePromptVisible,
    ]
  )

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  )
}

export function useTutorial() {
  const context = useContext(TutorialContext)

  if (!context) {
    throw new Error('useTutorial precisa estar dentro de TutorialProvider')
  }

  return context
}
