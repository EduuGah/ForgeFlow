import assert from 'node:assert/strict'
import {
    normalizeActiveWorkoutPayload,
    normalizeBackupPayload,
    validateWorkoutHistoryPayload,
} from '../utils/workoutValidation.js'

const validHistory = validateWorkoutHistoryPayload({
    workoutName: 'Push',
    exercises: [
        {
            exercise: { name: 'Supino Reto' },
            sets: [
                { id: '1', weight: '100', reps: '5', completed: true },
                { id: '2', weight: '40', reps: '10', completed: true, type: 'warmup' },
            ],
        },
    ],
    durationSeconds: '3600',
})

assert.equal(validHistory.valid, true)
assert.equal(validHistory.value.totalVolume, undefined)
assert.equal(validHistory.value.exercises[0].sets[0].weight, 100)
assert.equal(validHistory.value.exercises[0].sets[0].reps, 5)
assert.equal(validHistory.value.exercises[0].sets[0].volume, 500)

const invalidHistory = validateWorkoutHistoryPayload({
    workoutName: '',
    exercises: [],
})

assert.equal(invalidHistory.valid, false)

const noCompletedSet = validateWorkoutHistoryPayload({
    workoutName: 'Pull',
    exercises: [
        {
            exercise: { name: 'Remada' },
            sets: [{ weight: 50, reps: 10, completed: false }],
        },
    ],
})

assert.equal(noCompletedSet.valid, false)

const activeWorkout = normalizeActiveWorkoutPayload({
    name: 'Leg Day',
    exercises: [
        {
            name: 'Agachamento',
            sets: [{ weight: '120', reps: '3', done: true }],
        },
    ],
})

assert.equal(activeWorkout.workoutName, 'Leg Day')
assert.equal(activeWorkout.exercises[0].sets[0].completed, true)
assert.equal(activeWorkout.exercises[0].sets[0].volume, 360)

const invalidBackup = normalizeBackupPayload({
    app: 'OutroApp',
})

assert.equal(invalidBackup.valid, false)

const validBackup = normalizeBackupPayload({
    app: 'ForgeFlow',
    data: {
        workoutHistory: [validHistory.value],
    },
})

assert.equal(validBackup.valid, true)
assert.equal(validBackup.value.data.workoutHistory.length, 1)

console.log('✅ workoutValidation passou nos testes básicos.')
