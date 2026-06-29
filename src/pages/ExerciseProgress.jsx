import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  Dumbbell,
  Flame,
  Info,
  LineChart,
  Medal,
  RefreshCcw,
  Search,
  Sparkles,
  Target,
  Trophy,
  Weight,
  X,
} from 'lucide-react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart as RechartsLineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import AppPageIntro from '../components/app/AppPageIntro'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import SafeResponsiveContainer from '../components/ui/SafeResponsiveContainer'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import defaultExercises from '../data/defaultExercises'
import { getUserStorageData, saveUserStorageData } from '../utils/userStorage'
import {
  PROGRESS_PERIODS,
  formatNumber,
  getTooltipStyle,
  normalizeHistory,
} from '../features/progress/progressUtils'
import {
  buildBenchmarkSummary,
  buildExerciseOptions,
  calculateExerciseProgress,
  filterExerciseOptions,
  formatDate,
  formatLongDate,
  formatVolume,
  formatWeight,
  getDaysSinceLastEntry,
  getPrTone,
  resolveExerciseFromQuery,
} from '../features/exerciseProgress/exerciseProgressUtils'

const DEFAULT_PERIOD = 'all'

function normalizeHistoryResponse(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.history)) return data.history
  if (Array.isArray(data?.items)) return data.items
  return []
}

function getStatusLabel(loading, syncing, source) {
  if (loading || syncing) return 'Sincronizando'
  if (source === 'database') return 'Sincronizado'
  if (source === 'local') return 'Offline'
  return 'Sem dados'
}

function formatSignedWeight(value) {
  const number = Number(value) || 0
  if (number > 0) return `+${formatWeight(number)}`
  return formatWeight(number)
}

function formatSignedVolume(value) {
  const number = Number(value) || 0
  if (number > 0) return `+${formatVolume(number)}`
  return formatVolume(number)
}

function formatSignedReps(value) {
  const number = Number(value) || 0
  if (number > 0) return `+${formatNumber(number, { maximumFractionDigits: 0 })} reps`
  if (number < 0) return `${formatNumber(number, { maximumFractionDigits: 0 })} reps`
  return '0 reps'
}

function formatBestSet(set = null) {
  if (!set) return '—'
  return `${formatWeight(set.weight)} x ${set.reps}`
}

function parseKgValue(value) {
  if (value === null || value === undefined || value === '') return 0
  const number = Number(String(value).replace(',', '.'))
  return Number.isFinite(number) && number > 0 ? number : 0
}

function getCurrentBodyWeightFromStorage(user) {
  const bodyWeightHistory = getUserStorageData(user, 'bodyweight', [])
  const lastRecord = Array.isArray(bodyWeightHistory) ? bodyWeightHistory.at(-1) : null
  const latestWeight = parseKgValue(lastRecord?.weight)
  const profileWeight = parseKgValue(user?.profile?.currentWeight)

  return latestWeight || profileWeight || 0
}

function formatBodyweightRatio(value) {
  const number = Number(value) || 0
  if (number <= 0) return '—'
  return `${formatNumber(number, { maximumFractionDigits: 2 })}x`
}

function getBenchmarkLevelLabel(level) {
  const labels = {
    beginner: 'Iniciante',
    intermediate: 'Intermediário',
    advanced: 'Avançado',
  }

  return labels[level] || level
}


function getProfileStrengthContext(user) {
  const profile = user?.profile || {}
  const rawGender = String(profile.gender || profile.sex || profile.biologicalSex || '').toLowerCase()
  const rawAge = profile.age || profile.idade
  const birthDate = profile.birthDate || profile.birth_date || profile.birthday || profile.dataNascimento
  let age = Number(rawAge) || 0

  if (!age && birthDate) {
    const parsedBirthDate = new Date(birthDate)
    if (!Number.isNaN(parsedBirthDate.getTime())) {
      const today = new Date()
      age = today.getFullYear() - parsedBirthDate.getFullYear()
      const monthDiff = today.getMonth() - parsedBirthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsedBirthDate.getDate())) age -= 1
    }
  }

  let gender = ''
  if (['male', 'masculino', 'homem', 'm'].includes(rawGender)) gender = 'male'
  if (['female', 'feminino', 'mulher', 'f'].includes(rawGender)) gender = 'female'

  return {
    gender,
    age: age > 0 ? age : 0,
  }
}

function getGenderLabel(gender = '') {
  if (gender === 'male') return 'masculina'
  if (gender === 'female') return 'feminina'
  return 'geral'
}

function formatPercent(value) {
  const number = Number(value) || 0
  return `${formatNumber(Math.round(number), { maximumFractionDigits: 0 })}%`
}

