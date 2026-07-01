import TutorialDemoMini from './TutorialDemoMini'

export default function TutorialCoachCard({
  step,
  section,
  progress,
  isLastStep,
  canGoBack,
  isInline = false,
  targetStatus = '',
  onClose,
  onBack,
  onNext,
  onSkipStep,
  onPause,
}) {
  if (!step) return null

  const showDemo = step.mode === 'demo'
  const helperText = targetStatus === 'fallback'
    ? step.fallbackDescription || step.description
    : step.description

  return (
    <article
      className={`ff-tutorial-v5-card ${isInline ? 'ff-tutorial-v5-card--inline' : 'ff-tutorial-v5-card--panel'} ${showDemo ? 'ff-tutorial-v5-card--demo' : ''}`}
      role="region"
      aria-live="polite"
      aria-labelledby="ff-tutorial-v5-title"
      tabIndex={-1}
    >
      <header className="ff-tutorial-v5-card__topline">
        <span className="ff-tutorial-v5-card__section">{section?.shortTitle || section?.title || 'Tutorial'}</span>
        <span className="ff-tutorial-v5-card__counter">{progress.currentStep}/{progress.totalSteps}</span>
        <button type="button" className="ff-tutorial-v5-card__close" onClick={onClose} aria-label="Fechar tutorial e rever depois">
          ×
        </button>
      </header>

      <div className="ff-tutorial-v5-card__body">
        <div className="ff-tutorial-v5-card__copy">
          <h2 id="ff-tutorial-v5-title">{targetStatus === 'fallback' && step.fallbackTitle ? step.fallbackTitle : step.title}</h2>
          <p>{helperText}</p>
        </div>
        {showDemo ? <TutorialDemoMini /> : null}
      </div>

      <footer className="ff-tutorial-v5-card__actions" aria-label="Controles do tutorial">
        <button type="button" className="ff-tutorial-v5-btn ff-tutorial-v5-btn--ghost" onClick={onBack} disabled={!canGoBack}>
          Voltar
        </button>
        {step.canSkip !== false && !isLastStep ? (
          <button type="button" className="ff-tutorial-v5-btn ff-tutorial-v5-btn--link" onClick={onSkipStep}>
            Pular
          </button>
        ) : null}
        <button type="button" className="ff-tutorial-v5-btn ff-tutorial-v5-btn--link" onClick={onPause}>
          Depois
        </button>
        <button type="button" className="ff-tutorial-v5-btn ff-tutorial-v5-btn--primary" onClick={onNext}>
          {isLastStep ? 'Finalizar' : 'Próximo'}
        </button>
      </footer>
    </article>
  )
}
