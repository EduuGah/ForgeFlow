import { useState } from 'react'

import {
  CalendarDays,
  ArrowLeft,
  Dumbbell,
  Flame,
  MapPin,
  Medal,
  Search,
  ExternalLink,
  Trash2,
  Trophy,
  X,
  ChevronDown,
  Share2,
} from 'lucide-react'

import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'

import {
  LOAD_MORE_SESSIONS,
  formatDate,
  formatHour,
  formatShortDate,
  formatTime,
  formatVolume,
  getExerciseVolume,
  isValidWorkingSet,
} from '../historyUtils'
import HistoryStatCard from './HistoryStatCard'
import { formatLocationCoordinates, formatLocationLabel, getMapsUrl } from '../../../services/geolocationService'

export function HistorySummaryCards({ historyCount, summary }) {
  return (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <HistoryStatCard
        title="Treinos"
        value={historyCount}
        description="Finalizados"
        icon={CalendarDays}
      />

      <HistoryStatCard
        title="Séries concluídas"
        value={summary.totalCompletedSets}
        description="Registradas"
        icon={Medal}
      />

      <HistoryStatCard
        title="Volume total"
        value={formatVolume(summary.totalVolume)}
        description="Peso × reps"
        icon={Flame}
        accent
      />

      <HistoryStatCard
        title="PRs"
        value={`🏆 ${summary.totalPRs}`}
        description="Recordes batidos"
        icon={Trophy}
      />
    </section>
  )
}

function HistoryFilters({
  search,
  setSearch,
  workoutFilter,
  setWorkoutFilter,
  workoutFilterOptions,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  startDateRef,
  endDateRef,
  hasActiveFilters,
  clearFilters,
}) {
  return (
    <div className="ff-history-filters mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_160px_160px_auto]">
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500">
          Buscar
        </label>

        <div className="flex h-12 items-center gap-3 rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-zinc-400">
          <Search size={20} />

          <input
            type="search"
            placeholder="Treino ou exercício..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-zinc-500 transition hover:text-white"
              aria-label="Limpar busca"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500">
          Treino
        </label>

        <select
          value={workoutFilter}
          onChange={(event) => setWorkoutFilter(event.target.value)}
          className="h-12 w-full cursor-pointer rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-sm font-bold text-white outline-none transition hover:border-zinc-700 focus:border-[var(--ff-accent-border)] focus:ring-2 focus:ring-violet-500/10"
        >
          <option value="">Todos os treinos</option>
          {workoutFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500">
          Data inicial
        </label>

        <input
          ref={startDateRef}
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className="h-12 w-full cursor-pointer rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-sm font-bold text-white outline-none transition hover:border-zinc-700 focus:border-[var(--ff-accent-border)] focus:ring-2 focus:ring-violet-500/10"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500">
          Data final
        </label>

        <input
          ref={endDateRef}
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          className="h-12 w-full cursor-pointer rounded-2xl border border-zinc-800 bg-[#101014] px-4 text-sm font-bold text-white outline-none transition hover:border-zinc-700 focus:border-[var(--ff-accent-border)] focus:ring-2 focus:ring-violet-500/10"
        />
      </div>

      <div className="flex items-end">
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-sm font-bold text-zinc-300 transition hover:border-[var(--ff-accent-border)]/40 hover:text-white"
          >
            Limpar
          </button>
        )}
      </div>
    </div>
  )
}

function getSetPrLabels(set) {
  const labels = []

  if (set?.isWeightPR) labels.push('Peso')
  if (set?.isVolumePR) labels.push('Volume')
  if (set?.isPR && labels.length === 0) labels.push('Recorde')

  return labels
}

function getExercisePrSummary(sets = []) {
  return sets.reduce(
    (summary, set) => {
      const labels = getSetPrLabels(set)

      if (labels.length === 0) return summary

      summary.total += labels.length
      if (labels.includes('Peso')) summary.weight += 1
      if (labels.includes('Volume')) summary.volume += 1
      if (labels.includes('Recorde')) summary.generic += 1

      return summary
    },
    { total: 0, weight: 0, volume: 0, generic: 0 }
  )
}

