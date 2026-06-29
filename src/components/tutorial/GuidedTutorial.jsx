import FloatingTutorialHelp from './FloatingTutorialHelp'
import TutorialOverlay from './TutorialOverlay'
import WelcomePrompt from './WelcomePrompt'

export default function GuidedTutorial() {
  return (
    <>
      <WelcomePrompt />
      <TutorialOverlay />
      <FloatingTutorialHelp />
    </>
  )
}