function StrengthPercentileBar({ comparison, compact = false }) {
  if (!comparison) return null

  return (
    <div className={compact ? 'ff-strength-percentile-card is-compact' : 'ff-strength-percentile-card'}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-muted)]">{comparison.label}</p>
          <strong className="mt-1 block text-lg font-black text-[var(--ff-text)]">Mais forte que ~{formatPercent(comparison.percentile)}</strong>
        </div>
        <Badge variant={comparison.percentile >= 50 ? 'green' : 'yellow'}>{comparison.status}</Badge>
      </div>

      <div className="ff-strength-bar mt-3" aria-label={`Percentil estimado ${comparison.percentile}%`}>
        <span className="ff-strength-bar__fill" style={{ width: `${Math.min(100, Math.max(0, comparison.percentile))}%` }} />
        <span className="ff-strength-bar__marker" style={{ left: `${Math.min(100, Math.max(0, comparison.percentile))}%` }} />
      </div>

      {!compact && (
        <div className="mt-3 grid grid-cols-4 gap-1.5 text-[10px] font-bold text-[var(--ff-muted)]">
          <span>Base</span>
          <span>25%</span>
          <span>50%</span>
          <span className="text-right">80%+</span>
        </div>
      )}
    </div>
  )
}

function StrengthScaleRows({ rows = [] }) {
  return (
    <div className="mt-3 space-y-2">
      {rows.map((row) => (
        <div key={row.key} className="ff-strength-scale-row">
          <div className="flex min-w-0 items-center justify-between gap-2 text-xs">
            <span className="min-w-0 truncate font-bold text-[var(--ff-muted)]">{row.label}</span>
            <strong className="shrink-0 text-[var(--ff-text)]">{formatWeight(row.weight)}</strong>
          </div>
          <div className="ff-strength-scale-row__track">
            <span style={{ width: `${Math.min(100, Math.max(0, row.percentile))}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function BodyweightRatioBar({ ratioBar }) {
  if (!ratioBar) return null

  return (
    <div className="ff-strength-bodyweight-bar">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-black text-[var(--ff-text)]">Comparação por peso corporal</p>
        <strong className="shrink-0 text-sm font-black text-[var(--ff-accent-text)]">{formatBodyweightRatio(ratioBar.value)}</strong>
      </div>
      <div className="ff-strength-ratio-track mt-4">
        <span className="ff-strength-ratio-track__fill" style={{ width: `${ratioBar.percent}%` }} />
        <span className="ff-strength-ratio-track__marker" style={{ left: `${ratioBar.percent}%` }} />
        {ratioBar.markers.map((marker) => (
          <span
            key={marker.level}
            className="ff-strength-ratio-track__tick"
            style={{ left: `${marker.percent}%` }}
            title={`${getBenchmarkLevelLabel(marker.level)} • ${formatWeight(marker.weight)}`}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {ratioBar.markers.map((marker) => (
          <div key={marker.level} className="rounded-2xl bg-[var(--ff-card)] px-3 py-2 text-xs">
            <span className="block truncate font-bold text-[var(--ff-muted)]">{getBenchmarkLevelLabel(marker.level)}</span>
            <strong className="mt-1 block text-[var(--ff-text)]">{formatBodyweightRatio(marker.multiplier)}</strong>
            <span className="mt-0.5 block text-[11px] text-[var(--ff-accent-text)]">{formatWeight(marker.weight)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AgeReferenceBars({ rows = [] }) {
  if (rows.length === 0) return null

  return (
    <div className="mt-3 space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="ff-strength-age-row">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <span className="min-w-0 truncate text-xs font-black text-[var(--ff-muted)]">{row.label}</span>
            <strong className="shrink-0 text-xs font-black text-[var(--ff-text)]">Meta média {formatWeight(row.target)}</strong>
          </div>
          <div className="ff-strength-age-row__track mt-2">
            <span style={{ width: `${Math.min(100, row.percentOfTarget)}%` }} />
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--ff-muted)]">Seu 1RM estimado bate {formatPercent(row.percentOfTarget)} dessa referência.</p>
        </div>
      ))}
    </div>
  )
}

function PeriodFilters({ selectedPeriod, onChange }) {
  return (
    <div className="ff-exercise-progress-toolbar -mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filtrar evolução do exercício">
      {PROGRESS_PERIODS.map((period) => {
        const isActive = selectedPeriod === period.key
        return (
          <button
            key={period.key}
            type="button"
            onClick={() => onChange(period.key)}
            className={[
              'min-h-10 shrink-0 rounded-full border px-4 text-sm font-black transition active:scale-[0.98]',
              isActive
                ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent)] text-white shadow-[0_0_18px_var(--ff-accent-shadow)]'
                : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] hover:border-[var(--ff-border-strong)] hover:text-[var(--ff-text)]',
            ].join(' ')}
            aria-selected={isActive}
            role="tab"
          >
            {period.label}
          </button>
        )
      })}
    </div>
  )
}

function SectionHeader({ icon: Icon, eyebrow, title, description, action }) {
  return (
    <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-accent-text)]">{eyebrow}</p>}
        <h2 className="mt-1 text-xl font-black text-[var(--ff-text)]">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--ff-muted)]">{description}</p>}
      </div>
      {action || (Icon && (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-accent-text)]">
          <Icon size={21} />
        </span>
      ))}
    </div>
  )
}

function ExerciseOptionButton({ exercise, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(exercise)}
      className={[
        'flex w-full min-w-0 items-center gap-3 rounded-2xl border p-2.5 text-left transition active:scale-[0.99]',
        selected
          ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] shadow-[0_0_18px_var(--ff-accent-shadow)]/20'
          : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] hover:border-[var(--ff-border-strong)] hover:bg-[var(--ff-card-hover)]',
      ].join(' ')}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--ff-border)] bg-white">
        {exercise.mediaUrl ? (
          <img src={exercise.mediaUrl} alt={exercise.name} className="h-full w-full object-contain" loading="lazy" decoding="async" />
        ) : (
          <Dumbbell size={20} className="text-[var(--ff-muted-2)]" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-[var(--ff-text)]">{exercise.name}</span>
        <span className="mt-1 block truncate text-xs text-[var(--ff-muted)]">{exercise.muscleGroup || 'Sem grupo'} • {exercise.timesTrained}x</span>
      </span>
      <ChevronDown size={16} className="shrink-0 -rotate-90 text-[var(--ff-muted)]" />
    </button>
  )
}

function ExerciseSelector({ options, selectedExercise, selectedName, search, onSearchChange, onSelect, onClear }) {
  const [open, setOpen] = useState(false)
  const filteredOptions = useMemo(() => filterExerciseOptions(options, search).slice(0, 8), [options, search])

  useEffect(() => {
    if (!selectedName) setOpen(true)
  }, [selectedName])

  return (
    <Card className="min-w-0 overflow-visible">
      <SectionHeader
        icon={Search}
        eyebrow="Escolha um exercício"
        title={selectedExercise ? selectedExercise.name : 'Buscar exercício'}
        description={selectedExercise ? `${selectedExercise.muscleGroup || 'Sem grupo'} • ${selectedExercise.equipment || 'Sem equipamento'}` : 'Veja cargas, séries, volume, PRs e tendência de evolução.'}
        action={selectedExercise && (
          <Button type="button" variant="ghost" onClick={onClear} className="shrink-0 px-3">
            <X size={17} />
            Limpar
          </Button>
        )}
      />

      <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-2">
        <div className="flex h-12 min-w-0 items-center gap-3 rounded-2xl bg-[var(--ff-card)] px-3 text-[var(--ff-muted)]">
          <Search size={18} className="shrink-0" />
          <input
            type="search"
            value={search}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              onSearchChange(event.target.value)
              setOpen(true)
            }}
            placeholder="Buscar exercício..."
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted)]"
          />
          <button type="button" onClick={() => setOpen((current) => !current)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl hover:bg-[var(--ff-surface-2)]">
            <ChevronDown size={18} className={open ? 'rotate-180 transition' : 'transition'} />
          </button>
        </div>

        {open && (
          <div className="mt-2 max-h-[330px] space-y-2 overflow-y-auto overscroll-contain pr-1">
            {filteredOptions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--ff-border)] bg-[var(--ff-card)] p-4 text-center">
                <p className="text-sm font-black text-[var(--ff-text)]">Nenhum exercício encontrado</p>
                <p className="mt-1 text-xs text-[var(--ff-muted)]">Finalize treinos com séries válidas para aparecer aqui.</p>
              </div>
            ) : (
              filteredOptions.map((exercise) => (
                <ExerciseOptionButton
                  key={exercise.normalizedName}
                  exercise={exercise}
                  selected={exercise.normalizedName === selectedName}
                  onSelect={(nextExercise) => {
                    onSelect(nextExercise)
                    setOpen(false)
                  }}
                />
              ))
            )}
            {options.length > 8 && !search && (
              <p className="px-2 pb-1 text-center text-xs text-[var(--ff-muted)]">Digite para filtrar sem abrir uma lista enorme.</p>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

function StatCard({ icon: Icon, label, value, description, accent = false }) {
  return (
    <Card className="min-w-0 overflow-hidden p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-muted)]">{label}</p>
          <h3 className={accent ? 'mt-2 truncate text-2xl font-black text-[var(--ff-accent-text)]' : 'mt-2 truncate text-2xl font-black text-[var(--ff-text)]'}>{value}</h3>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
          <Icon size={19} />
        </span>
      </div>
      {description && <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[var(--ff-muted)]">{description}</p>}
    </Card>
  )
}

function SelectedExerciseHero({ exercise, stats }) {
  const daysSinceLast = getDaysSinceLastEntry(stats.lastEntry)

  return (
    <Card className="min-w-0 overflow-hidden">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-[var(--ff-border)] bg-white sm:h-24 sm:w-24">
          {exercise.mediaUrl ? (
            <img src={exercise.mediaUrl} alt={exercise.name} className="h-full w-full object-contain" loading="lazy" decoding="async" />
          ) : (
            <Dumbbell size={30} className="text-[var(--ff-muted-2)]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-accent-text)]">Exercício selecionado</p>
          <h2 className="mt-1 truncate text-2xl font-black text-[var(--ff-text)]">{exercise.name}</h2>
          <p className="mt-1 truncate text-sm text-[var(--ff-muted)]">{exercise.muscleGroup || 'Sem grupo'} • {exercise.equipment || 'Sem equipamento'}</p>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
              <span className="block text-[11px] font-bold text-[var(--ff-muted)]">Treinado</span>
              <strong className="mt-1 block text-lg font-black text-[var(--ff-text)]">{stats.trainedTimes}x</strong>
            </div>
            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
              <span className="block text-[11px] font-bold text-[var(--ff-muted)]">Último treino</span>
              <strong className="mt-1 block truncate text-sm font-black text-[var(--ff-text)]">{stats.lastEntry ? formatDate(stats.lastEntry.date) : '—'}</strong>
            </div>
            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
              <span className="block text-[11px] font-bold text-[var(--ff-muted)]">Melhor carga</span>
              <strong className="mt-1 block text-lg font-black text-[var(--ff-accent-text)]">{formatWeight(stats.bestWeight)}</strong>
            </div>
            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
              <span className="block text-[11px] font-bold text-[var(--ff-muted)]">Melhor volume</span>
              <strong className="mt-1 block text-lg font-black text-[var(--ff-text)]">{formatVolume(stats.bestWorkoutVolume)}</strong>
            </div>
          </div>

          {daysSinceLast !== null && (
            <p className="mt-3 text-xs text-[var(--ff-muted)]">Último registro há {daysSinceLast} dia{daysSinceLast === 1 ? '' : 's'}.</p>
          )}
        </div>
      </div>
    </Card>
  )
}

function WeightChart({ data = [] }) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <SectionHeader
        icon={LineChart}
        eyebrow="Carga"
        title="Evolução de carga"
        description="Mostra a maior carga usada em cada treino deste exercício."
      />
      <div className="h-[300px] min-h-[300px] min-w-0" data-chart-container="true">
        {data.length < 2 ? (
          <EmptyState icon={LineChart} title="Poucos registros" description="Com pelo menos dois treinos, o gráfico de carga fica mais útil." />
        ) : (
          <SafeResponsiveContainer height={300}>
            {({ width, height }) => (
              <RechartsLineChart width={width} height={height} data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
                <XAxis dataKey="dateLabel" interval="preserveStartEnd" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} width={42} />
                <Tooltip
                  formatter={(value) => [formatWeight(value), 'Maior carga']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload ? `${payload[0].payload.longDate} • ${payload[0].payload.workoutName}` : 'Data'}
                  contentStyle={getTooltipStyle()}
                />
                <Line type="monotone" dataKey="maxWeight" stroke="var(--ff-accent)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'var(--ff-card)' }} />
              </RechartsLineChart>
            )}
          </SafeResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

function VolumeChart({ data = [] }) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <SectionHeader
        icon={BarChart3}
        eyebrow="Volume"
        title="Volume por treino"
        description="Soma de peso × repetições apenas deste exercício no treino."
      />
      <div className="h-[300px] min-h-[300px] min-w-0" data-chart-container="true">
        {data.length === 0 ? (
          <EmptyState icon={BarChart3} title="Sem volume" description="Nenhuma série válida encontrada para montar o gráfico." />
        ) : (
          <SafeResponsiveContainer height={300}>
            {({ width, height }) => (
              <ComposedChart width={width} height={height} data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
                <XAxis dataKey="dateLabel" interval="preserveStartEnd" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} width={42} />
                <Tooltip
                  formatter={(value, name) => [name === 'totalVolume' ? formatVolume(value) : value, name === 'totalVolume' ? 'Volume' : 'Reps']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload ? `${payload[0].payload.longDate} • ${payload[0].payload.workoutName}` : 'Data'}
                  contentStyle={getTooltipStyle()}
                />
                <Bar dataKey="totalVolume" radius={[10, 10, 0, 0]} fill="var(--ff-accent)" maxBarSize={38} />
                <Line type="monotone" dataKey="totalReps" stroke="var(--ff-warning-text)" strokeWidth={3} dot={{ r: 3 }} />
              </ComposedChart>
            )}
          </SafeResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

function BestSetTimeline({ entries = [] }) {
  const visibleEntries = entries.slice(-8)

  return (
    <Card className="min-w-0 overflow-hidden">
      <SectionHeader
        icon={Target}
        eyebrow="Séries"
        title="Melhor série por treino"
        description="Resumo compacto para enxergar a progressão sem abrir cada treino."
      />

      {visibleEntries.length === 0 ? (
        <EmptyState title="Sem séries" description="As melhores séries aparecem após finalizar treinos com este exercício." />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {visibleEntries.map((entry) => (
            <div key={entry.id} className="min-w-0 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
              <p className="truncate text-[11px] font-bold text-[var(--ff-muted)]">{formatDate(entry.date)}</p>
              <strong className="mt-1 block truncate text-sm font-black text-[var(--ff-text)]">{entry.bestSetLabel || formatBestSet(entry.bestSet)}</strong>
              <span className="mt-1 block truncate text-[11px] text-[var(--ff-muted)]">{formatVolume(entry.totalVolume)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function RecordsSection({ records }) {
  const prs = records?.prs || []

  return (
    <Card className="min-w-0 overflow-hidden">
      <SectionHeader
        icon={Trophy}
        eyebrow="Recordes"
        title="PRs do exercício"
        description="Melhores marcas encontradas nas séries e no volume total do exercício."
      />

      {prs.length === 0 ? (
        <EmptyState icon={Trophy} title="Nenhum recorde detectado ainda" description="Registre mais treinos para acompanhar sua evolução." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {prs.map((record) => (
            <article key={record.id} className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[var(--ff-text)]">{record.label}</p>
                  <p className="mt-1 text-xs text-[var(--ff-muted)]">{record.detail}</p>
                </div>
                <Badge variant={getPrTone(record)}>{record.value}</Badge>
              </div>
              <p className="mt-3 text-xs font-bold text-[var(--ff-muted)]">{formatLongDate(record.date)}</p>
            </article>
          ))}
        </div>
      )}
    </Card>
  )
}

function ComparisonSection({ comparison }) {
  if (!comparison) {
    return (
      <Card className="min-w-0 overflow-hidden">
        <SectionHeader icon={Activity} eyebrow="Comparação" title="Comparado ao último treino" description="A comparação aparece quando houver pelo menos dois registros deste exercício." />
        <EmptyState icon={Info} title="Ainda não há comparação" description="Finalize este exercício novamente para comparar carga, volume e repetições." />
      </Card>
    )
  }

  const volumeLower = comparison.volume < 0

  return (
    <Card className="min-w-0 overflow-hidden">
      <SectionHeader icon={Activity} eyebrow="Comparação" title="Comparado ao último treino" description="Diferença entre os dois registros mais recentes do exercício." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
          <p className="text-xs font-bold text-[var(--ff-muted)]">Carga máxima</p>
          <strong className="mt-2 block text-2xl font-black text-[var(--ff-text)]">{formatSignedWeight(comparison.maxWeight)}</strong>
        </div>
        <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
          <p className="text-xs font-bold text-[var(--ff-muted)]">Volume</p>
          <strong className="mt-2 block text-2xl font-black text-[var(--ff-accent-text)]">{formatSignedVolume(comparison.volume)}</strong>
        </div>
        <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
          <p className="text-xs font-bold text-[var(--ff-muted)]">Repetições</p>
          <strong className="mt-2 block text-2xl font-black text-[var(--ff-text)]">{formatSignedReps(comparison.reps)}</strong>
        </div>
      </div>

      {volumeLower && (
        <p className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm leading-relaxed text-[var(--ff-warning-text)]">
          Volume menor que o último registro. Isso pode acontecer por variação de treino, descanso ou foco do dia.
        </p>
      )}
    </Card>
  )
}


function StrengthBenchmarkSection({ summary }) {
  if (!summary) return null

  const {
    benchmark,
    estimatedOneRepMax,
    ratio,
    bodyweightTargets,
    ageComparisonRows,
    hasBodyWeight,
    bodyweightRatioBar,
    maleComparison,
    femaleComparison,
    primaryComparison,
    profileContext,
  } = summary
  const male = benchmark.standards.male
  const female = benchmark.standards.female
  const comparisonRows = primaryComparison ? [primaryComparison] : [maleComparison, femaleComparison]
  const headline = primaryComparison
    ? `Mais forte que ~${formatPercent(primaryComparison.percentile)}`
    : `M ~${formatPercent(maleComparison.percentile)} • F ~${formatPercent(femaleComparison.percentile)}`
  const contextLabel = primaryComparison
    ? `referência ${getGenderLabel(profileContext?.gender)}`
    : 'referências masculina e feminina'

  return (
    <Card className="min-w-0 overflow-hidden">
      <SectionHeader
        icon={Medal}
        eyebrow="Referência externa"
        title="Comparativo de força"
        description="Mostra sua posição estimada em uma barrinha horizontal. É educativo e usa 1RM estimado, não substitui contexto de técnica, equipamento e treino."
        action={<Badge variant="purple">{benchmark.label}</Badge>}
      />

      <div className="ff-strength-score-card rounded-3xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] p-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-accent-text)]">Sua posição estimada</p>
            <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[var(--ff-text)]">
              {headline}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--ff-muted)]">
              Percentual aproximado considerando {contextLabel}. Quanto mais completo o perfil, melhor fica a leitura.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] px-3 py-2 text-right">
            <span className="block text-[10px] font-black uppercase text-[var(--ff-muted)]">1RM</span>
            <strong className="block text-lg font-black text-[var(--ff-accent-text)]">{estimatedOneRepMax > 0 ? formatWeight(estimatedOneRepMax) : '—'}</strong>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {comparisonRows.map((comparison) => (
          <StrengthPercentileBar key={comparison.label} comparison={comparison} compact={Boolean(primaryComparison)} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
          <p className="text-xs font-bold text-[var(--ff-muted)]">Seu 1RM estimado</p>
          <strong className="mt-2 block text-2xl font-black text-[var(--ff-accent-text)]">{estimatedOneRepMax > 0 ? formatWeight(estimatedOneRepMax) : '—'}</strong>
          <span className="mt-1 block text-[11px] text-[var(--ff-muted)]">calculado pela melhor série</span>
        </div>

        <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
          <p className="text-xs font-bold text-[var(--ff-muted)]">Peso corporal</p>
          <strong className="mt-2 block text-2xl font-black text-[var(--ff-text)]">{formatBodyweightRatio(ratio)}</strong>
          <span className="mt-1 block text-[11px] text-[var(--ff-muted)]">
            {hasBodyWeight ? 'carga estimada ÷ seu peso' : 'registre peso no perfil para comparar'}
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
          <p className="text-xs font-bold text-[var(--ff-muted)]">Média intermediária</p>
          <strong className="mt-2 block text-lg font-black text-[var(--ff-text)]">M {formatWeight(male.intermediate)} • F {formatWeight(female.intermediate)}</strong>
          <span className="mt-1 block text-[11px] text-[var(--ff-muted)]">1RM geral da comunidade</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
          <p className="text-sm font-black text-[var(--ff-text)]">Escala de força</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--ff-muted)]">Pontos de referência usados para estimar a barrinha de percentil.</p>
          <StrengthScaleRows rows={(primaryComparison || maleComparison).levelRows} />
        </div>

        <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
          <p className="text-sm font-black text-[var(--ff-text)]">Por faixa de peso</p>
          {bodyweightTargets.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-[var(--ff-card)] p-3 text-xs leading-relaxed text-[var(--ff-muted)]">
              Registre seu peso no Perfil para ver a barrinha por peso corporal, com metas aproximadas como 1x, 1.5x ou 2x seu peso.
            </p>
          ) : (
            <BodyweightRatioBar ratioBar={bodyweightRatioBar} />
          )}
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-[var(--ff-text)]">Por idade</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--ff-muted)]">
              Referência intermediária por faixa etária. {profileContext?.age ? `Perfil detectado: ${profileContext.age} anos.` : 'Adicione idade no perfil para personalizar mais.'}
            </p>
          </div>
          <Badge variant="default">estimado</Badge>
        </div>
        <AgeReferenceBars rows={ageComparisonRows} />
      </div>

      <div className="mt-4 flex gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-3">
        <Info size={17} className="mt-0.5 shrink-0 text-[var(--ff-accent-text)]" />
        <p className="min-w-0 text-xs leading-relaxed text-[var(--ff-muted)]">
          {benchmark.sourceNote} A porcentagem é uma estimativa interpolada entre padrões públicos de força e pode variar muito por sexo, idade, peso corporal, técnica, amplitude e equipamento.
        </p>
      </div>
    </Card>
  )
}

function InsightsSection({ insights = [], trend }) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <SectionHeader
        icon={Sparkles}
        eyebrow="Insights"
        title="Insights do exercício"
        description="Leituras simples baseadas no histórico registrado."
        action={trend && <Badge variant={trend.direction === 'up' ? 'green' : trend.direction === 'down' ? 'yellow' : 'default'}>{trend.label}</Badge>}
      />

      {insights.length === 0 ? (
        <EmptyState icon={Sparkles} title="Ainda não há registros suficientes" description="Registre mais treinos com este exercício para gerar insights." />
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => (
            <div key={insight} className="flex gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
                <Sparkles size={16} />
              </span>
              <p className="min-w-0 text-sm leading-relaxed text-[var(--ff-text)]">{insight}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function ExerciseHistorySection({ entries = [] }) {
  const [visibleCount, setVisibleCount] = useState(4)
  const visibleEntries = entries.slice().reverse().slice(0, visibleCount)
  const hasMore = visibleCount < entries.length

  useEffect(() => {
    setVisibleCount(4)
  }, [entries])

  return (
    <Card className="min-w-0 overflow-hidden">
      <SectionHeader
        icon={CalendarDays}
        eyebrow="Histórico"
        title="Últimos treinos"
        description="Cada card mostra as séries válidas deste exercício no treino."
        action={(
          <Link to="/history" className="shrink-0">
            <Button variant="secondary" className="px-3">
              Histórico
              <ArrowUpRight size={16} />
            </Button>
          </Link>
        )}
      />

      {entries.length === 0 ? (
        <EmptyState title="Este exercício ainda não tem registros" description="Quando você finalizar treinos com ele, a evolução aparecerá aqui." />
      ) : (
        <div className="space-y-3">
          {visibleEntries.map((entry) => (
            <article key={entry.id} className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-[var(--ff-text)]">{formatLongDate(entry.date)}</p>
                  <p className="mt-1 truncate text-xs text-[var(--ff-muted)]">{entry.workoutName} • {entry.totalSets} séries • {formatVolume(entry.totalVolume)}</p>
                </div>
                <Badge variant="purple">{formatBestSet(entry.bestSet)}</Badge>
              </div>

              <div className="mt-4 space-y-2">
                {entry.sets.map((set) => (
                  <div key={set.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[var(--ff-text)]">Série {set.setNumber}</p>
                      <p className="mt-1 text-xs text-[var(--ff-muted)]">{formatWeight(set.weight)} x {set.reps} reps</p>
                    </div>
                    <span className="self-center text-sm font-black text-[var(--ff-accent-text)]">{formatVolume(set.volume)}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}

          {hasMore && (
            <Button type="button" variant="secondary" className="w-full" onClick={() => setVisibleCount((count) => count + 4)}>
              Ver mais registros
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

function RankingCard({ title, description, options, selectedName, onSelect, mode }) {
  const sortedOptions = options
    .slice()
    .sort((a, b) => {
      if (mode === 'weight') return b.maxWeight - a.maxWeight
      if (mode === 'volume') return b.maxVolume - a.maxVolume
      return b.timesTrained - a.timesTrained
    })
    .slice(0, 5)

  return (
    <Card className="min-w-0 overflow-hidden">
      <SectionHeader icon={mode === 'weight' ? Trophy : Flame} eyebrow="Atalho" title={title} description={description} />
      {sortedOptions.length === 0 ? (
        <EmptyState title="Sem ranking" description="Finalize treinos para montar este ranking." />
      ) : (
        <div className="space-y-2">
          {sortedOptions.map((exercise, index) => (
            <ExerciseOptionButton
              key={exercise.normalizedName}
              exercise={{
                ...exercise,
                name: `#${index + 1} ${exercise.name}`,
                timesTrained: mode === 'weight' ? formatWeight(exercise.maxWeight) : mode === 'volume' ? formatVolume(exercise.maxVolume) : `${exercise.timesTrained}x`,
              }}
              selected={exercise.normalizedName === selectedName}
              onSelect={() => onSelect(exercise)}
            />
          ))}
        </div>
      )}
    </Card>
  )
}