function HistoryExerciseDetails({ exercise, exerciseIndex }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const exerciseVolume = getExerciseVolume(exercise)
  const validSets = (exercise.sets || []).filter(isValidWorkingSet)
  const prSummary = getExercisePrSummary(validSets)
  const exerciseName = exercise.exercise?.name || 'Exercício'
  const muscleGroup = exercise.exercise?.muscleGroup || 'Grupo muscular'
  const equipment = exercise.exercise?.equipment || 'Equipamento'

  return (
    <article className={`ff-history-exercise-card ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}>
      <button
        type="button"
        className="ff-history-exercise-card__toggle"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Minimizar' : 'Expandir'} ${exerciseName}`}
      >
        <span className="ff-history-exercise-card__header">
          <span className="ff-history-exercise-card__media">
            {exercise.exercise?.mediaUrl ? (
              <img
                src={exercise.exercise.mediaUrl}
                alt={exerciseName}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <Dumbbell size={22} />
            )}
          </span>

          <span className="ff-history-exercise-card__main">
            <span className="ff-history-exercise-card__eyebrow">
              <span>Exercício {exerciseIndex + 1}</span>
              {prSummary.total > 0 && <em>{prSummary.total} PR</em>}
            </span>
            <strong>{exerciseName}</strong>
            <small>{muscleGroup} • {equipment}</small>
          </span>

          <span className="ff-history-exercise-card__chevron" aria-hidden="true">
            <ChevronDown size={18} />
          </span>
        </span>
      </button>

      <div className="ff-history-exercise-card__stats">
        <span><small>Séries</small><strong>{validSets.length}</strong></span>
        <span><small>Volume</small><strong>{formatVolume(exerciseVolume)}</strong></span>
        {prSummary.weight > 0 && <span className="is-pr"><small>Peso PR</small><strong>{prSummary.weight}</strong></span>}
        {prSummary.volume > 0 && <span className="is-pr"><small>Volume PR</small><strong>{prSummary.volume}</strong></span>}
        {prSummary.generic > 0 && <span className="is-pr"><small>Recorde</small><strong>{prSummary.generic}</strong></span>}
      </div>

      {isExpanded ? (
        <div className="ff-history-set-list" aria-label={`Séries de ${exerciseName}`}>
          {validSets.map((set) => {
            const weight = Number(set.weight) || 0
            const reps = Number(set.reps) || 0
            const prLabels = getSetPrLabels(set)

            return (
              <div key={set.id} className={`ff-history-set-row ${prLabels.length > 0 ? 'has-pr' : ''}`}>
                <span className="ff-history-set-row__index">Série {set.setNumber}</span>
                <span><small>Peso</small><strong>{weight || '-'}kg</strong></span>
                <span><small>Reps</small><strong>{reps || '-'}</strong></span>
                <span className="ff-history-set-row__pr">
                  {prLabels.length > 0 ? (
                    prLabels.map((label) => <em key={label}>{label} PR</em>)
                  ) : (
                    <small>Sem PR</small>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="ff-history-exercise-card__collapsed-note">
          Toque para ver as séries deste exercício.
        </div>
      )}
    </article>
  )
}

function HistoryLocationDetails({ location }) {
  const mapsUrl = getMapsUrl(location)
  const coordinates = formatLocationCoordinates(location)
  const label = formatLocationLabel(location)
  const latitude = Number(location?.latitude)
  const longitude = Number(location?.longitude)
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)
  const mapPreviewUrl = hasCoordinates
    ? `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`
    : ''

  if (!mapsUrl) {
    return (
      <section className="ff-history-location-card ff-history-location-card--empty">
        <div className="ff-history-section-heading ff-history-section-heading--compact">
          <span><MapPin size={18} /></span>
          <div>
            <p>Local do treino</p>
            <h2>Sem localização salva</h2>
          </div>
        </div>
        <div className="ff-history-location-empty-state">
          <MapPin size={22} />
          <p>Esse treino foi finalizado sem salvar um ponto no mapa.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="ff-history-location-card">
      <div className="ff-history-section-heading ff-history-section-heading--compact">
        <span><MapPin size={18} /></span>
        <div>
          <p>Local do treino</p>
          <h2>{label}</h2>
        </div>
      </div>

      <div className="ff-history-location-layout">
        <div className="ff-history-map-preview" aria-label="Prévia visual do local do treino">
          {mapPreviewUrl && (
            <iframe
              title="Prévia do local do treino"
              src={mapPreviewUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
          <div className="ff-history-map-preview__overlay">
            <span><MapPin size={18} /></span>
            <strong>Prévia do mapa</strong>
            <small>Toque no botão para abrir a rota completa</small>
          </div>
        </div>

        <div className="ff-history-location-info-card">
          <div>
            <small>Nome salvo</small>
            <strong>{label}</strong>
          </div>
          {coordinates && (
            <div>
              <small>Coordenadas</small>
              <strong>{coordinates}</strong>
            </div>
          )}
          {location?.accuracy && (
            <div>
              <small>Precisão aproximada</small>
              <strong>{Math.round(location.accuracy)}m</strong>
            </div>
          )}
          <a className="ff-history-location-link" href={mapsUrl} target="_blank" rel="noreferrer">
            Abrir no mapa
            <ExternalLink size={15} />
          </a>
        </div>
      </div>
    </section>
  )
}

function HistorySessionCard({
  session,
  meta,
  isExpanded,
  onToggle,
  onShareSession,
  onDeleteSession,
}) {
  const sessionVolume = meta?.sessionVolume || 0
  const sessionPRs = meta?.sessionPRs || []
  const indexLabel = meta?.indexLabel || ''

  return (
    <article className="ff-history-feed-card">
      <button type="button" onClick={() => onToggle(session.id)} className="ff-history-feed-card__summary">
        <div className="ff-history-feed-card__avatar">
          <Dumbbell size={21} />
        </div>

        <div className="ff-history-feed-card__content">
          <div className="ff-history-feed-card__meta">
            <span>Treino #{indexLabel}</span>
            <span>{formatDate(session.finishedAt)}</span>
            <span>{formatHour(session.finishedAt)}</span>
          </div>

          <h3>{session.workoutName}</h3>

          <div className="ff-history-feed-card__stats">
            <span><small>Tempo</small><strong>{formatTime(session.duration || 0)}</strong></span>
            <span><small>Volume</small><strong>{formatVolume(sessionVolume)}</strong></span>
            <span><small>Exercícios</small><strong>{session.exercises.length}</strong></span>
            <span><small>Recordes</small><strong>{sessionPRs.length}</strong></span>
          </div>
        </div>

        <span className="ff-history-open-label">Ver</span>
      </button>

      <div className="ff-history-feed-card__actions">
        <button
          type="button"
          onClick={() => onShareSession(session.id)}
          className="ff-history-share-trigger"
        >
          <Share2 size={16} />
          Compartilhar
        </button>
      </div>

      {isExpanded && (
        <div className="ff-history-feed-card__details">
          <div className="ff-history-exercise-list">
            {session.exercises.map((exercise, exerciseIndex) => (
              <HistoryExerciseDetails
                key={exercise.id}
                exercise={exercise}
                exerciseIndex={exerciseIndex}
              />
            ))}
          </div>

          <HistoryLocationDetails location={session.location} />

          {session.notes && (
            <div className="ff-history-note-card">
              <h3>Observações finais</h3>
              <p>{session.notes}</p>
            </div>
          )}

          <Button
            type="button"
            variant="danger"
            onClick={() => onDeleteSession(session.id)}
            className="mt-4 w-full sm:w-auto"
          >
            <Trash2 size={17} />
            Excluir este treino
          </Button>
        </div>
      )}
    </article>
  )
}


export function HistorySessionDetailView({
  session,
  meta,
  onBack,
  onShareSession,
  onDeleteSession,
}) {
  const sessionVolume = meta?.sessionVolume || 0
  const sessionPRs = meta?.sessionPRs || []

  return (
    <div className="ff-hevy-page ff-hevy-page-history ff-history-native-page ff-history-detail-page">
      <header className="ff-history-detail-header">
        <button type="button" onClick={onBack} aria-label="Voltar ao histórico">
          <ArrowLeft size={22} />
        </button>
        <div>
          <p>{formatDate(session.finishedAt)} às {formatHour(session.finishedAt)}</p>
          <h1>{session.workoutName}</h1>
        </div>
      </header>

      <section className="ff-history-detail-metrics">
        <span><small>Duração</small><strong>{formatTime(session.duration || 0)}</strong></span>
        <span><small>Volume</small><strong>{formatVolume(sessionVolume)}</strong></span>
        <span><small>Exercícios</small><strong>{session.exercises.length}</strong></span>
        <span><small>Recordes</small><strong>{sessionPRs.length}</strong></span>
      </section>

      <div className="ff-history-detail-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onShareSession(session.id)}
          className="w-full"
        >
          <Share2 size={17} />
          Criar card de compartilhamento
        </Button>
      </div>

      <section className="ff-history-detail-section">
        <div className="ff-history-section-heading">
          <span><Dumbbell size={19} /></span>
          <div>
            <p>Resumo do treino</p>
            <h2>Exercícios realizados</h2>
            <small>{session.exercises.length} exercícios • {meta?.completedSets?.length || 0} séries concluídas • {sessionPRs.length} PRs</small>
          </div>
        </div>

        {sessionPRs.length > 0 && (
          <div className="ff-history-pr-summary-card">
            <div>
              <Trophy size={18} />
              <strong>{sessionPRs.length} recorde{sessionPRs.length > 1 ? 's' : ''} neste treino</strong>
            </div>
            <p>
              {sessionPRs.filter((set) => set.isWeightPR).length > 0 && <span>Peso ×{sessionPRs.filter((set) => set.isWeightPR).length}</span>}
              {sessionPRs.filter((set) => set.isVolumePR).length > 0 && <span>Volume ×{sessionPRs.filter((set) => set.isVolumePR).length}</span>}
              {sessionPRs.filter((set) => set.isPR && !set.isWeightPR && !set.isVolumePR).length > 0 && <span>Outros ×{sessionPRs.filter((set) => set.isPR && !set.isWeightPR && !set.isVolumePR).length}</span>}
            </p>
          </div>
        )}

        <div className="ff-history-exercise-list">
          {session.exercises.map((exercise, exerciseIndex) => (
            <HistoryExerciseDetails
              key={exercise.id}
              exercise={exercise}
              exerciseIndex={exerciseIndex}
            />
          ))}
        </div>
      </section>

      <HistoryLocationDetails location={session.location} />

      {session.notes && (
        <div className="ff-history-note-card">
          <h3>Observações finais</h3>
          <p>{session.notes}</p>
        </div>
      )}

      <Button
        type="button"
        variant="danger"
        onClick={() => onDeleteSession(session.id)}
        className="mt-4 w-full sm:w-auto"
      >
        <Trash2 size={17} />
        Excluir este treino
      </Button>
    </div>
  )
}

export function HistoryListSection({
  history,
  filteredHistory,
  visibleHistory,
  historyMetaMap,
  expandedSessionId,
  loading,
  search,
  setSearch,
  workoutFilter,
  setWorkoutFilter,
  workoutFilterOptions,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  startDateRef,
  endDateRef,
  hasActiveFilters,
  clearFilters,
  handleClearHistory,
  handleToggleSession,
  handleShareSession,
  handleDeleteSession,
  visibleCount,
  setVisibleCount,
}) {
  return (
    <section className="ff-history-list-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="ff-history-list-panel__title">Treinos finalizados</h2>
          <p className="ff-history-list-panel__subtitle">
            {filteredHistory.length} de {history.length} registros encontrados
          </p>
        </div>

        {history.length > 0 && (
          <Button
            type="button"
            variant="danger"
            onClick={handleClearHistory}
            className="w-full lg:w-auto"
          >
            <Trash2 size={17} />
            Limpar histórico
          </Button>
        )}
      </div>

      <HistoryFilters
        search={search}
        setSearch={setSearch}
        workoutFilter={workoutFilter}
        setWorkoutFilter={setWorkoutFilter}
        workoutFilterOptions={workoutFilterOptions}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        startDateRef={startDateRef}
        endDateRef={endDateRef}
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
      />

      <div className="mt-6 space-y-4">
        {loading && history.length === 0 && (
          <EmptyState
            title="Carregando histórico"
            description="Buscando seus treinos finalizados."
          />
        )}

        {!loading && history.length === 0 && (
          <EmptyState
            title="Nenhum treino finalizado"
            description="Finalize um treino para ele aparecer aqui."
          />
        )}

        {history.length > 0 && filteredHistory.length === 0 && (
          <EmptyState
            title="Nenhum treino encontrado"
            description="Tente buscar por outro nome de treino ou exercício."
          />
        )}

        {visibleHistory.map((session) => (
          <HistorySessionCard
            key={session.id}
            session={session}
            meta={historyMetaMap.get(session.id)}
            isExpanded={expandedSessionId === session.id}
            onToggle={handleToggleSession}
            onShareSession={handleShareSession}
            onDeleteSession={handleDeleteSession}
          />
        ))}

        {visibleCount < filteredHistory.length && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setVisibleCount((current) => current + LOAD_MORE_SESSIONS)}
            className="w-full"
          >
            Carregar mais treinos
          </Button>
        )}
      </div>
    </section>
  )
}

export function HistorySidebar({ summary }) {
  return (
    <aside className="space-y-6">
      <Card>
        <h2 className="text-xl font-bold">Resumo geral</h2>

        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
              <CalendarDays size={22} />
            </div>

            <div>
              <p className="text-xs text-zinc-500">Último treino</p>
              <p className="font-bold">
                {summary.lastWorkout ? formatShortDate(summary.lastWorkout.finishedAt) : 'Sem dados'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
              <Flame size={22} />
            </div>

            <div>
              <p className="text-xs text-zinc-500">Volume acumulado</p>
              <p className="font-bold">{formatVolume(summary.totalVolume)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-400">
              <Trophy size={22} />
            </div>

            <div>
              <p className="text-xs text-zinc-500">Recordes</p>
              <p className="font-bold">{summary.totalPRs} PRs</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Medal size={22} />
            </div>

            <div>
              <p className="text-xs text-zinc-500">Séries concluídas</p>
              <p className="font-bold">{summary.totalCompletedSets}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold">Dica</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Use a página de evolução para acompanhar um exercício específico ao longo do tempo.
        </p>
      </Card>
    </aside>
  )
}
