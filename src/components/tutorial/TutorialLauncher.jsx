import { CircleHelp, Play, RotateCcw } from 'lucide-react'

import { useTutorial } from '../../context/TutorialContext'

export default function TutorialLauncher({ compact = false }) {
  const {
    state,
    firstStepsProgress,
    continueTutorial,
    restartTutorial,
    toggleAutoStart,
  } = useTutorial()

  const completed = firstStepsProgress?.completed || 0
  const total = firstStepsProgress?.total || 6
  const isFinished = Boolean(firstStepsProgress?.isCompleted || state.tutorialCompleted || state.tutorialSkipped)
  const completedText = isFinished
    ? 'Você pode fazer o passo a passo completo novamente.'
    : `${completed} de ${total} etapas concluídas. Seu progresso fica salvo.`

  function handlePrimaryAction() {
    if (isFinished) {
      restartTutorial()
      return
    }

    continueTutorial()
  }

  return (
    <section className={`ff-tutorial-launcher ${compact ? 'ff-tutorial-launcher--compact' : ''}`} data-tutorial="settings-tutorial-panel">
      <div className="ff-tutorial-launcher__header" data-tutorial="settings-tutorial">
        <span className="ff-tutorial-launcher__icon" aria-hidden="true"><CircleHelp size={22} /></span>
        <div className="ff-tutorial-launcher__copy">
          <span className="ff-tutorial-tooltip__eyebrow">Ajuda</span>
          <h3>Tutorial guiado</h3>
          <p>{completedText}</p>
        </div>
        <span className="ff-tutorial-launcher__progress">{completed}/{total}</span>
      </div>

      <div className="ff-tutorial-launcher__meter" aria-hidden="true">
        <span style={{ width: `${firstStepsProgress?.percentage || 0}%` }} />
      </div>

      <div className="ff-tutorial-section-picker">
        <button type="button" className="ff-tutorial-btn ff-tutorial-btn--primary" onClick={handlePrimaryAction}>
          {isFinished ? <RotateCcw size={17} /> : <Play size={17} />}
          {isFinished ? 'Refazer tutorial do início' : 'Continuar tutorial'}
        </button>
        {!isFinished && (
          <button type="button" className="ff-tutorial-btn ff-tutorial-btn--ghost" onClick={restartTutorial}>
            <RotateCcw size={16} /> Recomeçar do zero
          </button>
        )}
      </div>

      <label className="ff-tutorial-launcher__toggle">
        <input
          type="checkbox"
          checked={Boolean(state.tutorialAutoStartEnabled)}
          onChange={toggleAutoStart}
        />
        <span>Iniciar automaticamente para novos usuários</span>
      </label>
    </section>
  )
}