function ExerciseProgress() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [history, setHistory] = useState([])
  const [source, setSource] = useState('empty')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedExerciseName, setSelectedExerciseName] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState(DEFAULT_PERIOD)
  const [bodyWeightKg, setBodyWeightKg] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!user) return undefined

    let isMounted = true

    async function loadHistory() {
      const cachedHistory = getUserStorageData(
        user,
        'history',
        getUserStorageData(user, 'workoutHistory', [])
      )
      const cachedBodyWeightKg = getCurrentBodyWeightFromStorage(user)

      if (isMounted) {
        setHistory(Array.isArray(cachedHistory) ? cachedHistory : [])
        setBodyWeightKg(cachedBodyWeightKg)
        setSource(cachedHistory?.length ? 'local' : 'empty')
        setLoading(false)
        setSyncing(true)
      }

      try {
        const data = await apiFetch('/workout-history')
        if (!isMounted) return

        const normalizedHistory = normalizeHistoryResponse(data)
        setHistory(normalizedHistory)
        saveUserStorageData(user, 'history', normalizedHistory)
        setSource(normalizedHistory.length > 0 ? 'database' : 'empty')
      } catch (error) {
        console.error(error)
        if (isMounted) setSource(cachedHistory?.length ? 'local' : 'empty')
      } finally {
        if (isMounted) {
          setLoading(false)
          setSyncing(false)
        }
      }
    }

    loadHistory()

    return () => {
      isMounted = false
    }
  }, [user, refreshKey])

  const normalizedHistory = useMemo(() => normalizeHistory(history), [history])
  const exerciseOptions = useMemo(() => buildExerciseOptions(normalizedHistory, defaultExercises), [normalizedHistory])

  useEffect(() => {
    const queryExercise = searchParams.get('exercise') || ''
    const resolved = resolveExerciseFromQuery(exerciseOptions, queryExercise)
    if (resolved && !selectedExerciseName) setSelectedExerciseName(resolved)
  }, [exerciseOptions, searchParams, selectedExerciseName])

  const selectedExercise = useMemo(() => {
    return exerciseOptions.find((exercise) => exercise.normalizedName === selectedExerciseName) || null
  }, [exerciseOptions, selectedExerciseName])

  const exerciseProgress = useMemo(() => {
    if (!selectedExerciseName) {
      return {
        entries: [],
        stats: {},
        chartData: [],
        insights: [],
        hasData: false,
      }
    }

    return calculateExerciseProgress(normalizedHistory, selectedExerciseName, selectedPeriod)
  }, [normalizedHistory, selectedExerciseName, selectedPeriod])

  const stats = exerciseProgress.stats || {}
  const profileStrengthContext = useMemo(() => getProfileStrengthContext(user), [user])

  const benchmarkSummary = useMemo(() => {
    if (!selectedExercise || !stats.bestSet) return null
    return buildBenchmarkSummary(selectedExercise.name, stats.bestSet, bodyWeightKg, profileStrengthContext)
  }, [bodyWeightKg, profileStrengthContext, selectedExercise, stats.bestSet])
  const statusLabel = getStatusLabel(loading, syncing, source)

  function handleSelectExercise(exercise) {
    setSelectedExerciseName(exercise.normalizedName)
    setSearch('')
    setSearchParams({ exercise: exercise.name })
  }

  function handleClearSelection() {
    setSelectedExerciseName('')
    setSearch('')
    setSearchParams({})
  }

  return (
    <div className="ff-hevy-page ff-hevy-page-exerciseprogress ff-exercise-progress-page-v2 max-w-full overflow-x-hidden">
      <AppPageIntro
        eyebrow="Exercício"
        title="Evolução por exercício"
        description="Escolha um exercício e veja carga, volume, séries, PRs e tendência de evolução."
        action={(
          <Button
            type="button"
            variant="secondary"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading || syncing}
            className="w-full sm:w-auto"
          >
            <RefreshCcw size={16} />
            Atualizar
          </Button>
        )}
        metrics={[
          { label: 'Exercícios', value: exerciseOptions.length },
          { label: 'Treinos', value: normalizedHistory.length },
          { label: 'Status', value: statusLabel },
        ]}
      />

      <div className="ff-exercise-progress-body ff-page-mobile-main-grid space-y-5 pb-8">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.15fr)]">
          <div className="space-y-5">
            <ExerciseSelector
              options={exerciseOptions}
              selectedExercise={selectedExercise}
              selectedName={selectedExerciseName}
              search={search}
              onSearchChange={setSearch}
              onSelect={handleSelectExercise}
              onClear={handleClearSelection}
            />

            <Card className="min-w-0 overflow-hidden">
              <SectionHeader
                icon={CalendarDays}
                eyebrow="Período"
                title="Filtro de análise"
                description="Recalcula estatísticas e gráficos sem alterar seus dados antigos."
                action={<Badge variant={source === 'database' ? 'purple' : source === 'local' ? 'default' : 'yellow'}>{statusLabel}</Badge>}
              />
              <PeriodFilters selectedPeriod={selectedPeriod} onChange={setSelectedPeriod} />
            </Card>
          </div>

          <div className="space-y-5">
            {!selectedExerciseName ? (
              <Card>
                <EmptyState
                  icon={Search}
                  title="Escolha um exercício para analisar"
                  description="Veja cargas, séries, volume, PRs e tendência de evolução em uma tela detalhada."
                />
              </Card>
            ) : !exerciseProgress.hasData || !selectedExercise ? (
              <Card>
                <EmptyState
                  icon={Dumbbell}
                  title="Este exercício ainda não tem registros"
                  description="Quando você finalizar treinos com ele, a evolução aparecerá aqui."
                />
              </Card>
            ) : (
              <SelectedExerciseHero exercise={selectedExercise} stats={stats} />
            )}
          </div>
        </div>

        {!selectedExerciseName ? (
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <RankingCard
              title="Mais treinados"
              description="Exercícios com mais registros no seu histórico."
              options={exerciseOptions}
              selectedName={selectedExerciseName}
              onSelect={handleSelectExercise}
              mode="frequency"
            />
            <RankingCard
              title="Ranking de carga"
              description="Atalho para os exercícios com maiores cargas registradas."
              options={exerciseOptions}
              selectedName={selectedExerciseName}
              onSelect={handleSelectExercise}
              mode="weight"
            />
          </section>
        ) : !exerciseProgress.hasData ? null : (
          <div className="space-y-5 sm:space-y-6">
            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard icon={Weight} label="Melhor carga" value={formatWeight(stats.bestWeight)} description="maior peso registrado" accent />
              <StatCard icon={Medal} label="Melhor série" value={formatBestSet(stats.bestSet)} description="melhor peso com reps" />
              <StatCard icon={Flame} label="Melhor volume" value={formatVolume(stats.bestWorkoutVolume)} description="maior volume em um treino" />
              <StatCard icon={Dumbbell} label="Vezes treinado" value={stats.trainedTimes} description="treinos com este exercício" />
            </section>

            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard icon={Activity} label="Última carga" value={formatWeight(stats.lastWeight)} description="maior carga do último registro" />
              <StatCard icon={Target} label="Média de carga" value={formatWeight(stats.averageWeight)} description="média das séries válidas" />
              <StatCard icon={BarChart3} label="Total de séries" value={stats.totalSets} description="séries válidas registradas" />
              <StatCard icon={Sparkles} label="Total de reps" value={stats.totalReps} description="repetições somadas" />
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <WeightChart data={exerciseProgress.chartData} />
              <VolumeChart data={exerciseProgress.chartData} />
            </section>

            <BestSetTimeline entries={exerciseProgress.entries} />

            <StrengthBenchmarkSection summary={benchmarkSummary} />

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
              <RecordsSection records={stats.records} />
              <ComparisonSection comparison={stats.comparison} />
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
              <ExerciseHistorySection entries={exerciseProgress.entries} />
              <InsightsSection insights={exerciseProgress.insights} trend={stats.trend} />
            </section>

            <Card className="min-w-0 overflow-hidden">
              <div className="flex gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                <Info size={20} className="mt-0.5 shrink-0 text-[var(--ff-accent-text)]" />
                <p className="min-w-0 text-sm leading-relaxed text-[var(--ff-muted)]">
                  Séries com peso ou repetições vazias são ignoradas. Isso evita falsos PRs, datas inválidas e valores como NaN na interface.
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExerciseProgress
