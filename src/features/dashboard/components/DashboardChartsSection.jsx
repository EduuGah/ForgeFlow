import { BarChart3, CalendarDays, Target } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import ResponsiveContainer from '../../../components/ui/SafeResponsiveContainer'
import Card from '../../../components/ui/Card'
import EmptyState from '../../../components/ui/EmptyState'

const chartCursor = {
  fill: 'var(--ff-surface-2)',
}

const chartTooltipStyle = {
  background: 'var(--ff-card)',
  border: '1px solid var(--ff-border)',
  borderRadius: '12px',
  color: 'var(--ff-text)',
  boxShadow: 'var(--ff-shadow-card)',
}

const chartTooltipLabelStyle = {
  color: 'var(--ff-text)',
  fontWeight: 700,
}

const chartTooltipItemStyle = {
  color: 'var(--ff-text-soft)',
}

const chartFocusFixClass =
  'focus:outline-none [&_*]:outline-none [&_svg]:outline-none [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none'

function getTooltipLabel(label) {
  return label || 'Registro'
}

function formatChartVolume(value) {
  return `${Number(value || 0).toLocaleString('pt-BR')} kg`
}

function ChartLoadingPlaceholder({ label = 'Preparando gráfico' }) {
  return (
    <div className="flex h-full min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-6 text-center">
      <div>
        <div className="mx-auto h-10 w-10 animate-pulse rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)]" />

        <p className="mt-4 text-sm font-bold text-[var(--ff-text)]">
          {label}
        </p>
      </div>
    </div>
  )
}

