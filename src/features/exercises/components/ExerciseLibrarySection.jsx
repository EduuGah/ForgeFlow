import { Link } from 'react-router-dom'
import {
  CalendarDays,
  Dumbbell,
  Edit3,
  ExternalLink,
  ImageIcon,
  MoreHorizontal,
  Search,
  Sparkles,
  Star,
  Trophy,
  Trash2,
  X,
} from 'lucide-react'

import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import { LOAD_MORE_COUNT, normalizeList } from '../exerciseLibraryUtils'

function ExerciseMetricPill({ label, value, icon: Icon, accent = false }) {
  return (
    <span className={accent ? 'ff-exercise-metric-pill is-accent' : 'ff-exercise-metric-pill'}>
      {Icon && <Icon size={13} />}
      <span>{label}</span>
      <strong>{value}</strong>
    </span>
  )
}

function ExerciseListRow({
  exercise,
  isExpanded,
  media,
  secondaryMuscles,
  stats,
  handleToggleExercise,
  handleToggleFavorite,
  handleEdit,
  handleDelete,
}) {
  const lastLabel = stats?.lastPerformedAt || 'Nunca feito'
  const lastSetLabel = stats?.lastSetLabel || 'Sem carga'
  const prCount = stats?.prCount || 0
  const bestWeight = stats?.bestWeight ? `${stats.bestWeight}kg` : '—'

  return (
    <article className="ff-exercise-list-row ff-exercise-list-row-v2">
      <div className="ff-exercise-row-main">
        <Link
          to={`/exercises/${exercise.id}`}
          className="ff-exercise-row-media"
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
            <Dumbbell size={28} className="text-zinc-900" />
          )}
        </Link>

        <Link to={`/exercises/${exercise.id}`} className="ff-exercise-row-content">
          <div className="ff-exercise-row-titleline">
            <h3>{exercise.name}</h3>

            {exercise.source === 'ForgeFlow' && (
              <span className="ff-exercise-source-chip">
                <Sparkles size={10} />
                Padrão
              </span>
            )}
          </div>

          {exercise.originalName && exercise.originalName !== exercise.name && (
            <p className="ff-exercise-row-original">
              {exercise.originalName}
            </p>
          )}

          <p className="ff-exercise-row-subtitle">
            {exercise.normalizedGroup} · {exercise.subgroup} · {exercise.normalizedEquipment}
          </p>

          <div className="ff-exercise-row-tags">
            <span>{exercise.normalizedGroup}</span>
            <span>{exercise.normalizedEquipment}</span>
            {media && (
              <span className="is-media">
                <ImageIcon size={12} />
                Mídia
              </span>
            )}
            {exercise.isFavorite && <span className="is-favorite">Favorito</span>}
          </div>

          <div className="ff-exercise-row-metrics">
            <ExerciseMetricPill label="Último" value={lastSetLabel} icon={CalendarDays} />
            <ExerciseMetricPill label="Maior peso" value={bestWeight} icon={Dumbbell} />
            <ExerciseMetricPill label="PRs" value={prCount} icon={Trophy} accent={prCount > 0} />
          </div>
        </Link>

        <div className="ff-exercise-row-actions">
          <button
            type="button"
            onClick={(event) => handleToggleFavorite(exercise, event)}
            className={exercise.isFavorite ? 'ff-exercise-icon-button is-favorite' : 'ff-exercise-icon-button'}
            aria-label={exercise.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Star size={18} fill={exercise.isFavorite ? 'currentColor' : 'none'} />
          </button>

          <button
            type="button"
            onClick={() => handleToggleExercise(exercise.id)}
            className="ff-exercise-icon-button"
            aria-label="Mais opções"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="ff-exercise-row-expanded">
          <div className="ff-exercise-row-expanded-card">
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div>
                <p>Grupo</p>
                <strong>{exercise.normalizedGroup}</strong>
              </div>
              <div>
                <p>Músculo</p>
                <strong>{exercise.subgroup}</strong>
              </div>
              <div>
                <p>Equipamento</p>
                <strong>{exercise.normalizedEquipment}</strong>
              </div>
              <div>
                <p>Último treino</p>
                <strong>{lastLabel}</strong>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Link
                to={`/exercises/${exercise.id}`}
                className="ff-exercise-expanded-action"
              >
                <ExternalLink size={16} />
                Detalhes
              </Link>
              <button
                type="button"
                onClick={() => handleEdit(exercise)}
                className="ff-exercise-expanded-action is-edit"
              >
                <Edit3 size={16} />
                Editar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(exercise.id)}
                className="ff-exercise-expanded-action is-delete"
              >
                <Trash2 size={16} />
                Excluir
              </button>
            </div>

            {secondaryMuscles.length > 0 && (
              <p className="mt-3 text-xs leading-relaxed text-[var(--ff-muted)]">
                Secundários: <strong className="text-[var(--ff-text-soft)]">{secondaryMuscles.join(', ')}</strong>
              </p>
            )}
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
  exerciseStatsMap,
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
  syncLabel,
  visibleCount,
  filterKey,
  setVisibleState,
}) {
  return (
    <main className="order-1 xl:order-2">
      <section className="ff-exercise-list-shell rounded-[28px] border border-[var(--ff-border)] bg-[var(--ff-card)] p-3 sm:p-4">
        <div className="ff-exercise-library-head">
          <div className="ff-exercise-library-titleline">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2>Biblioteca de exercícios</h2>
                <Badge variant="purple">{filteredExercises.length}</Badge>
              </div>
              <p>
                {filteredExercises.length} encontrados · {displayedExercises.length} visíveis · {syncLabel}
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="ff-exercise-add-button"
            >
              <Dumbbell size={17} />
              Adicionar
            </button>
          </div>

          <div className="ff-exercise-search mt-4 flex h-12 items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-input)] px-4 text-[var(--ff-muted)]">
            <Search size={18} />
            <input
              type="search"
              placeholder="Buscar por nome, músculo ou equipamento..."
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
              className={!hasActiveFilters ? 'is-active' : ''}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setShowOnlyFavorites((current) => !current)}
              className={showOnlyFavorites ? 'is-favorite-active' : ''}
            >
              Favoritos
            </button>
            {stats.groupStats.slice(0, 10).map((group) => (
              <button
                key={group.name}
                type="button"
                onClick={() => setGroupFilter(groupFilter === group.name ? '' : group.name)}
                className={groupFilter === group.name ? 'is-active' : ''}
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
          <div className="ff-exercise-native-list">
            {displayedExercises.map((exercise) => {
              const isExpanded = expandedExerciseId === exercise.id
              const media = getExerciseMedia(exercise)
              const secondaryMuscles = normalizeList(exercise.secondaryMuscles)
              const rowStats = exerciseStatsMap?.get(exercise.id) || exerciseStatsMap?.get(exercise.name) || null

              return (
                <ExerciseListRow
                  key={exercise.id}
                  exercise={exercise}
                  isExpanded={isExpanded}
                  media={media}
                  secondaryMuscles={secondaryMuscles}
                  stats={rowStats}
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
