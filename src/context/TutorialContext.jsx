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
  markWelcomeTutorialPending,
  resetTutorialState,
  saveTutorialState,
  shouldShowWelcomeTutorial,
  tutorialFlows,
  tutorialSections,
} from '../utils/tutorialUtils'
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

function getStepSection(step) {
  return step?.section || 'welcome'
}

function getInitialStepIndex(flow, preferredStep = 0) {
  if (!flow?.steps?.length) return 0
  const numericStep = Number(preferredStep)
  if (!Number.isFinite(numericStep)) return 0
  return Math.min(Math.max(0, numericStep), flow.steps.length - 1)
}

function createTutorialWorkout() {
  return {
    id: 'tutorial-workout-demo',
    name: 'Treino Teste — Modo Tutorial',
    isTutorial: true,
    tutorialOnly: true,
    isTutorialDemo: true,
    exercises: [
      {
        id: 'tutorial-warmup-bar',
        exercise: {
          id: 'tutorial-exercise-warmup-bar',
          name: 'Aquecimento com barra',
          muscleGroup: 'Mobilidade',
          equipment: 'Barra',
          instructions: 'Exercício de exemplo para entender a estrutura de um treino ativo.',
          tips: 'Tudo neste modo é descartável e não entra no histórico real.',
        },
        restTimer: '45s',
        sets: [
          { id: 'tutorial-warmup-1', description: '10 repetições leves', type: 'warmup' },
          { id: 'tutorial-warmup-2', description: '8 repetições controladas', type: 'warmup' },
        ],
      },
      {
        id: 'tutorial-bench-press',
        exercise: {
          id: 'tutorial-exercise-bench-press',
          name: 'Supino reto',
          muscleGroup: 'Peito',
          equipment: 'Barra',
          instructions: 'Use esta etapa para aprender onde preencher carga, reps e concluir uma série.',
          tips: 'Pode digitar valores fictícios. Nada é salvo como treino real.',
        },
        restTimer: '90s',
        sets: [
          { id: 'tutorial-bench-1', description: '8-12 reps', type: 'working' },
          { id: 'tutorial-bench-2', description: '8-12 reps', type: 'working' },
          { id: 'tutorial-bench-3', description: '8-12 reps', type: 'working' },
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
          { id: 'tutorial-pulldown-1', description: '10-12 reps', type: 'working' },
          { id: 'tutorial-pulldown-2', description: '10-12 reps', type: 'working' },
        ],
      },
      {
        id: 'tutorial-squat',
        exercise: {
          id: 'tutorial-exercise-squat',
          name: 'Agachamento',
          muscleGroup: 'Pernas',
          equipment: 'Barra',
          instructions: 'Exercício final da demonstração para explicar finalização e histórico.',
          tips: 'Ao finalizar a demo, o ForgeFlow descarta o treino sem enviar para o backend.',
        },
        restTimer: '120s',
        sets: [
          { id: 'tutorial-squat-1', description: '6-10 reps', type: 'working' },
          { id: 'tutorial-squat-2', description: '6-10 reps', type: 'working' },
        ],
      },
    ],
  }
}

