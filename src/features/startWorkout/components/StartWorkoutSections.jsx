import { Link } from 'react-router-dom'
import {
  Timer,
  X,
  StickyNote,
  Trophy,
  Dumbbell,
  ListChecks,
  Pause,
  PlayCircle,
  RotateCcw,
} from 'lucide-react'

import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Textarea from '../../../components/ui/Textarea'
import EmptyState from '../../../components/ui/EmptyState'

export function InvalidSessionState({ onClear }) {
  return (
    <>
      <PageHeader
        title="Executar treino"
        description="Encontramos uma sessão ativa incompleta ou corrompida."
      />

      <EmptyState
        title="Sessão de treino inválida"
        description="Isso pode acontecer após mudanças no formato dos dados. Limpe a sessão ativa e inicie o treino novamente."
        action={
          <Button
            type="button"
            variant="danger"
            onClick={onClear}
          >
            Limpar sessão ativa
          </Button>
        }
      />
    </>
  )
}

export function NoActiveSessionState() {
  return (
    <>
      <PageHeader
        title="Executar treino"
        description="Nenhum treino está em andamento no momento."
      />

      <EmptyState
        title="Nenhum treino ativo"
        description="Vá até a página de Treinos e inicie uma rotina salva."
        action={
          <Link to="/workouts">
            <Button>
              Ir para treinos
            </Button>
          </Link>
        }
      />
    </>
  )
}

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

export function WorkoutSessionSidebar({
  elapsedSeconds,
  completedSets,
  totalSets,
  progressPercent,
  workoutSummary,
  activeSession,
  formatTime,
  onStartRestTimer,
  onUpdateNotes,
  onRequestFinish,
  onCancelWorkout,
}) {
  return (
    <aside className="space-y-4 xl:col-span-1">
      <Card className="hidden xl:block">
        <h2 className="text-xl font-bold">
          Treino ativo
        </h2>

        <p className="mt-2 text-3xl font-black text-[var(--ff-accent-text)]">
          {formatTime(elapsedSeconds)}
        </p>

        <p className="mt-1 text-sm text-[var(--ff-muted)]">
          {completedSets}/{totalSets} séries concluídas
        </p>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--ff-surface-3)]">
          <div
            className="h-full rounded-full bg-[var(--ff-accent)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-5 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--ff-muted)]">
                Descanso opcional
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--ff-text)]">
                Inicie só quando quiser
              </p>
            </div>

            <button
              type="button"
              onClick={() => onStartRestTimer()}
              className="flex h-10 items-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-3 text-xs font-black text-white shadow-[0_0_16px_var(--ff-accent-shadow)]"
            >
              <Timer size={15} />
              Iniciar
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {[60, 90, 120].map((seconds) => (
              <button
                key={seconds}
                type="button"
                onClick={() => onStartRestTimer(seconds)}
                className="h-9 rounded-xl border border-[var(--ff-border)] bg-[var(--ff-card)] text-xs font-black text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]"
              >
                {seconds === 90 ? '1m30' : `${Math.round(seconds / 60)}min`}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
            <p className="text-xs text-[var(--ff-muted)]">Exercícios</p>
            <p className="mt-1 text-xl font-black">{workoutSummary.totalExercises}</p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-3">
            <p className="text-xs text-yellow-200/70">PRs</p>
            <p className="mt-1 text-xl font-black text-yellow-300">{workoutSummary.totalPRs}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center gap-2">
          <StickyNote size={18} className="text-[var(--ff-accent-text)]" />
          <h2 className="text-lg font-black">Observações</h2>
        </div>

        <Textarea
          label="Observações finais"
          placeholder="Ex: treino pesado, ombro incomodou, aumentei carga no supino..."
          value={activeSession.notes}
          onChange={(event) => onUpdateNotes(event.target.value)}
          rows={4}
        />
      </Card>

      <Card className="hidden xl:block">
        <div className="grid grid-cols-1 gap-3">
          <Button
            type="button"
            onClick={onRequestFinish}
            className="w-full"
          >
            Finalizar treino
          </Button>

          <Button
            type="button"
            variant="danger"
            onClick={onCancelWorkout}
            className="w-full"
          >
            Cancelar treino
          </Button>
        </div>
      </Card>
    </aside>
  )
}

export function MobileWorkoutActionBar({
  completedSets,
  totalSets,
  progressPercent,
  elapsedSeconds,
  savingWorkout,
  formatTime,
  onCancelWorkout,
  onStartRestTimer,
  onRequestFinish,
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--ff-border)] bg-[var(--ff-bg)]/95 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl xl:hidden">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3">
        <button
          type="button"
          onClick={onCancelWorkout}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300"
          aria-label="Cancelar treino"
        >
          <X size={20} />
        </button>

        <div className="min-w-0 flex-1 rounded-2xl border border-[var(--ff-border)] bg-[linear-gradient(180deg,var(--ff-card),var(--ff-surface-2))] px-3 py-2 shadow-inner shadow-black/10">
          <p className="truncate text-xs font-bold text-[var(--ff-muted)]">
            {completedSets}/{totalSets} séries • {progressPercent}%
          </p>

          <p className="truncate text-sm font-black text-[var(--ff-accent-text)]">
            {formatTime(elapsedSeconds)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onStartRestTimer()}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-accent-text)]"
          aria-label="Iniciar descanso"
        >
          <Timer size={19} />
        </button>

        <button
          type="button"
          onClick={onRequestFinish}
          disabled={savingWorkout}
          className="h-12 shrink-0 rounded-2xl bg-[var(--ff-accent)] px-5 text-sm font-black text-white shadow-[0_0_24px_var(--ff-accent-shadow)] transition active:scale-95 disabled:opacity-60"
        >
          Finalizar
        </button>
      </div>
    </div>
  )
}

