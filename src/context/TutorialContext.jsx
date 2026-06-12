import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from './AuthContext'
import { useWorkoutSession } from './WorkoutSessionContext'
import {
  clearWelcomeTutorialPending,
  getFlowForPath,
  getTutorialState,
  resetTutorialState,
  saveTutorialState,
  shouldShowWelcomeTutorial,
  tutorialFlows,
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
]

function canShowTutorialOnPath(pathname = '/') {
  return !NON_TUTORIAL_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export function TutorialProvider({ children }) {
  const { user } = useAuth()
  const { activeSession, startSession } = useWorkoutSession()
  const navigate = useNavigate()
  const location = useLocation()

  const [state, setState] = useState(() => getTutorialState(user))
  const [activeFlowId, setActiveFlowId] = useState('')
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [welcomePromptVisible, setWelcomePromptVisible] = useState(false)

  const activeFlow = activeFlowId ? tutorialFlows[activeFlowId] : null
  const activeStep = activeFlow?.steps?.[activeStepIndex] || null
  const isRunning = Boolean(activeFlow && activeStep)
  const canShowTutorial =
    Boolean(user?.profileCompleted) &&
    canShowTutorialOnPath(location.pathname)

  useEffect(() => {
    setState(getTutorialState(user))
  }, [user])

  useEffect(() => {
    if (!user || !user.profileCompleted) {
      setActiveFlowId('')
      setActiveStepIndex(0)
      setWelcomePromptVisible(false)
      unlockGlobalScroll()
      return
    }

    if (!canShowTutorialOnPath(location.pathname)) {
      setWelcomePromptVisible(false)
      return
    }

    const timeoutId = window.setTimeout(() => {
      const nextState = getTutorialState(user)

      if (shouldShowWelcomeTutorial(user, nextState)) {
        setWelcomePromptVisible(true)
      }
    }, 900)

    return () => window.clearTimeout(timeoutId)
  }, [location.pathname, user, state.dismissedWelcome, state.hasSeenWelcome])

  useEffect(() => {
    function handleOpenTutorial(event) {
      const flowId = event.detail?.flowId || 'welcome'
      startTutorial(flowId)
    }

    function handleResetTutorial() {
      resetAllTutorials()
    }

    window.addEventListener('forgeflow:start-tutorial', handleOpenTutorial)
    window.addEventListener('forgeflow:reset-tutorial', handleResetTutorial)

    return () => {
      window.removeEventListener('forgeflow:start-tutorial', handleOpenTutorial)
      window.removeEventListener('forgeflow:reset-tutorial', handleResetTutorial)
    }
     
  }, [user])

  useEffect(() => {
    if (!isRunning || !activeStep?.route) return

    if (!user || !user.profileCompleted || !canShowTutorialOnPath(location.pathname)) {
      setActiveFlowId('')
      setActiveStepIndex(0)
      setWelcomePromptVisible(false)
      unlockGlobalScroll()
      return
    }

    if (location.pathname !== activeStep.route) {
      navigate(activeStep.route)
    }
  }, [activeStep?.route, isRunning, location.pathname, navigate, user])

  const updateState = useCallback(
    (updater) => {
      setState((current) => {
        const nextState = typeof updater === 'function' ? updater(current) : updater
        return saveTutorialState(user, nextState)
      })
    },
    [user]
  )

  function createTutorialWorkout() {
    return {
      id: 'tutorial-workout',
      name: 'Tutorial ForgeFlow',
      isTutorial: true,
      tutorialOnly: true,
      exercises: [
        {
          id: 'tutorial-supino',
          exercise: {
            id: 'tutorial-exercise-supino',
            name: 'Supino reto — Teste',
            muscleGroup: 'Peito',
            equipment: 'Barra',
            instructions: 'Exercício de exemplo para aprender a registrar séries.',
            tips: 'Use valores fictícios. Este treino é apenas para teste.',
          },
          note: 'Exercício de teste para aprender carga, reps e aquecimento.',
          restTimer: '60s',
          sets: [
            {
              id: 'tutorial-supino-warmup',
              description: 'Aquecimento',
              type: 'warmup',
            },
            {
              id: 'tutorial-supino-1',
              description: '8-12 Rep',
              type: 'working',
            },
            {
              id: 'tutorial-supino-2',
              description: '8-12 Rep',
              type: 'working',
            },
          ],
        },
        {
          id: 'tutorial-remada',
          exercise: {
            id: 'tutorial-exercise-remada',
            name: 'Remada baixa — Teste',
            muscleGroup: 'Costas',
            equipment: 'Máquina',
            instructions: 'Exercício de exemplo para praticar troca de exercício.',
            tips: 'Clique na barra “Ir para exercício” para chegar até aqui.',
          },
          note: 'Use este exercício para testar navegação por exercício.',
          restTimer: '60s',
          sets: [
            {
              id: 'tutorial-remada-1',
              description: '10-12 Rep',
              type: 'working',
            },
            {
              id: 'tutorial-remada-2',
              description: '10-12 Rep',
              type: 'working',
            },
          ],
        },
      ],
    }
  }

  function startTutorialWorkoutSession() {
    if (activeSession) return

    const tutorialWorkout = createTutorialWorkout()
    startSession(tutorialWorkout)
  }

  function startTutorial(flowId = 'welcome') {
    if (!user || !user.profileCompleted || !canShowTutorialOnPath(location.pathname)) {
      setActiveFlowId('')
      setActiveStepIndex(0)
      setWelcomePromptVisible(false)
      unlockGlobalScroll()
      return
    }

    const flow = tutorialFlows[flowId] || tutorialFlows.welcome

    if (flow.id === 'workout') {
      startTutorialWorkoutSession()
    }

    if (flow.id === 'welcome') {
      clearWelcomeTutorialPending(user)
    }

    setWelcomePromptVisible(false)
    setActiveFlowId(flow.id)
    setActiveStepIndex(0)
  }

  function closeWelcomePrompt({ dontShowAgain = true } = {}) {
    setWelcomePromptVisible(false)

    if (dontShowAgain) {
      clearWelcomeTutorialPending(user)
      updateState((current) => ({
        ...current,
        dismissedWelcome: true,
        hasSeenWelcome: true,
      }))
    }
  }

  function completeTutorial() {
    if (!activeFlow) return

    updateState((current) => ({
      ...current,
      hasSeenWelcome: activeFlow.id === 'welcome' ? true : current.hasSeenWelcome,
      dismissedWelcome: activeFlow.id === 'welcome' ? true : current.dismissedWelcome,
      completedFlows: {
        ...current.completedFlows,
        [activeFlow.id]: true,
      },
    }))

    setActiveFlowId('')
    setActiveStepIndex(0)
    setWelcomePromptVisible(false)
    unlockGlobalScroll()
  }

  function skipTutorial() {
    completeTutorial()
  }

  function nextStep() {
    if (!activeFlow) return

    if (activeStepIndex >= activeFlow.steps.length - 1) {
      completeTutorial()
      return
    }

    setActiveStepIndex((current) => current + 1)
  }

  function previousStep() {
    setActiveStepIndex((current) => Math.max(0, current - 1))
  }

  function skipStep() {
    nextStep()
  }

  function resetAllTutorials() {
    resetTutorialState(user)
    const nextState = getTutorialState(user)
    setState(nextState)
    setActiveFlowId('')
    setActiveStepIndex(0)
    setWelcomePromptVisible(false)
    unlockGlobalScroll()
  }

  function toggleContextualTips() {
    updateState((current) => ({
      ...current,
      contextualTipsEnabled: current.contextualTipsEnabled === false,
    }))
  }

  const currentPageFlowId = getFlowForPath(location.pathname)
  const currentPageFlow = tutorialFlows[currentPageFlowId] || tutorialFlows.welcome

  const value = useMemo(
    () => ({
      state,
      flows: tutorialFlows,
      currentPageFlow,
      currentPageFlowId,
      activeFlow,
      activeStep,
      activeStepIndex,
      isRunning,
      welcomePromptVisible,
      canShowTutorial,
      startTutorial,
      closeWelcomePrompt,
      nextStep,
      previousStep,
      skipStep,
      skipTutorial,
      completeTutorial,
      resetAllTutorials,
      toggleContextualTips,
    }),
    [activeFlow, activeStep, activeStepIndex, canShowTutorial, currentPageFlow, currentPageFlowId, isRunning, state, welcomePromptVisible]
  )

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  )
}

export function useTutorial() {
  return useContext(TutorialContext)
}
