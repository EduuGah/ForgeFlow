import {
  Dumbbell,
  ListChecks,
  Timer,
} from 'lucide-react'


export function ActiveWorkoutHero({
  activeSession,
  completedSets,
  totalSets,
  progressPercent,
  elapsedSeconds,
  focusExercise,
  focusExerciseProgress,
  savingWorkout,
  appSettings,
  formatTime,
  getExerciseName,
  getExerciseSubtitle,
  onStartRestTimer,
  onRequestFinish,
  onFinishWorkout,
  onFocusExercise,
}) {
  const totalExercises = activeSession.exercises?.length || 0
  const focusName = focusExercise ? getExerciseName(focusExercise) : 'Próximo exercício'

  return (
    <header className="ff-hevy-workout-header">
      <div className="ff-hevy-workout-topbar">
        <button type="button" className="ff-hevy-workout-collapse" aria-label="Voltar">
          <span>⌄</span>
        </button>

        <div className="ff-hevy-workout-title">
          <h1>Treinamento</h1>
          <p>{activeSession.workoutName}</p>
        </div>

        <button
          type="button"
          onClick={() => onStartRestTimer()}
          className="ff-hevy-workout-timer"
          title="Iniciar descanso manual"
        >
          <Timer size={24} />
        </button>

        <button
          type="button"
          onClick={() => {
            if (appSettings.confirmBeforeFinishWorkout) {
              onRequestFinish()
            } else {
              onFinishWorkout()
            }
          }}
          disabled={savingWorkout}
          className="ff-hevy-workout-finish"
        >
          {savingWorkout ? 'Salvando...' : 'Concluir'}
        </button>
      </div>

      <div className="ff-hevy-workout-metrics">
        <div>
          <span>Duração</span>
          <strong>{formatTime(elapsedSeconds)}</strong>
        </div>
        <div>
          <span>Exercícios</span>
          <strong>{totalExercises}</strong>
        </div>
        <div>
          <span>Séries</span>
          <strong>{completedSets}/{totalSets}</strong>
        </div>
        <button type="button" onClick={() => onFocusExercise(focusExercise?.id)} disabled={!focusExercise}>
          <span>Atual</span>
          <strong>{focusName}</strong>
        </button>
      </div>

      <div className="ff-hevy-workout-progress" aria-label={`${progressPercent}% concluído`}>
        <div style={{ width: `${progressPercent}%` }} />
      </div>

      {focusExercise && (
        <button type="button" onClick={() => onFocusExercise(focusExercise.id)} className="ff-hevy-focus-strip">
          <Dumbbell size={18} />
          <span>{getExerciseSubtitle(focusExercise)}</span>
          <strong>{focusExerciseProgress}%</strong>
        </button>
      )}
    </header>
  )
}


export function ExerciseJumpNav({
  sessionExercises,
  selectedExercise,
  getExerciseName,
  onFocusExercise,
}) {
  return (
    <section className="ff-exercise-jump-nav mb-4 rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-3">
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-muted)]">
          <ListChecks size={15} />
          Ir para exercício
        </div>

        <span className="text-xs font-bold text-[var(--ff-muted)]">
          {sessionExercises.length} exercício(s)
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {sessionExercises.map((exercise, index) => {
          const isActive = selectedExercise?.id === exercise.id
          const completed = (exercise.sets || []).filter((set) => set.completed && set.type !== 'warmup').length
          const total = (exercise.sets || []).filter((set) => set.type !== 'warmup').length || 1

          return (
            <button
              key={exercise.id}
              type="button"
              onClick={() => onFocusExercise(exercise.id)}
              className={[
                'flex min-w-[210px] max-w-[260px] items-center gap-3 rounded-2xl border p-3 text-left transition',
                isActive
                  ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]'
                  : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-text-soft)] hover:border-[var(--ff-accent-border)]',
              ].join(' ')}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/30 text-xs font-black">
                {index + 1}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black">
                  {getExerciseName(exercise)}
                </span>
                <span className="block text-xs opacity-70">
                  {completed}/{total} séries
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
