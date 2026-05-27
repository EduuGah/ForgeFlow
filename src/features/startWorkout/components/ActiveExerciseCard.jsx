import {
  Check,
  ChevronDown,
  Flame,
  ImageIcon,
  Minus,
  MoreVertical,
  Plus,
  Repeat2,
  Trash2,
} from 'lucide-react'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import { SetPrBadges } from './ActiveExerciseSetControls'

function getPreviousLabel(performance) {
  if (!performance?.lastSet) return '-'

  const weight = performance.lastSet.weight
  const reps = performance.lastSet.reps

  if (!weight && !reps) return '-'

  return `${weight || 0}kg x ${reps || 0}`
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
  onCompleteSet,
  onAddSet,
  onRemoveSet,
  getExerciseId,
  getExerciseName,
  getExerciseSubtitle,
  getSessionExerciseMedia,
}) {
  const workingSets = (sessionExercise.sets || []).filter((set) => set.type !== 'warmup')
  const exerciseCompletedSets = workingSets.filter((set) => set.completed).length
  const exerciseTotalSets = workingSets.length
  const exerciseProgressPercent = exerciseTotalSets
    ? Math.min(100, Math.round((exerciseCompletedSets / exerciseTotalSets) * 100))
    : 0
  const isCurrent = selectedExercise?.id === sessionExercise.id || focusExercise?.id === sessionExercise.id
  const media = getSessionExerciseMedia(sessionExercise)
  const previousLabel = getPreviousLabel(performance)

  return (
    <article
      ref={(node) => onRegisterCardRef(sessionExercise.id, node)}
      className={`ff-hevy-active-exercise scroll-mt-24 ${isCurrent ? 'is-current' : ''} ${sessionExercise.skipped ? 'is-skipped' : ''}`}
    >
      <header className="ff-hevy-active-exercise__header">
        <div className="ff-hevy-active-exercise__media">
          <span className="ff-hevy-active-exercise__index">{exerciseIndex + 1}</span>
          {media ? (
            <img src={media} alt={getExerciseName(sessionExercise)} loading="lazy" decoding="async" />
          ) : (
            <ImageIcon size={24} />
          )}
        </div>

        <button
          type="button"
          onClick={() => onToggleCollapse(sessionExercise.id)}
          className="ff-hevy-active-exercise__title"
        >
          <span>{getExerciseName(sessionExercise)}</span>
          <small>{getExerciseSubtitle(sessionExercise)}</small>
        </button>

        <button
          type="button"
          onClick={() => onToggleReplace(sessionExercise.id)}
          className="ff-hevy-active-exercise__menu"
          aria-label={replaceExerciseId === sessionExercise.id ? 'Fechar opções do exercício' : 'Abrir opções do exercício'}
        >
          <MoreVertical size={22} />
        </button>
      </header>

      {isCurrent && (
        <div className="ff-hevy-current-exercise">
          <span>Exercício atual</span>
          <strong>{exerciseCompletedSets}/{exerciseTotalSets} séries · {exerciseProgressPercent}%</strong>
        </div>
      )}

      <p className="ff-hevy-exercise-note">Adicionar notas aqui...</p>

      <div className="ff-hevy-rest-row">
        <Flame size={18} />
        <span>Descanso: {sessionExercise.restTimer || 'DESATIVADO'}</span>
      </div>

      <div className="ff-hevy-set-table" aria-label={`Séries de ${getExerciseName(sessionExercise)}`}>
        <div className="ff-hevy-set-head">
          <span>SÉRIE</span>
          <span>ANTERIOR</span>
          <span>{(appSettings.weightUnit || 'KG').toUpperCase()}</span>
          <span>REPS</span>
          <span>PR</span>
          <span><Check size={18} /></span>
        </div>

        {!isCollapsed && (sessionExercise.sets || []).map((set) => {
          const isWarmup = set?.type === 'warmup'
          const isCompleted = Boolean(set.completed)

          return (
            <div key={set.id} className={`ff-hevy-set-row ${isCompleted ? 'is-done' : ''} ${isWarmup ? 'is-warmup' : ''}`}>
              <button
                type="button"
                onClick={() => onToggleSetWarmup(sessionExercise.id, set.id)}
                className="ff-hevy-set-number"
                aria-label="Alternar aquecimento"
              >
                {isWarmup ? 'A' : set.setNumber}
              </button>

              <span className="ff-hevy-set-prev">{previousLabel}</span>

              <input
                type="number"
                min="0"
                inputMode="decimal"
                value={set.weight}
                onChange={(event) => onUpdateSet(sessionExercise.id, set.id, 'weight', event.target.value)}
                onFocus={(event) => {
                  if (Number(event.target.value) === 0) onUpdateSet(sessionExercise.id, set.id, 'weight', '')
                  window.setTimeout(() => {
                    event.target?.select?.()
                    event.target?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
                  }, 120)
                }}
                aria-label="Carga"
              />

              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={set.reps}
                onChange={(event) => onUpdateSet(sessionExercise.id, set.id, 'reps', event.target.value)}
                onFocus={(event) => {
                  if (Number(event.target.value) === 0) onUpdateSet(sessionExercise.id, set.id, 'reps', '')
                  window.setTimeout(() => {
                    event.target?.select?.()
                    event.target?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
                  }, 120)
                }}
                aria-label="Repetições"
              />

              <div className="ff-hevy-set-pr">
                <SetPrBadges set={set} performance={performance} compact />
              </div>

              <button
                type="button"
                onClick={() => onCompleteSet(sessionExercise, set.id)}
                className="ff-hevy-set-check"
                aria-label={isCompleted ? 'Desmarcar série' : 'Concluir série'}
              >
                <Check size={20} />
              </button>
            </div>
          )
        })}
      </div>

      <div className="ff-hevy-set-actions">
        <button type="button" onClick={() => onAddSet(sessionExercise.id)}>
          <Plus size={20} />
          Adicionar Série
        </button>
        <button type="button" onClick={() => onAddSet(sessionExercise.id, { type: 'warmup' })}>
          <Flame size={18} />
          Aquecimento
        </button>
        <button
          type="button"
          disabled={(sessionExercise.sets || []).length <= 1}
          onClick={() => {
            const lastSet = [...(sessionExercise.sets || [])].reverse().find(Boolean)
            if (lastSet) onRemoveSet(sessionExercise.id, lastSet.id)
          }}
        >
          <Minus size={18} />
          Remover
        </button>
      </div>

      {replaceExerciseId === sessionExercise.id && (
        <div className="ff-hevy-exercise-options">
          <div className="ff-hevy-options-title">
            <strong>Opções de {getExerciseName(sessionExercise)}</strong>
            <span>Substituir, pular ou remover do treino.</span>
          </div>

          <Input
            label="Buscar substituto"
            placeholder="Pesquisar exercício..."
            value={replaceSearch}
            onChange={(event) => onReplaceSearchChange(event.target.value)}
          />

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

          <div className="ff-hevy-option-actions">
            <button type="button" onClick={() => onToggleReplace(sessionExercise.id)}>
              <ChevronDown size={17} />
              Fechar
            </button>
            <button type="button" onClick={() => onSkipExercise(sessionExercise.id)}>
              <Repeat2 size={17} />
              {sessionExercise.skipped ? 'Retomar' : 'Pular'}
            </button>
            <button type="button" onClick={() => onRemoveExercise(sessionExercise.id)} className="danger">
              <Trash2 size={17} />
              Excluir
            </button>
          </div>

          {exercises.length > replacementOptions.length && (
            <p>Exibindo até {replacementOptions.length} opções. Use a busca para filtrar melhor.</p>
          )}
        </div>
      )}
    </article>
  )
}
