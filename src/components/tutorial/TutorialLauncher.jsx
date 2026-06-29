import { useMemo } from 'react'
import { useTutorial } from '../../context/TutorialContext'

const REVIEW_SECTIONS = [
  { id: 'dashboard', label: 'Rever Dashboard' },
  { id: 'workout', label: 'Rever Treino Ativo' },
  { id: 'history', label: 'Rever Histórico' },
  { id: 'nutrition', label: 'Rever Nutrição' },
]

export default function TutorialLauncher({ compact = false }) {
  const {
    state,
    sections,
    progress,
    continueTutorial,
    restartTutorial,
    openTutorialSection,
    toggleAutoStart,
  } = useTutorial()

  const completedSections = useMemo(() => new Set(state.completedSections || []), [state.completedSections])
  const completedCount = Math.min(completedSections.size, sections.length)
  const completionText = state.tutorialCompleted
    ? 'Tutorial concluído. Você pode rever qualquer parte quando quiser.'
    : `Você concluiu ${completedCount} de ${sections.length} seções.`

  return (
    <section className={`ff-tutorial-launcher ${compact ? 'ff-tutorial-launcher--compact' : ''}`} data-tutorial="settings-tutorial">
      <div className="ff-tutorial-launcher__header">
        <div>
          <span className="ff-tutorial-tooltip__eyebrow">Ajuda do app</span>
          <h3>Tutorial e ajuda</h3>
          <p>{completionText}</p>
        </div>
        <span className="ff-tutorial-launcher__progress">{completedCount}/{sections.length}</span>
      </div>

      <div className="ff-tutorial-launcher__meter" aria-hidden="true">
        <span style={{ width: `${sections.length ? (completedCount / sections.length) * 100 : progress.percentage || 0}%` }} />
      </div>

      <div className="ff-tutorial-section-picker">
        <button type="button" className="ff-tutorial-btn ff-tutorial-btn--primary" onClick={continueTutorial}>
          Continuar tutorial
        </button>
        <button type="button" className="ff-tutorial-btn ff-tutorial-btn--ghost" onClick={restartTutorial}>
          Reiniciar tutorial
        </button>
        {REVIEW_SECTIONS.map((item) => (
          <button key={item.id} type="button" className="ff-tutorial-btn ff-tutorial-btn--soft" onClick={() => openTutorialSection(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      <label className="ff-tutorial-launcher__toggle">
        <input
          type="checkbox"
          checked={Boolean(state.tutorialAutoStartEnabled)}
          onChange={toggleAutoStart}
        />
        <span>Mostrar tutorial automaticamente</span>
      </label>
    </section>
  )
}
