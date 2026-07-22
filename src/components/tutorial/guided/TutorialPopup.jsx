import { ArrowLeft, ArrowRight, X } from 'lucide-react'

export default function TutorialPopup({
  step,
  flowTitle,
  current,
  total,
  placement = 'right',
  style,
  canGoBack = false,
  feedback = '',
  status = 'ready',
  onBack,
  onNext,
  onSkip,
  popupRef,
  compact = false,
}) {
  const isWaiting = status === 'waiting'
  const isMissing = status === 'missing'

  return (
    <section
      ref={popupRef}
      className={`ff-guided-tutorial-popup is-${placement} ${compact ? 'is-compact' : ''}`}
      style={style}
      role="dialog"
      aria-modal="false"
      aria-label={step?.title || 'Tutorial'}
    >
      <div className="ff-guided-tutorial-popup__top">
        <span>{current} de {total}</span>
        <button type="button" onClick={onSkip} aria-label="Pular tutorial">
          <X size={15} />
        </button>
      </div>

      <div className="ff-guided-tutorial-popup__copy">
        {!compact && <small>{flowTitle || 'Primeiros passos'}</small>}
        <h3>{step?.title || 'Tutorial'}</h3>
        <p>{isWaiting ? 'Preparando a tela...' : step?.description || 'Siga o destaque na tela.'}</p>
      </div>

      {(feedback || isMissing) && (
        <p className={isMissing ? 'ff-guided-tutorial-popup__feedback is-error' : 'ff-guided-tutorial-popup__feedback'}>
          {feedback || 'Não encontrei essa parte da tela. Tente voltar ou pular.'}
        </p>
      )}

      {!compact && (
        <div className="ff-guided-tutorial-popup__progress" aria-hidden="true">
          <span style={{ width: `${total ? Math.round((current / total) * 100) : 0}%` }} />
        </div>
      )}

      <div className="ff-guided-tutorial-popup__actions">
        {canGoBack && (
          <button type="button" className="is-ghost" onClick={onBack}>
            <ArrowLeft size={15} /> Voltar
          </button>
        )}

        <button type="button" className="is-primary" onClick={onNext} disabled={isWaiting}>
          Próximo <ArrowRight size={15} />
        </button>
      </div>

      {!compact && (
        <button type="button" className="ff-guided-tutorial-popup__skip" onClick={onSkip}>
          Pular tutorial
        </button>
      )}
    </section>
  )
}
