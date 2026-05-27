import { Link } from 'react-router-dom'
import {
  Dumbbell,
  Edit3,
  ExternalLink,
  ImageIcon,
  MoreHorizontal,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react'

import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import { LOAD_MORE_COUNT, normalizeList } from '../exerciseLibraryUtils'

function ExerciseListRow({
  exercise,
  isExpanded,
  media,
  secondaryMuscles,
  handleToggleExercise,
  handleToggleFavorite,
  handleEdit,
  handleDelete,
}) {
  return (
    <article className="ff-exercise-list-row overflow-hidden border-b border-[var(--ff-border)] bg-transparent last:border-b-0">
      <div className="flex items-center gap-3 px-1 py-3 sm:px-2">
        <Link
          to={`/exercises/${exercise.id}`}
          className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--ff-border)] bg-white sm:h-18 sm:w-18"
          aria-label={`Abrir ${exercise.name}`}
        >
          {media ? (
            <img
              src={media}
              alt={exercise.name}
              className="h-full w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <Dumbbell size={26} className="text-zinc-900" />
          )}
        </Link>

        <Link to={`/exercises/${exercise.id}`} className="min-w-0 flex-1 py-1">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-base font-black leading-tight text-[var(--ff-text)]">
              {exercise.name}
            </h3>

            {exercise.source === 'ForgeFlow' && (
              <span className="hidden shrink-0 items-center gap-1 rounded-full bg-[var(--ff-accent-soft)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[var(--ff-accent-text)] sm:inline-flex">
                <Sparkles size={10} />
                Padrão
              </span>
            )}
          </div>

          {exercise.originalName && exercise.originalName !== exercise.name && (
            <p className="mt-0.5 truncate text-xs text-[var(--ff-muted-2)]">
              {exercise.originalName}
            </p>
          )}

          <p className="mt-1 truncate text-sm text-[var(--ff-muted)]">
            {exercise.normalizedGroup} · {exercise.subgroup} · {exercise.normalizedEquipment}
          </p>

          <div className="mt-2 flex min-w-0 gap-1.5 overflow-hidden">
            <span className="shrink-0 rounded-full border border-[var(--ff-border)] px-2.5 py-1 text-[11px] font-bold text-[var(--ff-muted)]">
              {exercise.normalizedGroup}
            </span>
            {media && (
              <span className="hidden shrink-0 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300 sm:inline-flex">
                <ImageIcon size={12} />
                Mídia
              </span>
            )}
            {exercise.isFavorite && (
              <span className="shrink-0 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-1 text-[11px] font-bold text-yellow-300">
                Favorito
              </span>
            )}
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={(event) => handleToggleFavorite(exercise, event)}
            className={
              exercise.isFavorite
                ? 'flex h-10 w-10 items-center justify-center rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
                : 'flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] text-[var(--ff-muted)]'
            }
            aria-label={exercise.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Star size={18} fill={exercise.isFavorite ? 'currentColor' : 'none'} />
          </button>

          <button
            type="button"
            onClick={() => handleToggleExercise(exercise.id)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] text-[var(--ff-muted)]"
            aria-label="Mais opções"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-1 pb-4 sm:px-2">
          <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-3">
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div className="rounded-2xl bg-black/30 p-3">
                <p className="text-xs text-[var(--ff-muted)]">Grupo</p>
                <p className="mt-1 truncate font-bold">{exercise.normalizedGroup}</p>
              </div>
              <div className="rounded-2xl bg-black/30 p-3">
                <p className="text-xs text-[var(--ff-muted)]">Músculo</p>
                <p className="mt-1 truncate font-bold">{exercise.subgroup}</p>
              </div>
              <div className="rounded-2xl bg-black/30 p-3">
                <p className="text-xs text-[var(--ff-muted)]">Equipamento</p>
                <p className="mt-1 truncate font-bold">{exercise.normalizedEquipment}</p>
              </div>
              <div className="rounded-2xl bg-black/30 p-3">
                <p className="text-xs text-[var(--ff-muted)]">Secundários</p>
                <p className="mt-1 truncate font-bold">{secondaryMuscles.length ? secondaryMuscles.join(', ') : '-'}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <Link
                to={`/exercises/${exercise.id}`}
                className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-black/30 text-sm font-black text-[var(--ff-text)]"
              >
                <ExternalLink size={16} />
                Detalhes
              </Link>
              <button
                type="button"
                onClick={() => handleEdit(exercise)}
                className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)] text-sm font-black text-[var(--ff-accent-text)]"
              >
                <Edit3 size={16} />
                Editar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(exercise.id)}
                className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 text-sm font-black text-red-300"
              >
                <Trash2 size={16} />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

