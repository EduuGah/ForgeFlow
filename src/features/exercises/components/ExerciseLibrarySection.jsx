import { Link } from 'react-router-dom'
import {
  CalendarDays,
  Dumbbell,
  Edit3,
  ExternalLink,
  ImageIcon,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  Trophy,
  Trash2,
  X,
} from 'lucide-react'

import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import { LOAD_MORE_COUNT, normalizeList } from '../exerciseLibraryUtils'

function ExerciseMetricPill({ label, value, icon: Icon, accent = false }) {
  return (
    <span className={accent ? 'ff-exercise-catalog-metric is-accent' : 'ff-exercise-catalog-metric'}>
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
  const lastLabel = stats?.lastPerformedAt || 'Nunca'
  const lastSetLabel = stats?.lastSetLabel || 'Sem carga'
  const prCount = stats?.prCount || 0
  const bestWeight = stats?.bestWeight ? `${stats.bestWeight}kg` : '--'

  return (
    <article className={isExpanded ? 'ff-exercise-catalog-card is-open' : 'ff-exercise-catalog-card'}>
      <div className="ff-exercise-catalog-card__main">
        <Link
          to={`/exercises/${exercise.id}`}
          className="ff-exercise-catalog-card__media"
          aria-label={`Abrir ${exercise.name}`}
        >
          {media ? (
            <img
              src={media}
              alt={exercise.name}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <Dumbbell size={26} />
          )}
        </Link>

        <div className="ff-exercise-catalog-card__content">
          <div className="ff-exercise-catalog-card__titleline">
            <Link to={`/exercises/${exercise.id}`}>
              <h3>{exercise.name}</h3>
            </Link>
            {exercise.isFavorite && <span className="is-favorite">Favorito</span>}
          </div>

          {exercise.originalName && exercise.originalName !== exercise.name && (
            <p className="ff-exercise-catalog-card__original">{exercise.originalName}</p>
          )}

          <p className="ff-exercise-catalog-card__subtitle">
            {exercise.normalizedGroup} - {exercise.subgroup} - {exercise.normalizedEquipment}
          </p>

          <div className="ff-exercise-catalog-card__chips">
            <span>{exercise.normalizedGroup}</span>
            <span>{exercise.normalizedEquipment}</span>
            {media && <span><ImageIcon size={12} /> Midia</span>}
          </div>
        </div>

        <div className="ff-exercise-catalog-card__actions">
          <button
            type="button"
            onClick={(event) => handleToggleFavorite(exercise, event)}
            className={exercise.isFavorite ? 'is-favorite' : ''}
            aria-label={exercise.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Star size={18} fill={exercise.isFavorite ? 'currentColor' : 'none'} />
          </button>

          <button
            type="button"
            onClick={() => handleToggleExercise(exercise.id)}
            aria-label="Mais opcoes"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      <div className="ff-exercise-catalog-card__metrics">
        <ExerciseMetricPill label="Ultimo" value={lastSetLabel} icon={CalendarDays} />
        <ExerciseMetricPill label="Peso" value={bestWeight} icon={Dumbbell} />
        <ExerciseMetricPill label="PRs" value={prCount} icon={Trophy} accent={prCount > 0} />
      </div>

      {isExpanded && (
        <div className="ff-exercise-catalog-card__expanded">
          <div className="ff-exercise-catalog-detail-grid">
            <div>
              <p>Grupo</p>
              <strong>{exercise.normalizedGroup}</strong>
            </div>
            <div>
              <p>Musculo</p>
              <strong>{exercise.subgroup}</strong>
            </div>
            <div>
              <p>Equipamento</p>
              <strong>{exercise.normalizedEquipment}</strong>
            </div>
            <div>
              <p>Ultimo treino</p>
              <strong>{lastLabel}</strong>
            </div>
          </div>

          {secondaryMuscles.length > 0 && (
            <p className="ff-exercise-catalog-secondary">
              Secundarios: <strong>{secondaryMuscles.join(', ')}</strong>
            </p>
          )}

          <div className="ff-exercise-catalog-expanded-actions">
            <Link to={`/exercises/${exercise.id}`}>
              <ExternalLink size={16} />
              Detalhes
            </Link>
            <button type="button" className="is-edit" onClick={() => handleEdit(exercise)}>
              <Edit3 size={16} />
              Editar
            </button>
            <button type="button" className="is-delete" onClick={() => handleDelete(exercise.id)}>
              <Trash2 size={16} />
              Excluir
            </button>
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
    <main className="ff-exercise-catalog-main order-1 xl:order-2">
      <section className="ff-exercise-catalog-shell">
        <div className="ff-exercise-catalog-head">
          <div>
            <span>{syncLabel}</span>
            <h2>Catalogo</h2>
            <p>{filteredExercises.length} encontrados - {displayedExercises.length} visiveis</p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="ff-exercise-catalog-add"
          >
            <Plus size={17} />
            Novo
          </button>
        </div>

        <label className="ff-exercise-catalog-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Buscar exercicio, musculo ou equipamento"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} aria-label="Limpar busca">
              <X size={17} />
            </button>
          )}
        </label>

        <div className="ff-exercise-catalog-chips">
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

        {!isLoaded && <EmptyState title="Carregando biblioteca" description="Preparando seus exercicios." />}

        {isLoaded && filteredExercises.length === 0 && (
          <EmptyState title="Nenhum exercicio encontrado" description="Tente limpar os filtros ou buscar por outro termo." />
        )}

        {displayedExercises.length > 0 && (
          <div className="ff-exercise-catalog-list">
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
          <div className="pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setVisibleState({ key: filterKey, count: visibleCount + LOAD_MORE_COUNT })}
              className="w-full"
            >
              Carregar mais 8 exercicios
            </Button>
          </div>
        )}
      </section>
    </main>
  )
}

export default ExerciseLibrarySection
