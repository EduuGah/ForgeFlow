import { useState } from 'react'

import {
    ArrowLeft,
    Dumbbell,
    Flame,
    Plus,
    Save,
    Search,
    Star,
    Trash2,
    X,
} from 'lucide-react'

import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Textarea from '../../../components/ui/Textarea'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'

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
    selectedExercise,
    setSelectedExercise,
    sortedExercisesForSelect,
    setDescription,
    setSetDescription,
    exerciseSets,
    handleSubmit,
    closeBuilder,
    setIsFolderModalOpen,
    setIsSetModelModalOpen,
    handleDeleteSetModel,
    handleUpdateExerciseNote,
    handleUpdateWorkoutSetDescription,
    handleRemoveExercise,
    handleAddSetToWorkoutExercise,
    handleToggleWorkoutSetWarmup,
    handleRemoveSetFromWorkoutExercise,
    isExerciseAlreadyAdded,
    formatRecentExerciseDate,
    handleQuickAddExercise,
    handleAddSet,
    handleDefaultSets,
    handleAddExercise,
    handleRemoveSet,
    onGoToExercises,
}) {
    const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false)

    if (!isOpen) return null

    return (
<div className="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain bg-[#050507] pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-0">
    <div className="mx-auto max-w-[1180px] px-3 py-3 sm:px-4 sm:py-6">
        <form onSubmit={handleSubmit}>
            <div className="sticky top-0 z-20 -mx-3 mb-4 border-b border-zinc-900 bg-black/90 px-3 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:mb-6 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={closeBuilder}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                        >
                            <ArrowLeft size={22} />
                        </button>

                        <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-accent-text)]
">
                                {editingWorkoutId ? 'Editar rotina' : 'Nova rotina'}
                            </p>

                            <h1 className="truncate text-2xl font-black sm:text-3xl">
                                {editingWorkoutId ? 'Editar treino' : 'Criar treino'}
                            </h1>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">

                        <button
                            type="submit"
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-5 text-sm font-bold text-white transition hover:bg-[var(--ff-accent-hover)] sm:w-auto"
                        >
                            <Save size={18} />
                            Salvar treino
                        </button>
                    </div>
                </div>
            </div>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                <div className="space-y-6 xl:col-span-3">
                    <Card>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Input
                                label="Título do treino"
                                placeholder="Ex: Push A, Costas pesado..."
                                value={workoutName}
                                onChange={(event) => setWorkoutName(event.target.value)}
                            />

                            <div>
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <label className="block text-sm font-bold text-zinc-300">
                                            Pasta
                                        </label>

                                        <button
                                            type="button"
                                            onClick={() => setIsFolderModalOpen(true)}
                                            className="text-xs font-bold text-[var(--ff-accent-text)]
 transition hover:text-[var(--ff-accent-text)]
