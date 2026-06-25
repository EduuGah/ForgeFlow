import { formatGoalValue } from '../../features/goals/goalUtils'

function GoalProgressBar({ currentValue = 0, targetValue = 0, unit = '', progressPercent = 0 }) {
  const percent = Math.max(0, Math.min(100, Number(progressPercent || 0)))

  return (
    <div className="ff-goal-progress-bar">
      <div className="ff-goal-progress-bar__head">
        <p>Progresso</p>
        <strong>{percent}%</strong>
      </div>

      <div className="ff-goal-progress-bar__track">
        <span style={{ width: `${percent}%` }} />
      </div>

      <div className="ff-goal-progress-bar__values">
        <span>Atual: {formatGoalValue(currentValue, unit)}</span>
        <span>Meta: {formatGoalValue(targetValue, unit)}</span>
      </div>
    </div>
  )
}

export default GoalProgressBar
