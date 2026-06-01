import { useState } from 'react'
import {
  MapPin,
  Trophy,
  Pause,
  PlayCircle,
  RotateCcw,
  StickyNote,
  Timer,
  X,
} from 'lucide-react'

import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Textarea from '../../../components/ui/Textarea'

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
    <div className="ff-mobile-workout-action-bar ff-mobile-workout-action-bar--finish fixed inset-x-0 bottom-0 z-40 border-t border-[var(--ff-border)] bg-[var(--ff-bg)]/95 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl xl:hidden">
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
            Pré-resumo · {completedSets}/{totalSets} séries · {progressPercent}%
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
          className="ff-mobile-workout-action-bar__finish h-12 shrink-0 rounded-2xl bg-[var(--ff-accent)] px-5 text-sm font-black text-white shadow-[0_0_24px_var(--ff-accent-shadow)] transition active:scale-95 disabled:opacity-60"
        >
          Concluir treino
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
  const [locationLabel, setLocationLabel] = useState('')
  const [selectedPreset, setSelectedPreset] = useState('')

  if (!open) return null

  const label = selectedPreset === 'Outro'
    ? locationLabel
    : selectedPreset || locationLabel

  function handlePresetClick(value) {
    setSelectedPreset(value)
    if (value !== 'Outro') setLocationLabel(value)
    if (value === 'Outro') setLocationLabel('')
  }

  return (
    <div className="ff-finish-workout-modal fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-3 pb-3 pt-[calc(1rem+env(safe-area-inset-top))] backdrop-blur-sm sm:items-center sm:p-4">
      <div className="ff-finish-workout-panel w-full max-w-lg overflow-hidden rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] shadow-2xl shadow-[0_0_20px_var(--ff-accent-shadow)]">
        <div className="sticky top-0 z-10 border-b border-[var(--ff-border)] bg-[var(--ff-surface-2)]/95 p-4 backdrop-blur-xl sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-accent-text)]">
                Confirmar finalização
              </p>

              <h2 className="mt-1 text-2xl font-black text-[var(--ff-text)]">
                Finalizar treino?
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                O treino será salvo no histórico. A localização é opcional.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-400 transition hover:bg-[var(--ff-surface-3)] hover:text-[var(--ff-text)]"
              aria-label="Fechar finalização"
            >
              ×
            </button>
          </div>
        </div>

        <div className="ff-finish-workout-scroll space-y-4 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[var(--ff-border)] bg-zinc-900 p-3 sm:p-4">
              <p className="text-xs text-[var(--ff-muted)]">Duração</p>
              <p className="mt-1 text-lg font-black text-[var(--ff-accent-text)] sm:text-xl">
                {formatTime(elapsedSeconds)}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--ff-border)] bg-zinc-900 p-3 sm:p-4">
              <p className="text-xs text-[var(--ff-muted)]">Séries</p>
              <p className="mt-1 text-lg font-black sm:text-xl">
                {completedSets}/{totalSets}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--ff-border)] bg-zinc-900 p-3 sm:p-4">
              <p className="text-xs text-[var(--ff-muted)]">Exercícios</p>
              <p className="mt-1 text-lg font-black sm:text-xl">
                {workoutSummary.totalExercises}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--ff-border)] bg-zinc-900 p-3 sm:p-4">
              <p className="text-xs text-[var(--ff-muted)]">Pulados</p>
              <p className="mt-1 text-lg font-black sm:text-xl">
                {workoutSummary.skippedExercises}
              </p>
            </div>
          </div>

          {workoutSummary.totalPRs > 0 && (
            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-yellow-400">
                <Trophy size={17} />
                {workoutSummary.totalPRs} novo(s) PR(s) neste treino
              </p>
            </div>
          )}

          {activeSession.notes && (
            <div className="rounded-2xl border border-[var(--ff-border)] bg-zinc-900 p-4">
              <p className="text-xs text-[var(--ff-muted)]">Observações</p>
              <p className="mt-2 text-sm text-[var(--ff-text-soft)]">
                {activeSession.notes}
              </p>
            </div>
          )}

          <div className="rounded-3xl border border-[var(--ff-accent-border)]/20 bg-[var(--ff-accent-soft)]/10 p-4">
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
                <MapPin size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-[var(--ff-text)]">Salvar localização deste treino?</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
                  Informe um nome opcional para o local. A permissão só será pedida se você escolher salvar localização.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {['Academia', 'Casa', 'Parque', 'Outro'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetClick(preset)}
                      className={selectedPreset === preset
                        ? 'rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent)] px-3 py-1.5 text-xs font-black text-white'
                        : 'rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 py-1.5 text-xs font-black text-[var(--ff-text-soft)]'}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <label className="mt-3 block">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-[var(--ff-muted)]">Nome do local</span>
                  <input
                    type="text"
                    value={locationLabel}
                    onChange={(event) => setLocationLabel(event.target.value)}
                    maxLength={60}
                    placeholder="Ex: Academia Smart Fit"
                    className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] px-3 text-base font-bold text-[var(--ff-text)] outline-none transition focus:border-[var(--ff-accent-border)] focus:ring-2 focus:ring-[var(--ff-accent-soft)]"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 grid grid-cols-1 gap-2 border-t border-[var(--ff-border)] bg-[var(--ff-surface-2)]/95 p-4 backdrop-blur-xl sm:grid-cols-3 sm:p-5">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="w-full"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => onFinishWorkout({ saveLocation: false })}
            disabled={savingWorkout}
            className="w-full"
          >
            Finalizar sem localização
          </Button>

          <Button
            type="button"
            onClick={() => onFinishWorkout({ saveLocation: true, locationLabel: label })}
            disabled={savingWorkout}
            className="w-full"
          >
            {savingWorkout ? 'Salvando...' : 'Salvar localização e finalizar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
