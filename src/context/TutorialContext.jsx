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
  const { activeSession, startSession } = useWorkoutSession()
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
      const flow = tutorialFlows[flowId] || tutorialFlows.welcome

      if (!user || !user.profileCompleted || !canShowTutorialOnPath(location.pathname)) {
        stopTutorialUi()
        return false
      }

      const requestedStep = options.resume
        ? state.tutorialCurrentFlow === flow.id
          ? state.tutorialCurrentStep
          : 0
        : options.stepIndex || 0
      const nextStepIndex = getInitialStepIndex(flow, requestedStep)
      const firstStep = flow.steps[nextStepIndex]

      if (flow.id === 'workout' || firstStep?.route === '/start-workout') {
        ensureTutorialWorkoutSession()
      }

      if (flow.id === 'welcome') {
        clearWelcomeTutorialPending(user)
      }

      setWelcomePromptVisible(false)
      setActiveFlowId(flow.id)
      setActiveStepIndex(nextStepIndex)
      persistCurrentPosition(flow.id, nextStepIndex)
      return true
    },
    [ensureTutorialWorkoutSession, location.pathname, persistCurrentPosition, state.tutorialCurrentFlow, state.tutorialCurrentStep, stopTutorialUi, user]
  )

  const completeTutorial = useCallback(
    (options = {}) => {
      if (!activeFlow) {
        stopTutorialUi()
        return
      }

      const completedSections = uniqueValues([
        ...(state.completedSections || []),
        ...(activeFlow.sections || []),
        getStepSection(activeStep),
      ])

      updateState((current) => ({
        ...current,
        tutorialCompleted: options.full || activeFlow.id === 'welcome' ? true : current.tutorialCompleted,
        tutorialCompletedAt: options.full || activeFlow.id === 'welcome' ? nowIso() : current.tutorialCompletedAt,
        tutorialPaused: false,
        tutorialSkipped: Boolean(options.skipped || current.tutorialSkipped),
        hasSeenWelcome: activeFlow.id === 'welcome' || options.full ? true : current.hasSeenWelcome,
        dismissedWelcome: activeFlow.id === 'welcome' || options.full ? true : current.dismissedWelcome,
        tutorialSeenSections: uniqueValues([...(current.tutorialSeenSections || []), ...completedSections]),
        completedFlows: {
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
          tutorialCurrentFlow: current.tutorialCurrentFlow || 'welcome',
          tutorialCurrentStep: current.tutorialCurrentStep || 0,
        }))
      }
    },
    [updateState, user]
  )

  const continueTutorial = useCallback(() => {
    const flowId = state.tutorialCurrentFlow || getFlowForPath(location.pathname)
    return startTutorial(flowId, { resume: true })
  }, [location.pathname, startTutorial, state.tutorialCurrentFlow])

  const openTutorialSection = useCallback(
    (sectionId) => {
      const flowId = tutorialFlows[sectionId] ? sectionId : getFlowForPath(location.pathname)
      return startTutorial(flowId, { stepIndex: 0 })
    },
    [location.pathname, startTutorial]
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
    if (!isRunning || activeStep?.route !== '/start-workout') return
    ensureTutorialWorkoutSession()
  }, [activeStep?.route, ensureTutorialWorkoutSession, isRunning])

  useEffect(() => {
    if (!isRunning || !activeFlow) return
    persistCurrentPosition(activeFlow.id, activeStepIndex)
  }, [activeFlow, activeStepIndex, isRunning, persistCurrentPosition])

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
      completedSections: completedSectionCount,
      totalSections: sections.length,
      currentSectionId: currentSection?.id || '',
      currentSectionTitle: currentSection?.shortTitle || currentSection?.title || '',
    }
  }, [activeFlow?.steps?.length, activeStepIndex, completedSectionCount, currentSection, sections.length])

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
      completeTutorial,
      continueTutorial,
      currentPageFlow,
      currentPageFlowId,
      currentSection,
      isRunning,
      nextStep,
      openTutorialSection,
      pauseTutorial,
      previousStep,
      progress,
      resetAllTutorials,
      restartTutorial,
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
