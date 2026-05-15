import {
  ArrowDown,
  ArrowUp,
  Award,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Flame,
  GripVertical,
  Hash,
  ImageIcon,
  Minus,
  Plus,
  Repeat2,
  SkipForward,
  Trash2,
  TrendingUp,
  Weight,
  Zap,
} from 'lucide-react'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import { formatPerformance } from '../../../utils/prUtils'
import { getProgressionToneClasses } from '../../../utils/progressionSuggestionUtils'

function getLiveSetPrStatus(set, performance) {
  const weight = Number(set.weight || 0)
  const reps = Number(set.reps || 0)
  const volume = weight * reps

  const bestWeight = Number(performance?.bestWeightPerformance?.weight || 0)
  const bestVolume = Number(performance?.bestVolumePerformance?.volume || 0)

  const hasPreviousWeightRecord = Boolean(performance?.bestWeightPerformance?.weight)
  const hasPreviousVolumeRecord = Boolean(performance?.bestVolumePerformance?.volume)
  const hasValidSet = Boolean(set.completed) && set.type !== 'warmup' && weight > 0 && reps > 0

  return {
    isWeightPR:
      Boolean(set.isWeightPR) ||
      (hasValidSet &&
        hasPreviousWeightRecord &&
        performance?.weightPRSetId === set.id &&
        weight > bestWeight),
    isVolumePR:
      Boolean(set.isVolumePR) ||
      (hasValidSet &&
        hasPreviousVolumeRecord &&
        performance?.volumePRSetId === set.id &&
        volume > bestVolume),
  }
}

