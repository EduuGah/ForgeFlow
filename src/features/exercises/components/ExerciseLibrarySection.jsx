import { Link } from 'react-router-dom'
import {
  Activity,
  ChevronDown,
  Dumbbell,
  Edit3,
  ExternalLink,
  ImageIcon,
  Info,
  Layers3,
  Search,
  Sparkles,
  Star,
  Target,
  Trash2,
  Wrench,
  X,
} from 'lucide-react'

import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import { LOAD_MORE_COUNT, normalizeList } from '../exerciseLibraryUtils'
import { DetailMiniCard } from './ExerciseLibraryUi'

function ExerciseInfoList({ title, items, variant = 'default' }) {
  const normalizedItems = normalizeList(items)
  if (normalizedItems.length === 0) return null

  const isDanger = variant === 'danger'

  return (
    <div
      className={
        isDanger
          ? 'ff-danger-panel rounded-2xl border p-4'
          : 'rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4'
      }
    >
      <p
        className={
          isDanger
            ? 'ff-danger-title text-xs font-semibold uppercase tracking-wide'
            : 'text-xs font-semibold uppercase tracking-wide text-[var(--ff-muted)]'
        }
      >
        {title}
      </p>

      <ul className="ff-exercise-library-card mt-3 space-y-2">
        {normalizedItems.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className={
              isDanger
                ? 'text-sm font-medium leading-relaxed'
                : 'text-sm leading-relaxed text-[var(--ff-text)]'
            }
          >
            <span className={isDanger ? 'ff-danger-index mr-2 font-black' : 'mr-2 font-bold text-[var(--ff-accent-text)]'}>
              {index + 1}.
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
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
      <Card className="ff-exercise-app-card overflow-visible">
        <div className="border-b border-[var(--ff-border)] p-4 sm:p-5">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-[-0.04em]">
                  Exercícios
                </h2>

                <Badge variant="purple">
                  {filteredExercises.length}
                </Badge>
              </div>

              <p className="mt-1 text-sm text-[var(--ff-muted)]">
                {filteredExercises.length} encontrados • {displayedExercises.length} visíveis
              </p>

              <div className="mt-4 hidden min-w-0 max-w-full xl:block">
                <div className="ff-filter-chips ff-exercise-quick-filter flex min-w-0 max-w-full gap-2 pb-2 pr-1">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={!hasActiveFilters ? 'shrink-0 rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-4 py-2 text-xs font-black text-[var(--ff-accent-text)]' : 'shrink-0 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-bold text-zinc-400'}
                  >
                    Todos
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowOnlyFavorites((current) => !current)}
                    className={showOnlyFavorites ? 'shrink-0 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs font-black text-yellow-300' : 'shrink-0 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-bold text-zinc-400'}
                  >
                    Favoritos
                  </button>

                  {stats.groupStats.map((group) => (
                    <button
                      key={group.name}
                      type="button"
                      onClick={() => setGroupFilter(groupFilter === group.name ? '' : group.name)}
                      className={groupFilter === group.name ? 'shrink-0 rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-4 py-2 text-xs font-black text-[var(--ff-accent-text)]' : 'shrink-0 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-bold text-zinc-400'}
                    >
                      {group.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-3 xl:hidden">
                <div className="ff-native-search flex h-12 items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-input)] px-4 text-[var(--ff-muted)]">
                  <Search size={18} />

                  <input
                    type="search"
                    placeholder="Buscar exercício..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted-2)]"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="text-zinc-500 transition hover:text-white"
                      aria-label="Limpar busca"
                    >
                      <X size={17} />
                    </button>
                  )}
                </div>

                <div className="ff-filter-chips -mx-1 flex max-w-full gap-2 ff-mobile-chip-scroll overflow-x-auto overscroll-x-contain px-1 pb-2 pr-8 [scrollbar-width:none]">
                  <button
                    type="button"
                    onClick={() => {
                      clearFilters()
                    }}
                    className={
                      !hasActiveFilters
                        ? 'shrink-0 rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-4 py-2 text-xs font-black text-[var(--ff-accent-text)]'
                        : 'shrink-0 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-bold text-zinc-400'
                    }
                  >
                    Todos
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowOnlyFavorites((current) => !current)}
                    className={
                      showOnlyFavorites
                        ? 'shrink-0 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs font-black text-yellow-300'
                        : 'shrink-0 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-bold text-zinc-400'
                    }
                  >
                    Favoritos
                  </button>

                  {stats.groupStats.slice(0, 8).map((group) => (
                    <button
                      key={group.name}
                      type="button"
                      onClick={() => setGroupFilter(groupFilter === group.name ? '' : group.name)}
                      className={
                        groupFilter === group.name
                          ? 'shrink-0 rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-4 py-2 text-xs font-black text-[var(--ff-accent-text)]'
                          : 'shrink-0 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-bold text-zinc-400'
                      }
                    >
                      {group.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-5 text-sm font-bold text-white transition hover:bg-[var(--ff-accent-hover)] active:scale-[0.98]"
            >
              <Dumbbell size={18} />
              Adicionar exercício
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4">
          {!isLoaded && (
            <EmptyState
              title="Carregando biblioteca"
              description="Preparando seus exercícios."
            />
          )}

          {isLoaded && filteredExercises.length === 0 && (
            <EmptyState
              title="Nenhum exercício encontrado"
              description="Tente limpar os filtros ou buscar por outro termo."
            />
          )}

          {displayedExercises.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {displayedExercises.map((exercise) => {
                const isExpanded = expandedExerciseId === exercise.id
                const media = getExerciseMedia(exercise)
                const secondaryMuscles = normalizeList(exercise.secondaryMuscles)

                return (
                  <div
                    key={exercise.id}
                    className="ff-exercise-row-card overflow-hidden rounded-[18px] border border-[var(--ff-border)] bg-[var(--ff-surface)] transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-surface-2)]"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleExercise(exercise.id)}
                      className="relative w-full p-3 text-left sm:p-4"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--ff-border)] bg-white shadow-inner sm:h-24 sm:w-24 xl:h-20 xl:w-20">
                          {media ? (
                            <img
                              src={media}
                              alt={exercise.name}
                              className="h-full w-full object-contain"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <Dumbbell size={30} className="text-zinc-900" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="line-clamp-2 text-base font-black leading-tight tracking-[-0.03em] text-[var(--ff-text)] xl:truncate">
                              {exercise.name}
                            </h3>

                            {exercise.source === 'ForgeFlow' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ff-accent-soft)]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--ff-accent-text)]">
                                <Sparkles size={11} />
                                Padrão
                              </span>
                            )}
                          </div>

                          {exercise.originalName && exercise.originalName !== exercise.name && (
                            <p className="mt-0.5 truncate text-xs text-zinc-600">
                              {exercise.originalName}
                            </p>
                          )}

                          <div className="mt-2 flex flex-wrap gap-1.5 xl:mt-3 xl:gap-2 ff-limited-badges">
                            <Badge variant="purple">
                              {exercise.normalizedGroup}
                            </Badge>

                            <Badge>
                              {exercise.subgroup}
                            </Badge>

                            <Badge>
                              {exercise.normalizedEquipment}
                            </Badge>

                            {media ? (
                              <Badge variant="green">
                                <ImageIcon size={13} />
                                Mídia
                              </Badge>
                            ) : (
                              <Badge>
                                Sem mídia
                              </Badge>
                            )}
                            {exercise.isFavorite && (
                              <Badge>
                                ⭐ Favorito
                              </Badge>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(event) => handleToggleFavorite(exercise, event)}
                          title={
                            exercise.isFavorite
                              ? 'Remover dos favoritos'
                              : 'Adicionar aos favoritos'
                          }
                          className={
                            exercise.isFavorite
                              ? 'absolute right-2 top-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 backdrop-blur transition hover:bg-yellow-500/20 xl:static xl:h-10 xl:w-10'
                              : 'absolute right-2 top-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/90 text-zinc-500 backdrop-blur transition hover:border-yellow-500/30 hover:bg-yellow-500/10 hover:text-yellow-300 xl:static xl:h-10 xl:w-10'
                          }
                        >
                          <Star
                            size={18}
                            fill={exercise.isFavorite ? 'currentColor' : 'none'}
                          />
                        </button>

                        <ChevronDown
                          size={22}
                          className={
                            isExpanded
                              ? 'hidden shrink-0 rotate-180 text-[var(--ff-accent-text)] transition sm:block'
                              : 'hidden shrink-0 text-zinc-500 transition sm:block'
                          }
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-zinc-800 px-4 pb-4">
                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <DetailMiniCard
                            icon={Layers3}
                            title="Grupo"
                            value={exercise.normalizedGroup}
                          />

                          <DetailMiniCard
                            icon={Target}
                            title="Músculo alvo"
                            value={exercise.subgroup}
                            accent
                          />

                          <DetailMiniCard
                            icon={Wrench}
                            title="Equipamento"
                            value={exercise.normalizedEquipment}
                          />

                          <DetailMiniCard
                            icon={Activity}
                            title="Músculos secundários"
                            value={
                              secondaryMuscles.length > 0
                                ? secondaryMuscles.join(', ')
                                : 'Não informado'
                            }
                          />
                        </div>

                        {exercise.description ? (
                          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400">
                                <Info size={16} />
                              </div>

                              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                Observações
                              </p>
                            </div>

                            <p className="mt-3 text-sm text-zinc-300">
                              {exercise.description}
                            </p>
                          </div>
                        ) : null}

                        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                          <ExerciseInfoList
                            title="Execução correta"
                            items={exercise.instructions || exercise.execution}
                          />

                          <ExerciseInfoList
                            title="Dicas"
                            items={exercise.tips}
                          />

                          <ExerciseInfoList
                            title="Erros comuns"
                            items={exercise.commonMistakes}
                            variant="danger"
                          />
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <Link
                            to={`/exercises/${exercise.id}`}
                            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 text-sm font-bold text-white transition hover:border-[var(--ff-accent-border)]/40 hover:bg-zinc-800"
                          >
                            <ExternalLink size={17} />
                            Detalhes
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleEdit(exercise)}
                            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)]/10 text-sm font-bold text-[var(--ff-accent-text)] transition hover:border-violet-400 hover:bg-[var(--ff-accent-hover)]/20"
                          >
                            <Edit3 size={17} />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(exercise.id)}
                            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 text-sm font-bold text-red-300 transition hover:border-red-400/40 hover:bg-red-500/20"
                          >
                            <Trash2 size={17} />
                            Excluir
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

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
            </div>
          )}
        </div>
      </Card>
    </main>
  )
}

export default ExerciseLibrarySection
