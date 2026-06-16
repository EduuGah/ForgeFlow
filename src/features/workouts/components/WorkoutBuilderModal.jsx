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
    SlidersHorizontal,
    Star,
    Trash2,
    X,
} from 'lucide-react'

const SET_MODEL_OPTIONS = [
    {
        id: 'hypertrophy',
        label: 'Hipertrofia',
        detail: '4 séries vazias',
    },
    {
        id: 'beginner',
        label: 'Iniciante',
        detail: '3 séries vazias',
    },
    {
        id: 'strength',
        label: 'Força',
        detail: '5 séries vazias',
    },
    {
        id: 'pyramid',
        label: 'Pirâmide',
        detail: '4 séries vazias',
    },
    {
        id: 'custom',
        label: 'Simples',
        detail: '1 série vazia',
    },
]

function getSetModelLabel(modelId, customSetModels = []) {
    const fixed = SET_MODEL_OPTIONS.find((model) => model.id === modelId)
    if (fixed) return fixed.label

    return customSetModels.find((model) => model.id === modelId)?.name || 'Modelo atual'
}

function ExerciseMedia({ exercise, size = 'md' }) {
    return (
        <span className={`ff-workout-builder-clean-media ff-workout-builder-clean-media--${size}`}>
            {exercise?.mediaUrl ? (
                <img
                    src={exercise.mediaUrl}
                    alt={exercise.name}
                    loading="lazy"
                    decoding="async"
                />
            ) : (
                <Dumbbell size={size === 'sm' ? 19 : 24} />
            )}
        </span>
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
        <div className={isWarmup ? 'ff-workout-builder-clean-set is-warmup' : 'ff-workout-builder-clean-set'}>
            <button
                type="button"
                onClick={() => handleToggleWorkoutSetWarmup(exerciseItem.id, set.id)}
                className="ff-workout-builder-clean-set__badge"
                aria-label={isWarmup ? 'Marcar como série normal' : 'Marcar como aquecimento'}
            >
                {isWarmup ? 'A' : setIndex + 1}
            </button>

            <label className="ff-workout-builder-clean-set__input">
                <span>{isWarmup ? 'Aquecimento' : 'Série'}</span>
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
                    placeholder={isWarmup ? 'Ex: leve, técnica...' : 'Ex: 8-12 reps, carga alvo...'}
                />
            </label>

            <button
                type="button"
                onClick={() => handleRemoveSetFromWorkoutExercise(exerciseItem.id, set.id)}
                className="ff-workout-builder-clean-icon-danger"
                aria-label="Remover série"
            >
                <Trash2 size={15} />
            </button>
        </div>
    )
}

function ExerciseLibraryCard({ exercise, alreadyAdded, recentInfo, formatRecentExerciseDate, onPick }) {
    const recentText = recentInfo?.lastUsedAt
        ? `Recente ${formatRecentExerciseDate(recentInfo.lastUsedAt)}`
        : ''

    return (
        <button
            type="button"
            onClick={() => onPick(exercise.id)}
            className={alreadyAdded ? 'ff-workout-builder-clean-library-card is-added' : 'ff-workout-builder-clean-library-card'}
            disabled={alreadyAdded}
        >
            <ExerciseMedia exercise={exercise} size="sm" />

            <span className="ff-workout-builder-clean-library-card__text">
                <strong>{exercise.name}</strong>
                <small>{exercise.muscleGroup || 'Sem músculo'} · {exercise.equipment || 'Sem equipamento'}</small>
                <em>
                    {exercise.isFavorite ? 'Favorito' : recentText ? 'Usado antes' : 'Exercício'}
                    {exercise.isFavorite && recentText ? ` · ${recentText}` : ''}
                    {!exercise.isFavorite && recentText ? ` · ${recentText}` : ''}
                </em>
            </span>

            <b>{alreadyAdded ? 'Adicionado' : 'Adicionar'}</b>
        </button>
    )
}