function SetPrBadges({ set, performance, compact = false }) {
  const { isWeightPR, isVolumePR } = getLiveSetPrStatus(set, performance)
  const badges = []

  if (isWeightPR) {
    badges.push({
      key: 'weight',
      label: 'Peso PR',
      icon: Award,
      className:
        'border-sky-400/30 bg-sky-500/10 text-sky-200 shadow-[0_0_14px_rgba(14,165,233,0.18)]',
    })
  }

  if (isVolumePR) {
    badges.push({
      key: 'volume',
      label: 'Volume PR',
      icon: Zap,
      className:
        'border-amber-400/30 bg-amber-500/10 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.18)]',
    })
  }

  if (badges.length === 0) {
    return compact ? null : (
      <span className="text-xs font-bold text-[var(--ff-muted)]">—</span>
    )
  }

  return (
    <div className={compact ? 'flex flex-wrap gap-2' : 'flex flex-col items-start gap-1.5'}>
      {badges.map((badge) => {
        const Icon = badge.icon

        return (
          <span
            key={badge.key}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${badge.className}`}
          >
            <Icon size={12} />
            {badge.label}
          </span>
        )
      })}
    </div>
  )
}

function WorkoutSetInput({
  icon: Icon,
  label,
  unit,
  value,
  min,
  inputMode,
  onChange,
  suggestedValue = '',
  suggestionLabel = '',
}) {
  const hasSuggestion = suggestedValue !== '' && suggestedValue !== null && suggestedValue !== undefined

  return (
    <label className="group block">
      <span className="mb-1.5 hidden items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--ff-muted)] sm:flex">
        <span>{label}</span>
        {hasSuggestion && (
          <span className="max-w-[110px] truncate rounded-full border border-[var(--ff-accent-border)]/20 bg-[var(--ff-accent-soft)]/10 px-2 py-0.5 text-[9px] text-[var(--ff-accent-text)] opacity-70 transition group-hover:opacity-100">
            {suggestionLabel || `Último: ${suggestedValue}`}
          </span>
        )}
      </span>

      <div className={`flex h-14 items-center overflow-hidden rounded-2xl border bg-[var(--ff-card)] transition group-focus-within:border-[var(--ff-accent-border)] group-focus-within:shadow-[0_0_18px_var(--ff-accent-shadow)]/20 ${hasSuggestion ? 'border-[var(--ff-accent-border)]/20 group-hover:border-[var(--ff-accent-border)]/45' : 'border-[var(--ff-border)]'}`}>
        <div className="flex h-full w-11 shrink-0 items-center justify-center border-r border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-accent-text)]">
          <Icon size={18} />
        </div>

        <input
          type="number"
          min={min}
          inputMode={inputMode}
          value={value}
          onChange={onChange}
          placeholder="0"
          className="min-w-0 flex-1 bg-transparent px-2 text-center text-xl font-black tabular-nums text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted-2)]"
        />

        <div className="flex h-full min-w-12 shrink-0 items-center justify-center border-l border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-2 text-xs font-black uppercase text-[var(--ff-muted)]">
          {unit}
        </div>
      </div>
    </label>
  )
}

export default function ActiveExerciseCard({
  sessionExercise,
  exerciseIndex,
  performance,
  appSettings,
  selectedExercise,
  focusExercise,
  isCollapsed,
  replaceExerciseId,
  replaceSearch,
  replacementOptions,
  exercises,
  onRegisterCardRef,
  onToggleCollapse,
  onToggleReplace,
  onReplaceSearchChange,
  onReplaceExercise,
  onSkipExercise,
  onRemoveExercise,
  onUpdateSet,
  onToggleSetWarmup,
  onMoveSet,
  onCompleteSet,
  onAddSet,
  onRemoveSet,
  getExerciseId,
  getExerciseName,
  getExerciseSubtitle,
  getSessionExerciseMedia,
}) {
  const progressionSuggestion = performance.progressionSuggestion
  const progressionTone = getProgressionToneClasses(progressionSuggestion?.tone)
  const exerciseCompletedSets = sessionExercise.sets.filter(
    (set) => set.completed && set.type !== 'warmup'
  ).length
  const exerciseTotalSets = sessionExercise.sets.filter(
    (set) => set.type !== 'warmup'
  ).length
  const exerciseProgressPercent = exerciseTotalSets
    ? Math.min(100, Math.round((exerciseCompletedSets / exerciseTotalSets) * 100))
    : 0

  return (
    <Card
      ref={(node) => onRegisterCardRef(sessionExercise.id, node)}
      className={`ff-active-exercise-card scroll-mt-32 overflow-hidden ${selectedExercise?.id === sessionExercise.id || focusExercise?.id === sessionExercise.id ? 'ring-1 ring-[var(--ff-accent-border)] shadow-[0_0_28px_var(--ff-accent-shadow)]' : ''} ${sessionExercise.skipped ? 'opacity-50' : ''}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-4">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-[var(--ff-border)] bg-white shadow-inner sm:h-28 sm:w-28">
              {getSessionExerciseMedia(sessionExercise) ? (
                <img
                  src={getSessionExerciseMedia(sessionExercise)}
                  alt={getExerciseName(sessionExercise)}
                  className="h-full w-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <ImageIcon size={30} className="text-zinc-500" />
              )}

              <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-xl bg-black/70 text-xs font-black text-white backdrop-blur">
                {exerciseIndex + 1}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onToggleCollapse(sessionExercise.id)}
              className="min-w-0 flex-1 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="line-clamp-2 text-2xl font-black leading-tight text-[var(--ff-text)]">
                    {getExerciseName(sessionExercise)}
                  </h2>

                  <p className="mt-1 text-sm text-[var(--ff-muted)]">
                    {getExerciseSubtitle(sessionExercise)}
                  </p>

                  {focusExercise?.id === sessionExercise.id && (
                    <span className="mt-2 inline-flex rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--ff-accent-text)]">
                      Exercício atual
                    </span>
                  )}
                </div>

                <ChevronDown
                  size={20}
                  className={`mt-1 shrink-0 text-[var(--ff-muted)] transition ${isCollapsed ? '-rotate-90' : ''}`}
                />
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--ff-surface-3)]">
                <div
                  className="h-full rounded-full bg-[var(--ff-accent)] transition-all"
                  style={{ width: `${exerciseProgressPercent}%` }}
                />
              </div>

              <p className="mt-2 text-xs font-bold text-[var(--ff-muted)]">
                {exerciseCompletedSets}/{exerciseTotalSets} séries concluídas
              </p>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
              <div className="flex items-center gap-2 text-xs text-[var(--ff-muted)]">
                <ClipboardCheck size={15} />
                Último treino
              </div>

              <p className="mt-1 text-sm font-semibold text-[var(--ff-text-soft)]">
                {performance.lastSet
                  ? formatPerformance(performance.lastSet)
                  : 'Sem registro anterior'}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--ff-accent-border)]/20 bg-[var(--ff-accent-soft)]/10 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-accent-text)]">
                Melhores marcas
              </p>

              <p className="mt-1 text-sm font-semibold text-[var(--ff-accent-text)]">
                Peso:{' '}
                {performance.bestWeightPerformance
                  ? `${performance.bestWeightPerformance.weight}${appSettings.weightUnit || 'kg'}`
                  : 'Sem registro'}
              </p>

              <p className="text-sm font-semibold text-[var(--ff-accent-text)]">
                Volume:{' '}
                {performance.bestVolumePerformance
                  ? `${performance.bestVolumePerformance.volume}kg total`
                  : 'Sem registro'}
              </p>
            </div>
          </div>

          {progressionSuggestion && (
            <div className={`ff-progression-glow mt-3 rounded-3xl border p-4 ${progressionTone.card}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${progressionTone.icon}`}>
                    <TrendingUp size={19} />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black">
                        {progressionSuggestion.title}
                      </p>

                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${progressionTone.badge}`}>
                        {progressionSuggestion.badge}
                      </span>
                    </div>

                    <p className="mt-1 text-sm leading-relaxed opacity-85">
                      {progressionSuggestion.description}
                    </p>

                    <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] opacity-70">
                      {progressionSuggestion.nextTarget}
                    </p>
                  </div>
                </div>

                <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-[150px] sm:max-w-[170px]">
                  <div className="min-w-0 rounded-2xl border border-white/10 bg-black/10 px-2 py-2 text-center">
                    <p className="truncate text-[9px] font-black uppercase opacity-60">
                      Anterior
                    </p>
                    <p className="truncate text-xs font-black sm:text-sm">
                      {progressionSuggestion.lastVolume || 0} kg
                    </p>
                  </div>

                  <div className="min-w-0 rounded-2xl border border-white/10 bg-black/10 px-2 py-2 text-center">
                    <p className="truncate text-[9px] font-black uppercase opacity-60">
                      Atual
                    </p>
                    <p className="truncate text-xs font-black sm:text-sm">
                      {progressionSuggestion.currentVolume || 0} kg
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:flex lg:justify-end">
          <button
            type="button"
            onClick={() => onToggleReplace(sessionExercise.id)}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 text-xs font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)]/40 hover:bg-zinc-900 hover:text-[var(--ff-text)] lg:px-4 lg:text-sm"
          >
            <Repeat2 size={15} />
            Trocar
          </button>

          <button
            type="button"
            onClick={() => onSkipExercise(sessionExercise.id)}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 text-xs font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)]/40 hover:bg-zinc-900 hover:text-[var(--ff-text)] lg:px-4 lg:text-sm"
          >
            <SkipForward size={15} />
            {sessionExercise.skipped ? 'Retomar' : 'Pular'}
          </button>

          <button
            type="button"
            onClick={() => onRemoveExercise(sessionExercise.id)}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 text-xs font-bold text-red-300 transition hover:border-red-400/40 hover:bg-red-500/20 lg:px-4 lg:text-sm"
          >
            <Trash2 size={15} />
            Excluir
          </button>
        </div>
      </div>

      {isCollapsed && (
        <div className="mt-4 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[var(--ff-text)]">
                Séries ocultas
              </p>

              <p className="mt-1 text-xs text-[var(--ff-muted)]">
                {exerciseCompletedSets}/{exerciseTotalSets} séries concluídas
              </p>
            </div>

            <button
              type="button"
              onClick={() => onToggleCollapse(sessionExercise.id)}
              className="rounded-2xl bg-[var(--ff-accent)] px-4 py-2 text-xs font-bold text-white transition hover:bg-[var(--ff-accent-hover)]"
            >
              Ver séries
            </button>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--ff-surface-3)]">
            <div
              className="h-full rounded-full bg-[var(--ff-accent)] transition-all"
              style={{ width: `${exerciseProgressPercent}%` }}
            />
          </div>
        </div>
      )}

      {replaceExerciseId === sessionExercise.id && (
        <div className="mt-4 rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
          <Input
            label="Buscar substituto"
            placeholder="Pesquisar exercício..."
            value={replaceSearch}
            onChange={(event) => onReplaceSearchChange(event.target.value)}
          />

          <div className="mt-3">
            <Select
              label="Substituir por"
              defaultValue=""
              onChange={(event) => onReplaceExercise(sessionExercise.id, event.target.value)}
            >
              <option value="">Selecione um exercício</option>

              {replacementOptions.map((exercise) => (
                <option key={getExerciseId(exercise)} value={getExerciseId(exercise)}>
                  {exercise.name}
                </option>
              ))}
            </Select>

            {exercises.length > replacementOptions.length && (
              <p className="mt-2 text-xs text-[var(--ff-muted)]">
                Exibindo até {replacementOptions.length} opções. Use a busca para filtrar melhor.
              </p>
            )}
          </div>
        </div>
      )}

      {!isCollapsed && (
        <div className="mt-5">
          <div className="mb-3 hidden grid-cols-[58px_minmax(170px,1fr)_minmax(170px,1fr)_150px_92px_54px] gap-3 px-3 text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)] lg:grid">
            <span>Série</span>
            <span>KG</span>
            <span>Reps</span>
            <span>Recordes</span>
            <span>Ordem</span>
            <span>Status</span>
          </div>

          <div className="ff-sets-scroll space-y-3 pb-2">
            {(sessionExercise.sets || []).map((set, setIndex) => {
              const isWarmup = set?.type === 'warmup'
              const canMoveUp = setIndex > 0
              const canMoveDown = setIndex < (sessionExercise.sets || []).length - 1

              return (
                <div
                  key={set.id}
                  className={`grid w-full grid-cols-[52px_minmax(0,1fr)_52px] gap-3 rounded-[1.75rem] border p-4 shadow-lg shadow-black/10 transition sm:grid-cols-[56px_minmax(0,1fr)_minmax(0,1fr)_56px] lg:grid-cols-[58px_minmax(170px,1fr)_minmax(170px,1fr)_150px_92px_54px] lg:items-center lg:gap-3 lg:p-3 ${
                    set.completed
                      ? 'border-emerald-400/35 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.10)]'
                      : 'border-[var(--ff-border)] bg-[linear-gradient(180deg,var(--ff-card),var(--ff-surface-2))]'
                  }`}
                >
                  <div className="col-start-1 row-start-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-3)] text-sm font-black text-[var(--ff-text)] shadow-inner shadow-black/20 lg:w-12">
                    {isWarmup ? 'A' : set.setNumber}
                  </div>

                  <div className="col-span-3 row-start-2 min-w-0 sm:col-span-1 sm:row-start-1 lg:col-span-1">
                    <WorkoutSetInput
                      icon={Weight}
                      label="Carga"
                      unit={appSettings.weightUnit || 'kg'}
                      min="0"
                      inputMode="decimal"
                      value={set.weight}
                      suggestedValue={performance.lastSet?.weight || ''}
                      suggestionLabel={performance.lastSet?.weight ? `Último: ${performance.lastSet.weight}${appSettings.weightUnit || 'kg'}` : ''}
                      onChange={(event) =>
                        onUpdateSet(
                          sessionExercise.id,
                          set.id,
                          'weight',
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div className="col-span-3 row-start-3 min-w-0 sm:col-span-1 sm:row-start-1 lg:col-span-1">
                    <WorkoutSetInput
                      icon={Hash}
                      label="Reps"
                      unit="reps"
                      min="1"
                      inputMode="numeric"
                      value={set.reps}
                      suggestedValue={performance.lastSet?.reps || ''}
                      suggestionLabel={performance.lastSet?.reps ? `Último: ${performance.lastSet.reps} reps` : ''}
                      onChange={(event) =>
                        onUpdateSet(
                          sessionExercise.id,
                          set.id,
                          'reps',
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div className="col-span-3 row-start-4 flex flex-wrap items-center gap-2 lg:hidden">
                    <div className="min-w-0 flex-1 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)]/70 p-2">
                      <SetPrBadges set={set} performance={performance} compact />
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleSetWarmup(sessionExercise.id, set.id)}
                      className={set.type === 'warmup'
                        ? 'rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black text-amber-200'
                        : 'rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-2.5 py-1 text-[10px] font-black text-[var(--ff-muted)]'}
                    >
                      {set.type === 'warmup' ? 'Aquec.' : 'Normal'}
                    </button>
                  </div>

                  <div className="hidden min-h-11 flex-col items-start justify-center gap-1 overflow-hidden lg:flex">
                    <SetPrBadges set={set} performance={performance} />

                    <button
                      type="button"
                      onClick={() => onToggleSetWarmup(sessionExercise.id, set.id)}
                      className={set.type === 'warmup'
                        ? 'rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black text-amber-200'
                        : 'rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-2 py-0.5 text-[9px] font-black text-[var(--ff-muted)]'}
                    >
                      {set.type === 'warmup' ? 'Aquec.' : 'Normal'}
                    </button>
                  </div>

                  <div className="col-span-3 row-start-5 flex items-center justify-between gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-2 py-2 lg:col-auto lg:row-auto lg:justify-center lg:bg-transparent lg:border-transparent lg:p-0">
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--ff-muted)] lg:hidden">
                      <GripVertical size={14} />
                      Ordem
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onMoveSet(sessionExercise.id, set.id, 'up')}
                        disabled={!canMoveUp}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--ff-border)] bg-[var(--ff-card)] text-[var(--ff-muted)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)] disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label="Mover série para cima"
                      >
                        <ArrowUp size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onMoveSet(sessionExercise.id, set.id, 'down')}
                        disabled={!canMoveDown}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--ff-border)] bg-[var(--ff-card)] text-[var(--ff-muted)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)] disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label="Mover série para baixo"
                      >
                        <ArrowDown size={15} />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onCompleteSet(sessionExercise, set.id)}
                    className={
                      set.completed
                        ? 'col-start-3 row-start-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-500 text-white shadow-[0_0_22px_rgba(16,185,129,0.42)] transition active:scale-95 lg:col-auto lg:row-auto'
                        : 'col-start-3 row-start-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-3)] text-[var(--ff-muted)] shadow-inner shadow-black/20 transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)] active:scale-95 lg:col-auto lg:row-auto'
                    }
                    aria-label={set.completed ? 'Desmarcar série' : 'Concluir série'}
                  >
                    {set.completed ? <CheckCircle2 size={22} /> : <span className="h-3 w-3 rounded-full border-2 border-current" />}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => onAddSet(sessionExercise.id)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ff-surface-3)] text-sm font-bold transition hover:bg-zinc-700"
            >
              <Plus size={17} />
              Série
            </button>

            <button
              type="button"
              onClick={() => onAddSet(sessionExercise.id, { type: 'warmup' })}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/25 bg-amber-500/10 text-sm font-bold text-amber-200 transition hover:bg-amber-500/15"
            >
              <Flame size={17} />
              Aquecimento
            </button>

            <button
              type="button"
              onClick={() => {
                const lastSet = [...(sessionExercise.sets || [])].reverse().find(Boolean)
                if (lastSet) onRemoveSet(sessionExercise.id, lastSet.id)
              }}
              disabled={(sessionExercise.sets || []).length <= 1}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 text-sm font-bold text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus size={17} />
              Remover
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
