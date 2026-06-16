import { Fragment, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Flame,
  ImageIcon,
  Search,
  SlidersHorizontal,
  Minus,
  MoreVertical,
  Plus,
  Repeat2,
  Trash2,
  X,
} from 'lucide-react'
import { SetPrMedal } from './ActiveExerciseSetControls'
import { getExerciseMedia } from '../../../utils/exerciseMediaUtils'

function isWarmupSet(set = {}) {
  return set.type === 'warmup' || set.isWarmup === true || set.warmup === true
}

function getPreviousSetForRow(performance, set, setIndex) {
  const previousSets = Array.isArray(performance?.lastPerformance?.sets)
    ? performance.lastPerformance.sets.filter((previousSet) => !isWarmupSet(previousSet))
    : []

  if (previousSets.length > 0) {
    const sameNumber = previousSets.find((previousSet) =>
      String(previousSet?.setNumber || '') === String(set?.setNumber || '')
    )

    return sameNumber || previousSets[setIndex] || previousSets[0]
  }

  return performance?.lastSet || null
}

function getPreviousLabel(previousSet) {
  if (!previousSet) return '-'

  const weight = previousSet.weight
  const reps = previousSet.reps

  if (!weight && !reps) return '-'

  return `${weight || 0}kg x ${reps || 0}`
}

function getExerciseMuscle(exercise = {}) {
  return exercise.muscleGroup || exercise.primaryMuscle || 'Sem grupo'
}

function getExerciseEquipment(exercise = {}) {
  return exercise.equipment || 'Sem equipamento'
}


function normalizeFilterValue(value = '') {
  return String(value || '').trim()
}

function getUniqueFilterValues(options = [], getter, limit = 12) {
  const values = []
  const seen = new Set()

  options.forEach((exercise) => {
    const value = normalizeFilterValue(getter(exercise))
    if (!value || seen.has(value)) return
    seen.add(value)
    values.push(value)
  })

  return values.slice(0, limit)
}

function filterExerciseOptions(options = [], { muscle = '', equipment = '' } = {}) {
  return options.filter((exercise) => {
    const exerciseMuscle = getExerciseMuscle(exercise)
    const exerciseEquipment = getExerciseEquipment(exercise)

    if (muscle && exerciseMuscle !== muscle) return false
    if (equipment && exerciseEquipment !== equipment) return false

    return true
  })
}