export function RestTimerCard({
  restTimer,
  formatTime,
  onTogglePause,
  onRestart,
  onClose,
}) {
  if (!restTimer) return null

  const progress = restTimer.totalSeconds
    ? ((restTimer.totalSeconds - restTimer.secondsLeft) / restTimer.totalSeconds) * 100
    : 0

  return (
    <div className="ff-rest-timer-card fixed left-3 right-3 top-[calc(4.25rem+env(safe-area-inset-top))] z-50 rounded-3xl border border-[var(--ff-accent-border)]/30 bg-[#121212]/95 p-3 shadow-2xl shadow-[0_0_20px_var(--ff-accent-shadow)] backdrop-blur-xl sm:left-auto sm:right-5 sm:w-[min(420px,calc(100vw-32px))] sm:p-4 xl:top-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)] sm:h-12 sm:w-12">
            <Timer size={22} />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--ff-text)]">
              Descanso
            </p>

            <p className="truncate text-xs text-[var(--ff-muted)]">
              {restTimer.exerciseName}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <p className="text-xl font-black text-[var(--ff-accent-text)] sm:text-2xl">
            {formatTime(restTimer.secondsLeft)}
          </p>

          <button
            type="button"
            onClick={onTogglePause}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 transition hover:bg-[var(--ff-surface-3)] hover:text-[var(--ff-text)]"
            aria-label={restTimer.isPaused ? 'Retomar descanso' : 'Pausar descanso'}
          >
            {restTimer.isPaused ? <PlayCircle size={18} /> : <Pause size={18} />}
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 transition hover:bg-[var(--ff-surface-3)] hover:text-[var(--ff-text)]"
            aria-label="Reiniciar descanso"
          >
            <RotateCcw size={17} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 transition hover:bg-[var(--ff-surface-3)] hover:text-[var(--ff-text)]"
            aria-label="Fechar descanso"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--ff-surface-3)] sm:mt-4 sm:h-2">
        <div
          className="h-full rounded-full bg-[var(--ff-accent)] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {restTimer.isPaused && restTimer.secondsLeft > 0 && (
        <p className="mt-3 text-center text-sm font-bold text-[var(--ff-muted)]">
          Descanso pausado
        </p>
      )}

      {restTimer.secondsLeft === 0 && (
        <p className="mt-3 text-center text-sm font-bold text-emerald-400">
          Descanso finalizado
        </p>
      )}
    </div>
  )
}

export function FinishWorkoutModal({
  open,
  activeSession,
  elapsedSeconds,
  completedSets,
  totalSets,
  workoutSummary,
  savingWorkout,
  formatTime,
  onClose,
  onFinishWorkout,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0">
      <div className="w-full max-w-lg rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5 shadow-2xl shadow-[0_0_20px_var(--ff-accent-shadow)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--ff-accent-text)]">
              Confirmar finalização
            </p>

            <h2 className="mt-1 text-2xl font-black text-[var(--ff-text)]">
              Finalizar treino?
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              Confira o resumo antes de salvar este treino no histórico.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 transition hover:bg-[var(--ff-surface-3)] hover:text-[var(--ff-text)]"
          >
            ×
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[var(--ff-border)] bg-zinc-900 p-4">
            <p className="text-xs text-[var(--ff-muted)]">Duração</p>
            <p className="mt-1 text-xl font-black text-[var(--ff-accent-text)]">
              {formatTime(elapsedSeconds)}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--ff-border)] bg-zinc-900 p-4">
            <p className="text-xs text-[var(--ff-muted)]">Séries</p>
            <p className="mt-1 text-xl font-black">
              {completedSets}/{totalSets}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--ff-border)] bg-zinc-900 p-4">
            <p className="text-xs text-[var(--ff-muted)]">Exercícios</p>
            <p className="mt-1 text-xl font-black">
              {workoutSummary.totalExercises}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--ff-border)] bg-zinc-900 p-4">
            <p className="text-xs text-[var(--ff-muted)]">Pulados</p>
            <p className="mt-1 text-xl font-black">
              {workoutSummary.skippedExercises}
            </p>
          </div>
        </div>

        {workoutSummary.totalPRs > 0 && (
          <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-yellow-400">
              <Trophy size={17} />
              {workoutSummary.totalPRs} novo(s) PR(s) neste treino
            </p>
          </div>
        )}

        {activeSession.notes && (
          <div className="mt-4 rounded-2xl border border-[var(--ff-border)] bg-zinc-900 p-4">
            <p className="text-xs text-[var(--ff-muted)]">Observações</p>
            <p className="mt-2 text-sm text-[var(--ff-text-soft)]">
              {activeSession.notes}
            </p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="w-full"
          >
            Continuar treino
          </Button>

          <Button
            type="button"
            onClick={onFinishWorkout}
            disabled={savingWorkout}
            className="w-full"
          >
            {savingWorkout ? 'Salvando...' : 'Salvar no histórico'}
          </Button>
        </div>
      </div>
    </div>
  )
}
