export default function TutorialControls({
  isLastStep = false,
  canGoBack = false,
  canSkipStep = true,
  onBack,
  onNext,
  onSkipStep,
  onSkipSection,
  onPause,
  onSkipAll,
}) {
  return (
    <div className="ff-tutorial-tooltip__controls" aria-label="Controles do tutorial">
      <div className="ff-tutorial-tooltip__primary-actions">
        <button
          type="button"
          className="ff-tutorial-btn ff-tutorial-btn--ghost"
          onClick={onBack}
          disabled={!canGoBack}
        >
          Voltar
        </button>
        <button type="button" className="ff-tutorial-btn ff-tutorial-btn--primary" onClick={onNext}>
          {isLastStep ? 'Finalizar' : 'Próximo'}
        </button>
      </div>

      <div className="ff-tutorial-tooltip__secondary-actions">
        {canSkipStep ? (
          <button type="button" className="ff-tutorial-link-btn" onClick={onSkipStep}>
            Pular etapa
          </button>
        ) : null}
        <button type="button" className="ff-tutorial-link-btn" onClick={onSkipSection}>
          Pular seção
        </button>
        <button type="button" className="ff-tutorial-link-btn" onClick={onPause}>
          Rever depois
        </button>
        <button type="button" className="ff-tutorial-link-btn ff-tutorial-link-btn--danger" onClick={onSkipAll}>
          Pular tudo
        </button>
      </div>
    </div>
  )
}
