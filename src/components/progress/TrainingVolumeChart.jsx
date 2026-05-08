import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

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
          <h2 className="text-xl font-black text-[var(--ff-text)]">
            {title}
          </h2>

          <p className="mt-1 text-sm text-[var(--ff-muted)]">
            {description}
          </p>
        </div>

        {badge && <Badge>{badge}</Badge>}
      </div>

      <div className="mt-5 h-[260px] sm:h-[320px]">
        {!hasData ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          children
        )}
      </div>
    </Card>
  )
}

function TrainingVolumeChart({ data = [], accentColor = '#8b5cf6' }) {
  const validVolumeData = data.filter((item) => Number(item.volume || 0) > 0)
  const validWorkoutData = data.filter((item) => Number(item.workouts || 0) > 0)
  const validDurationData = data.filter((item) => Number(item.averageDurationSeconds || 0) > 0)

  const hasVolumeData = validVolumeData.length > 0
  const hasWorkoutData = validWorkoutData.length > 0
  const hasDurationComparison = validDurationData.length >= 2

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <ChartShell
        title="Volume semanal"
        description="Soma de volume por semana."
        badge={`${validVolumeData.length} semanas`}
        hasData={hasVolumeData}
        emptyTitle="Sem volume registrado"
        emptyDescription="Finalize treinos com séries concluídas para gerar o gráfico."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={validVolumeData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
            <XAxis
              dataKey="week"
              stroke="var(--ff-muted)"
              tick={{ fontSize: 11, fill: 'var(--ff-muted)' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="var(--ff-muted)"
              tick={{ fontSize: 11, fill: 'var(--ff-muted)' }}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <Tooltip
              formatter={(value) => [formatVolume(value), 'Volume']}
              contentStyle={getChartTooltipStyle()}
              labelStyle={chartLabelStyle}
              itemStyle={chartItemStyle}
            />
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
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={validWorkoutData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
            <XAxis
              dataKey="week"
              stroke="var(--ff-muted)"
              tick={{ fontSize: 11, fill: 'var(--ff-muted)' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              stroke="var(--ff-muted)"
              tick={{ fontSize: 11, fill: 'var(--ff-muted)' }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              formatter={(value) => [`${value} treino(s)`, 'Treinos']}
              contentStyle={getChartTooltipStyle()}
              labelStyle={chartLabelStyle}
              itemStyle={chartItemStyle}
            />
            <Bar dataKey="workouts" fill={accentColor} radius={[10, 10, 0, 0]} maxBarSize={80} />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <div className="xl:col-span-2">
        <ChartShell
          title="Duração média semanal"
          description="Tempo médio por treino em cada semana. O comparativo aparece quando houver pelo menos duas semanas com tempo registrado."
          badge="tempo"
          hasData={hasDurationComparison}
          emptyTitle="Poucos dados de duração"
          emptyDescription="Finalize treinos em pelo menos duas semanas diferentes para comparar a duração média sem distorcer o gráfico."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={validDurationData} margin={{ top: 18, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
              <XAxis
                dataKey="week"
                stroke="var(--ff-muted)"
                tick={{ fontSize: 11, fill: 'var(--ff-muted)' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="var(--ff-muted)"
                tick={{ fontSize: 11, fill: 'var(--ff-muted)' }}
                tickLine={false}
                axisLine={false}
                width={46}
                tickFormatter={(value) => Math.round(Number(value || 0) / 60)}
              />
              <Tooltip
                formatter={(value) => [formatDuration(value), 'Duração média']}
                contentStyle={getChartTooltipStyle()}
                labelStyle={chartLabelStyle}
                itemStyle={chartItemStyle}
              />
              <Line
                type="monotone"
                dataKey="averageDurationSeconds"
                stroke={accentColor}
                strokeWidth={3}
                dot={{ r: 5, strokeWidth: 2, stroke: accentColor, fill: 'var(--ff-card)' }}
                activeDot={{ r: 8, strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartShell>
      </div>
    </div>
  )
}

export default TrainingVolumeChart
