import TutorialControls from './TutorialControls'
import TutorialProgress from './TutorialProgress'

function TutorialDemoPreview() {
  return (
    <div className="ff-tutorial-demo-preview" aria-label="Previa de treino ativo">
      <div className="ff-tutorial-demo-preview__top">
        <span>Supino reto</span>
        <strong>2/3 séries</strong>
      </div>
      <div className="ff-tutorial-demo-preview__row">
        <label>
          <span>Kg</span>
          <output>40</output>
        </label>
        <label>
          <span>Reps</span>
          <output>10</output>
        </label>
        <button type="button" aria-label="Exemplo de concluir série" tabIndex={-1}>
          Concluir
        </button>
      </div>
      <p>Preencha carga, registre reps e conclua a serie.</p>
    </div>
  )
}

export default function TutorialTooltip({
  step,
  section,
  progress,
  isLastStep,
  canGoBack,
  targetPending,
  targetMissing,
  nextDisabled,
  tooltipRef,
  style,
  variant = 'dock',
  onClose,
  onBack,
  onNext,
  onSkipStep,
  onPause,
  onSkipAll,
}) {
  if (!step) return null

  const showDemo = step.mode === 'demo' || variant === 'demo'
  const showWarning = targetMissing && step.requireTarget

  return (
    <article
      ref={tooltipRef}
      className={`ff-tutorial-tooltip ff-tutorial-tooltip--${variant}`}
      style={style}
      role="dialog"
      aria-modal="false"
      aria-labelledby="ff-tutorial-title"
      aria-describedby="ff-tutorial-description"
      tabIndex={-1}
    >
      <header className="ff-tutorial-tooltip__header">
        <div>
          <span className="ff-tutorial-tooltip__eyebrow">{section?.shortTitle || section?.title || 'Tutorial'}</span>
          <h2 id="ff-tutorial-title">{step.title}</h2>
        </div>
        <button type="button" className="ff-tutorial-close" onClick={onClose} aria-label="Fechar e rever depois">
          ×
        </button>
      </header>

      <TutorialProgress progress={progress} />

      <div className="ff-tutorial-tooltip__body">
        <p id="ff-tutorial-description">{step.description}</p>
        {showDemo ? <TutorialDemoPreview /> : null}
        {!showDemo && step.example ? <p className="ff-tutorial-tooltip__example">{step.example}</p> : null}
        {targetPending ? (
          <p className="ff-tutorial-tooltip__warning">
            Preparando a proxima etapa...
          </p>
        ) : null}
        {showWarning ? (
          <p className="ff-tutorial-tooltip__warning">
            Nao encontrei esse item agora. Voce pode continuar pelo menu da tela.
          </p>
        ) : null}
      </div>

      <TutorialControls
        isLastStep={isLastStep}
        canGoBack={canGoBack}
        canSkipStep={step.canSkip !== false}
        nextDisabled={nextDisabled}
        onBack={onBack}
        onNext={onNext}
        onSkipStep={onSkipStep}
        onPause={onPause}
        onSkipAll={onSkipAll}
      />
    </article>
  )
}
