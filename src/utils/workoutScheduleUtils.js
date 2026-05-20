export const WEEK_DAYS = [
  { key: 'monday', short: 'Seg', label: 'Segunda-feira', weekday: 2 },
  { key: 'tuesday', short: 'Ter', label: 'Terça-feira', weekday: 3 },
  { key: 'wednesday', short: 'Qua', label: 'Quarta-feira', weekday: 4 },
  { key: 'thursday', short: 'Qui', label: 'Quinta-feira', weekday: 5 },
  { key: 'friday', short: 'Sex', label: 'Sexta-feira', weekday: 6 },
  { key: 'saturday', short: 'Sáb', label: 'Sábado', weekday: 7 },
  { key: 'sunday', short: 'Dom', label: 'Domingo', weekday: 1 },
]

export const emptyWeeklySchedule = WEEK_DAYS.reduce((schedule, day) => {
  schedule[day.key] = { type: 'empty' }
  return schedule
}, {})

export function getWorkoutId(workout) {
  return String(workout?.id || workout?._id || '')
}

export function getWorkoutName(workout) {
  return workout?.name || workout?.title || workout?.workoutName || 'Treino sem nome'
}

export function normalizeScheduleEntry(entry = {}) {
  if (entry?.type === 'rest') return { type: 'rest' }

  if (entry?.type === 'workout' && (entry.workoutId || entry.id)) {
    return {
      type: 'workout',
      workoutId: String(entry.workoutId || entry.id),
      workoutName: entry.workoutName || entry.name || 'Treino agendado',
    }
  }

  return { type: 'empty' }
}

export function normalizeWeeklySchedule(schedule = {}) {
  return WEEK_DAYS.reduce((normalized, day) => {
    normalized[day.key] = normalizeScheduleEntry(schedule?.[day.key])
    return normalized
  }, {})
}

export function getTodayScheduleKey(date = new Date()) {
  const index = date.getDay()
  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][index]
}

export function getDayInfo(dayKey) {
  return WEEK_DAYS.find((day) => day.key === dayKey) || WEEK_DAYS[0]
}

export function findWorkoutByScheduleEntry(workouts = [], entry = {}) {
  if (entry?.type !== 'workout') return null

  return workouts.find((workout) => getWorkoutId(workout) === String(entry.workoutId)) || null
}

export function getTodayScheduledWorkout({ schedule, workouts, date = new Date() }) {
  const dayKey = getTodayScheduleKey(date)
  const entry = normalizeWeeklySchedule(schedule)[dayKey]
  const workout = findWorkoutByScheduleEntry(workouts, entry)

  return {
    dayKey,
    day: getDayInfo(dayKey),
    entry,
    workout,
    isMissingWorkout: entry?.type === 'workout' && !workout,
  }
}

export function countScheduledWorkoutDays(schedule = {}) {
  const normalized = normalizeWeeklySchedule(schedule)
  return WEEK_DAYS.filter((day) => normalized[day.key]?.type === 'workout').length
}

export function getNextScheduledWorkout({ schedule, workouts, fromDate = new Date() }) {
  const normalized = normalizeWeeklySchedule(schedule)
  const todayIndex = fromDate.getDay()

  for (let offset = 1; offset <= 7; offset += 1) {
    const targetDate = new Date(fromDate)
    targetDate.setDate(fromDate.getDate() + offset)
    const dayKey = getTodayScheduleKey(targetDate)
    const entry = normalized[dayKey]

    if (entry?.type !== 'workout') continue

    const workout = findWorkoutByScheduleEntry(workouts, entry)
    if (!workout) continue

    return {
      offset,
      dayKey,
      day: getDayInfo(dayKey),
      entry,
      workout,
      isTomorrow: offset === 1,
      startsInCurrentWeek: (todayIndex + offset) <= 6,
    }
  }

  return null
}

export function withWorkoutName(entry, workouts = []) {
  if (entry?.type === 'rest') return { type: 'rest' }
  if (entry?.type !== 'workout') return { type: 'empty' }

  const workout = findWorkoutByScheduleEntry(workouts, entry)

  return {
    type: 'workout',
    workoutId: String(entry.workoutId),
    workoutName: workout ? getWorkoutName(workout) : entry.workoutName || 'Treino removido',
  }
}

export function hydrateWeeklyScheduleWithWorkoutNames(schedule = {}, workouts = []) {
  const normalized = normalizeWeeklySchedule(schedule)

  return WEEK_DAYS.reduce((updatedSchedule, day) => {
    updatedSchedule[day.key] = withWorkoutName(normalized[day.key], workouts)
    return updatedSchedule
  }, {})
}

export function getScheduleSummary(schedule = {}) {
  const normalized = normalizeWeeklySchedule(schedule)
  const workoutDays = countScheduledWorkoutDays(normalized)
  const restDays = WEEK_DAYS.filter((day) => normalized[day.key]?.type === 'rest').length
  const emptyDays = WEEK_DAYS.length - workoutDays - restDays

  return { workoutDays, restDays, emptyDays }
}