function DashboardChartsSection({
  shouldRenderCharts,
  volumeByWorkout,
  completedSets,
  radarData,
  workoutsByWeek,
  setsByWorkout,
  muscleVolumeChartData,
  chartAccentColor,
}) {
  return (
    <>
<section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
  <Card>
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold">Volume por treino</h2>

        <p className="mt-1 text-sm text-[var(--ff-muted-2)]">
          Soma de peso × repetições nos últimos treinos.
        </p>
      </div>

      <BarChart3 size={24} className="text-[var(--ff-accent-text)]" />
    </div>

    <div className={`mt-5 h-[300px] min-h-[300px] ${chartFocusFixClass}`}>
      {!shouldRenderCharts ? (
        <ChartLoadingPlaceholder label="Preparando gráfico de volume" />
      ) : volumeByWorkout.length === 0 ? (
        <EmptyState
          title="Sem dados para gráfico"
          description="Finalize treinos para gerar evolução de volume."
        />
      ) : (
        <ResponsiveContainer height={320}>
          <BarChart data={volumeByWorkout} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />

            <XAxis
              dataKey="name"
              stroke="var(--ff-muted)"
              tick={{
                fontSize: 11,
              }}
              tickLine={false}
            />

            <YAxis
              stroke="var(--ff-muted)"
              tick={{
                fontSize: 11,
              }}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip
              cursor={chartCursor}
              formatter={(value) => [formatChartVolume(value), 'Volume']}
              labelFormatter={(label, payload) =>
                getTooltipLabel(payload?.[0]?.payload?.fullName || label)
              }
              contentStyle={chartTooltipStyle}
              labelStyle={chartTooltipLabelStyle}
              itemStyle={chartTooltipItemStyle}
            />

            <Bar
              isAnimationActive={false}
              maxBarSize={72}
              dataKey="volume"
              fill={chartAccentColor}
              radius={[8, 8, 0, 0]}
              activeBar={{
                fill: chartAccentColor,
                opacity: 0.85,
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  </Card>

  <Card>
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold">Mapa muscular</h2>

        <p className="mt-1 text-sm text-[var(--ff-muted-2)]">
          Distribuição dos grupos mais treinados.
        </p>
      </div>

      <Target size={24} className="text-[var(--ff-accent-text)]" />
    </div>

    <div className={`mt-5 h-[300px] min-h-[300px] ${chartFocusFixClass}`}>
      {!shouldRenderCharts ? (
        <ChartLoadingPlaceholder label="Preparando radar muscular" />
      ) : completedSets.length === 0 ? (
        <EmptyState
          title="Sem dados musculares"
          description="Finalize treinos para gerar o gráfico."
        />
      ) : (
        <ResponsiveContainer height={320}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="var(--ff-chart-grid)" />
            <PolarAngleAxis dataKey="group" stroke="var(--ff-muted)" />

            <Radar
              name="Séries"
              dataKey="total"
              stroke={chartAccentColor}
              fill={chartAccentColor}
              fillOpacity={0.35}
              activeDot={{
                r: 5,
                fill: chartAccentColor,
                stroke: 'var(--ff-card)',
                strokeWidth: 2,
              }}
            />

            <Tooltip
              cursor={false}
              formatter={(value) => [`${value} série(s)`, 'Total']}
              contentStyle={chartTooltipStyle}
              labelStyle={chartTooltipLabelStyle}
              itemStyle={chartTooltipItemStyle}
            />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>
  </Card>
</section>

<section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
  <Card>
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold">Treinos por semana</h2>

        <p className="mt-1 text-sm text-[var(--ff-muted-2)]">
          Frequência semanal registrada no histórico.
        </p>
      </div>

      <CalendarDays size={24} className="text-[var(--ff-accent-text)]" />
    </div>

    <div className={`mt-5 h-[300px] min-h-[300px] ${chartFocusFixClass}`}>
      {!shouldRenderCharts ? (
        <ChartLoadingPlaceholder label="Preparando gráfico semanal" />
      ) : workoutsByWeek.length === 0 ? (
        <EmptyState
          title="Sem frequência"
          description="Finalize treinos para gerar esse gráfico."
        />
      ) : (
        <ResponsiveContainer height={320}>
          <BarChart data={workoutsByWeek} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
            <XAxis dataKey="week" stroke="var(--ff-muted)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />

            <YAxis
              stroke="var(--ff-muted)"
              allowDecimals={false}
              tick={{
                fontSize: 11,
              }}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip
              formatter={(value) => [`${value} treino(s)`, 'Treinos']}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.fullWeek || label}
              contentStyle={{
                background: 'var(--ff-card)',
                border: '1px solid var(--ff-border)',
                borderRadius: '12px',
                color: 'var(--ff-text)',
              }}
              labelStyle={{
                color: 'var(--ff-text)',
                fontWeight: 700,
              }}
            />

            <Bar
              isAnimationActive={false}
              maxBarSize={72}
              dataKey="total"
              fill={chartAccentColor}
              radius={[8, 8, 0, 0]}
              activeBar={{
                fill: chartAccentColor,
                opacity: 0.85,
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  </Card>

  <Card>
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold">Séries por treino</h2>

        <p className="mt-1 text-sm text-[var(--ff-muted-2)]">
          Quantidade de séries válidas nos últimos treinos.
        </p>
      </div>

      <BarChart3 size={24} className="text-[var(--ff-accent-text)]" />
    </div>

    <div className={`mt-5 h-[300px] min-h-[300px] ${chartFocusFixClass}`}>
      {!shouldRenderCharts ? (
        <ChartLoadingPlaceholder label="Preparando gráfico de séries" />
      ) : setsByWorkout.length === 0 ? (
        <EmptyState
          title="Sem séries"
          description="Finalize treinos para gerar esse gráfico."
        />
      ) : (
        <ResponsiveContainer height={320}>
          <BarChart data={setsByWorkout} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />

            <XAxis
              dataKey="name"
              stroke="var(--ff-muted)"
              tick={{
                fontSize: 11,
              }}
              tickLine={false}
            />

            <YAxis
              stroke="var(--ff-muted)"
              allowDecimals={false}
              tick={{
                fontSize: 11,
              }}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip
              formatter={(value) => [`${value} série(s)`, 'Séries concluídas']}
              labelFormatter={(label, payload) =>
                getTooltipLabel(payload?.[0]?.payload?.fullName || label)
              }
              contentStyle={{
                background: 'var(--ff-card)',
                border: '1px solid var(--ff-border)',
                borderRadius: '12px',
                color: 'var(--ff-text)',
              }}
              labelStyle={{
                color: 'var(--ff-text)',
                fontWeight: 700,
              }}
            />

            <Bar
              isAnimationActive={false}
              maxBarSize={72}
              dataKey="sets"
              fill={chartAccentColor}
              radius={[8, 8, 0, 0]}
              activeBar={{
                fill: chartAccentColor,
                opacity: 0.85,
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  </Card>

  <Card>
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold">Volume por músculo</h2>

        <p className="mt-1 text-sm text-[var(--ff-muted-2)]">
          Grupos musculares com maior volume acumulado.
        </p>
      </div>

      <BarChart3 size={24} className="text-[var(--ff-accent-text)]" />
    </div>

    <div className={`mt-5 h-[300px] min-h-[300px] ${chartFocusFixClass}`}>
      {!shouldRenderCharts ? (
        <ChartLoadingPlaceholder label="Preparando gráfico muscular" />
      ) : muscleVolumeChartData.length === 0 ? (
        <EmptyState
          title="Sem volume"
          description="Finalize treinos para gerar esse gráfico."
        />
      ) : (
        <ResponsiveContainer height={320}>
          <BarChart data={muscleVolumeChartData} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
            <XAxis dataKey="group" stroke="var(--ff-muted)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />

            <YAxis
              stroke="var(--ff-muted)"
              tick={{
                fontSize: 11,
              }}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip
              formatter={(value) => [formatChartVolume(value), 'Volume acumulado']}
              labelFormatter={(label) => `Grupo: ${label}`}
              contentStyle={{
                background: 'var(--ff-card)',
                border: '1px solid var(--ff-border)',
                borderRadius: '12px',
                color: 'var(--ff-text)',
              }}
              labelStyle={{
                color: 'var(--ff-text)',
                fontWeight: 700,
              }}
            />

            <Bar
              isAnimationActive={false}
              maxBarSize={72}
              dataKey="volume"
              fill={chartAccentColor}
              radius={[8, 8, 0, 0]}
              activeBar={{
                fill: chartAccentColor,
                opacity: 0.85,
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  </Card>
</section>

    </>
  )
}

export default DashboardChartsSection
