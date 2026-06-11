export function getSetWeight(set = {}) {
  return Number(set.weight || set.load || 0)
}

export function getSetReps(set = {}) {
  return Number(set.reps || 0)
}

export function getSetVolume(set = {}) {
  return getSetWeight(set) * getSetReps(set)
}

export function isCompletedWorkingSet(set = {}) {
  return Boolean(set.completed || set.isCompleted || set.done) && set.type !== 'warmup'
}

export function getBestCompletedSet(sets = []) {
  return sets
    .filter((set) => set && isCompletedWorkingSet(set) && getSetWeight(set) > 0 && getSetReps(set) > 0)
    .sort((a, b) => {
      const volumeDiff = getSetVolume(b) - getSetVolume(a)
      if (volumeDiff !== 0) return volumeDiff
      return getSetWeight(b) - getSetWeight(a)
    })[0] || null
}

export function getCurrentWorkingSets(sets = []) {
  return sets.filter((set) => set?.type !== 'warmup')
}

export function getProgressionToneClasses(tone = 'neutral') {
  const tones = {
    success: {
      card: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
      icon: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200',
      badge: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
    },
    warning: {
      card: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
      icon: 'border-amber-400/30 bg-amber-500/15 text-amber-200',
      badge: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
    },
    info: {
      card: 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]',
      icon: 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]',
      badge: 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]',
    },
    neutral: {
      card: 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-text)]',
      icon: 'border-[var(--ff-border)] bg-[var(--ff-card)] text-[var(--ff-accent-text)]',
      badge: 'border-[var(--ff-border)] bg-[var(--ff-card)] text-[var(--ff-muted)]',
    },
  }

  return tones[tone] || tones.neutral
}

export function getExerciseProgressionSuggestion({ lastPerformance, currentSets = [] } = {}) {
  const lastSet = getBestCompletedSet(lastPerformance?.sets || [])
  const currentSet = getBestCompletedSet(currentSets)
  const workingSets = getCurrentWorkingSets(currentSets)
  const completedWorkingSets = workingSets.filter(isCompletedWorkingSet)

  if (!lastSet) {
    return {
      tone: 'neutral',
      title: 'Sem base anterior',
      badge: 'Construindo histórico',
      description: 'Finalize algumas séries para o ForgeFlow começar a sugerir progressão.',
      nextTarget: 'Registrar séries consistentes',
      lastVolume: 0,
      currentVolume: currentSet ? getSetVolume(currentSet) : 0,
      volumeDiff: 0,
      weightDiff: 0,
      repsDiff: 0,
    }
  }

  const lastWeight = getSetWeight(lastSet)
  const lastReps = getSetReps(lastSet)
  const lastVolume = getSetVolume(lastSet)

  if (!currentSet) {
    return {
      tone: 'info',
      title: 'Referência do último treino',
      badge: 'Base anterior',
      description: `${lastWeight} kg x ${lastReps} reps foi sua melhor série recente.`,
      nextTarget: `Tente igualar ${lastWeight} kg x ${lastReps} reps`,
      lastVolume,
      currentVolume: 0,
      volumeDiff: 0,
      weightDiff: 0,
      repsDiff: 0,
    }
  }

  const currentWeight = getSetWeight(currentSet)
  const currentReps = getSetReps(currentSet)
  const currentVolume = getSetVolume(currentSet)
  const volumeDiff = currentVolume - lastVolume
  const weightDiff = currentWeight - lastWeight
  const repsDiff = currentReps - lastReps
  const completedRatio = workingSets.length
    ? completedWorkingSets.length / workingSets.length
    : 0

  if (volumeDiff > 0 && weightDiff >= 0) {
    return {
      tone: 'success',
      title: 'Progressão positiva',
      badge: `+${volumeDiff} kg volume`,
      description: 'Você superou a referência anterior. Se a execução estiver boa, pode manter ou subir pouco a carga no próximo treino.',
      nextTarget: `Próximo alvo: ${currentWeight} kg x ${currentReps + 1} reps ou +2,5 kg`,
      lastVolume,
      currentVolume,
      volumeDiff,
      weightDiff,
      repsDiff,
    }
  }

  if (volumeDiff > 0) {
    return {
      tone: 'success',
      title: 'Volume melhorou',
      badge: `+${volumeDiff} kg volume`,
      description: 'Mesmo sem aumentar carga, seu volume evoluiu. Boa opção para consolidar antes de subir peso.',
      nextTarget: `Consolidar ${currentWeight} kg x ${currentReps} reps`,
      lastVolume,
      currentVolume,
      volumeDiff,
      weightDiff,
      repsDiff,
    }
  }

  if (volumeDiff === 0) {
    return {
      tone: 'neutral',
      title: 'Performance mantida',
      badge: 'Mesmo volume',
      description: 'Você repetiu a referência anterior. Um pequeno aumento de reps ou carga já cria progressão.',
      nextTarget: `Tente ${currentWeight} kg x ${currentReps + 1} reps`,
      lastVolume,
      currentVolume,
      volumeDiff,
      weightDiff,
      repsDiff,
    }
  }

  if (completedRatio < 0.5) {
    return {
      tone: 'info',
      title: 'Ainda cedo para avaliar',
      badge: 'Poucas séries',
      description: 'Complete mais séries para a sugestão ficar mais confiável.',
      nextTarget: `Referência: ${lastWeight} kg x ${lastReps} reps`,
      lastVolume,
      currentVolume,
      volumeDiff,
      weightDiff,
      repsDiff,
    }
  }

  return {
    tone: 'warning',
    title: 'Volume abaixo do anterior',
    badge: `${volumeDiff} kg volume`,
    description: 'O volume ficou abaixo da referência. Talvez seja melhor manter a carga ou reduzir pouco para preservar execução.',
    nextTarget: `Voltar perto de ${lastWeight} kg x ${lastReps} reps`,
    lastVolume,
    currentVolume,
    volumeDiff,
    weightDiff,
    repsDiff,
  }
}
