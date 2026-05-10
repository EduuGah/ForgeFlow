export function getStorageData(key, fallback = []) {
  if (typeof window === 'undefined') return fallback
  try {
    const data = window.localStorage.getItem(key)
    return data ? JSON.parse(data) : fallback
  } catch {
    return fallback
  }
}

export function normalizeText(value = '') {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
export function safeArray(value) { return Array.isArray(value) ? value : [] }
export function safeNumber(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback }
export function getSessionDate(session = {}) { return session.finishedAt || session.completedAt || session.date || session.createdAt || session.startedAt || null }
export function getSessionDuration(session = {}) { return safeNumber(session.durationSeconds ?? session.duration ?? session.elapsedSeconds ?? 0) }
export function getWorkoutName(session = {}, index = 0) { return session.workoutName || session.name || session.title || `Treino ${index + 1}` }
export function getExerciseObject(item = {}) { return item.exercise || item.exerciseData || item.details || item.exerciseInfo || item }
export function getExerciseName(item = {}, index = 0) { const e = getExerciseObject(item); return e.name || e.exerciseName || e.title || item.name || item.exerciseName || item.title || item.label || `Exercício ${index + 1}` }
export function getExerciseMuscleGroup(item = {}) { const e = getExerciseObject(item); return e.muscleGroup || e.normalizedGroup || e.group || e.primaryMuscle || item.muscleGroup || item.normalizedGroup || item.group || item.primaryMuscle || 'Sem grupo' }
export function getExerciseEquipment(item = {}) { const e = getExerciseObject(item); return e.equipment || e.equipmentType || item.equipment || item.equipmentType || 'Sem equipamento' }
export function getSetWeight(set = {}) { return safeNumber(set.weight ?? set.load ?? set.carga ?? 0) }
export function getSetReps(set = {}) { return safeNumber(set.reps ?? set.repetitions ?? set.rep ?? 0) }
export function getSetVolume(set = {}) { return getSetWeight(set) * getSetReps(set) }

export function isValidWorkingSet(set = {}) {
  const hasFlag = set.completed !== undefined || set.isCompleted !== undefined || set.done !== undefined
  const completed = hasFlag ? set.completed === true || set.isCompleted === true || set.done === true : true
  return set.type !== 'warmup' && completed && getSetWeight(set) > 0 && getSetReps(set) > 0
}

export function getCompletedSets(history = []) {
  if (!Array.isArray(history)) return []
  return history.flatMap((session, sessionIndex) => {
    const exercises = safeArray(session?.exercises)
    const workoutName = getWorkoutName(session, sessionIndex)
    const date = getSessionDate(session)
    return exercises.flatMap((exerciseItem, exerciseIndex) => {
      const sets = safeArray(exerciseItem?.sets)
      const exerciseName = getExerciseName(exerciseItem, exerciseIndex)
      const normalizedExerciseName = normalizeText(exerciseName)
      const muscleGroup = getExerciseMuscleGroup(exerciseItem)
      const equipment = getExerciseEquipment(exerciseItem)
      return sets.filter(isValidWorkingSet).map((set, setIndex) => {
        const weight = getSetWeight(set); const reps = getSetReps(set); const volume = weight * reps
        return { id: set.id || set._id || `${session?._id || session?.id || sessionIndex}-${exerciseIndex}-${setIndex}`, workoutName, fullDate: date, date, sessionIndex, exerciseIndex, rawSetIndex: setIndex, exerciseName, normalizedExerciseName, muscleGroup, equipment, setNumber: safeNumber(set.setNumber ?? set.order ?? setIndex + 1, setIndex + 1), weight, reps, volume, chartIndex: 0, axisLabel: '', plannedDescription: set.plannedDescription || set.description || '', isPR: Boolean(set.isPR || set.isWeightPR || set.isVolumePR), isWeightPR: Boolean(set.isWeightPR || set.isPR), isVolumePR: Boolean(set.isVolumePR) }
      })
    })
  })
}

export function getTotalVolume(sets = []) { return safeArray(sets).reduce((total, set) => total + safeNumber(set.volume ?? getSetVolume(set)), 0) }
export function getHeaviestExercise(sets = []) { if (!Array.isArray(sets) || sets.length === 0) return null; return sets.reduce((best, current) => current.weight > best.weight || (current.weight === best.weight && current.reps > best.reps) ? current : best, sets[0]) }
export function getBestVolumeSet(sets = []) { if (!Array.isArray(sets) || sets.length === 0) return null; return sets.reduce((best, current) => current.volume > best.volume ? current : best, sets[0]) }
export function getMostTrainedExercise(sets = []) { const count = new Map(); safeArray(sets).forEach((set) => count.set(set.exerciseName || 'Sem nome', (count.get(set.exerciseName || 'Sem nome') || 0) + 1)); const entries = Array.from(count.entries()); if (entries.length === 0) return null; const [name, total] = entries.sort((a, b) => b[1] - a[1])[0]; return { name, exerciseName: name, total } }
export function getMuscleGroupStats(sets = []) { const count = new Map(); safeArray(sets).forEach((set) => count.set(set.muscleGroup || 'Sem grupo', (count.get(set.muscleGroup || 'Sem grupo') || 0) + 1)); return Array.from(count.entries()).map(([group, total]) => ({ group, muscleGroup: group, total, sets: total })) }
export function getMuscleGroupVolumeStats(sets = []) { const map = new Map(); safeArray(sets).forEach((set) => { const group = set.muscleGroup || 'Sem grupo'; const cur = map.get(group) || { group, muscleGroup: group, sets: 0, volume: 0 }; cur.sets += 1; cur.volume += safeNumber(set.volume); map.set(group, cur) }); return Array.from(map.values()).sort((a, b) => b.volume - a.volume) }
export function getPRCount(sets = []) { return getExercisePRs(sets).length + getExerciseVolumePRs(sets).length }
export function getWeightPRCount(sets = []) { return getExercisePRs(sets).length }
export function getVolumePRCount(sets = []) { return getExerciseVolumePRs(sets).length }
export function getExercisePRs(sets = []) { const prs = new Map(); safeArray(sets).forEach((set) => { if (!set.exerciseName || !set.weight || !set.reps) return; const key = normalizeText(set.exerciseName); const cur = prs.get(key); if (!cur || set.weight > cur.weight || (set.weight === cur.weight && set.reps > cur.reps)) prs.set(key, { ...set, isWeightPR: true }) }); return Array.from(prs.values()).sort((a, b) => b.weight - a.weight) }
export function getExerciseVolumePRs(sets = []) { const prs = new Map(); safeArray(sets).forEach((set) => { if (!set.exerciseName || !set.weight || !set.reps) return; const key = normalizeText(set.exerciseName); const cur = prs.get(key); if (!cur || set.volume > cur.volume) prs.set(key, { ...set, isVolumePR: true }) }); return Array.from(prs.values()).sort((a, b) => b.volume - a.volume) }
export function getRecentPRs(sets = [], limit = 8) { return [...getExercisePRs(sets).map((x) => ({ ...x, isWeightPR: true })), ...getExerciseVolumePRs(sets).map((x) => ({ ...x, isVolumePR: true }))].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, limit) }
export function groupSetsByWeek(sets = []) { const map = new Map(); safeArray(sets).forEach((set) => { if (!set.date) return; const date = new Date(set.date); if (Number.isNaN(date.getTime())) return; const year = date.getFullYear(); const start = new Date(year, 0, 1); const week = Math.ceil((((date - start) / 86400000) + start.getDay() + 1) / 7); const key = `${year}-S${String(week).padStart(2, '0')}`; const cur = map.get(key) || { week: key, volume: 0, sets: 0, workouts: new Set(), averageDurationSeconds: 0 }; cur.volume += set.volume; cur.sets += 1; cur.workouts.add(set.workoutName); map.set(key, cur) }); return Array.from(map.values()).map((item) => ({ ...item, workouts: item.workouts.size })) }
export function getBodyWeightHistory() { return getStorageData('forgeflow:bodyweight', []) }
