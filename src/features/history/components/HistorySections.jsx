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
  RefreshCcw,
  Filter,
  CalendarRange,
  ListChecks,
} from 'lucide-react'

import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'

import {
  LOAD_MORE_SESSIONS,
  HISTORY_TIMELINE_MODES,
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


export function HistoryHero({
  historyCount,
  filteredCount,
  summary,
  periodSummary,
  source,
  syncing,
}) {
  const currentMonthSessions = periodSummary?.currentMonth?.sessions || 0
  const previousMonthSessions = periodSummary?.previousMonth?.sessions || 0
  const monthDelta = currentMonthSessions - previousMonthSessions
  const monthLabel = monthDelta === 0
    ? 'Mesmo ritmo do mês anterior'
    : monthDelta > 0
      ? `+${monthDelta} vs mês anterior`
      : `${monthDelta} vs mês anterior`

  return (
    <section className="ff-history-hero-v2">
      <div className="ff-history-hero-v2__main">
        <p className="ff-history-hero-v2__eyebrow">Histórico</p>
        <h1>Treinos finalizados</h1>
        <p>
          Timeline dos seus treinos, recordes, volume e evolução real. {syncing ? 'Sincronizando com o banco...' : source === 'database' ? 'Dados sincronizados.' : 'Dados locais.'}
        </p>
      </div>

      <div className="ff-history-hero-v2__score">
        <span>Registros</span>
        <strong>{filteredCount}</strong>
        <small>{historyCount} no total</small>
      </div>

      <div className="ff-history-hero-v2__chips" aria-label="Resumo rápido do histórico">
        <span>
          <small>Últimos 30 dias</small>
          <strong>{periodSummary?.last30?.sessions || 0} treinos</strong>
        </span>
        <span>
          <small>Volume 30d</small>
          <strong>{formatVolume(periodSummary?.last30?.volume || 0)}</strong>
        </span>
        <span>
          <small>PRs 30d</small>
          <strong>{periodSummary?.last30?.prs || 0}</strong>
        </span>
        <span>
          <small>Mês atual</small>
          <strong>{monthLabel}</strong>
        </span>
      </div>

      {summary.lastWorkout && (
        <div className="ff-history-hero-v2__last">
          <small>Último treino</small>
          <strong>{summary.lastWorkout.workoutName || 'Treino'}</strong>
          <span>{formatShortDate(summary.lastWorkout.finishedAt)} • {formatTime(summary.lastWorkout.duration || 0)}</span>
        </div>
      )}
    </section>
  )
}

export function HistorySummaryCards({ historyCount, summary }) {
  return (
    <section className="ff-history-summary-grid grid grid-cols-2 gap-3 xl:grid-cols-4">
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
  muscleFilter,
  setMuscleFilter,
  muscleFilterOptions,
  prOnly,
  setPrOnly,
  timelineMode,
  setTimelineMode,
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
    <div className="ff-history-filters ff-history-filters-v2 mt-4">
      <div className="ff-history-timeline-switch" aria-label="Agrupamento do histórico">
        {HISTORY_TIMELINE_MODES.map((mode) => (
          <button
            key={mode.value}
            type="button"
            onClick={() => setTimelineMode(mode.value)}
            className={timelineMode === mode.value ? 'is-active' : ''}
          >
            {mode.value === 'week' && <CalendarRange size={15} />}
            {mode.value === 'month' && <CalendarDays size={15} />}
            {mode.value === 'list' && <ListChecks size={15} />}
            {mode.label}
          </button>
        ))}
      </div>

      <div className="ff-history-quick-periods" aria-label="Filtros rápidos de período">
        <button type="button" onClick={() => { const date = new Date(); date.setDate(date.getDate() - 7); setStartDate(date.toISOString().slice(0, 10)); setEndDate('') }}>Últimos 7 dias</button>
        <button type="button" onClick={() => { const date = new Date(); date.setDate(date.getDate() - 30); setStartDate(date.toISOString().slice(0, 10)); setEndDate('') }}>Últimos 30 dias</button>
        <button type="button" onClick={() => { const date = new Date(); const start = new Date(date.getFullYear(), date.getMonth(), 1); setStartDate(start.toISOString().slice(0, 10)); setEndDate('') }}>Este mês</button>
        <button type="button" className={prOnly ? 'is-active' : ''} onClick={() => setPrOnly((current) => !current)}><Trophy size={14} /> Com PR</button>
      </div>

      <div className="ff-history-filter-grid">
      <div className="ff-history-filter-field ff-history-filter-field--search">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--ff-muted-2)]">
          Buscar
        </label>

        <div className="flex h-12 items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-input)] px-4 text-[var(--ff-muted)]">
          <Search size={20} />

          <input
            type="search"
            placeholder="Treino ou exercício..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted-2)]"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-[var(--ff-muted-2)] transition hover:text-[var(--ff-text)]"
              aria-label="Limpar busca"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="ff-history-filter-field">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--ff-muted-2)]">
          Treino
        </label>

        <select
          value={workoutFilter}
          onChange={(event) => setWorkoutFilter(event.target.value)}
          className="h-12 w-full cursor-pointer rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-input)] px-4 text-sm font-bold text-[var(--ff-text)] outline-none transition hover:border-[var(--ff-border)] focus:border-[var(--ff-accent-border)] focus:ring-2 focus:ring-violet-500/10"
        >
          <option value="">Todos os treinos</option>
          {workoutFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="ff-history-filter-field ff-history-filter-field--date">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--ff-muted-2)]">
          Data inicial
        </label>

        <input
          ref={startDateRef}
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className="h-12 w-full cursor-pointer rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-input)] px-4 text-sm font-bold text-[var(--ff-text)] outline-none transition hover:border-[var(--ff-border)] focus:border-[var(--ff-accent-border)] focus:ring-2 focus:ring-violet-500/10"
        />
      </div>

      <div className="ff-history-filter-field ff-history-filter-field--date">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--ff-muted-2)]">
          Data final
        </label>

        <input
          ref={endDateRef}
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          className="h-12 w-full cursor-pointer rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-input)] px-4 text-sm font-bold text-[var(--ff-text)] outline-none transition hover:border-[var(--ff-border)] focus:border-[var(--ff-accent-border)] focus:ring-2 focus:ring-violet-500/10"
        />
      </div>

      <div className="ff-history-filter-field">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--ff-muted-2)]">
          Músculo
        </label>

        <select
          value={muscleFilter}
          onChange={(event) => setMuscleFilter(event.target.value)}
          className="h-12 w-full cursor-pointer rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-input)] px-4 text-sm font-bold text-[var(--ff-text)] outline-none transition hover:border-[var(--ff-border)] focus:border-[var(--ff-accent-border)] focus:ring-2 focus:ring-violet-500/10"
        >
          <option value="">Todos os músculos</option>
          {muscleFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="ff-history-filter-field ff-history-filter-field--pr">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--ff-muted-2)]">
          Recordes
        </label>

        <button
          type="button"
          onClick={() => setPrOnly((current) => !current)}
          className={prOnly ? 'is-active' : ''}
        >
          <Trophy size={16} />
          Só PRs
        </button>
      </div>

      <div className="ff-history-filter-field ff-history-filter-field--clear flex items-end">
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="h-12 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] px-4 text-sm font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)]/40 hover:text-[var(--ff-text)]"
          >
            Limpar
          </button>
        ) : (
          <span className="ff-history-filter-clean-state"><Filter size={15} /> Sem filtros</span>
        )}
      </div>
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


