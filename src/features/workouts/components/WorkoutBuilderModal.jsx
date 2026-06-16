import { useMemo, useState } from 'react'

import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    ChevronDown,
    Copy,
    Dumbbell,
    Flame,
    FolderPlus,
    Plus,
    Save,
    Search,
    Star,
    Trash2,
    X,
} from 'lucide-react'

const SET_MODEL_OPTIONS = [
    {
        id: 'hypertrophy',
        label: 'Hipertrofia',
        detail: '4 séries progressivas',
    },
    {
        id: 'beginner',
        label: 'Iniciante',
        detail: '3 séries simples',
    },
    {
        id: 'strength',
        label: 'Força',
        detail: '5 séries pesadas',
    },
    {
        id: 'pyramid',
        label: 'Pirâmide',
        detail: '15 até 8 reps',
    },
    {
        id: 'custom',
        label: 'Simples',
        detail: '1 série editável',
    },
]

function getSetModelLabel(modelId, customSetModels = []) {
    const fixed = SET_MODEL_OPTIONS.find((model) => model.id === modelId)
    if (fixed) return fixed.label

    return customSetModels.find((model) => model.id === modelId)?.name || 'Modelo atual'
}

function ExerciseMedia({ exercise, size = 'md' }) {
    return (
        <span className={`ff-workout-builder-v2-media ff-workout-builder-v2-media--${size}`}>
            {exercise?.mediaUrl ? (
                <img
                    src={exercise.mediaUrl}
                    alt={exercise.name}
                    loading="lazy"
                    decoding="async"
                />
            ) : (
                <Dumbbell size={size === 'sm' ? 20 : 26} />
            )}
        </span>
    )
}

function WorkoutBuilderMetric({ label, value, detail }) {
    return (
        <div className="ff-workout-builder-v2-metric">
            <span>{label}</span>
            <strong>{value}</strong>
            {detail && <small>{detail}</small>}
        </div>
    )
}

function WorkoutSetRow({
    exerciseItem,
    set,
    setIndex,
    handleToggleWorkoutSetWarmup,
    handleUpdateWorkoutSetDescription,
    handleRemoveSetFromWorkoutExercise,
}) {
    const isWarmup = set.type === 'warmup'

    return (
        <div className={isWarmup ? 'ff-workout-builder-v2-set is-warmup' : 'ff-workout-builder-v2-set'}>
            <button
                type="button"
                onClick={() => handleToggleWorkoutSetWarmup(exerciseItem.id, set.id)}
                className="ff-workout-builder-v2-set__index"
                aria-label={isWarmup ? 'Marcar como série normal' : 'Marcar como aquecimento'}
            >
                {isWarmup ? 'A' : setIndex + 1}
            </button>

            <label className="ff-workout-builder-v2-set__field">
                <span>{isWarmup ? 'Aquecimento' : 'Meta da série'}</span>
                <input
                    type="text"
                    value={set.description || ''}
                    onChange={(event) =>
                        handleUpdateWorkoutSetDescription(
                            exerciseItem.id,
                            set.id,
                            event.target.value
                        )
                    }
                    placeholder={isWarmup ? 'Ex: 15 reps leve' : 'Ex: 8-12 Rep'}
                />
            </label>

            <button
                type="button"
                onClick={() => handleRemoveSetFromWorkoutExercise(exerciseItem.id, set.id)}
                className="ff-workout-builder-v2-set__remove"
                aria-label="Remover série"
            >
                <Trash2 size={16} />
            </button>
        </div>
    )
}

