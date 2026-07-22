import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { useTutorial } from '../../../context/TutorialContext'
import TutorialOverlay from './TutorialOverlay'
import useTutorialStepTarget from './useTutorialStepTarget'

export default function TutorialController() {
  const location = useLocation()
  const {
    activeFlow,
    activeStep,
    activeStepIndex,
    canShowTutorial,
    isRunning,
    previousStep,
    requestNextStep,
    skipTutorial,
    progress,
  } = useTutorial()
  const watchKey = `${activeFlow?.id || ''}:${activeStep?.id || ''}:${activeStepIndex}:${location.pathname}`
  const targetState = useTutorialStepTarget(isRunning && canShowTutorial ? activeStep : null, watchKey)

  useEffect(() => {
    const element = targetState.element
    if (!isRunning || !activeStep?.autoAdvanceOn || targetState.status !== 'ready' || !element) return undefined

    const eventNames = activeStep.autoAdvanceOn === 'input'
      ? ['input', 'change']
      : [activeStep.autoAdvanceOn]

    function handleAction(event) {
      requestNextStep({
        eventType: event.type,
        targetElement: element,
      })
    }

    eventNames.forEach((eventName) => {
      element.addEventListener(eventName, handleAction, true)
    })

    return () => {
      eventNames.forEach((eventName) => {
        element.removeEventListener(eventName, handleAction, true)
      })
    }
  }, [activeStep, isRunning, requestNextStep, targetState.element, targetState.status])

  useEffect(() => {
    if (!isRunning) return
    document.documentElement.classList.add('ff-guided-tutorial-open')
    document.body.classList.add('ff-guided-tutorial-open')

    return () => {
      document.documentElement.classList.remove('ff-guided-tutorial-open')
      document.body.classList.remove('ff-guided-tutorial-open')
    }
  }, [isRunning])

  if (!isRunning || !canShowTutorial || !activeStep) return null

  return (
    <TutorialOverlay
      step={activeStep}
      flowTitle={activeFlow?.title}
      current={progress.currentStep}
      total={progress.totalSteps}
      canGoBack={activeStepIndex > 0}
      targetState={targetState}
      onBack={previousStep}
      onNext={() => requestNextStep({ targetElement: targetState.element })}
      onSkip={skipTutorial}
    />
  )
}