"
                                        >
                                            + Criar pasta
                                        </button>
                                    </div>

                                    <select
                                        value={selectedFolderId || ''}
                                        onChange={(event) => setSelectedFolderId(event.target.value || null)}
                                        className="h-12 w-full rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-sm font-bold text-white outline-none transition hover:border-zinc-700 focus:border-[var(--ff-accent-border)] focus:ring-2 focus:ring-violet-500/10"
                                    >
                                        <option value="">Sem pasta</option>

                                        {folders.map((folder) => (
                                            <option key={folder.id} value={folder.id}>
                                                {folder.name}
                                            </option>
                                        ))}
                                    </select>
                            </div>
                        </div>
                    </Card>

                    {workoutExercises.length === 0 && (
                        <EmptyState
                            icon={Dumbbell}
                            title="Nenhum exercício"
                            description="Use a biblioteca para adicionar exercícios ao treino."
                        />
                    )}

                    {workoutExercises.map((item, index) => (
                        <Card key={item.id}>
                            <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                                <span className="hidden text-xl text-zinc-500 sm:block">⋮⋮</span>

                                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-white">
                                    {item.exercise.mediaUrl ? (
                                        <img
                                            src={item.exercise.mediaUrl}
                                            alt={item.exercise.name}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : (
                                        <Dumbbell size={26} className="text-zinc-900" />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--ff-accent-soft)]/10 text-xs font-bold text-[var(--ff-accent-text)]
">
                                            {index + 1}
                                        </span>

                                        <h3 className="truncate text-lg font-bold">
                                            {item.exercise.name}
                                        </h3>
                                    </div>

                                    <p className="mt-1 text-xs text-zinc-500">
                                        {item.exercise.muscleGroup} • {item.exercise.equipment}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleRemoveExercise(item.id)}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="mt-5">
                                <Textarea
                                    label="Nota"
                                    placeholder="Adicionar nota"
                                    value={item.note || ''}
                                    onChange={(event) =>
                                        handleUpdateExerciseNote(item.id, event.target.value)
                                    }
                                    rows={3}
                                />
                            </div>

                            <div className="mt-5">
                                <div className="mb-2 hidden grid-cols-[70px_1fr_80px] gap-3 px-3 text-xs font-bold uppercase tracking-wide text-zinc-500 sm:grid">
                                    <span>Série</span>
                                    <span>Meta</span>
                                    <span></span>
                                </div>

                                <div className="space-y-2">
                                    {item.sets.map((set, setIndex) => {
                                        const isWarmup = set.type === 'warmup'

                                        return (
                                            <div
                                                key={set.id}
                                                className="grid grid-cols-[44px_1fr_40px] items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 sm:grid-cols-[70px_1fr_80px]"
                                            >
                                                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-[#18181b] text-sm font-bold">
                                                    {isWarmup ? 'A' : setIndex + 1}
                                                </span>

                                                <div className="min-w-0 space-y-2">
                                                    <input
                                                        type="text"
                                                        value={set.description}
                                                        onChange={(event) =>
                                                            handleUpdateWorkoutSetDescription(
                                                                item.id,
                                                                set.id,
                                                                event.target.value
                                                            )
                                                        }
                                                        className="h-10 w-full rounded-xl border border-zinc-800 bg-[#18181b] px-3 text-sm font-bold text-white outline-none transition hover:border-[var(--ff-accent-border)]/40 focus:border-[var(--ff-accent-border)]"
                                                        placeholder="Ex: 8-12 Rep"
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleWorkoutSetWarmup(item.id, set.id)}
                                                        className={isWarmup
                                                            ? 'rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black text-amber-200'
                                                            : 'rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-[10px] font-black text-zinc-500'}
                                                    >
                                                        {isWarmup ? 'AQUECIMENTO' : 'NORMAL'}
                                                    </button>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveSetFromWorkoutExercise(item.id, set.id)
                                                    }
                                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 transition hover:bg-red-500/20 sm:ml-auto"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => handleAddSetToWorkoutExercise(item.id)}
                                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-800 text-sm font-bold transition hover:bg-zinc-700"
                                >
                                    <Plus size={18} />
                                    Série
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleAddSetToWorkoutExercise(item.id, 'warmup')}
                                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/25 bg-amber-500/10 text-sm font-bold text-amber-200 transition hover:bg-amber-500/15"
                                >
                                    <Flame size={18} />
                                    Aquecimento
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="space-y-6 xl:col-span-2">
                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold">Resumo</h2>

                                <div className="mt-4 grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-zinc-500">Exercícios</p>
                                        <p className="mt-1 text-xl font-bold text-[var(--ff-accent-text)]
">
                                            {workoutExercises.length}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-zinc-500">Total de séries</p>
                                        <p className="mt-1 text-xl font-bold">
                                            {totalSetsInCurrentWorkout}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-zinc-500">Favoritos</p>
                                        <p className="mt-1 text-xl font-bold text-yellow-300">
                                            {favoriteExercisesCount}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Dumbbell size={48} className="text-zinc-600" />
                        </div>

                        <div className="mt-5">
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <label className="block text-sm font-bold text-zinc-300">
                                    Modelo padrão de séries
                                </label>

                                <button
                                    type="button"
                                    onClick={() => setIsSetModelModalOpen(true)}
                                    className="text-xs font-bold text-[var(--ff-accent-text)]
 transition hover:text-[var(--ff-accent-text)]
"
                                >
                                    + Criar modelo
                                </button>
                            </div>

                            <select
                                value={defaultSetModel}
                                onChange={(event) => setDefaultSetModel(event.target.value)}
                                className="h-12 w-full rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-sm font-bold text-white outline-none transition hover:border-zinc-700 focus:border-[var(--ff-accent-border)] focus:ring-2 focus:ring-violet-500/10"
                            >
                                <option value="hypertrophy">Hipertrofia padrão - 4 séries</option>
                                <option value="beginner">Iniciante - 3 séries</option>
                                <option value="strength">Força - 5 séries</option>
                                <option value="pyramid">Pirâmide - 4 séries</option>
                                <option value="custom">Simples - 1 série</option>

                                {customSetModels.length > 0 && (
                                    <option disabled>─ Modelos personalizados ─</option>
                                )}

                                {customSetModels.map((model) => (
                                    <option key={model.id} value={model.id}>
                                        {model.name} - {model.sets.length} séries
                                    </option>
                                ))}
                            </select>

                            {customSetModels.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                                        Modelos personalizados
                                    </p>

                                    {customSetModels.map((model) => (
                                        <div
                                            key={model.id}
                                            className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-3"
                                        >
                                            <div>
                                                <p className="text-sm font-bold">{model.name}</p>

                                                <p className="text-xs text-zinc-500">
                                                    {model.sets.length} itens
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteSetModel(model.id)}
                                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-bold">Biblioteca</h2>

                                <p className="mt-1 text-sm text-zinc-500">
                                    Favoritos e exercícios recentes aparecem primeiro para montar treinos mais rápido.
                                </p>

                                <div className="mt-2 flex flex-wrap gap-2">
                                    <Badge>
                                        {filteredQuickExercises.length} encontrados
                                    </Badge>

                                    {filteredQuickExercises.length > visibleQuickExercises.length && (
                                        <Badge>
                                            exibindo {visibleQuickExercises.length}
                                        </Badge>
                                    )}

                                    {favoriteExercisesCount > 0 && (
                                        <Badge>
                                            ⭐ {favoriteExercisesCount} favoritos
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    onGoToExercises()
                                }}
                                className="inline-flex items-center gap-2 text-sm font-bold text-[var(--ff-accent-text)]
 transition hover:text-[var(--ff-accent-text)]
"
                            >
                                <Plus size={18} />
                                Cadastrar
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsExercisePickerOpen(true)}
                            className="ff-workout-builder-add-exercise-button mb-4 flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)]/12 px-4 text-left text-[var(--ff-text)] shadow-[0_0_24px_var(--ff-accent-shadow)] transition active:scale-[0.98]"
                        >
                            <span className="min-w-0">
                                <strong className="block text-base font-black">Adicionar exercÃ­cio</strong>
                                <small className="block truncate text-xs font-bold text-[var(--ff-muted)]">
                                    Buscar, filtrar e tocar para incluir na rotina
                                </small>
                            </span>
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ff-accent)] text-white">
                                <Plus size={20} />
                            </span>
                        </button>

                        <div className="hidden space-y-3 xl:block">
                            <button
                                type="button"
                                onClick={() => setQuickFavoritesOnly((current) => !current)}
                                className={
                                    quickFavoritesOnly
                                        ? 'flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-sm font-bold text-yellow-300 transition hover:bg-yellow-500/20'
                                        : 'flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 text-sm font-bold text-zinc-300 transition hover:border-yellow-500/30 hover:text-yellow-300'
                                }
                            >
                                <Star
                                    size={17}
                                    fill={quickFavoritesOnly ? 'currentColor' : 'none'}
                                />
                                Somente favoritos
                            </button>
                            <Select
                                value={quickEquipmentFilter}
                                onChange={(event) => setQuickEquipmentFilter(event.target.value)}
                            >
                                <option value="">Todos os equipamentos</option>

                                {equipmentList.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </Select>

                            <Select
                                value={quickGroupFilter}
                                onChange={(event) => setQuickGroupFilter(event.target.value)}
                            >
                                <option value="">Todos os músculos</option>

                                {muscleGroups.map((group) => (
                                    <option key={group} value={group}>
                                        {group}
                                    </option>
                                ))}
                            </Select>

                            <div className="flex h-12 items-center gap-3 rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-zinc-400">
                                <Search size={20} />

                                <input
                                    type="text"
                                    placeholder="Procurar exercícios"
                                    value={quickSearch}
                                    onChange={(event) => setQuickSearch(event.target.value)}
                                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
                                />

                                {quickSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setQuickSearch('')}
                                        className="text-zinc-500 transition hover:text-white"
                                    >
                                        <X size={17} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-5 hidden max-h-[520px] space-y-2 overflow-y-auto overscroll-contain pr-2 xl:block">
                            {filteredQuickExercises.length === 0 && (
                                <EmptyState
                                    title="Nenhum exercício"
                                    description="Tente outro filtro ou cadastre um exercício."
                                />
                            )}

                            {visibleQuickExercises.map((exercise) => {
                                const alreadyAdded = isExerciseAlreadyAdded(exercise.id)
                                const recentInfo = exercise.__recentInfo

                                return (
                                    <button
                                        key={exercise.id}
                                        type="button"
                                        onClick={() => handleQuickAddExercise(exercise.id)}
                                        className={
                                            exercise.isFavorite
                                                ? 'flex w-full items-center gap-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-left transition hover:bg-yellow-500/10'
                                                : 'flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-zinc-900'
                                        }
                                    >
                                        <span
                                            className={
                                                alreadyAdded
                                                    ? 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white'
                                                    : 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ff-accent)] text-white'
                                            }
                                        >
                                            {alreadyAdded ? '✓' : '+'}
                                        </span>

                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-white">
                                            {exercise.mediaUrl ? (
                                                <img
                                                    src={exercise.mediaUrl}
                                                    alt={exercise.name}
                                                    className="h-full w-full object-cover"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            ) : (
                                                <Dumbbell size={24} className="text-zinc-900" />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate font-bold">
                                                    {exercise.name}
                                                </p>

                                                {exercise.isFavorite && (
                                                    <span className="shrink-0 text-yellow-300">
                                                        ⭐
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-sm text-zinc-500">
                                                {exercise.muscleGroup}
                                            </p>

                                            <div className="mt-1 flex flex-wrap gap-1.5">
                                                {exercise.isFavorite && (
                                                    <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
                                                        ⭐ Favorito
                                                    </span>
                                                )}

                                                {recentInfo?.lastUsedAt && (
                                                    <span className="rounded-full bg-[var(--ff-accent-soft)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--ff-accent-text)]">
                                                        Recente • {formatRecentExerciseDate(recentInfo.lastUsedAt)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                            <h3 className="font-bold">Modo personalizado</h3>

                            <p className="mt-1 text-sm text-zinc-500">
                                Monte séries manualmente antes de adicionar.
                            </p>

                            <div className="mt-4 space-y-3">
                                <Select
                                    value={selectedExercise}
                                    onChange={(event) => setSelectedExercise(event.target.value)}
                                >
                                    <option value="">Selecione um exercício</option>

                                    {sortedExercisesForSelect.map((exercise) => (
                                            <option key={exercise.id} value={exercise.id}>
                                                {exercise.isFavorite ? '⭐ ' : ''}{exercise.name}
                                            </option>
                                        ))}
                                </Select>

                                <Input
                                    placeholder="Ex: Aquecimento ou 8-12 Rep"
                                    value={setDescription}
                                    onChange={(event) => setSetDescription(event.target.value)}
                                />

                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleAddSet}
                                        className="w-full"
                                    >
                                        Série
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleDefaultSets}
                                        className="w-full"
                                    >
                                        Padrão
                                    </Button>

                                    <Button
                                        type="button"
                                        onClick={handleAddExercise}
                                        className="w-full"
                                    >
                                        Adicionar
                                    </Button>
                                </div>

                                {exerciseSets.length > 0 && (
                                    <div className="space-y-2">
                                        {exerciseSets.map((set, index) => (
                                            <div
                                                key={set.id}
                                                className="flex items-center justify-between rounded-xl bg-zinc-900 p-3"
                                            >
                                                <p className="text-sm">
                                                    {set.type === 'warmup' ? 'Aquecimento' : `Série ${index + 1}`}: {set.description}
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSet(set.id)}
                                                    className="text-red-400"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </section>

            {isExercisePickerOpen && (
                <div className="ff-workout-exercise-picker-sheet" role="dialog" aria-modal="true" aria-label="Adicionar exercÃ­cios">
                    <div className="ff-workout-exercise-picker-sheet__panel">
                        <div className="ff-workout-exercise-picker-sheet__header">
                            <button
                                type="button"
                                onClick={() => setIsExercisePickerOpen(false)}
                                aria-label="Voltar"
                            >
                                <ArrowLeft size={20} />
                            </button>

                            <div className="min-w-0">
                                <p>Biblioteca</p>
                                <h2>Adicionar exercÃ­cios</h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => onGoToExercises()}
                                aria-label="Cadastrar exercÃ­cio"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="ff-workout-exercise-picker-sheet__tools">
                            <label className="ff-workout-exercise-picker-sheet__search">
                                <Search size={18} />
                                <input
                                    type="search"
                                    placeholder="Buscar exercÃ­cio, mÃºsculo ou equipamento"
                                    value={quickSearch}
                                    onChange={(event) => setQuickSearch(event.target.value)}
                                />
                                {quickSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setQuickSearch('')}
                                        aria-label="Limpar busca"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </label>

                            <div className="ff-workout-exercise-picker-sheet__chips" aria-label="Filtros rÃ¡pidos">
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
                                className="ff-workout-exercise-picker-sheet__select"
                            >
                                <option value="">Todos os equipamentos</option>
                                {equipmentList.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="ff-workout-exercise-picker-sheet__list">
                            {filteredQuickExercises.length === 0 && (
                                <EmptyState
                                    title="Nenhum exercÃ­cio"
                                    description="Tente outro filtro ou cadastre um exercÃ­cio."
                                />
                            )}

                            {visibleQuickExercises.map((exercise) => {
                                const alreadyAdded = isExerciseAlreadyAdded(exercise.id)
                                const recentInfo = exercise.__recentInfo

                                return (
                                    <button
                                        key={exercise.id}
                                        type="button"
                                        onClick={() => handleQuickAddExercise(exercise.id)}
                                        className={alreadyAdded ? 'is-added' : ''}
                                    >
                                        <span className="ff-workout-exercise-picker-sheet__media">
                                            {exercise.mediaUrl ? (
                                                <img
                                                    src={exercise.mediaUrl}
                                                    alt={exercise.name}
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            ) : (
                                                <Dumbbell size={24} />
                                            )}
                                        </span>

                                        <span className="ff-workout-exercise-picker-sheet__copy">
                                            <strong>{exercise.name}</strong>
                                            <small>{exercise.muscleGroup} Â· {exercise.equipment}</small>
                                            <span>
                                                {exercise.isFavorite && <em>Favorito</em>}
                                                {recentInfo?.lastUsedAt && (
                                                    <em>Recente {formatRecentExerciseDate(recentInfo.lastUsedAt)}</em>
                                                )}
                                            </span>
                                        </span>

                                        <span className="ff-workout-exercise-picker-sheet__add">
                                            {alreadyAdded ? 'OK' : '+'}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>

                        <div className="ff-workout-exercise-picker-sheet__footer">
                            <button type="button" onClick={() => setIsExercisePickerOpen(false)}>
                                Concluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-800 bg-black/90 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl sm:hidden">
                <div className="grid grid-cols-[48px_1fr] gap-2">
                    <button
                        type="button"
                        onClick={closeBuilder}
                        className="flex h-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-300 transition active:scale-95"
                        aria-label="Fechar criação de treino"
                    >
                        <X size={20} />
                    </button>

                    <button
                        type="submit"
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-5 text-sm font-black text-white shadow-[0_0_20px_var(--ff-accent-shadow)] transition active:scale-[0.98]"
                    >
                        <Save size={18} />
                        Salvar treino
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>
    )
}

export default WorkoutBuilderModal
