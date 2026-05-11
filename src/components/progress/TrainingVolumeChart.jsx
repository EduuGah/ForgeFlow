import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import ResponsiveContainer from '../ui/SafeResponsiveContainer'

import Badge from '../ui/Badge'
import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'
import {
  chartItemStyle,
  chartLabelStyle,
  formatDuration,
  formatVolume,
  getChartTooltipStyle,
} from '../../utils/chartUtils'

function ChartShell({ title, description, badge, children, emptyTitle, emptyDescription, hasData }) {
  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-[var(--ff-text)]">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">{description}</p>
        </div>
        {badge && <Badge>{badge}</Badge>}
      </div>
      <div className="mt-5 min-h-[320px]">
        {!hasData ? <EmptyState title={emptyTitle} description={emptyDescription} /> : children}
      </div>
    </Card>
  )
}

function SmallStat({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
      <p className="text-xs font-black uppercase tracking-wide text-[var(--ff-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[var(--ff-text)]">{value}</p>
      {description && <p className="mt-1 text-xs leading-relaxed text-[var(--ff-muted)]">{description}</p>}
    </div>
  )
}

function formatWeekRange(weekValue) {
  if (!weekValue) return 'Sem período'
  const str = String(weekValue)
  const match = str.match(/(\d{4}).*?(\d{1,2})$/)
  if (!match) return str
  const year = Number(match[1])
  const week = Number(match[2])
  const simple = new Date(year, 0, 1 + (week - 1) * 7)
  const day = simple.getDay()
  const isoWeekStart = new Date(simple)
  if (day <= 4) isoWeekStart.setDate(simple.getDate() - simple.getDay() + 1)
  else isoWeekStart.setDate(simple.getDate() + 8 - simple.getDay())
  const isoWeekEnd = new Date(isoWeekStart)
  isoWeekEnd.setDate(isoWeekStart.getDate() + 6)
  const start = isoWeekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const end = isoWeekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return `${start}–${end}`
}

function prepareData(data = []) {
  return data.map((item) => ({
    ...item,
    weekLabel: formatWeekRange(item.week),
  }))
}

function TrainingVolumeChart({ data = [], accentColor = '#8b5cf6' }) {
  const prepared = prepareData(data)
  const validVolumeData = prepared.filter((item) => Number(item.volume || 0) > 0)
  const validWorkoutData = prepared.filter((item) => Number(item.workouts || 0) > 0)
  const validDurationData = prepared.filter((item) => Number(item.averageDurationSeconds || 0) > 0)

  const hasVolumeData = validVolumeData.length > 0
  const hasWorkoutData = validWorkoutData.length > 0
  const hasDurationComparison = validDurationData.length >= 2
  const lastDurationWeek = validDurationData[validDurationData.length - 1] || null

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <ChartShell
        title="Volume semanal"
        description="Soma de carga × repetições por semana."
        badge={`${validVolumeData.length} semanas`}
        hasData={hasVolumeData}
        emptyTitle="Sem volume registrado"
        emptyDescription="Finalize treinos com séries concluídas para gerar o gráfico."
      >
        <ResponsiveContainer height={320}>
          <BarChart data={validVolumeData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
            <XAxis dataKey="weekLabel" stroke="var(--ff-muted)" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis stroke="var(--ff-muted)" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} width={56} />
            <Tooltip formatter={(value) => [formatVolume(value), 'Volume']} labelFormatter={(value, payload) => payload?.[0]?.payload?.weekLabel || value} contentStyle={getChartTooltipStyle()} labelStyle={chartLabelStyle} itemStyle={chartItemStyle} />
            <Bar dataKey="volume" fill={accentColor} radius={[10, 10, 0, 0]} maxBarSize={80} />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell
        title="Treinos por semana"
        description="Frequência de treinos ao longo das semanas."
        badge="frequência"
        hasData={hasWorkoutData}
        emptyTitle="Sem frequência"
        emptyDescription="Finalize treinos para acompanhar frequência."
      >
        <ResponsiveContainer height={320}>
          <BarChart data={validWorkoutData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
            <XAxis dataKey="weekLabel" stroke="var(--ff-muted)" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} stroke="var(--ff-muted)" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} width={36} />
            <Tooltip formatter={(value) => [`${value} treino(s)`, 'Treinos']} labelFormatter={(value, payload) => payload?.[0]?.payload?.weekLabel || value} contentStyle={getChartTooltipStyle()} labelStyle={chartLabelStyle} itemStyle={chartItemStyle} />
            <Bar dataKey="workouts" fill={accentColor} radius={[10, 10, 0, 0]} maxBarSize={80} />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <div className="xl:col-span-2">
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-[var(--ff-text)]">Duração média semanal</h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">Agora a semana aparece com intervalo real de datas para ficar mais fácil entender o período.</p>
            </div>
            <Badge>tempo</Badge>
          </div>

          <div className="mt-5 h-auto min-h-[220px] sm:h-[320px]">
            {validDurationData.length === 0 ? (
              <EmptyState title="Sem duração registrada" description="Finalize treinos com tempo registrado para acompanhar a duração média." />
            ) : !hasDurationComparison ? (
              <div className="grid min-h-[220px] grid-cols-1 gap-3 sm:grid-cols-3">
                <SmallStat label="Período registrado" value={lastDurationWeek?.weekLabel || '—'} description="Ainda não há uma segunda semana para comparar." />
                <SmallStat label="Duração média" value={formatDuration(lastDurationWeek?.averageDurationSeconds || 0)} description="Tempo médio dos treinos nesse período." />
                <SmallStat label="Treinos" value={lastDurationWeek?.workouts || 0} description="Treinos finalizados nesse período." />
              </div>
            ) : (
              <ResponsiveContainer height={320}>
                <LineChart data={validDurationData} margin={{ top: 18, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
                  <XAxis dataKey="weekLabel" stroke="var(--ff-muted)" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="var(--ff-muted)" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} width={46} tickFormatter={(value) => Math.round(Number(value || 0) / 60)} />
                  <Tooltip formatter={(value) => [formatDuration(value), 'Duração média']} labelFormatter={(value, payload) => payload?.[0]?.payload?.weekLabel || value} contentStyle={getChartTooltipStyle()} labelStyle={chartLabelStyle} itemStyle={chartItemStyle} />
                  <Line type="monotone" dataKey="averageDurationSeconds" stroke={accentColor} strokeWidth={3} dot={{ r: 5, strokeWidth: 2, stroke: accentColor, fill: 'var(--ff-card)' }} activeDot={{ r: 8, strokeWidth: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default TrainingVolumeChart
