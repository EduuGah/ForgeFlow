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
import Badge from '../../../components/ui/Badge'
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

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-700 bg-white sm:h-16 sm:w-16 sm:rounded-full">
          {exercise.exercise?.mediaUrl ? (
            <img
              src={exercise.exercise.mediaUrl}
              alt={exercise.exercise.name}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <Dumbbell size={28} className="text-zinc-900" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--ff-accent-soft)]/10 text-xs font-bold text-[var(--ff-accent-text)]">
              {exerciseIndex + 1}
            </span>

            <h3 className="truncate text-lg font-bold">
              {exercise.exercise.name}
            </h3>
          </div>

          <p className="mt-1 text-sm text-zinc-500">
            {exercise.exercise.muscleGroup} • {exercise.exercise.equipment}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="purple">
              {validSets.length} séries
            </Badge>

            <Badge>
              {formatVolume(exerciseVolume)} volume
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 hidden grid-cols-[70px_minmax(90px,1fr)_minmax(90px,1fr)_minmax(90px,1fr)_140px] gap-3 px-3 text-xs font-bold uppercase tracking-wide text-zinc-500 md:grid">
          <span>Série</span>
          <span>KG</span>
          <span>Reps</span>
          <span>Volume</span>
          <span>Recorde</span>
        </div>

        <div className="space-y-2">
          {validSets.map((set) => {
            const weight = Number(set.weight) || 0
            const reps = Number(set.reps) || 0
            const volume = weight * reps

            return (
              <div
                key={set.id}
                className="grid grid-cols-2 gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 md:grid-cols-[70px_minmax(90px,1fr)_minmax(90px,1fr)_minmax(90px,1fr)_140px] md:items-center"
              >
                <div>
                  <p className="text-xs text-zinc-500 md:hidden">Série</p>
                  <p className="font-bold">{set.setNumber}</p>
                </div>

                <div>
                  <p className="text-xs text-zinc-500 md:hidden">KG</p>
                  <p className="font-semibold">{set.weight || '-'}kg</p>
                </div>

                <div>
                  <p className="text-xs text-zinc-500 md:hidden">Reps</p>
                  <p className="font-semibold">{set.reps || '-'}</p>
                </div>

                <div>
                  <p className="text-xs text-zinc-500 md:hidden">Volume</p>
                  <p className="font-semibold text-orange-300">{volume ? `${volume}kg` : '-'}</p>
                </div>

                <div className="col-span-2 flex flex-wrap gap-1 md:col-span-1">
                  {set.isWeightPR && (
                    <span className="rounded-lg bg-[var(--ff-accent-soft)]/20 px-2 py-1 text-[10px] font-bold text-[var(--ff-accent-text)]">
                      PESO PR
                    </span>
                  )}

                  {set.isVolumePR && (
                    <span className="rounded-lg bg-yellow-500/20 px-2 py-1 text-[10px] font-bold text-yellow-300">
                      VOL PR
                    </span>
                  )}

                  {set.isPR && !set.isWeightPR && !set.isVolumePR && (
                    <span className="rounded-lg bg-yellow-500/20 px-2 py-1 text-[10px] font-bold text-yellow-300">
                      PR
                    </span>
                  )}

                  {!set.isPR && !set.isWeightPR && !set.isVolumePR && (
                    <span className="text-xs text-zinc-600">—</span>
                  )}
                </div>
              </div>
            )
          })}
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
    <div className="ff-history-session-row overflow-hidden rounded-[26px] border border-[var(--ff-border)] bg-[var(--ff-card)] transition hover:border-[var(--ff-accent-border)]/30">
      <button
        type="button"
        onClick={() => onToggle(session.id)}
        className="w-full p-4 text-left"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--ff-accent-border)]/20 bg-[var(--ff-accent-soft)]/10 text-sm font-bold text-[var(--ff-accent-text)]">
                #{indexLabel}
              </span>

              <div className="min-w-0">
                <h3 className="line-clamp-2 text-xl font-black text-white">
                  {session.workoutName}
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  {formatDate(session.finishedAt)} às {formatHour(session.finishedAt)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                <p className="text-xs text-zinc-500">Duração</p>
                <p className="mt-1 font-bold text-[var(--ff-accent-text)]">
                  {formatTime(session.duration || 0)}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                <p className="text-xs text-zinc-500">Exercícios</p>
                <p className="mt-1 font-bold">{session.exercises.length}</p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                <p className="text-xs text-zinc-500">Volume</p>
                <p className="mt-1 font-bold">{formatVolume(sessionVolume)}</p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                <p className="text-xs text-zinc-500">PRs</p>
                <p className="mt-1 font-bold text-yellow-300">{sessionPRs.length}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {sessionPRs.length > 0 && <Badge>🏆 {sessionPRs.length} PR</Badge>}

            <ChevronDown
              size={24}
              className={
                isExpanded
                  ? 'rotate-180 text-[var(--ff-accent-text)] transition'
                  : 'text-zinc-500 transition'
              }
            />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-zinc-800 p-4 sm:p-5">
          <div className="space-y-3">
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
            <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <h3 className="font-bold">Observações finais</h3>
              <p className="mt-3 leading-relaxed text-zinc-300">{session.notes}</p>
            </div>
          )}

          <div className="mt-5 rounded-3xl border border-red-500/20 bg-red-500/5 p-5">
            <h3 className="font-bold text-red-400">Zona de perigo</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Remova este treino específico do histórico.
            </p>

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
        </div>
      )}
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
