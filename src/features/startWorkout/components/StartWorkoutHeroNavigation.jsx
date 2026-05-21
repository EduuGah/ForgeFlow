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
  return (
    <div className="sticky top-0 z-30 -mx-4 mb-5 border-b border-[var(--ff-border)] bg-[var(--ff-bg)]/92 px-4 pb-3 pt-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:static xl:mx-0 xl:border-0 xl:bg-transparent xl:p-0 xl:backdrop-blur-none">
      <div className="ff-active-workout-hero rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.22)] sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-accent-text)]">
              Treino ativo
            </p>

            <h1 className="mt-1 truncate text-2xl font-black text-[var(--ff-text)] sm:text-3xl">
              {activeSession.workoutName}
            </h1>

            <p className="mt-1 text-sm text-[var(--ff-muted)]">
              {completedSets}/{totalSets} séries concluídas • {progressPercent}%
            </p>

            <div className="ff-active-workout-status-line">
              <span>{formatTime(elapsedSeconds)}</span>
              <span>{activeSession.exercises?.length || 0} exercícios</span>
              <span>{completedSets}/{totalSets} séries</span>
              <span>{progressPercent}% concluído</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <div className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)]/10 px-4 text-sm font-black text-[var(--ff-accent-text)] sm:h-11">
              <Timer size={18} />
              {formatTime(elapsedSeconds)}
            </div>

            <button
              type="button"
              onClick={() => onStartRestTimer()}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm font-black text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)] sm:h-11"
              title="Iniciar descanso manual"
            >
              <Timer size={17} />
              Descanso
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
              className="h-12 rounded-2xl bg-[var(--ff-accent)] px-4 text-sm font-bold text-white shadow-[0_0_20px_var(--ff-accent-shadow)] transition hover:bg-[var(--ff-accent-hover)] hover:shadow-[0_0_20px_var(--ff-accent-shadow)] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11"
            >
              {savingWorkout ? 'Salvando...' : 'Finalizar'}
            </button>
          </div>
        </div>

        {focusExercise && (
          <button
            type="button"
            onClick={() => onFocusExercise(focusExercise.id)}
            className="mt-4 w-full rounded-3xl border border-[var(--ff-accent-border)]/25 bg-[var(--ff-accent-soft)]/10 p-3 text-left transition hover:border-[var(--ff-accent-border)]"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
                  <Dumbbell size={19} />
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--ff-accent-text)]">
                    Próximo foco
                  </p>
                  <p className="truncate text-sm font-black text-[var(--ff-text)]">
                    {getExerciseName(focusExercise)}
                  </p>
                  <p className="truncate text-xs text-[var(--ff-muted)]">
                    {getExerciseSubtitle(focusExercise)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:min-w-[210px]">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--ff-surface-3)]">
                  <div
                    className="h-full rounded-full bg-[var(--ff-accent)] transition-all"
                    style={{ width: `${focusExerciseProgress}%` }}
                  />
                </div>

                <span className="text-xs font-black text-[var(--ff-accent-text)]">
                  {focusExerciseProgress}%
                </span>
              </div>
            </div>
          </button>
        )}

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--ff-surface-3)]">
          <div
            className="h-full rounded-full bg-[var(--ff-accent)] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
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