function ExerciseLibraryTools({
    quickSearch,
    setQuickSearch,
    quickFavoritesOnly,
    setQuickFavoritesOnly,
    quickGroupFilter,
    setQuickGroupFilter,
    muscleGroups,
    quickEquipmentFilter,
    setQuickEquipmentFilter,
    equipmentList,
    compact = false,
}) {
    const groups = compact ? muscleGroups.slice(0, 8) : muscleGroups

    return (
        <div className="ff-workout-builder-clean-library-tools">
            <label className="ff-workout-builder-clean-search">
                <Search size={18} />
                <input
                    type="search"
                    placeholder="Buscar exercício, músculo ou equipamento"
                    value={quickSearch}
                    onChange={(event) => setQuickSearch(event.target.value)}
                />
                {quickSearch && (
                    <button type="button" onClick={() => setQuickSearch('')} aria-label="Limpar busca">
                        <X size={14} />
                    </button>
                )}
            </label>

            <div className="ff-workout-builder-clean-chips" aria-label="Filtros de exercícios">
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

                {groups.map((group) => (
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

            <label className="ff-workout-builder-clean-select">
                <span>Equipamento</span>
                <select
                    value={quickEquipmentFilter}
                    onChange={(event) => setQuickEquipmentFilter(event.target.value)}
                >
                    <option value="">Todos os equipamentos</option>
                    {equipmentList.map((item) => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
                </select>
            </label>
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
    const [showModels, setShowModels] = useState(false)

    const selectedFolder = folders.find((folder) => folder.id === selectedFolderId)
    const selectedFolderLabel = selectedFolder?.name || 'Sem pasta'
    const currentModelName = getSetModelLabel(defaultSetModel, customSetModels)
    const canSubmit = workoutName.trim() && workoutExercises.length > 0

    const builderStatus = useMemo(() => {
        if (!workoutName.trim()) return 'Informe o nome da rotina'
        if (workoutExercises.length === 0) return 'Adicione pelo menos um exercício'
        return editingWorkoutId ? 'Pronto para atualizar' : 'Pronto para salvar'
    }, [editingWorkoutId, workoutExercises.length, workoutName])

    const librarySummary = useMemo(() => {
        const total = filteredQuickExercises.length
        const visible = visibleQuickExercises.length

        if (quickSearch || quickGroupFilter || quickEquipmentFilter || quickFavoritesOnly) {
            return `${total} encontrado${total === 1 ? '' : 's'} nos filtros`
        }

        return `${visible} exercício${visible === 1 ? '' : 's'} disponíveis agora`
    }, [
        filteredQuickExercises.length,
        quickEquipmentFilter,
        quickFavoritesOnly,
        quickGroupFilter,
        quickSearch,
        visibleQuickExercises.length,
    ])

    function handlePickExercise(exerciseId) {
        if (isExerciseAlreadyAdded(exerciseId)) return
        handleQuickAddExercise(exerciseId)
    }

    if (!isOpen) return null

    return (
        <div className="ff-workout-builder-clean" role="dialog" aria-modal="true" aria-label="Criar ou editar rotina">
            <form onSubmit={handleSubmit} className="ff-workout-builder-clean__shell">
                <header className="ff-workout-builder-clean__topbar">
                    <button
                        type="button"
                        onClick={closeBuilder}
                        className="ff-workout-builder-clean-icon-button"
                        aria-label="Voltar para rotinas"
                    >
                        <ArrowLeft size={21} />
                    </button>

                    <div className="ff-workout-builder-clean__title">
                        <p>{editingWorkoutId ? 'Editando rotina' : 'Nova rotina'}</p>
                        <h1>{workoutName.trim() || 'Criar treino'}</h1>
                    </div>

                    <button
                        type="submit"
                        className="ff-workout-builder-clean-save ff-workout-builder-clean-save--desktop"
                        disabled={!canSubmit}
                    >
                        <Save size={18} />
                        {editingWorkoutId ? 'Atualizar rotina' : 'Salvar rotina'}
                    </button>
                </header>

                <main className="ff-workout-builder-clean__body">
                    <section className="ff-workout-builder-clean-card ff-workout-builder-clean-card--setup">
                        <div className="ff-workout-builder-clean-section-head">
                            <span>1</span>
                            <div>
                                <p>Dados da rotina</p>
                                <h2>Nome e pasta</h2>
                            </div>
                            <strong>{builderStatus}</strong>
                        </div>

                        <div className="ff-workout-builder-clean-setup-grid">
                            <label className="ff-workout-builder-clean-field">
                                <span>Nome do treino</span>
                                <input
                                    type="text"
                                    value={workoutName}
                                    onChange={(event) => setWorkoutName(event.target.value)}
                                    placeholder="Ex: Push A, Pull pesado, Legs..."
                                    autoFocus
                                />
                            </label>

                            <label className="ff-workout-builder-clean-field">
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
                                className="ff-workout-builder-clean-secondary-action"
                            >
                                <FolderPlus size={18} />
                                Criar pasta
                            </button>
                        </div>

                        <div className="ff-workout-builder-clean-save-strip">
                            <div>
                                <span>Será salvo como</span>
                                <strong>{workoutName.trim() || 'Nome ainda vazio'}</strong>
                                <small>Pasta: {selectedFolderLabel} · {workoutExercises.length} exercícios · {totalSetsInCurrentWorkout} séries</small>
                            </div>

                            <button type="submit" disabled={!canSubmit}>
                                <Save size={17} />
                                Salvar rotina
                            </button>
                        </div>
                    </section>

                    <section className="ff-workout-builder-clean-card ff-workout-builder-clean-card--plan">
                        <div className="ff-workout-builder-clean-section-head ff-workout-builder-clean-section-head--split">
                            <div className="ff-workout-builder-clean-section-head__left">
                                <span>2</span>
                                <div>
                                    <p>Plano do treino</p>
                                    <h2>Exercícios da rotina</h2>
                                </div>
                            </div>

                            <div className="ff-workout-builder-clean-actions">
                                {workoutExercises.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearWorkoutExercises}
                                        className="ff-workout-builder-clean-danger-soft"
                                    >
                                        Limpar
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setIsExercisePickerOpen(true)}
                                    className="ff-workout-builder-clean-primary-small"
                                >
                                    <Plus size={16} />
                                    Adicionar
                                </button>
                            </div>
                        </div>

                        {workoutExercises.length === 0 ? (
                            <div className="ff-workout-builder-clean-empty-plan">
                                <Dumbbell size={26} />
                                <strong>Nenhum exercício ainda</strong>
                                <p>Toque em adicionar e escolha na biblioteca. As séries entram vazias para você preencher depois.</p>
                                <button type="button" onClick={() => setIsExercisePickerOpen(true)}>
                                    <Plus size={17} />
                                    Abrir biblioteca
                                </button>
                            </div>
                        ) : (
                            <div className="ff-workout-builder-clean-exercise-list">
                                {workoutExercises.map((item, index) => {
                                    const isExpanded = expandedExerciseId === item.id
                                    const setsCount = item.sets?.length || 0

                                    return (
                                        <article
                                            key={item.id}
                                            className={isExpanded ? 'ff-workout-builder-clean-exercise is-expanded' : 'ff-workout-builder-clean-exercise'}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setExpandedExerciseId(isExpanded ? null : item.id)}
                                                className="ff-workout-builder-clean-exercise__main"
                                            >
                                                <span className="ff-workout-builder-clean-exercise__order">{index + 1}</span>
                                                <ExerciseMedia exercise={item.exercise} />
                                                <span className="ff-workout-builder-clean-exercise__text">
                                                    <strong>{item.exercise?.name || 'Exercício'}</strong>
                                                    <small>{item.exercise?.muscleGroup || 'Sem músculo'} · {item.exercise?.equipment || 'Sem equipamento'}</small>
                                                    <em>{setsCount} série{setsCount === 1 ? '' : 's'} vazia{setsCount === 1 ? '' : 's'} · {item.note ? 'com nota' : 'sem nota'}</em>
                                                </span>
                                                <ChevronDown size={18} />
                                            </button>

                                            <div className="ff-workout-builder-clean-exercise__actions">
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
                                                <div className="ff-workout-builder-clean-exercise__details">
                                                    <div className="ff-workout-builder-clean-set-actions">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddSetToWorkoutExercise(item.id)}
                                                        >
                                                            <Plus size={16} />
                                                            Série vazia
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
                                                            Aplicar {currentModelName}
                                                        </button>
                                                    </div>

                                                    <div className="ff-workout-builder-clean-sets">
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

                                                    <label className="ff-workout-builder-clean-note">
                                                        <span>Nota do exercício</span>
                                                        <textarea
                                                            value={item.note || ''}
                                                            onChange={(event) => handleUpdateExerciseNote(item.id, event.target.value)}
                                                            placeholder="Ex: foco em controle, ajustar pegada, banco inclinado..."
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
                    </section>

                    <section className="ff-workout-builder-clean-card ff-workout-builder-clean-card--library">
                        <div className="ff-workout-builder-clean-section-head ff-workout-builder-clean-section-head--split">
                            <div className="ff-workout-builder-clean-section-head__left">
                                <span>3</span>
                                <div>
                                    <p>Biblioteca</p>
                                    <h2>Escolher exercícios</h2>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onGoToExercises}
                                className="ff-workout-builder-clean-link"
                            >
                                Gerenciar
                            </button>
                        </div>

                        <ExerciseLibraryTools
                            quickSearch={quickSearch}
                            setQuickSearch={setQuickSearch}
                            quickFavoritesOnly={quickFavoritesOnly}
                            setQuickFavoritesOnly={setQuickFavoritesOnly}
                            quickGroupFilter={quickGroupFilter}
                            setQuickGroupFilter={setQuickGroupFilter}
                            muscleGroups={muscleGroups}
                            quickEquipmentFilter={quickEquipmentFilter}
                            setQuickEquipmentFilter={setQuickEquipmentFilter}
                            equipmentList={equipmentList}
                            compact
                        />

                        <div className="ff-workout-builder-clean-library-summary">
                            <span>{librarySummary}</span>
                            <span>{favoriteExercisesCount} favoritos</span>
                            <span>Modelo: {currentModelName}</span>
                        </div>

                        <div className="ff-workout-builder-clean-library-list">
                            {visibleQuickExercises.length === 0 ? (
                                <div className="ff-workout-builder-clean-library-empty">
                                    Nenhum exercício encontrado.
                                </div>
                            ) : (
                                visibleQuickExercises.slice(0, 16).map((exercise) => (
                                    <ExerciseLibraryCard
                                        key={exercise.id}
                                        exercise={exercise}
                                        alreadyAdded={isExerciseAlreadyAdded(exercise.id)}
                                        recentInfo={exercise.__recentInfo}
                                        formatRecentExerciseDate={formatRecentExerciseDate}
                                        onPick={handlePickExercise}
                                    />
                                ))
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsExercisePickerOpen(true)}
                            className="ff-workout-builder-clean-full-library"
                        >
                            Ver biblioteca completa
                        </button>
                    </section>

                    <section className="ff-workout-builder-clean-card ff-workout-builder-clean-card--models">
                        <button
                            type="button"
                            onClick={() => setShowModels((current) => !current)}
                            className="ff-workout-builder-clean-model-summary"
                        >
                            <span>
                                <small>Modelo de séries</small>
                                <strong>{currentModelName}</strong>
                                <em>Novos exercícios entram com séries vazias, sem reps preenchidas.</em>
                            </span>
                            <SlidersHorizontal size={18} />
                        </button>

                        {showModels && (
                            <div className="ff-workout-builder-clean-models">
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

                                <button
                                    type="button"
                                    onClick={() => setIsSetModelModalOpen(true)}
                                    className="ff-workout-builder-clean-model-create"
                                >
                                    + Criar modelo
                                </button>

                                {customSetModels.map((model) => (
                                    <div key={model.id} className="ff-workout-builder-clean-custom-model">
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
                                ))}
                            </div>
                        )}
                    </section>
                </main>

                {isExercisePickerOpen && (
                    <div className="ff-workout-builder-clean-picker" role="dialog" aria-modal="true" aria-label="Biblioteca de exercícios">
                        <div className="ff-workout-builder-clean-picker__panel">
                            <header className="ff-workout-builder-clean-picker__header">
                                <button type="button" onClick={() => setIsExercisePickerOpen(false)} aria-label="Voltar">
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <p>Biblioteca completa</p>
                                    <h2>Adicionar exercícios</h2>
                                </div>
                                <span>{workoutExercises.length} no treino</span>
                            </header>

                            <div className="ff-workout-builder-clean-picker__tools">
                                <ExerciseLibraryTools
                                    quickSearch={quickSearch}
                                    setQuickSearch={setQuickSearch}
                                    quickFavoritesOnly={quickFavoritesOnly}
                                    setQuickFavoritesOnly={setQuickFavoritesOnly}
                                    quickGroupFilter={quickGroupFilter}
                                    setQuickGroupFilter={setQuickGroupFilter}
                                    muscleGroups={muscleGroups}
                                    quickEquipmentFilter={quickEquipmentFilter}
                                    setQuickEquipmentFilter={setQuickEquipmentFilter}
                                    equipmentList={equipmentList}
                                />
                            </div>

                            <div className="ff-workout-builder-clean-picker__list">
                                {visibleQuickExercises.length === 0 ? (
                                    <div className="ff-workout-builder-clean-library-empty">
                                        Nenhum exercício encontrado. Tente limpar a busca ou os filtros.
                                    </div>
                                ) : (
                                    visibleQuickExercises.map((exercise) => (
                                        <ExerciseLibraryCard
                                            key={exercise.id}
                                            exercise={exercise}
                                            alreadyAdded={isExerciseAlreadyAdded(exercise.id)}
                                            recentInfo={exercise.__recentInfo}
                                            formatRecentExerciseDate={formatRecentExerciseDate}
                                            onPick={handlePickExercise}
                                        />
                                    ))
                                )}
                            </div>

                            <footer className="ff-workout-builder-clean-picker__footer">
                                <button type="button" onClick={() => setIsExercisePickerOpen(false)}>
                                    Concluir seleção
                                </button>
                            </footer>
                        </div>
                    </div>
                )}

                <div className="ff-workout-builder-clean-mobile-footer">
                    <button type="button" onClick={closeBuilder} aria-label="Fechar">
                        <X size={19} />
                    </button>
                    <button type="button" onClick={() => setIsExercisePickerOpen(true)}>
                        <Plus size={18} />
                        Exercício
                    </button>
                    <button type="submit" disabled={!canSubmit}>
                        <Save size={18} />
                        Salvar rotina
                    </button>
                </div>
            </form>
        </div>
    )
}

export default WorkoutBuilderModal
