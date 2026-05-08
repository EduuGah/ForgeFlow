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
      <div className="flex items-start justify-between gap-4">
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

      <div className="mt-5 h-[300px]">
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
  const hasData = data.length > 0

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <ChartShell
        title="Volume semanal"
        description="Soma de volume por semana."
        badge={`${data.length} semanas`}
        hasData={hasData}
        emptyTitle="Sem volume registrado"
        emptyDescription="Finalize treinos com séries concluídas para gerar o gráfico."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
            <XAxis
              dataKey="week"
              stroke="var(--ff-muted)"
              tick={{ fontSize: 11, fill: 'var(--ff-muted)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--ff-muted)"
              tick={{ fontSize: 11, fill: 'var(--ff-muted)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value) => [formatVolume(value), 'Volume']}
              contentStyle={getChartTooltipStyle()}
              labelStyle={chartLabelStyle}
              itemStyle={chartItemStyle}
            />
            <Bar dataKey="volume" fill={accentColor} radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell
        title="Treinos por semana"
        description="Frequência de treinos ao longo das semanas."
        badge="frequência"
        hasData={hasData}
        emptyTitle="Sem frequência"
        emptyDescription="Finalize treinos para acompanhar frequência."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
            <XAxis
              dataKey="week"
              stroke="var(--ff-muted)"
              tick={{ fontSize: 11, fill: 'var(--ff-muted)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              stroke="var(--ff-muted)"
              tick={{ fontSize: 11, fill: 'var(--ff-muted)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value) => [`${value} treino(s)`, 'Treinos']}
              contentStyle={getChartTooltipStyle()}
              labelStyle={chartLabelStyle}
              itemStyle={chartItemStyle}
            />
            <Bar dataKey="workouts" fill={accentColor} radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <div className="xl:col-span-2">
        <ChartShell
          title="Duração média semanal"
          description="Tempo médio por treino em cada semana."
          badge="tempo"
          hasData={hasData}
          emptyTitle="Sem duração"
          emptyDescription="Finalize treinos com tempo registrado."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 18, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
              <XAxis
                dataKey="week"
                stroke="var(--ff-muted)"
                tick={{ fontSize: 11, fill: 'var(--ff-muted)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--ff-muted)"
                tick={{ fontSize: 11, fill: 'var(--ff-muted)' }}
                tickLine={false}
                axisLine={false}
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
                dot={{ r: 4, strokeWidth: 2, stroke: accentColor, fill: 'var(--ff-card)' }}
                activeDot={{ r: 7, strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartShell>
      </div>
    </div>
  )
}

export default TrainingVolumeChart
