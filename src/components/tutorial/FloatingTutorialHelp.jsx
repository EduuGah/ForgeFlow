import { useLocation } from 'react-router-dom'
import { useTutorial } from '../../context/TutorialContext'

export default function FloatingTutorialHelp() {
  const location = useLocation()
  const {
    canShowTutorial,
    isTutorialOpen,
    welcomePromptVisible,
    state,
    currentPageFlow,
    currentPageFlowId,
    continueTutorial,
    startTutorial,
  } = useTutorial()

  if (!canShowTutorial || isTutorialOpen || welcomePromptVisible) return null
  if (!state.contextualTipsEnabled) return null
  if (location.pathname === '/settings') return null

  const label = state.tutorialPaused ? 'Continuar tutorial' : `Ajuda: ${currentPageFlow?.title?.replace('Tutorial do ', '') || 'esta tela'}`

  return (
    <button
      type="button"
      className="ff-tutorial-floating-help"
      onClick={() => (state.tutorialPaused ? continueTutorial() : startTutorial(currentPageFlowId))}
      aria-label={label}
    >
      ?
    </button>
  )
}
