import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Dumbbell,
  Flame,
  Info,
  Medal,
  RefreshCcw,
  Sparkles,
  Target,
  Trophy,
  Weight,
  Zap,
} from 'lucide-react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
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
import { getUserStorageData, saveUserStorageData } from '../utils/userStorage'
import {
  PROGRESS_PERIODS,
  buildProgressInsights,
  buildVolumeTrend,
  calculateProgressSummary,
  comparePeriods,
  filterHistoryByPeriod,
  formatDate,
  formatDateKey,
  formatDuration,
  formatNumber,
  formatVolume,
  formatWeight,
  getPeriodRange,
  getPreviousPeriodHistory,
  getTooltipStyle,
  normalizeHistory,
  startOfLocalDay,
} from '../features/progress/progressUtils'

const DEFAULT_PERIOD = '30d'

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

function getCurrentMonthHistory(history = []) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  return normalizeHistory(history).filter((session) => {
    return session.date >= start && session.date <= end
  })
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  const number = Number(value)
  const prefix = number > 0 ? '+' : ''
  return `${prefix}${formatNumber(number, { maximumFractionDigits: 0 })}%`
}

function formatSignedNumber(value, suffix = '') {
  const number = Number(value) || 0
  const prefix = number > 0 ? '+' : ''
  return `${prefix}${formatNumber(number, { maximumFractionDigits: 0 })}${suffix}`
}

function getPrValue(pr = {}) {
  if (pr.type === 'reps') return `${formatNumber(pr.value, { maximumFractionDigits: 0 })} reps`
  if (String(pr.type || '').includes('volume')) return formatVolume(pr.value)
  return formatWeight(pr.value)
}

function getPrDelta(pr = {}) {
  const delta = Number(pr.value || 0) - Number(pr.previousValue || 0)
  if (!Number.isFinite(delta) || delta <= 0) return 'Novo recorde registrado'
  if (pr.type === 'reps') return `+${formatNumber(delta, { maximumFractionDigits: 0 })} reps em relação ao anterior`
  if (String(pr.type || '').includes('volume')) return `+${formatVolume(delta)} em relação ao anterior`
  return `+${formatWeight(delta)} em relação ao anterior`
}