function WorkoutBuilderModal({
    isOpen,
    editingWorkoutId,
    workoutName,
    setWorkoutName,
    selectedFolderId,
    setSelectedFolderId,
    folders,
    defaultSetModel,
    setDefaultSetModel,
    customSetModels,
    workoutExercises,
    totalSetsInCurrentWorkout,
    quickFavoritesOnly,
    setQuickFavoritesOnly,
    quickEquipmentFilter,
    setQuickEquipmentFilter,
    equipmentList,
    quickGroupFilter,
    setQuickGroupFilter,
    muscleGroups,
    quickSearch,
    setQuickSearch,
    filteredQuickExercises,
    visibleQuickExercises,
    favoriteExercisesCount,
    handleSubmit,
    closeBuilder,
    setIsFolderModalOpen,
    setIsSetModelModalOpen,
    handleDeleteSetModel,
    handleUpdateExerciseNote,
    handleUpdateWorkoutSetDescription,
    handleRemoveExercise,
    handleMoveWorkoutExercise,
    handleAddSetToWorkoutExercise,
    handleToggleWorkoutSetWarmup,
    handleRemoveSetFromWorkoutExercise,
    isExerciseAlreadyAdded,
    formatRecentExerciseDate,
    handleQuickAddExercise,
    handleDuplicateWorkoutExercise,
    handleApplySetModelToWorkoutExercise,
    handleClearWorkoutExercises,
    onGoToExercises,
}) {
    const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false)
    const [expandedExerciseId, setExpandedExerciseId] = useState(null)
    const [showAdvancedSetup, setShowAdvancedSetup] = useState(false)

    const selectedFolder = folders.find((folder) => folder.id === selectedFolderId)
    const currentModelName = getSetModelLabel(defaultSetModel, customSetModels)
    const canSubmit = workoutName.trim() && workoutExercises.length > 0

    const builderStatus = useMemo(() => {
        if (!workoutName.trim() && workoutExercises.length === 0) {
            return {
                label: 'Comece pelo nome e pela biblioteca',
                tone: 'empty',
            }
        }

        if (!workoutName.trim()) {
            return {
                label: 'Falta nomear a rotina',
                tone: 'warning',
            }
        }

        if (workoutExercises.length === 0) {
            return {
                label: 'Adicione pelo menos um exercício',
                tone: 'warning',
            }
        }

        if (totalSetsInCurrentWorkout >= 28) {
            return {
                label: 'Treino muito volumoso',
                tone: 'danger',
            }
        }

        if (totalSetsInCurrentWorkout >= 20) {
            return {
                label: 'Volume alto, revise recuperação',
                tone: 'warning',
            }
        }

        return {
            label: editingWorkoutId ? 'Pronto para atualizar' : 'Pronto para salvar',
            tone: 'success',
        }
    }, [editingWorkoutId, totalSetsInCurrentWorkout, workoutExercises.length, workoutName])

    const builderProgress = useMemo(() => {
        const steps = [Boolean(workoutName.trim()), workoutExercises.length > 0]
        const completed = steps.filter(Boolean).length

        return Math.round((completed / steps.length) * 100)
    }, [workoutExercises.length, workoutName])

    function handlePickExercise(exerciseId) {
        if (isExerciseAlreadyAdded(exerciseId)) return

        handleQuickAddExercise(exerciseId)
    }

    if (!isOpen) return null

    return (
        <div className="ff-workout-builder-v2" role="dialog" aria-modal="true" aria-label="Construtor de treino">
            <form onSubmit={handleSubmit} className="ff-workout-builder-v2__shell">
                <header className="ff-workout-builder-v2__topbar">
                    <button
                        type="button"
                        onClick={closeBuilder}
                        className="ff-workout-builder-v2__back"
                        aria-label="Voltar para rotinas"
                    >
                        <ArrowLeft size={21} />
                    </button>

                    <div className="ff-workout-builder-v2__title">
                        <p>{editingWorkoutId ? 'Editando rotina' : 'Nova rotina'}</p>
                        <h1>{editingWorkoutId ? 'Ajustar treino' : 'Criar treino'}</h1>
                    </div>

                    <button
                        type="submit"
                        className="ff-workout-builder-v2__save ff-workout-builder-v2__save--desktop"
                        disabled={!canSubmit}
                    >
                        <Save size={18} />
                        {editingWorkoutId ? 'Atualizar' : 'Salvar'}
                    </button>
                </header>

                <section className="ff-workout-builder-v2-hero">
                    <div className="ff-workout-builder-v2-hero__copy">
                        <span className={`ff-workout-builder-v2-status is-${builderStatus.tone}`}>
                            {builderStatus.label}
                        </span>

                        <h2>{workoutName.trim() || 'Monte uma rotina limpa e rápida'}</h2>

                        <p>
                            Escolha um modelo de séries, busque os exercícios na biblioteca e organize a ordem antes de salvar.
                        </p>
                    </div>

                    <div className="ff-workout-builder-v2-hero__metrics">
                        <WorkoutBuilderMetric
                            label="Progresso"
                            value={`${builderProgress}%`}
                            detail="nome + exercícios"
                        />
                        <WorkoutBuilderMetric
                            label="Exercícios"
                            value={workoutExercises.length}
                            detail="na rotina"
                        />
                        <WorkoutBuilderMetric
                            label="Séries"
                            value={totalSetsInCurrentWorkout}
                            detail={currentModelName}
                        />
                    </div>
                </section>

                <section className="ff-workout-builder-v2-grid">
                    <aside className="ff-workout-builder-v2-panel ff-workout-builder-v2-panel--setup">
                        <div className="ff-workout-builder-v2-section-head">
                            <span>1</span>
                            <div>
                                <p>Configuração</p>
                                <h2>Base do treino</h2>
                            </div>
                        </div>

                        <label className="ff-workout-builder-v2-field">
                            <span>Nome da rotina</span>
                            <input
                                type="text"
                                value={workoutName}
                                onChange={(event) => setWorkoutName(event.target.value)}
                                placeholder="Ex: Push A, Costas pesado..."
                                autoFocus
                            />
                        </label>

                        <div className="ff-workout-builder-v2-field-row">
                            <label className="ff-workout-builder-v2-field">
                                <span>Pasta</span>
                                <select
                                    value={selectedFolderId || ''}
                                    onChange={(event) => setSelectedFolderId(event.target.value || null)}
                                >
                                    <option value="">Sem pasta</option>
                                    {folders.map((folder) => (
                                        <option key={folder.id} value={folder.id}>
                                            {folder.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <button
                                type="button"
                                onClick={() => setIsFolderModalOpen(true)}
                                className="ff-workout-builder-v2-mini-action"
                            >
                                <FolderPlus size={18} />
                                Nova pasta
                            </button>
                        </div>

                        <div className="ff-workout-builder-v2-template-card">
                            <div>
                                <span>Modelo aplicado ao adicionar</span>
                                <strong>{currentModelName}</strong>
                                <small>
                                    Novos exercícios entram com esse padrão de séries.
                                </small>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowAdvancedSetup((current) => !current)}
                            >
                                <ChevronDown size={17} />
                            </button>
                        </div>

                        {showAdvancedSetup && (
                            <div className="ff-workout-builder-v2-advanced">
                                <div className="ff-workout-builder-v2-template-grid">
                                    {SET_MODEL_OPTIONS.map((model) => (
                                        <button
                                            key={model.id}
                                            type="button"
                                            className={defaultSetModel === model.id ? 'is-active' : ''}
                                            onClick={() => setDefaultSetModel(model.id)}
                                        >
                                            <strong>{model.label}</strong>
                                            <small>{model.detail}</small>
                                        </button>
                                    ))}
                                </div>

                                <div className="ff-workout-builder-v2-custom-models">
                                    <div className="ff-workout-builder-v2-custom-models__head">
                                        <span>Modelos personalizados</span>
                                        <button
                                            type="button"
                                            onClick={() => setIsSetModelModalOpen(true)}
                                        >
                                            + Criar
                                        </button>
                                    </div>

                                    {customSetModels.length === 0 ? (
                                        <p>Nenhum modelo personalizado ainda.</p>
                                    ) : (
                                        customSetModels.map((model) => (
                                            <div key={model.id}>
                                                <button
                                                    type="button"
                                                    className={defaultSetModel === model.id ? 'is-active' : ''}
                                                    onClick={() => setDefaultSetModel(model.id)}
                                                >
                                                    <strong>{model.name}</strong>
                                                    <small>{model.sets.length} séries</small>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteSetModel(model.id)}
                                                    aria-label="Excluir modelo"
                                                >
                                                    <X size={15} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </aside>

                    <main className="ff-workout-builder-v2-panel ff-workout-builder-v2-panel--plan">
                        <div className="ff-workout-builder-v2-section-head ff-workout-builder-v2-section-head--split">
                            <div className="ff-workout-builder-v2-section-head__left">
                                <span>2</span>
                                <div>
                                    <p>Plano do treino</p>
                                    <h2>Exercícios da rotina</h2>
                                </div>
                            </div>

                            <div className="ff-workout-builder-v2-plan-actions">
                                {workoutExercises.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearWorkoutExercises}
                                        className="ff-workout-builder-v2-ghost-danger"
                                    >
                                        Limpar
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setIsExercisePickerOpen(true)}
                                    className="ff-workout-builder-v2-primary-small"
                                >
                                    <Plus size={17} />
                                    Exercício
                                </button>
                            </div>
                        </div>

                        {workoutExercises.length === 0 ? (
                            <div className="ff-workout-builder-v2-empty">
                                <Dumbbell size={34} />
                                <strong>Seu treino ainda está vazio</strong>
                                <p>Abra a biblioteca, toque nos exercícios e eles entrarão com o modelo de séries escolhido.</p>
                                <button type="button" onClick={() => setIsExercisePickerOpen(true)}>
                                    <Plus size={18} />
                                    Abrir biblioteca
                                </button>
                            </div>
                        ) : (
                            <div className="ff-workout-builder-v2-exercise-list">
                                {workoutExercises.map((item, index) => {
                                    const isExpanded = expandedExerciseId === item.id
                                    const setsCount = item.sets?.length || 0

                                    return (
                                        <article
                                            key={item.id}
                                            className={isExpanded ? 'ff-workout-builder-v2-exercise is-expanded' : 'ff-workout-builder-v2-exercise'}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setExpandedExerciseId(isExpanded ? null : item.id)}
                                                className="ff-workout-builder-v2-exercise__main"
                                            >
                                                <span className="ff-workout-builder-v2-exercise__order">{index + 1}</span>
                                                <ExerciseMedia exercise={item.exercise} />
                                                <span className="ff-workout-builder-v2-exercise__copy">
                                                    <strong>{item.exercise?.name || 'Exercício'}</strong>
                                                    <small>
                                                        {item.exercise?.muscleGroup || 'Sem músculo'} · {item.exercise?.equipment || 'Sem equipamento'}
                                                    </small>
                                                    <em>{setsCount} séries · {item.note ? 'com nota' : 'sem nota'}</em>
                                                </span>
                                                <ChevronDown size={18} />
                                            </button>

                                            <div className="ff-workout-builder-v2-exercise__quick-actions">
                                                <button
                                                    type="button"
                                                    onClick={() => handleMoveWorkoutExercise(item.id, 'up')}
                                                    disabled={index === 0}
                                                    aria-label="Mover para cima"
                                                >
                                                    <ArrowUp size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleMoveWorkoutExercise(item.id, 'down')}
                                                    disabled={index === workoutExercises.length - 1}
                                                    aria-label="Mover para baixo"
                                                >
                                                    <ArrowDown size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDuplicateWorkoutExercise(item.id)}
                                                    aria-label="Duplicar exercício"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveExercise(item.id)}
                                                    className="is-danger"
                                                    aria-label="Remover exercício"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {isExpanded && (
                                                <div className="ff-workout-builder-v2-exercise__details">
                                                    <div className="ff-workout-builder-v2-set-actions">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddSetToWorkoutExercise(item.id)}
                                                        >
                                                            <Plus size={16} />
                                                            Série normal
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddSetToWorkoutExercise(item.id, 'warmup')}
                                                        >
                                                            <Flame size={16} />
                                                            Aquecimento
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleApplySetModelToWorkoutExercise(item.id, defaultSetModel)}
                                                        >
                                                            Aplicar modelo
                                                        </button>
                                                    </div>

                                                    <div className="ff-workout-builder-v2-sets">
                                                        {(item.sets || []).map((set, setIndex) => (
                                                            <WorkoutSetRow
                                                                key={set.id}
                                                                exerciseItem={item}
                                                                set={set}
                                                                setIndex={setIndex}
                                                                handleToggleWorkoutSetWarmup={handleToggleWorkoutSetWarmup}
                                                                handleUpdateWorkoutSetDescription={handleUpdateWorkoutSetDescription}
                                                                handleRemoveSetFromWorkoutExercise={handleRemoveSetFromWorkoutExercise}
                                                            />
                                                        ))}
                                                    </div>

                                                    <label className="ff-workout-builder-v2-note">
                                                        <span>Nota do exercício</span>
                                                        <textarea
                                                            value={item.note || ''}
                                                            onChange={(event) => handleUpdateExerciseNote(item.id, event.target.value)}
                                                            placeholder="Ex: foco em controle, cadeira 4, ajustar pegada..."
                                                            rows={3}
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                        </article>
                                    )
                                })}
                            </div>
                        )}

                        {totalSetsInCurrentWorkout >= 24 && (
                            <div className="ff-workout-builder-v2-volume-warning">
                                <Flame size={18} />
                                <div>
                                    <strong>{totalSetsInCurrentWorkout >= 28 ? 'Treino muito volumoso' : 'Volume alto'}</strong>
                                    <span>{totalSetsInCurrentWorkout} séries no total. Revise descanso, tempo e recuperação.</span>
                                </div>
                            </div>
                        )}
                    </main>

                    <aside className="ff-workout-builder-v2-panel ff-workout-builder-v2-panel--library">
                        <div className="ff-workout-builder-v2-section-head ff-workout-builder-v2-section-head--split">
                            <div className="ff-workout-builder-v2-section-head__left">
                                <span>3</span>
                                <div>
                                    <p>Biblioteca</p>
                                    <h2>Adicionar rápido</h2>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onGoToExercises}
                                className="ff-workout-builder-v2-link-button"
                            >
                                Gerenciar
                            </button>
                        </div>

                        <label className="ff-workout-builder-v2-search">
                            <Search size={18} />
                            <input
                                type="search"
                                placeholder="Buscar exercício, músculo..."
                                value={quickSearch}
                                onChange={(event) => setQuickSearch(event.target.value)}
                            />
                            {quickSearch && (
                                <button type="button" onClick={() => setQuickSearch('')} aria-label="Limpar busca">
                                    <X size={15} />
                                </button>
                            )}
                        </label>

                        <div className="ff-workout-builder-v2-chips" aria-label="Filtros de exercícios">
                            <button
                                type="button"
                                className={quickFavoritesOnly ? 'is-active is-favorite' : ''}
                                onClick={() => setQuickFavoritesOnly((current) => !current)}
                            >
                                <Star size={14} fill={quickFavoritesOnly ? 'currentColor' : 'none'} />
                                Favoritos
                            </button>
                            <button
                                type="button"
                                className={!quickGroupFilter ? 'is-active' : ''}
                                onClick={() => setQuickGroupFilter('')}
                            >
                                Todos
                            </button>
                            {muscleGroups.slice(0, 9).map((group) => (
                                <button
                                    key={group}
                                    type="button"
                                    className={quickGroupFilter === group ? 'is-active' : ''}
                                    onClick={() => setQuickGroupFilter(group)}
                                >
                                    {group}
                                </button>
                            ))}
                        </div>

                        <label className="ff-workout-builder-v2-field ff-workout-builder-v2-field--compact">
                            <span>Equipamento</span>
                            <select
                                value={quickEquipmentFilter}
                                onChange={(event) => setQuickEquipmentFilter(event.target.value)}
                            >
                                <option value="">Todos</option>
                                {equipmentList.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="ff-workout-builder-v2-library-stats">
                            <span>{filteredQuickExercises.length} encontrados</span>
                            <span>{favoriteExercisesCount} favoritos</span>
                            <span>{selectedFolder?.name || 'Sem pasta'}</span>
                        </div>

                        <div className="ff-workout-builder-v2-library-list">
                            {visibleQuickExercises.length === 0 ? (
                                <div className="ff-workout-builder-v2-library-empty">
                                    Nenhum exercício encontrado.
                                </div>
                            ) : (
                                visibleQuickExercises.slice(0, 18).map((exercise) => {
                                    const alreadyAdded = isExerciseAlreadyAdded(exercise.id)
                                    const recentInfo = exercise.__recentInfo

                                    return (
                                        <button
                                            key={exercise.id}
                                            type="button"
                                            onClick={() => handlePickExercise(exercise.id)}
                                            className={alreadyAdded ? 'is-added' : ''}
                                            disabled={alreadyAdded}
                                        >
                                            <ExerciseMedia exercise={exercise} size="sm" />
                                            <span>
                                                <strong>{exercise.name}</strong>
                                                <small>{exercise.muscleGroup} · {exercise.equipment}</small>
                                                <em>
                                                    {exercise.isFavorite && 'Favorito'}
                                                    {exercise.isFavorite && recentInfo?.lastUsedAt && ' · '}
                                                    {recentInfo?.lastUsedAt && `Recente ${formatRecentExerciseDate(recentInfo.lastUsedAt)}`}
                                                </em>
                                            </span>
                                            <b>{alreadyAdded ? 'OK' : '+'}</b>
                                        </button>
                                    )
                                })
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsExercisePickerOpen(true)}
                            className="ff-workout-builder-v2-full-library-button"
                        >
                            Ver biblioteca completa
                        </button>
                    </aside>
                </section>

                {isExercisePickerOpen && (
                    <div className="ff-workout-builder-v2-picker" role="dialog" aria-modal="true" aria-label="Biblioteca de exercícios">
                        <div className="ff-workout-builder-v2-picker__panel">
                            <div className="ff-workout-builder-v2-picker__header">
                                <button type="button" onClick={() => setIsExercisePickerOpen(false)} aria-label="Voltar">
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <p>Biblioteca completa</p>
                                    <h2>Adicionar exercícios</h2>
                                </div>
                                <span>{workoutExercises.length} no treino</span>
                            </div>

                            <div className="ff-workout-builder-v2-picker__tools">
                                <label className="ff-workout-builder-v2-search">
                                    <Search size={18} />
                                    <input
                                        type="search"
                                        placeholder="Buscar por nome, músculo ou equipamento"
                                        value={quickSearch}
                                        onChange={(event) => setQuickSearch(event.target.value)}
                                    />
                                    {quickSearch && (
                                        <button type="button" onClick={() => setQuickSearch('')} aria-label="Limpar busca">
                                            <X size={15} />
                                        </button>
                                    )}
                                </label>

                                <div className="ff-workout-builder-v2-chips">
                                    <button
                                        type="button"
                                        className={quickFavoritesOnly ? 'is-active is-favorite' : ''}
                                        onClick={() => setQuickFavoritesOnly((current) => !current)}
                                    >
                                        <Star size={14} fill={quickFavoritesOnly ? 'currentColor' : 'none'} />
                                        Favoritos
                                    </button>
                                    <button
                                        type="button"
                                        className={!quickGroupFilter ? 'is-active' : ''}
                                        onClick={() => setQuickGroupFilter('')}
                                    >
                                        Todos
                                    </button>
                                    {muscleGroups.map((group) => (
                                        <button
                                            key={group}
                                            type="button"
                                            className={quickGroupFilter === group ? 'is-active' : ''}
                                            onClick={() => setQuickGroupFilter(group)}
                                        >
                                            {group}
                                        </button>
                                    ))}
                                </div>

                                <select
                                    value={quickEquipmentFilter}
                                    onChange={(event) => setQuickEquipmentFilter(event.target.value)}
                                    className="ff-workout-builder-v2-picker__select"
                                >
                                    <option value="">Todos os equipamentos</option>
                                    {equipmentList.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="ff-workout-builder-v2-picker__list">
                                {visibleQuickExercises.length === 0 ? (
                                    <div className="ff-workout-builder-v2-library-empty">
                                        Nenhum exercício encontrado. Tente limpar os filtros.
                                    </div>
                                ) : (
                                    visibleQuickExercises.map((exercise) => {
                                        const alreadyAdded = isExerciseAlreadyAdded(exercise.id)
                                        const recentInfo = exercise.__recentInfo

                                        return (
                                            <button
                                                key={exercise.id}
                                                type="button"
                                                onClick={() => handlePickExercise(exercise.id)}
                                                className={alreadyAdded ? 'is-added' : ''}
                                                disabled={alreadyAdded}
                                            >
                                                <ExerciseMedia exercise={exercise} />
                                                <span>
                                                    <strong>{exercise.name}</strong>
                                                    <small>{exercise.muscleGroup} · {exercise.equipment}</small>
                                                    <em>
                                                        {exercise.isFavorite && 'Favorito'}
                                                        {exercise.isFavorite && recentInfo?.lastUsedAt && ' · '}
                                                        {recentInfo?.lastUsedAt && `Recente ${formatRecentExerciseDate(recentInfo.lastUsedAt)}`}
                                                    </em>
                                                </span>
                                                <b>{alreadyAdded ? 'Adicionado' : 'Adicionar'}</b>
                                            </button>
                                        )
                                    })
                                )}
                            </div>

                            <div className="ff-workout-builder-v2-picker__footer">
                                <button type="button" onClick={() => setIsExercisePickerOpen(false)}>
                                    Concluir
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="ff-workout-builder-v2-mobile-footer">
                    <button type="button" onClick={closeBuilder} aria-label="Fechar">
                        <X size={19} />
                    </button>
                    <button type="button" onClick={() => setIsExercisePickerOpen(true)}>
                        <Plus size={18} />
                        Exercício
                    </button>
                    <button type="submit" disabled={!canSubmit}>
                        <Save size={18} />
                        Salvar
                    </button>
                </div>
            </form>
        </div>
    )
}

export default WorkoutBuilderModal