function ExerciseLibrarySection({
  isLoaded,
  filteredExercises,
  displayedExercises,
  expandedExerciseId,
  handleToggleExercise,
  handleToggleFavorite,
  handleEdit,
  handleDelete,
  getExerciseMedia,
  stats,
  groupFilter,
  setGroupFilter,
  showOnlyFavorites,
  setShowOnlyFavorites,
  hasActiveFilters,
  clearFilters,
  search,
  setSearch,
  openCreateModal,
  visibleCount,
  filterKey,
  setVisibleState,
}) {
  return (
    <main className="order-1 xl:order-2">
      <section className="ff-exercise-list-shell rounded-[28px] border border-[var(--ff-border)] bg-[var(--ff-card)] p-3 sm:p-4">
        <div className="px-1 pb-3 sm:px-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-2xl font-black tracking-[-0.04em]">Biblioteca</h2>
                <Badge variant="purple">{filteredExercises.length}</Badge>
              </div>
              <p className="mt-1 text-sm text-[var(--ff-muted)]">
                {filteredExercises.length} exercícios encontrados · exibindo {displayedExercises.length}
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="hidden h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-4 text-sm font-black text-white sm:inline-flex"
            >
              <Dumbbell size={17} />
              Adicionar
            </button>
          </div>

          <div className="ff-exercise-search mt-4 flex h-12 items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-input)] px-4 text-[var(--ff-muted)]">
            <Search size={18} />
            <input
              type="search"
              placeholder="Buscar exercício..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted-2)]"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Limpar busca">
                <X size={17} />
              </button>
            )}
          </div>

          <div className="ff-filter-chips mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            <button
              type="button"
              onClick={clearFilters}
              className={!hasActiveFilters ? 'shrink-0 rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-4 py-2 text-sm font-black text-[var(--ff-accent-text)]' : 'shrink-0 rounded-full border border-[var(--ff-border)] bg-black/30 px-4 py-2 text-sm font-bold text-[var(--ff-muted)]'}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setShowOnlyFavorites((current) => !current)}
              className={showOnlyFavorites ? 'shrink-0 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm font-black text-yellow-300' : 'shrink-0 rounded-full border border-[var(--ff-border)] bg-black/30 px-4 py-2 text-sm font-bold text-[var(--ff-muted)]'}
            >
              Favoritos
            </button>
            {stats.groupStats.slice(0, 10).map((group) => (
              <button
                key={group.name}
                type="button"
                onClick={() => setGroupFilter(groupFilter === group.name ? '' : group.name)}
                className={groupFilter === group.name ? 'shrink-0 rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-4 py-2 text-sm font-black text-[var(--ff-accent-text)]' : 'shrink-0 rounded-full border border-[var(--ff-border)] bg-black/30 px-4 py-2 text-sm font-bold text-[var(--ff-muted)]'}
              >
                {group.name}
              </button>
            ))}
          </div>
        </div>

        {!isLoaded && <EmptyState title="Carregando biblioteca" description="Preparando seus exercícios." />}

        {isLoaded && filteredExercises.length === 0 && (
          <EmptyState title="Nenhum exercício encontrado" description="Tente limpar os filtros ou buscar por outro termo." />
        )}

        {displayedExercises.length > 0 && (
          <div className="ff-exercise-native-list divide-y divide-[var(--ff-border)] overflow-visible rounded-3xl bg-black/20">
            {displayedExercises.map((exercise) => {
              const isExpanded = expandedExerciseId === exercise.id
              const media = getExerciseMedia(exercise)
              const secondaryMuscles = normalizeList(exercise.secondaryMuscles)

              return (
                <ExerciseListRow
                  key={exercise.id}
                  exercise={exercise}
                  isExpanded={isExpanded}
                  media={media}
                  secondaryMuscles={secondaryMuscles}
                  handleToggleExercise={handleToggleExercise}
                  handleToggleFavorite={handleToggleFavorite}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                />
              )
            })}
          </div>
        )}

        {visibleCount < filteredExercises.length && (
          <div className="pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setVisibleState({ key: filterKey, count: visibleCount + LOAD_MORE_COUNT })}
              className="w-full"
            >
              Carregar mais 8 exercícios
            </Button>
          </div>
        )}
      </section>
    </main>
  )
}

export default ExerciseLibrarySection
