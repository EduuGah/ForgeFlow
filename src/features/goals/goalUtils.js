export function normalizeGoal(goal) {
  return {
    ...goal,
    id: goal._id || goal.id,
    title: goal.title || 'Meta sem título',
    description: goal.description || '',
    type: goal.type || 'custom',
    targetValue: Number(goal.targetValue) || 0,
    currentValue: Number(goal.currentValue) || 0,
    progressPercent: Number(goal.progressPercent) || 0,
    unit: goal.unit || '',
    status: goal.status || 'active',
    direction: goal.direction || 'increase',
    period: goal.period || 'none',
    exerciseName: goal.exerciseName || '',
    deadline: goal.deadline ? String(goal.deadline).slice(0, 10) : '',
    completedAt: goal.completedAt || null,
    baselineValue: Number(goal.baselineValue) || 0,
    baselineAt: goal.baselineAt || null,
    baselinePeriodKey: goal.baselinePeriodKey || '',
  }
}