function buildReplacementSections(options = [], currentExercise = {}) {
  const currentMuscle = getExerciseMuscle(currentExercise)
  const recommended = []
  const groups = new Map()

  options.forEach((exercise) => {
    const group = getExerciseMuscle(exercise)
    const isRecommended = currentMuscle && group === currentMuscle

    if (isRecommended && recommended.length < 8) {
      recommended.push(exercise)
      return
    }

    if (!groups.has(group)) groups.set(group, [])
    groups.get(group).push(exercise)
  })

  const sections = []
  if (recommended.length) sections.push({ title: 'Recomendados', items: recommended })

  Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
    .forEach(([title, items]) => sections.push({ title, items }))

  return sections
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
  onRegisterCardRef,
  onToggleCollapse,
  onToggleReplace,
  onReplaceSearchChange,
  onReplaceExercise,
  onSkipExercise,
  onRemoveExercise,
  onOpenExerciseDetails,
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
  const exerciseData = sessionExercise.exercise || sessionExercise
  const isOptionsOpen = replaceExerciseId === sessionExercise.id
  const [replaceMode, setReplaceMode] = useState(false)
  const [replaceMuscleFilter, setReplaceMuscleFilter] = useState('')
  const [replaceEquipmentFilter, setReplaceEquipmentFilter] = useState('')

  const replaceMuscleOptions = useMemo(
    () => getUniqueFilterValues(replacementOptions, getExerciseMuscle),
    [replacementOptions]
  )
  const replaceEquipmentOptions = useMemo(
    () => getUniqueFilterValues(replacementOptions, getExerciseEquipment),
    [replacementOptions]
  )
  const filteredReplacementOptions = useMemo(
    () => filterExerciseOptions(replacementOptions, {
      muscle: replaceMuscleFilter,
      equipment: replaceEquipmentFilter,
    }),
    [replacementOptions, replaceEquipmentFilter, replaceMuscleFilter]
  )
  const replacementSections = buildReplacementSections(filteredReplacementOptions, exerciseData)

  useEffect(() => {
    if (!isOptionsOpen) setReplaceMode(false)
  }, [isOptionsOpen])

  useEffect(() => {
    if (!isOptionsOpen || typeof document === 'undefined') return undefined

    const shell = document.querySelector('.ff-page-scroll-shell')
    const previousShellOverflow = shell?.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    shell?.classList.add('ff-scroll-locked-by-workout-modal')
    document.body.classList.add('ff-scroll-locked-by-workout-modal')
    document.documentElement.classList.add('ff-scroll-locked-by-workout-modal')

    if (shell) shell.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      shell?.classList.remove('ff-scroll-locked-by-workout-modal')
      document.body.classList.remove('ff-scroll-locked-by-workout-modal')
      document.documentElement.classList.remove('ff-scroll-locked-by-workout-modal')

      if (shell) shell.style.overflow = previousShellOverflow || ''
      document.body.style.overflow = previousBodyOverflow || ''
      document.documentElement.style.overflow = previousHtmlOverflow || ''
    }
  }, [isOptionsOpen])

  function closeExerciseOptions() {
    setReplaceMode(false)
    setReplaceMuscleFilter('')
    setReplaceEquipmentFilter('')
    onCloseOptions?.()
  }

  function applyPreviousSet(setId, previousSet) {
    const previousWeight = previousSet?.weight ?? ''
    const previousReps = previousSet?.reps ?? ''

    if (previousWeight === '' && previousReps === '') return

    if (previousWeight !== '') {
      onUpdateSet(sessionExercise.id, setId, 'weight', String(previousWeight))
    }

    if (previousReps !== '') {
      onUpdateSet(sessionExercise.id, setId, 'reps', String(previousReps))
    }

    window.setTimeout(() => {
      const repsInput = document.querySelector(`[data-set-row-id="${setId}"] input[data-set-field="reps"]`)
      repsInput?.focus?.()
      repsInput?.select?.()
    }, 60)
  }

  function getFilledWorkingSets() {
    return (sessionExercise.sets || []).filter((set) =>
      !isWarmupSet(set) && (String(set?.weight || '').trim() || String(set?.reps || '').trim())
    )
  }

  function getNextTargetSet() {
    const workingSets = (sessionExercise.sets || []).filter((set) => !isWarmupSet(set))

    return (
      workingSets.find((set) => !set.completed && !String(set?.weight || '').trim() && !String(set?.reps || '').trim()) ||
      workingSets.find((set) => !set.completed) ||
      workingSets[0] ||
      null
    )
  }

  function handleApplySuggestedSet() {
    const targetSet = getNextTargetSet()
    const referenceSet = performance?.lastSet

    if (!targetSet || !referenceSet) return

    applyPreviousSet(targetSet.id, referenceSet)
  }

  function handleRepeatLastSet() {
    const referenceSet = [...getFilledWorkingSets()].reverse()[0] || performance?.lastSet
    const referenceWeight = referenceSet?.weight ?? ''
    const referenceReps = referenceSet?.reps ?? ''

    if (referenceWeight === '' && referenceReps === '') return

    onAddSet(sessionExercise.id, {
      plannedDescription: 'Repetição da última série',
      weight: referenceWeight,
      reps: referenceReps,
    })
  }

  function isEnterKey(event) {
    return (
      event.key === 'Enter' ||
      event.key === 'NumpadEnter' ||
      event.code === 'Enter' ||
      event.code === 'NumpadEnter' ||
      event.keyCode === 13 ||
      event.which === 13
    )
  }

  function closeMobileKeyboard(input) {
    if (!input) return

    input.setAttribute('readonly', 'readonly')
    input.blur?.()

    window.setTimeout(() => {
      input.removeAttribute('readonly')
    }, 80)
  }

  function handleSetInputDone(event) {
    if (!isEnterKey(event)) return

    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent?.preventDefault?.()
    event.nativeEvent?.stopImmediatePropagation?.()
    closeMobileKeyboard(event.currentTarget)
  }

  function sanitizeSetInputValue(value, field) {
    const raw = String(value || '')

    if (field === 'reps') {
      return raw.replace(/\D/g, '').slice(0, 4)
    }

    return raw
      .replace(',', '.')
      .replace(/[^0-9.]/g, '')
      .replace(/(\..*)\./g, '$1')
      .slice(0, 6)
  }

  function handleSetInputChange(setId, field, value) {
    onUpdateSet(sessionExercise.id, setId, field, sanitizeSetInputValue(value, field))
  }

  function handleSearchKeyDown(event) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    event.currentTarget.blur()
  }

  const progressionSuggestion = performance?.progressionSuggestion
  const canApplySuggestion = Boolean(performance?.lastSet?.weight || performance?.lastSet?.reps)
  const canRepeatLastSet = getFilledWorkingSets().length > 0 || canApplySuggestion

  const exerciseOptionsModal = isOptionsOpen && typeof document !== 'undefined'
    ? createPortal(
      <div className="ff-active-exercise-actions-modal" role="dialog" aria-modal="true" aria-label={`Opções de ${getExerciseName(sessionExercise)}`}>
        <button
          type="button"
          className="ff-active-exercise-actions-modal__backdrop"
          onClick={closeExerciseOptions}
          aria-label="Fechar opções"
        />

        <div className="ff-active-exercise-actions-modal__panel">
          <div className="ff-active-exercise-actions-modal__header">
            <div>
              <span>{replaceMode ? 'Substituir exercício' : 'Ações do exercício'}</span>
              <strong>{getExerciseName(sessionExercise)}</strong>
              <small>{getExerciseSubtitle(sessionExercise)} · {exerciseCompletedSets}/{exerciseTotalSets} séries · {exerciseProgressPercent}%</small>
            </div>

            <button type="button" onClick={closeExerciseOptions} aria-label="Fechar opções">
              <X size={19} />
            </button>
          </div>

          {!replaceMode ? (
            <div className="ff-active-exercise-actions-modal__grid">
              <button type="button" onClick={() => setReplaceMode(true)}>
                <Search size={18} />
                Substituir
              </button>

              <button type="button" onClick={() => {
                onOpenExerciseDetails?.(sessionExercise)
                closeExerciseOptions()
              }}>
                <ExternalLink size={18} />
                Ver detalhes
              </button>

              <button type="button" onClick={() => {
                onSkipExercise(sessionExercise.id)
                closeExerciseOptions()
              }}>
                <Repeat2 size={18} />
                {sessionExercise.skipped ? 'Retomar' : 'Pular'}
              </button>

              <button type="button" onClick={() => {
                onRemoveExercise(sessionExercise.id)
                closeExerciseOptions()
              }} className="danger">
                <Trash2 size={18} />
                Excluir
              </button>
            </div>
          ) : (
            <div className="ff-active-exercise-actions-modal__replace">
              <label className="ff-replace-exercise-search ff-replace-exercise-search--modal">
                <Search size={17} />
                <input
                  type="search"
                  placeholder="Buscar substituto..."
                  value={replaceSearch}
                  onChange={(event) => onReplaceSearchChange(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  enterKeyHint="done"
                />
              </label>

              <div className="ff-exercise-picker-filters" aria-label="Filtros rápidos de substituição">
                <span><SlidersHorizontal size={14} /> Filtros</span>
                <button type="button" className={!replaceMuscleFilter ? 'is-active' : ''} onClick={() => setReplaceMuscleFilter('')}>Todos</button>
                {replaceMuscleOptions.map((muscle) => (
                  <button key={muscle} type="button" className={replaceMuscleFilter === muscle ? 'is-active' : ''} onClick={() => setReplaceMuscleFilter(muscle)}>
                    {muscle}
                  </button>
                ))}
              </div>

              <div className="ff-exercise-picker-filters ff-exercise-picker-filters--equipment" aria-label="Filtros rápidos por equipamento">
                <button type="button" className={!replaceEquipmentFilter ? 'is-active' : ''} onClick={() => setReplaceEquipmentFilter('')}>Todos equipamentos</button>
                {replaceEquipmentOptions.map((equipment) => (
                  <button key={equipment} type="button" className={replaceEquipmentFilter === equipment ? 'is-active' : ''} onClick={() => setReplaceEquipmentFilter(equipment)}>
                    {equipment}
                  </button>
                ))}
              </div>

              <div className="ff-replace-exercise-list ff-replace-exercise-list--modal" aria-label="Exercícios para substituir">
                {filteredReplacementOptions.length === 0 ? (
                  <p className="ff-replace-exercise-empty">Nenhum exercício encontrado.</p>
                ) : (
                  replacementSections.map((section) => (
                    <section key={section.title} className="ff-exercise-picker-section">
                      <h4>{section.title}</h4>
                      <div className="ff-exercise-picker-section__list">
                        {section.items.map((exercise) => {
                          const exerciseId = getExerciseId(exercise)
                          const mediaUrl = getExerciseMedia(exercise)

                          return (
                            <button
                              key={exerciseId}
                              type="button"
                              onClick={() => {
                                onReplaceExercise(sessionExercise.id, exerciseId)
                                closeExerciseOptions()
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
                                <small>{getExerciseMuscle(exercise)} · {getExerciseEquipment(exercise)}</small>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </section>
                  ))
                )}
              </div>

              <div className="ff-active-exercise-actions-modal__footer">
                <button type="button" onClick={() => setReplaceMode(false)}>Voltar</button>
                <button type="button" onClick={closeExerciseOptions}>Fechar</button>
              </div>
            </div>
          )}
        </div>
      </div>,
      document.body
    )
    : null

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
          {sessionExercise.skipped && <em className="ff-hevy-active-exercise__skipped-badge">Pulado</em>}
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
            onClick={() => {
              if (replaceExerciseId === sessionExercise.id) {
                closeExerciseOptions()
                return
              }

              setReplaceMode(false)
              onToggleReplace(sessionExercise.id)
            }}
            className="ff-hevy-active-exercise__menu"
            aria-label={replaceExerciseId === sessionExercise.id ? 'Fechar opções do exercício' : 'Abrir opções do exercício'}
          >
            <MoreVertical size={22} />
          </button>
        </div>
      </header>

      {exerciseOptionsModal}

      {isCurrent && (
        <div className="ff-hevy-current-exercise">
          <span>Exercício atual</span>
          <strong>{exerciseCompletedSets}/{exerciseTotalSets} séries · {exerciseProgressPercent}%</strong>
        </div>
      )}

      {!isCollapsed && progressionSuggestion && (
        <div className={`ff-active-progression-card ff-active-progression-card--${progressionSuggestion.tone || 'neutral'}`}>
          <div className="ff-active-progression-card__copy">
            <span>{progressionSuggestion.badge || 'Sugestão'}</span>
            <strong>{progressionSuggestion.title || 'Sugestão de progressão'}</strong>
            <small>{progressionSuggestion.nextTarget || progressionSuggestion.description}</small>
          </div>

          <button
            type="button"
            onClick={handleApplySuggestedSet}
            disabled={!canApplySuggestion}
            title={canApplySuggestion ? 'Aplicar a última carga/reps na próxima série' : 'Sem última série registrada'}
          >
            Usar última
          </button>
        </div>
      )}

      {!isCollapsed && <p className="ff-hevy-exercise-note">Dica: toque em “Anterior” ou em “Usar última” para preencher a série mais rápido.</p>}

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

        {(sessionExercise.sets || []).map((set, setIndex) => {
          const isWarmup = set?.type === 'warmup'
          const isCompleted = Boolean(set.completed)
          const previousSet = getPreviousSetForRow(performance, set, setIndex)
          const previousLabel = getPreviousLabel(previousSet)
          const hasPreviousValues = Boolean(previousSet?.weight || previousSet?.reps)

          return (
            <Fragment key={set.id}>
            <div data-set-row-id={set.id} className={`ff-hevy-set-row ${isCompleted ? 'is-done' : ''} ${isWarmup ? 'is-warmup' : ''}`}>
              <button
                type="button"
                onClick={() => onToggleSetWarmup(sessionExercise.id, set.id)}
                className="ff-hevy-set-number"
                aria-label="Alternar aquecimento"
              >
                {isWarmup ? 'A' : set.setNumber}
              </button>

              <button
                type="button"
                className="ff-hevy-set-prev"
                onClick={() => applyPreviousSet(set.id, previousSet)}
                disabled={!hasPreviousValues}
                title={hasPreviousValues ? 'Usar carga e reps anteriores' : 'Sem registro anterior'}
                aria-label={hasPreviousValues ? 'Usar carga e repetições anteriores nesta série' : 'Sem registro anterior'}
              >
                {previousLabel}
              </button>

              <input
                type="text"
                inputMode="decimal"
                enterKeyHint="done"
                pattern="[0-9]*[.,]?[0-9]*"
                data-set-field="weight"
                value={set.weight}
                placeholder={previousSet?.weight ? String(previousSet.weight) : (appSettings.weightUnit || 'kg')}
                onChange={(event) => handleSetInputChange(set.id, 'weight', event.target.value)}
                onKeyDown={handleSetInputDone}
                onKeyDownCapture={handleSetInputDone}
                onKeyUp={handleSetInputDone}
                onKeyUpCapture={handleSetInputDone}
                onKeyPress={handleSetInputDone}
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
                type="text"
                inputMode="numeric"
                enterKeyHint="done"
                pattern="[0-9]*"
                data-set-field="reps"
                value={set.reps}
                placeholder={previousSet?.reps ? String(previousSet.reps) : 'reps'}
                onChange={(event) => handleSetInputChange(set.id, 'reps', event.target.value)}
                onKeyDown={handleSetInputDone}
                onKeyDownCapture={handleSetInputDone}
                onKeyUp={handleSetInputDone}
                onKeyUpCapture={handleSetInputDone}
                onKeyPress={handleSetInputDone}
                onFocus={(event) => {
                  if (Number(event.target.value) === 0) onUpdateSet(sessionExercise.id, set.id, 'reps', '')
                  window.setTimeout(() => {
                    event.target?.select?.()
                    event.target?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
                  }, 120)
                }}
                aria-label="Repetições"
              />

              <div className="ff-hevy-set-pr" aria-label="Recorde da série">
                <SetPrMedal set={set} performance={performance} />
              </div>

              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onCompleteSet(sessionExercise, set.id)
                }}
                className="ff-hevy-set-check"
                aria-label={isCompleted ? 'Desmarcar série' : 'Concluir série'}
              >
                <Check size={20} />
              </button>
            </div>
            </Fragment>
          )
        })}
      </div>
      )}

      {!isCollapsed && (
      <div className="ff-hevy-set-actions ff-hevy-set-actions--smart">
        <button type="button" onClick={handleRepeatLastSet} disabled={!canRepeatLastSet} className="ff-hevy-repeat-set-button">
          <Repeat2 size={18} />
          Repetir última
        </button>
        <button type="button" onClick={() => onAddSet(sessionExercise.id)}>
          <Plus size={20} />
          Série vazia
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