export function TutorialProvider({ children }) {
  const { user, loadingUser } = useAuth()
  const { activeSession, startSession, completedSets } = useWorkoutSession()
  const navigate = useNavigate()
  const location = useLocation()

  const [state, setState] = useState(() => getTutorialState(user))
  const [activeFlowId, setActiveFlowId] = useState('')
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [welcomePromptVisible, setWelcomePromptVisible] = useState(false)
  const remoteSyncTimeoutRef = useRef(null)
  const lastRemotePayloadRef = useRef('')

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
            let currentRemoteSettings = {}

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
    if (activeSession && !activeSession.isTutorial && !activeSession.tutorialOnly) {
      return false
    }

    if (activeSession?.isTutorial || activeSession?.tutorialOnly) {
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
    updateState((current) => ({
      ...current,
      firstStepsStarted: true,
      firstStepsPaused: false,
      firstStepsDismissed: false,
      hasSeenWelcome: true,
      dismissedWelcome: true,
      tutorialStartedAt: current.tutorialStartedAt || nowIso(),
    }))
    if (canShowTutorialOnPath(location.pathname)) {
      navigate('/')
    }
  }, [location.pathname, navigate, updateState])

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
    (flowId = 'welcome', options = {}) => {
      if (!user || !user.profileCompleted || !canShowTutorialOnPath(location.pathname)) {
        stopTutorialUi()
        return false
      }

      const firstMission = FIRST_STEPS_MISSIONS[0]?.id || ''

      clearWelcomeTutorialPending(user)
      setWelcomePromptVisible(false)
      stopTutorialUi()

      updateState((current) => ({
        ...current,
        tutorialCurrentFlow: flowId || 'welcome',
        tutorialCurrentStep: 0,
        tutorialPaused: false,
        tutorialSkipped: false,
        tutorialStartedAt: current.tutorialStartedAt || nowIso(),
        hasSeenWelcome: true,
        dismissedWelcome: true,
        firstStepsStarted: true,
        firstStepsPaused: false,
        firstStepsDismissed: false,
        firstStepsLastFocusedMission: options.missionId || current.firstStepsLastFocusedMission || firstMission,
        tutorialSeenSections: uniqueValues([...(current.tutorialSeenSections || []), 'firstSteps']),
      }))

      if (canShowTutorialOnPath(location.pathname) && location.pathname !== '/') {
        navigate('/')
      }

      return true
    },
    [location.pathname, navigate, stopTutorialUi, updateState, user]
  )

  const completeTutorial = useCallback(
    (options = {}) => {
      if (!activeFlow) {
        stopTutorialUi()
        return
      }

      const finishesFullTour = Boolean(options.full || activeFlow.id === 'welcome')
      const completedSections = finishesFullTour
        ? uniqueValues(Object.keys(tutorialSections))
        : uniqueValues([
          ...(state.completedSections || []),
          ...(activeFlow.sections || []),
          getStepSection(activeStep),
        ])

      updateState((current) => ({
        ...current,
        tutorialCompleted: finishesFullTour ? true : current.tutorialCompleted,
        tutorialCompletedAt: finishesFullTour ? nowIso() : current.tutorialCompletedAt,
        tutorialPaused: false,
        tutorialSkipped: Boolean(options.skipped || current.tutorialSkipped),
        hasSeenWelcome: activeFlow.id === 'welcome' || options.full ? true : current.hasSeenWelcome,
        dismissedWelcome: activeFlow.id === 'welcome' || options.full ? true : current.dismissedWelcome,
        tutorialSeenSections: uniqueValues([...(current.tutorialSeenSections || []), ...completedSections]),
        completedFlows: finishesFullTour
          ? Object.keys(tutorialFlows).reduce((acc, flowId) => ({ ...acc, [flowId]: true }), {})
          : {
            ...(current.completedFlows || {}),
            [activeFlow.id]: true,
          },
        completedSections,
      }))

      stopTutorialUi()
    },
    [activeFlow, activeStep, state.completedSections, stopTutorialUi, updateState]
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

  const previousStep = useCallback(() => {
    if (!activeFlow) return
    const nextIndex = Math.max(0, activeStepIndex - 1)
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

    stopTutorialUi()
  }, [activeFlow, activeStepIndex, persistCurrentPosition, stopTutorialUi, updateState])

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
    stopTutorialUi()
  }, [stopTutorialUi, updateState, user])

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
    return startTutorial(state.tutorialCurrentFlow || getFlowForPath(location.pathname), { resume: true })
  }, [location.pathname, startTutorial, state.tutorialCurrentFlow])

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
    resetTutorialState(user)
    markWelcomeTutorialPending(user)
    const nextState = getTutorialState(user)
    setState(nextState)
    setWelcomePromptVisible(false)
    setActiveFlowId('')
    setActiveStepIndex(0)
    unlockGlobalScroll()
    window.setTimeout(() => {
      startTutorial('welcome')
    }, 80)
  }, [startTutorial, user])

  const resetAllTutorials = useCallback(() => {
    restartTutorial()
  }, [restartTutorial])

  const skipTutorial = useCallback(() => {
    skipAll()
  }, [skipAll])

  const toggleContextualTips = useCallback(() => {
    updateState((current) => ({
      ...current,
      contextualTipsEnabled: !Boolean(current.contextualTipsEnabled),
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

    const timeoutId = window.setTimeout(() => {
      const nextState = getTutorialState(user)
      setState(nextState)

      if (shouldShowWelcomeTutorial(user, nextState)) {
        setWelcomePromptVisible(true)
      }
    }, 900)

    return () => window.clearTimeout(timeoutId)
  }, [loadingUser, location.pathname, stopTutorialUi, user])

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
    if (!state.firstStepsStarted || state.firstStepsDismissed) return

    if (activeSession && !activeSession.isTutorial && !activeSession.tutorialOnly) {
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