function PeriodFilters({ selectedPeriod, onChange }) {
  return (
    <div className="ff-progress-periods -mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filtrar evolução por período">
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

function SummaryCard({ icon: Icon, label, value, description, tone = 'default' }) {
  return (
    <Card className={`ff-progress-v2-card is-${tone} min-w-0 overflow-hidden p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-muted)]">{label}</p>
          <h2 className="mt-2 truncate text-2xl font-black text-[var(--ff-text)] sm:text-3xl">{value}</h2>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
          <Icon size={19} />
        </span>
      </div>
      {description && <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[var(--ff-muted)]">{description}</p>}
    </Card>
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

function VolumeTrendChart({ data = [] }) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <SectionHeader
        icon={BarChart3}
        eyebrow="Gráfico principal"
        title="Evolução de volume"
        description="Volume representa peso × repetições somado nas séries válidas do período."
      />

      <div className="h-[300px] min-h-[300px] min-w-0" data-chart-container="true">
        {data.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Sem volume no período"
            description="Finalize treinos com peso e repetições para o gráfico aparecer aqui."
          />
        ) : (
          <SafeResponsiveContainer height={300}>
            {({ width, height }) => (
              <ComposedChart data={data} width={width} height={height} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
                <XAxis
                  dataKey="label"
                  interval="preserveStartEnd"
                  tick={{ fontSize: 11, fill: 'var(--ff-muted)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--ff-muted)' }}
                  tickLine={false}
                  axisLine={false}
                  width={42}
                />
                <Tooltip
                  formatter={(value, name) => [name === 'volume' ? formatVolume(value) : value, name === 'volume' ? 'Volume' : 'Treinos']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.longLabel || 'Período'}
                  contentStyle={getTooltipStyle()}
                />
                <Bar dataKey="volume" radius={[10, 10, 0, 0]} fill="var(--ff-accent)" maxBarSize={38} />
                <Line type="monotone" dataKey="workouts" stroke="var(--ff-warning-text)" strokeWidth={3} dot={{ r: 3 }} />
              </ComposedChart>
            )}
          </SafeResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

function ConsistencySection({ summary, period }) {
  const range = getPeriodRange(period)
  const activeKeys = new Set(summary.frequency.activeDayKeys)
  const daysToShow = Math.min(range.days || 35, 35)
  const end = startOfLocalDay(new Date())
  const cells = Array.from({ length: daysToShow }, (_, index) => {
    const date = new Date(end)
    date.setDate(end.getDate() - (daysToShow - index - 1))
    const key = formatDateKey(date)
    return {
      key,
      day: date.getDate(),
      label: formatDate(date),
      active: activeKeys.has(key),
    }
  })

  return (
    <Card className="min-w-0 overflow-hidden">
      <SectionHeader
        icon={CalendarDays}
        eyebrow="Consistência"
        title="Ritmo de treinos"
        description="A média semanal considera o período selecionado e apenas treinos registrados no histórico."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
          <p className="text-xs font-bold text-[var(--ff-muted)]">Dias ativos</p>
          <strong className="mt-1 block text-2xl font-black text-[var(--ff-text)]">{summary.activeDays}</strong>
          <span className="text-xs text-[var(--ff-muted)]">dias com treino no período</span>
        </div>
        <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
          <p className="text-xs font-bold text-[var(--ff-muted)]">Melhor sequência</p>
          <strong className="mt-1 block text-2xl font-black text-[var(--ff-accent-text)]">{summary.bestStreak} dias</strong>
          <span className="text-xs text-[var(--ff-muted)]">maior sequência detectada</span>
        </div>
        <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
          <p className="text-xs font-bold text-[var(--ff-muted)]">Média semanal</p>
          <strong className="mt-1 block text-2xl font-black text-[var(--ff-text)]">{formatNumber(summary.averageWeekly, { maximumFractionDigits: 1 })}x</strong>
          <span className="text-xs text-[var(--ff-muted)]">treinos por semana</span>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
        <div className="mb-3 flex items-center justify-between gap-3 text-[11px] font-bold text-[var(--ff-muted)]">
          <span>Menos recente</span>
          <span>Hoje</span>
        </div>

        <div className="ff-progress-consistency-map" aria-label="Mapa compacto de dias com treino">
          {cells.map((cell) => (
            <span
              key={cell.key}
              title={`${cell.label}${cell.active ? ' • treino registrado' : ' • sem treino'}`}
              className={cell.active ? 'ff-progress-consistency-dot is-active' : 'ff-progress-consistency-dot'}
              aria-label={`${cell.label}: ${cell.active ? 'treino registrado' : 'sem treino'}`}
            />
          ))}
        </div>

      </div>
    </Card>
  )
}

function RecentPrsSection({ prs = [] }) {
  const visiblePrs = prs.slice(0, 5)

  return (
    <Card className="min-w-0 overflow-hidden">
      <SectionHeader
        icon={Trophy}
        eyebrow="Recordes"
        title="PRs recentes"
        description="PR é o melhor resultado registrado ou detectado para um exercício."
      />

      {visiblePrs.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Nenhum PR neste período"
          description="Continue registrando seus treinos para acompanhar novos recordes de carga, reps e volume."
        />
      ) : (
        <div className="space-y-3">
          {visiblePrs.map((pr) => (
            <article key={pr.id} className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[var(--ff-text)]">{pr.exerciseName}</p>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--ff-muted)]">{getPrDelta(pr)}</p>
                <p className="mt-1 text-[11px] font-bold text-[var(--ff-muted)]">{formatDate(pr.date)} • {pr.label}</p>
              </div>
              <Badge variant="yellow" className="shrink-0">{getPrValue(pr)}</Badge>
            </article>
          ))}
        </div>
      )}
    </Card>
  )
}

function MuscleGroupsSection({ groups = [] }) {
  const visibleGroups = groups.slice(0, 6)
  const maxSets = Math.max(1, ...visibleGroups.map((group) => group.sets || 0))

  return (
    <Card className="min-w-0 overflow-hidden">
      <SectionHeader
        icon={Activity}
        eyebrow="Distribuição"
        title="Grupos mais treinados"
        description="Contagem baseada nas séries válidas do período selecionado."
      />

      {visibleGroups.length === 0 ? (
        <EmptyState title="Sem grupos musculares" description="Os grupos aparecem quando há exercícios com séries válidas no histórico." />
      ) : (
        <div className="space-y-3">
          {visibleGroups.map((group) => (
            <div key={group.key} className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-black text-[var(--ff-text)]">{group.muscleGroup}</p>
                <span className="shrink-0 text-xs font-black text-[var(--ff-accent-text)]">{group.sets} séries</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--ff-card)]">
                <div className="h-full rounded-full bg-[var(--ff-accent)]" style={{ width: `${Math.max(8, (group.sets / maxSets) * 100)}%` }} />
              </div>
              <p className="mt-2 text-xs text-[var(--ff-muted)]">{group.workouts} treino(s) • {formatVolume(group.volume)}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function HighlightDescription({ exercise }) {
  if (exercise.improvement > 0) {
    return <>{formatWeight(exercise.improvement)} desde o primeiro registro</>
  }

  if (exercise.sessions >= 2) {
    return <>Treinado {exercise.sessions} vezes no período</>
  }

  return <>Maior volume: {formatVolume(exercise.maxVolume)}</>
}

function ExerciseHighlightsSection({ exercises = [] }) {
  const visibleExercises = exercises.slice(0, 5)

  return (
    <Card className="min-w-0 overflow-hidden">
      <SectionHeader
        icon={Medal}
        eyebrow="Destaques"
        title="Exercícios em destaque"
        description="Toque em um exercício para abrir a análise detalhada por exercício."
      />

      {visibleExercises.length === 0 ? (
        <EmptyState title="Sem exercícios em destaque" description="Finalize treinos com séries válidas para identificar evolução, frequência e volume." />
      ) : (
        <div className="space-y-3">
          {visibleExercises.map((exercise) => (
            <Link
              key={exercise.key}
              to={`/exercise-progress?exercise=${encodeURIComponent(exercise.name)}`}
              className="group flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-card-hover)]"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-[var(--ff-text)]">{exercise.name}</span>
                <span className="mt-1 block line-clamp-2 text-xs text-[var(--ff-muted)]"><HighlightDescription exercise={exercise} /></span>
                <span className="mt-1 block truncate text-[11px] font-bold text-[var(--ff-muted)]">{exercise.muscleGroup || 'Sem grupo'} • {exercise.sessions} treino(s)</span>
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] text-[var(--ff-accent-text)] transition group-hover:translate-x-0.5">
                <ArrowUpRight size={17} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  )
}

function ComparisonItem({ label, metric, formatter }) {
  const isPositive = Number(metric?.delta || 0) > 0
  const isNegative = Number(metric?.delta || 0) < 0
  const formattedDelta = formatter ? formatter(metric?.delta || 0) : formatSignedNumber(metric?.delta || 0)

  return (
    <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
      <p className="text-xs font-bold text-[var(--ff-muted)]">{label}</p>
      <strong className={['mt-2 block text-2xl font-black', isPositive ? 'text-[var(--ff-success-text)]' : isNegative ? 'text-[var(--ff-warning-text)]' : 'text-[var(--ff-text)]'].join(' ')}>
        {metric?.percent !== null && metric?.percent !== undefined ? formatPercent(metric.percent) : formattedDelta}
      </strong>
      <span className="mt-1 block text-xs text-[var(--ff-muted)]">{formattedDelta} vs período anterior</span>
    </div>
  )
}

function ComparisonSection({ comparison }) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <SectionHeader
        icon={TrendingIcon}
        eyebrow="Comparativo"
        title="Comparado ao período anterior"
        description="Compara o período selecionado com outro período do mesmo tamanho imediatamente anterior."
      />

      {!comparison?.hasPreviousData ? (
        <EmptyState
          icon={Info}
          title="Ainda não há dados suficientes"
          description="Quando houver treinos no período anterior, o ForgeFlow mostra a diferença de volume, treinos e PRs."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ComparisonItem label="Volume" metric={comparison.volume} formatter={(value) => formatVolume(value)} />
          <ComparisonItem label="Treinos" metric={comparison.workouts} formatter={(value) => formatSignedNumber(value)} />
          <ComparisonItem label="PRs" metric={comparison.prs} formatter={(value) => formatSignedNumber(value)} />
        </div>
      )}
    </Card>
  )
}

function TrendingIcon(props) {
  return <Zap {...props} />
}

function InsightsSection({ insights = [] }) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <SectionHeader
        icon={Sparkles}
        eyebrow="Insights"
        title="Leituras automáticas"
        description="Mensagens simples geradas apenas com os dados registrados no app."
      />

      {insights.length === 0 ? (
        <EmptyState title="Sem insights por enquanto" description="Registre mais treinos para identificar tendências com segurança." />
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

function Progress() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState(DEFAULT_PERIOD)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [source, setSource] = useState('empty')
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

      if (isMounted) {
        setHistory(Array.isArray(cachedHistory) ? cachedHistory : [])
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
  const periodHistory = useMemo(() => filterHistoryByPeriod(normalizedHistory, selectedPeriod), [normalizedHistory, selectedPeriod])
  const previousPeriodHistory = useMemo(() => getPreviousPeriodHistory(normalizedHistory, selectedPeriod), [normalizedHistory, selectedPeriod])

  const summary = useMemo(() => {
    const result = calculateProgressSummary(periodHistory, selectedPeriod, previousPeriodHistory)
    return {
      ...result,
      frequency: result.activeDayKeys
        ? result
        : {
            activeDayKeys: [],
          },
    }
  }, [periodHistory, selectedPeriod, previousPeriodHistory])

  const frequency = useMemo(() => {
    const activeDayKeys = Array.from(new Set(periodHistory.map((session) => session.dateKey).filter(Boolean))).sort()
    return { activeDayKeys }
  }, [periodHistory])

  const periodSummary = useMemo(() => ({ ...summary, frequency }), [summary, frequency])
  const volumeTrend = useMemo(() => buildVolumeTrend(periodHistory, selectedPeriod), [periodHistory, selectedPeriod])
  const insights = useMemo(() => buildProgressInsights({ summary: periodSummary }), [periodSummary])
  const currentMonthSummary = useMemo(() => {
    const currentMonth = getCurrentMonthHistory(normalizedHistory)
    return calculateProgressSummary(currentMonth, 'all', [])
  }, [normalizedHistory])

  const hasAnyData = normalizedHistory.length > 0
  const statusLabel = getStatusLabel(loading, syncing, source)

  return (
    <div className="ff-hevy-page ff-hevy-page-progress ff-progress-page-v2 max-w-full overflow-x-hidden">
      <AppPageIntro
        eyebrow="Evolução"
        title="Evolução"
        description="Acompanhe seu progresso real nos treinos"
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
          { label: 'Este mês', value: `${currentMonthSummary.totalWorkouts} treinos` },
          { label: 'Volume', value: formatVolume(currentMonthSummary.totalVolume) },
          { label: 'PRs', value: currentMonthSummary.prs },
        ]}
      />

      <div className="ff-progress-body ff-page-mobile-main-grid space-y-5 pb-8">
        <div className="flex flex-col gap-3 rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-accent-text)]">Período</p>
            <p className="mt-1 text-sm text-[var(--ff-muted)]">Filtre os cards, gráficos, PRs e insights sem quebrar o layout mobile.</p>
          </div>
          <Badge variant={source === 'database' ? 'purple' : source === 'local' ? 'default' : 'yellow'}>{statusLabel}</Badge>
          <div className="sm:basis-full" />
          <PeriodFilters selectedPeriod={selectedPeriod} onChange={setSelectedPeriod} />
        </div>

        {!hasAnyData ? (
          <Card>
            <EmptyState
              icon={Dumbbell}
              title={loading || syncing ? 'Carregando evolução' : 'Ainda não há evolução para mostrar'}
              description={loading || syncing ? 'Buscando histórico salvo no app e no servidor.' : 'Finalize alguns treinos para o ForgeFlow calcular volume, frequência, PRs e consistência.'}
              action={(
                <Link to="/workouts">
                  <Button>Ver treinos</Button>
                </Link>
              )}
            />
          </Card>
        ) : (
          <div className="space-y-5 sm:space-y-6">
            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <SummaryCard
                icon={Dumbbell}
                label="Treinos"
                value={summary.totalWorkouts}
                description="sessões finalizadas no período"
              />
              <SummaryCard
                icon={Weight}
                label="Volume"
                value={formatVolume(summary.totalVolume)}
                description="peso × repetições somado"
                tone="accent"
              />
              <SummaryCard
                icon={Trophy}
                label="PRs"
                value={summary.prs}
                description="recordes detectados ou salvos"
              />
              <SummaryCard
                icon={Zap}
                label="Sequência"
                value={`${summary.bestStreak} dias`}
                description="melhor sequência de dias ativos"
              />
            </section>

            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <SummaryCard
                icon={CalendarDays}
                label="Dias ativos"
                value={summary.activeDays}
                description="dias diferentes com treino"
              />
              <SummaryCard
                icon={Activity}
                label="Exercícios"
                value={summary.uniqueExercises}
                description="exercícios com séries válidas"
              />
              <SummaryCard
                icon={Flame}
                label="Média por treino"
                value={formatVolume(summary.averageVolumePerWorkout)}
                description="volume médio das sessões"
              />
              <SummaryCard
                icon={Target}
                label="Tempo total"
                value={formatDuration(summary.totalDurationSeconds)}
                description="tempo registrado no histórico"
              />
            </section>

            <VolumeTrendChart data={volumeTrend} />

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <ConsistencySection summary={periodSummary} period={selectedPeriod} />
              <RecentPrsSection prs={summary.recentPrs} />
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <MuscleGroupsSection groups={summary.muscleGroups} />
              <ExerciseHighlightsSection exercises={summary.exerciseHighlights} />
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
              <ComparisonSection comparison={comparePeriods(periodHistory, previousPeriodHistory)} />
              <InsightsSection insights={insights} />
            </section>

            <Card className="min-w-0 overflow-hidden">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-accent-text)]">Como ler</p>
                  <h2 className="mt-1 text-xl font-black text-[var(--ff-text)]">O que estes números significam?</h2>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
                    Volume é peso × repetições. Séries vazias, aquecimentos e valores inválidos são ignorados para evitar NaN e falsos recordes.
                  </p>
                </div>
                <Link to="/exercise-progress" className="shrink-0">
                  <Button variant="secondary" className="w-full sm:w-auto">
                    <BarChart3 size={16} />
                    Evolução por exercício
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default Progress
