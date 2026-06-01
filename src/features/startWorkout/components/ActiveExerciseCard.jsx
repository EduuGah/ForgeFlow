import {
  Check,
  ChevronDown,
  ChevronUp,
  Flame,
  ImageIcon,
  Search,
  Minus,
  MoreVertical,
  Plus,
  Repeat2,
  Trash2,
} from 'lucide-react'
import { SetPrBadges } from './ActiveExerciseSetControls'
import { getExerciseMedia } from '../../../utils/exerciseMediaUtils'

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
  onCloseOptions,
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
          onClick={() => {
                onToggleCollapse(sessionExercise.id)
                onCloseOptions?.()
              }}
          className="ff-hevy-active-exercise__title"
        >
          <span>{getExerciseName(sessionExercise)}</span>
          <small>{getExerciseSubtitle(sessionExercise)}</small>
        </button>

        <div className="ff-hevy-active-exercise__tools">
          <button
            type="button"
            onClick={() => onToggleCollapse(sessionExercise.id)}
            className="ff-hevy-active-exercise__minimize"
            aria-label={isCollapsed ? 'Expandir exercício' : 'Minimizar exercício'}
          >
            {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>

          <button
            type="button"
            onClick={() => onToggleReplace(sessionExercise.id)}
            className="ff-hevy-active-exercise__menu"
            aria-label={replaceExerciseId === sessionExercise.id ? 'Fechar opções do exercício' : 'Abrir opções do exercício'}
          >
            <MoreVertical size={22} />
          </button>
        </div>
      </header>

      {replaceExerciseId === sessionExercise.id && (
        <div className="ff-hevy-exercise-options ff-hevy-exercise-options--top">
          <div className="ff-hevy-options-title">
            <strong>Opções de {getExerciseName(sessionExercise)}</strong>
            <span>Substituir, pular ou remover do treino.</span>
          </div>

          <label className="ff-replace-exercise-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Buscar substituto..."
              value={replaceSearch}
              onChange={(event) => onReplaceSearchChange(event.target.value)}
            />
          </label>

          <div className="ff-replace-exercise-list" aria-label="Exercícios para substituir">
            {replacementOptions.length === 0 ? (
              <p className="ff-replace-exercise-empty">Nenhum exercício encontrado.</p>
            ) : (
              replacementOptions.map((exercise) => {
                const exerciseId = getExerciseId(exercise)
                const mediaUrl = getExerciseMedia(exercise)

                return (
                  <button
                    key={exerciseId}
                    type="button"
                    onClick={() => {
                      onReplaceExercise(sessionExercise.id, exerciseId)
                      onCloseOptions?.()
                    }}
                    className="ff-replace-exercise-option"
                  >
                    <span className="ff-replace-exercise-option__media">
                      {mediaUrl ? (
                        <img src={mediaUrl} alt="" loading="lazy" decoding="async" />
                      ) : (
                        <ImageIcon size={18} />
                      )}
                    </span>
                    <span className="ff-replace-exercise-option__content">
                      <strong>{exercise.name || 'Exercício sem nome'}</strong>
                      <small>{exercise.muscleGroup || 'Sem grupo'} · {exercise.equipment || 'Sem equipamento'}</small>
                    </span>
                  </button>
                )
              })
            )}
          </div>

          <div className="ff-hevy-option-actions">
            <button type="button" onClick={() => {
              onToggleCollapse(sessionExercise.id)
              onCloseOptions?.()
            }}>
              {isCollapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
              {isCollapsed ? 'Expandir' : 'Minimizar'}
            </button>
            <button type="button" onClick={() => {
              onSkipExercise(sessionExercise.id)
              onCloseOptions?.()
            }}>
              <Repeat2 size={17} />
              {sessionExercise.skipped ? 'Retomar' : 'Pular'}
            </button>
            <button type="button" onClick={() => {
              onRemoveExercise(sessionExercise.id)
              onCloseOptions?.()
            }} className="danger">
              <Trash2 size={17} />
              Excluir
            </button>
          </div>

          {exercises.length > replacementOptions.length && (
            <p>Exibindo até {replacementOptions.length} opções. Use a busca para filtrar melhor.</p>
          )}
        </div>
      )}

      {isCurrent && (
        <div className="ff-hevy-current-exercise">
          <span>Exercício atual</span>
          <strong>{exerciseCompletedSets}/{exerciseTotalSets} séries · {exerciseProgressPercent}%</strong>
        </div>
      )}

      {!isCollapsed && <p className="ff-hevy-exercise-note">Adicionar notas aqui...</p>}

      {!isCollapsed && (
      <div className="ff-hevy-set-table" aria-label={`Séries de ${getExerciseName(sessionExercise)}`}>
        <div className="ff-hevy-set-head">
          <span>SÉRIE</span>
          <span>ANTERIOR</span>
          <span>{(appSettings.weightUnit || 'KG').toUpperCase()}</span>
          <span>REPS</span>
          <span>PR</span>
          <span><Check size={18} /></span>
        </div>

        {(sessionExercise.sets || []).map((set) => {
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
      )}

      {!isCollapsed && (
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
      )}

    </article>
  )
}
