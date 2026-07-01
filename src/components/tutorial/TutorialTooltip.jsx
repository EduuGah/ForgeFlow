import TutorialControls from './TutorialControls'
import TutorialProgress from './TutorialProgress'

export default function TutorialTooltip({
  step,
  section,
  progress,
  isLastStep,
  canGoBack,
  targetMissing,
  tooltipRef,
  style,
  variant = 'panel',
  onClose,
  onBack,
  onNext,
  onSkipStep,
  onPause,
  onSkipAll,
}) {
  if (!step) return null

  return (
    <article
      ref={tooltipRef}
      className={`ff-tutorial-tooltip ff-tutorial-tooltip--${variant}`}
      style={style}
      role="dialog"
      aria-modal={variant === 'panel' ? 'true' : 'false'}
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
        {step.example ? <p className="ff-tutorial-tooltip__example">{step.example}</p> : null}
        {targetMissing ? (
          <p className="ff-tutorial-tooltip__warning">
            Não encontrei esse item na tela agora. Talvez você ainda não tenha dados aqui. Pode pular esta etapa sem problema.
          </p>
        ) : null}
      </div>

      <TutorialControls
        isLastStep={isLastStep}
        canGoBack={canGoBack}
        canSkipStep={step.canSkip !== false}
        onBack={onBack}
        onNext={onNext}
        onSkipStep={onSkipStep}
        onPause={onPause}
        onSkipAll={onSkipAll}
      />
    </article>
  )
}
