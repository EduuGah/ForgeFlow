import FirstStepsChecklist from './FirstStepsChecklist'
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
  const total = firstStepsProgress?.total || 5
  const isHidden = Boolean(state.firstStepsDismissed)
  const completedText = firstStepsProgress?.isCompleted
    ? 'Missões concluídas. Você pode reiniciar quando quiser.'
    : isHidden
      ? 'O guia está oculto no Dashboard. Você pode mostrar novamente quando quiser.'
    : `${completed} de ${total} missões concluídas.`

  return (
    <section className={`ff-tutorial-launcher ${compact ? 'ff-tutorial-launcher--compact' : ''}`} data-tutorial="settings-tutorial-panel">
      <div className="ff-tutorial-launcher__header" data-tutorial="settings-tutorial">
        <div>
          <span className="ff-tutorial-tooltip__eyebrow">Central de missões</span>
          <h3>Guia rápido</h3>
          <p>{completedText}</p>
        </div>
        <span className="ff-tutorial-launcher__progress">{completed}/{total}</span>
      </div>

      <div className="ff-tutorial-launcher__meter" aria-hidden="true">
        <span style={{ width: `${firstStepsProgress?.percentage || 0}%` }} />
      </div>

      <div className="ff-tutorial-section-picker">
        <button type="button" className="ff-tutorial-btn ff-tutorial-btn--primary" onClick={continueTutorial}>
          {isHidden ? 'Mostrar guia novamente' : 'Continuar missões'}
        </button>
        <button type="button" className="ff-tutorial-btn ff-tutorial-btn--ghost" onClick={restartTutorial}>
          Reiniciar missões
        </button>
      </div>

      <div className="mt-4">
        <FirstStepsChecklist compact />
      </div>

      <label className="ff-tutorial-launcher__toggle">
        <input
          type="checkbox"
          checked={Boolean(state.tutorialAutoStartEnabled)}
          onChange={toggleAutoStart}
        />
        <span>Mostrar primeiros passos automaticamente</span>
      </label>
    </section>
  )
}
