import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from './AuthContext'
import {
  getFlowForPath,
  getTutorialState,
  resetTutorialState,
  saveTutorialState,
  shouldShowWelcomeTutorial,
  tutorialFlows,
} from '../utils/tutorialUtils'

const TutorialContext = createContext(null)

export function TutorialProvider({ children }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [state, setState] = useState(() => getTutorialState(user))
  const [activeFlowId, setActiveFlowId] = useState('')
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [welcomePromptVisible, setWelcomePromptVisible] = useState(false)

  const activeFlow = activeFlowId ? tutorialFlows[activeFlowId] : null
  const activeStep = activeFlow?.steps?.[activeStepIndex] || null
  const isRunning = Boolean(activeFlow && activeStep)

  useEffect(() => {
    setState(getTutorialState(user))
  }, [user])

  useEffect(() => {
    if (!user) {
      setWelcomePromptVisible(false)
      return
    }

    const timeoutId = window.setTimeout(() => {
      if (shouldShowWelcomeTutorial(user)) {
        setWelcomePromptVisible(true)
      }
    }, 900)

    return () => window.clearTimeout(timeoutId)
  }, [user])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (!activeStep?.route) return

    if (location.pathname !== activeStep.route) {
      navigate(activeStep.route)
    }
  }, [activeStep?.route, location.pathname, navigate])

  const updateState = useCallback(
    (updater) => {
      setState((current) => {
        const nextState = typeof updater === 'function' ? updater(current) : updater
        return saveTutorialState(user, nextState)
      })
    },
    [user]
  )

  function startTutorial(flowId = 'welcome') {
    const flow = tutorialFlows[flowId] || tutorialFlows.welcome

    setWelcomePromptVisible(false)
    setActiveFlowId(flow.id)
    setActiveStepIndex(0)
  }

  function closeWelcomePrompt({ dontShowAgain = false } = {}) {
    setWelcomePromptVisible(false)

    if (dontShowAgain) {
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
    setWelcomePromptVisible(true)
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
    [activeFlow, activeStep, activeStepIndex, currentPageFlow, currentPageFlowId, isRunning, state, welcomePromptVisible]
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
