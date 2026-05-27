import {
  CalendarDays,
  ChevronDown,
  Dumbbell,
  Flame,
  MapPin,
  Medal,
  Search,
  Trash2,
  Trophy,
  X,
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
import { formatLocationLabel, getMapsUrl } from '../../../services/geolocationService'

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
    <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_160px_160px_auto]">
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

function HistoryExerciseDetails({ exercise, exerciseIndex }) {
  const exerciseVolume = getExerciseVolume(exercise)
  const validSets = (exercise.sets || []).filter(isValidWorkingSet)
  const firstSets = validSets.slice(0, 3)

  return (
    <div className="ff-history-exercise-row">
      <div className="ff-history-exercise-row__media">
        {exercise.exercise?.mediaUrl ? (
          <img
            src={exercise.exercise.mediaUrl}
            alt={exercise.exercise.name}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <Dumbbell size={22} />
        )}
      </div>

      <div className="ff-history-exercise-row__body">
        <div className="ff-history-exercise-row__title">
          <span>{exerciseIndex + 1}</span>
          <strong>{exercise.exercise.name}</strong>
        </div>
        <p>{exercise.exercise.muscleGroup} • {exercise.exercise.equipment}</p>
        <div className="ff-history-exercise-row__chips">
          <span>{validSets.length} séries</span>
          <span>{formatVolume(exerciseVolume)}</span>
        </div>

        <div className="ff-history-mini-sets">
          {firstSets.map((set) => {
            const weight = Number(set.weight) || 0
            const reps = Number(set.reps) || 0

            return (
              <div key={set.id}>
                <span>{set.setNumber}</span>
                <strong>{weight || '-'}kg</strong>
                <strong>{reps || '-'}</strong>
                {(set.isPR || set.isWeightPR || set.isVolumePR) && <em>PR</em>}
              </div>
            )
          })}
          {validSets.length > firstSets.length && <small>+{validSets.length - firstSets.length} séries</small>}
        </div>
      </div>
    </div>
  )
}

function HistoryLocationDetails({ location }) {
  const mapsUrl = getMapsUrl(location)

  if (!mapsUrl) {
    return (
      <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
        <h3 className="flex items-center gap-2 font-bold text-zinc-300"><MapPin size={17} /> Local do treino</h3>
        <p className="mt-2 text-sm text-zinc-500">Localização não salva para este treino.</p>
      </div>
    )
  }

  return (
    <div className="mt-5 rounded-3xl border border-[var(--ff-accent-border)]/20 bg-[var(--ff-accent-soft)]/10 p-5">
      <h3 className="flex items-center gap-2 font-bold text-[var(--ff-accent-text)]"><MapPin size={17} /> Local do treino</h3>
      <p className="mt-2 text-sm text-[var(--ff-text-soft)]">Local salvo: {formatLocationLabel(location)}</p>
      {location?.accuracy && <p className="mt-1 text-xs text-[var(--ff-muted)]">Precisão aproximada: {Math.round(location.accuracy)}m</p>}
      <a className="mt-3 inline-flex rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] px-4 py-2 text-sm font-black text-[var(--ff-accent-text)]" href={mapsUrl} target="_blank" rel="noreferrer">Abrir no mapa</a>
    </div>
  )
}

function HistorySessionCard({
  session,
  meta,
  isExpanded,
  onToggle,
  onDeleteSession,
}) {
  const sessionVolume = meta?.sessionVolume || 0
  const sessionPRs = meta?.sessionPRs || []
  const indexLabel = meta?.indexLabel || ''

  return (
    <article className="ff-history-feed-card">
      <button type="button" onClick={() => onToggle(session.id)} className="ff-history-feed-card__summary">
        <div className="ff-history-feed-card__avatar">#{indexLabel}</div>

        <div className="ff-history-feed-card__content">
          <div className="ff-history-feed-card__meta">
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

        <ChevronDown
          size={24}
          className={isExpanded ? 'rotate-180 text-[var(--ff-accent-text)] transition' : 'text-zinc-500 transition'}
        />
      </button>

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

export function HistoryListSection({
  history,
  filteredHistory,
  visibleHistory,
  historyMetaMap,
  expandedSessionId,
  loading,
  search,
  setSearch,
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
  handleDeleteSession,
  visibleCount,
  setVisibleCount,
}) {
  return (
    <section className="rounded-[28px] border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-black">Treinos finalizados</h2>
          <p className="mt-1 text-sm text-zinc-500">
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
