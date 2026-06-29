export default function TutorialProgress({ progress }) {
  if (!progress?.totalSteps) return null

  return (
    <div className="ff-tutorial-progress" aria-label={`Etapa ${progress.currentStep} de ${progress.totalSteps}`}>
      <div className="ff-tutorial-progress__bar" aria-hidden="true">
        <span style={{ width: `${progress.percentage || 0}%` }} />
      </div>
      <span className="ff-tutorial-step-counter">
        {progress.currentStep}/{progress.totalSteps}
      </span>
    </div>
  )
}
