const ACTION_TEXT = {
  'create-workout': 'Crie uma rotina para continuar.',
  'start-workout': 'Inicie uma rotina para continuar.',
  'register-set': 'Registre a série destacada para continuar.',
  'finish-workout': 'Finalize o treino para continuar.',
  'view-history': 'Abra o histórico para continuar.',
  'create-goal': 'Crie uma meta para continuar.',
  'set-weight': 'Digite o peso usado.',
  'set-reps': 'Digite as repetições.',
}

export function getTutorialStepActionText(step = {}) {
  return step.pendingText || ACTION_TEXT[step.id] || 'Conclua a ação destacada para continuar.'
}

export function shouldValidateTutorialStep(step = {}) {
  return step.requiresAction !== false && Boolean(step.id)
}

export function isTutorialStepActionComplete(step = {}, context = {}) {
  if (!shouldValidateTutorialStep(step)) return true

  if (step.validation === 'none') return true

  if (step.validation === 'input-value') {
    const targetElement = context.targetElement
    if (!targetElement) return false

    const input = targetElement.matches?.('input, textarea, select')
      ? targetElement
      : targetElement.querySelector?.('input, textarea, select')

    return Boolean(String(input?.value || '').trim())
  }

  if (step.validation === 'event') {
    return Boolean(context.eventType)
  }

  const completed = context.firstStepsCompleted || {}
  if (completed[step.id]) return true

  if (step.id === 'view-history') {
    const pathname = context.location?.pathname || ''
    return pathname === '/history' || pathname.startsWith('/history/')
  }

  return false
}