function getExerciseDisplayName(exercise = {}) {
  return exercise.exercise?.name || exercise.exerciseName || exercise.name || 'Exercício'
}

function normalizePrText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function getExercisePrDetails(exercise, sessionPRs = []) {
  const exerciseName = getExerciseDisplayName(exercise)
  const exerciseKey = normalizePrText(exerciseName)
  const setIds = new Set((exercise.sets || []).map((set) => String(set.id || '')))

  return sessionPRs.filter((pr) => {
    const prExerciseKey = normalizePrText(pr.exerciseName || pr.exercise || '')
    const prSetId = String(pr.setId || pr.id || '')

    return (prExerciseKey && prExerciseKey === exerciseKey) || (prSetId && setIds.has(prSetId))
  })
}

function formatPrDetailNumber(value, unit = 'kg') {
  const number = Number(value)

  if (!Number.isFinite(number) || number <= 0) return 'sem registro'

  return `${number.toLocaleString('pt-BR')}${unit ? ` ${unit}` : ''}`
}

function formatPrDetailValue(detail = {}) {
  const unit = detail.type === 'volume' ? 'kg' : (detail.unit || 'kg')
  const value = detail.value || (detail.type === 'volume' ? detail.volume : detail.weight)

  if (detail.type === 'volume') return formatPrDetailNumber(value, unit)

  const weight = Number(detail.weight || detail.value || 0)
  const reps = Number(detail.reps || 0)

  if (weight > 0 && reps > 0) return `${weight.toLocaleString('pt-BR')} kg × ${reps}`

  return formatPrDetailNumber(value, unit)
}

