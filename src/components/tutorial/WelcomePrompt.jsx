import { useEffect, useRef } from 'react'
import { useTutorial } from '../../context/TutorialContext'

export default function WelcomePrompt() {
  const {
    welcomePromptVisible,
    startTutorial,
    closeWelcomePrompt,
    skipAll,
  } = useTutorial()
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!welcomePromptVisible) return undefined

    const id = window.setTimeout(() => {
      dialogRef.current?.querySelector('button')?.focus({ preventScroll: true })
    }, 40)

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeWelcomePrompt({ pause: true })
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeWelcomePrompt, welcomePromptVisible])

  if (!welcomePromptVisible) return null

  return (
    <div className="ff-tutorial-welcome" role="presentation">
      <div className="ff-tutorial-welcome__backdrop" />
      <section
        ref={dialogRef}
        className="ff-tutorial-welcome__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ff-tutorial-welcome-title"
        aria-describedby="ff-tutorial-welcome-description"
      >
        <span className="ff-tutorial-welcome__badge">Guia rápido</span>
        <h2 id="ff-tutorial-welcome-title">Bem-vindo ao ForgeFlow</h2>
        <p id="ff-tutorial-welcome-description">
          O ForgeFlow acompanha seus treinos, séries, kg, repetições, PRs e consistência. O tour mostra exatamente onde tocar, com destaque visual na tela.
        </p>

        <div className="ff-tutorial-welcome__grid" aria-hidden="true">
          <span>Treino do dia</span>
          <span>Kg e reps</span>
          <span>Histórico</span>
          <span>Progresso</span>
        </div>

        <div className="ff-tutorial-welcome__actions">
          <button type="button" className="ff-tutorial-btn ff-tutorial-btn--primary" onClick={() => startTutorial('welcome')}>
            Começar tour
          </button>
          <button type="button" className="ff-tutorial-btn ff-tutorial-btn--ghost" onClick={() => closeWelcomePrompt({ pause: true })}>
            Ver depois
          </button>
          <button type="button" className="ff-tutorial-link-btn" onClick={skipAll}>
            Pular
          </button>
          <button type="button" className="ff-tutorial-link-btn" onClick={() => closeWelcomePrompt({ dontShowAgain: true })}>
            Não mostrar novamente
          </button>
        </div>
      </section>
    </div>
  )
}
