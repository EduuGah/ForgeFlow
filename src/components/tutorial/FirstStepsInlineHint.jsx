import { CheckCircle2, Sparkles } from 'lucide-react'
import { useTutorial } from '../../context/TutorialContext'

export default function FirstStepsInlineHint({ missionId, title, description, actionLabel = 'Entendi', children }) {
  const {
    state,
    firstStepsCompleted = {},
    completeFirstStepMission,
    dismissFirstSteps,
  } = useTutorial()

  if (!state.firstStepsStarted || state.firstStepsPaused || state.firstStepsDismissed) return null
  if (missionId && firstStepsCompleted[missionId]) return null

  return (
    <aside className="ff-first-steps-hint" data-first-steps-hint={missionId || 'context'}>
      <div className="ff-first-steps-hint__icon">
        <Sparkles size={17} />
      </div>
      <div className="ff-first-steps-hint__copy">
        <strong>{title}</strong>
        <p>{description}</p>
        {children ? <div className="ff-first-steps-hint__content">{children}</div> : null}
      </div>
      <div className="ff-first-steps-hint__actions">
        {missionId ? (
          <button type="button" onClick={() => completeFirstStepMission?.(missionId)}>
            <CheckCircle2 size={14} /> {actionLabel}
          </button>
        ) : null}
        <button type="button" className="is-ghost" onClick={dismissFirstSteps} aria-label="Ocultar primeiros passos">
          ×
        </button>
      </div>
    </aside>
  )
}
