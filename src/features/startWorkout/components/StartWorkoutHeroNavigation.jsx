import { Dumbbell, ListChecks } from 'lucide-react'

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
  onRequestFinish,
  onFinishWorkout,
  onFocusExercise,
}) {
  const totalExercises = activeSession.exercises?.length || 0
  const focusName = focusExercise ? getExerciseName(focusExercise) : 'Próximo exercício'

  function handleFinishClick() {
    if (appSettings.confirmBeforeFinishWorkout) {
      onRequestFinish()
      return
    }

    onFinishWorkout()
  }

  return (
    <header className="ff-forge-active-hero">
      <div className="ff-forge-active-hero__top">
        <button type="button" className="ff-forge-active-hero__back" aria-label="Voltar">
          <span>⌄</span>
        </button>

        <div className="ff-forge-active-hero__title">
          <span>Treino ativo</span>
          <h1>{activeSession.workoutName || 'Treinamento'}</h1>
        </div>

        <button
          type="button"
          onClick={handleFinishClick}
          disabled={savingWorkout}
          className="ff-forge-active-hero__finish"
        >
          {savingWorkout ? 'Salvando...' : 'Concluir'}
        </button>
      </div>

      <div className="ff-forge-active-hero__progress" aria-label={`${progressPercent}% concluído`}>
        <div style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="ff-forge-active-hero__metrics">
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
      </div>

      {focusExercise && (
        <button
          type="button"
          onClick={() => onFocusExercise(focusExercise.id)}
          className="ff-forge-active-hero__current"
        >
          <Dumbbell size={18} />
          <span>
            <small>Atual · {getExerciseSubtitle(focusExercise)}</small>
            <strong>{focusName}</strong>
          </span>
          <b>{focusExerciseProgress}%</b>
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
    <section className="ff-forge-exercise-strip" aria-label="Lista de exercícios do treino">
      <div className="ff-forge-exercise-strip__label">
        <ListChecks size={15} />
        <span>Exercícios</span>
        <b>{sessionExercises.length}</b>
      </div>

      <div className="ff-forge-exercise-strip__scroller">
        {sessionExercises.map((exercise, index) => {
          const isActive = selectedExercise?.id === exercise.id
          const completed = (exercise.sets || []).filter((set) => set.completed && set.type !== 'warmup').length
          const total = (exercise.sets || []).filter((set) => set.type !== 'warmup').length || 1

          return (
            <button
              key={exercise.id}
              type="button"
              onClick={() => onFocusExercise(exercise.id)}
              className={`ff-forge-exercise-strip__item ${isActive ? 'is-active' : ''}`}
            >
              <span>{index + 1}</span>
              <strong>{getExerciseName(exercise)}</strong>
              <small>{completed}/{total}</small>
            </button>
          )
        })}
      </div>
    </section>
  )
}