function formatPrPreviousValue(detail = {}) {
  if (!detail.previousValue) return 'sem marca anterior salva'

  return formatPrDetailNumber(detail.previousValue, detail.type === 'volume' ? 'kg' : (detail.unit || 'kg'))
}

function formatPrDetailDate(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''

  return formatShortDate(date.toISOString())
}

function HistoryPrDetailsList({ prs = [] }) {
  if (!prs.length) return null

  return (
    <div className="ff-history-pr-detail-list">
      {prs.slice(0, 6).map((pr, index) => {
        const previousDate = formatPrDetailDate(pr.previousDate)
        const title = `${pr.label || 'PR'}${pr.setNumber ? ` • série ${pr.setNumber}` : ''}`

        return (
          <div key={`${pr.exerciseName}-${pr.setId || pr.id}-${pr.type}-${index}`} className="ff-history-pr-detail-item">
            <span><Trophy size={15} /></span>
            <div>
              <strong>{pr.exerciseName || 'Exercício'} · {title}</strong>
              <p>
                {formatPrPreviousValue(pr)} → <b>{formatPrDetailValue(pr)}</b>
                {previousDate ? <small> marca anterior em {previousDate}</small> : null}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function HistoryExerciseDetails({ exercise, exerciseIndex, sessionPRs = [] }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const exerciseVolume = getExerciseVolume(exercise)
  const validSets = (exercise.sets || []).filter(isValidWorkingSet)
  const prSummary = getExercisePrSummary(validSets)
  const exerciseName = getExerciseDisplayName(exercise)
  const muscleGroup = exercise.exercise?.muscleGroup || 'Grupo muscular'
  const equipment = exercise.exercise?.equipment || 'Equipamento'
  const exercisePrDetails = getExercisePrDetails(exercise, sessionPRs)

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

      {isExpanded && <HistoryPrDetailsList prs={exercisePrDetails} />}

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
                {(set.notes || set.note || set.description) && (
                  <p className="ff-history-set-row__note">{set.notes || set.note || set.description}</p>
                )}
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
  onRepeatSession,
  onDeleteSession,
}) {
  const sessionVolume = meta?.sessionVolume || 0
  const sessionPRs = meta?.sessionPRs || []
  const indexLabel = meta?.indexLabel || ''
  const locationLabel = getMapsUrl(session.location) ? formatLocationLabel(session.location) : ''

  return (
    <article className={`ff-history-feed-card ${sessionPRs.length > 0 ? 'has-pr' : ''}`}>
      <button type="button" onClick={() => onToggle(session.id)} className="ff-history-feed-card__summary">
        <div className="ff-history-feed-card__avatar">
          <Dumbbell size={21} />
        </div>

        <div className="ff-history-feed-card__content">
          <div className="ff-history-feed-card__meta">
            <span>Treino #{indexLabel}</span>
            <span>{formatDate(session.finishedAt)}</span>
            <span>{formatHour(session.finishedAt)}</span>
            {locationLabel && <span><MapPin size={12} /> {locationLabel}</span>}
          </div>

          <h3>{session.workoutName}</h3>

          <div className="ff-history-feed-card__stats">
            <span><small>Tempo</small><strong>{formatTime(session.duration || 0)}</strong></span>
            <span><small>Volume</small><strong>{formatVolume(sessionVolume)}</strong></span>
            <span><small>Exercícios</small><strong>{session.exercises.length}</strong></span>
            <span><small>Recordes</small><strong>{sessionPRs.length}</strong></span>
          </div>

          {sessionPRs.length > 0 && (
            <div className="ff-history-feed-card__pr-strip">
              <Trophy size={14} />
              <span>{sessionPRs.length} PR{sessionPRs.length > 1 ? 's' : ''}: {sessionPRs.slice(0, 2).map((pr) => pr.exerciseName).filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>

        <span className="ff-history-open-label">Ver</span>
      </button>

      <div className="ff-history-feed-card__actions">
        <button
          type="button"
          onClick={() => onRepeatSession(session)}
          className="ff-history-share-trigger ff-history-repeat-trigger"
        >
          <RefreshCcw size={16} />
          Refazer
        </button>

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
                sessionPRs={meta?.sessionPRs || []}
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
  onRepeatSession,
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
          onClick={() => onRepeatSession(session)}
          className="w-full"
        >
          <RefreshCcw size={17} />
          Refazer treino com estas cargas
        </Button>

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
            <HistoryPrDetailsList prs={sessionPRs} />
          </div>
        )}

        <div className="ff-history-exercise-list">
          {session.exercises.map((exercise, exerciseIndex) => (
            <HistoryExerciseDetails
              key={exercise.id}
              exercise={exercise}
              exerciseIndex={exerciseIndex}
              sessionPRs={sessionPRs}
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
  groupedVisibleHistory,
  historyMetaMap,
  expandedSessionId,
  loading,
  search,
  setSearch,
  workoutFilter,
  setWorkoutFilter,
  workoutFilterOptions,
  muscleFilter,
  setMuscleFilter,
  muscleFilterOptions,
  prOnly,
  setPrOnly,
  timelineMode,
  setTimelineMode,
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
  handleRepeatSession,
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
        muscleFilter={muscleFilter}
        setMuscleFilter={setMuscleFilter}
        muscleFilterOptions={muscleFilterOptions}
        prOnly={prOnly}
        setPrOnly={setPrOnly}
        timelineMode={timelineMode}
        setTimelineMode={setTimelineMode}
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

        {groupedVisibleHistory.map((group) => (
          <div key={group.key} className="ff-history-timeline-group">
            <div className="ff-history-timeline-group__header">
              <div>
                <p>{group.subtitle}</p>
                <h3>{group.label}</h3>
              </div>

              <div className="ff-history-timeline-group__stats">
                <span>{group.sessions.length} treino{group.sessions.length === 1 ? '' : 's'}</span>
                <span>{formatVolume(group.totalVolume)}</span>
                {group.totalPRs > 0 && <span>{group.totalPRs} PR</span>}
              </div>
            </div>

            <div className="ff-history-timeline-group__list">
              {group.sessions.map((session) => (
                <HistorySessionCard
                  key={session.id}
                  session={session}
                  meta={historyMetaMap.get(session.id)}
                  isExpanded={expandedSessionId === session.id}
                  onToggle={handleToggleSession}
                  onShareSession={handleShareSession}
                  onRepeatSession={handleRepeatSession}
                  onDeleteSession={handleDeleteSession}
                />
              ))}
            </div>
          </div>
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
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
              <CalendarDays size={22} />
            </div>

            <div>
              <p className="text-xs text-[var(--ff-muted-2)]">Último treino</p>
              <p className="font-bold">
                {summary.lastWorkout ? formatShortDate(summary.lastWorkout.finishedAt) : 'Sem dados'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
              <Flame size={22} />
            </div>

            <div>
              <p className="text-xs text-[var(--ff-muted-2)]">Volume acumulado</p>
              <p className="font-bold">{formatVolume(summary.totalVolume)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-400">
              <Trophy size={22} />
            </div>

            <div>
              <p className="text-xs text-[var(--ff-muted-2)]">Recordes</p>
              <p className="font-bold">{summary.totalPRs} PRs</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Medal size={22} />
            </div>

            <div>
              <p className="text-xs text-[var(--ff-muted-2)]">Séries concluídas</p>
              <p className="font-bold">{summary.totalCompletedSets}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold">Dica</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ff-muted-2)]">
          Use a página de evolução para acompanhar um exercício específico ao longo do tempo.
        </p>
      </Card>
    </aside>
  )
}
