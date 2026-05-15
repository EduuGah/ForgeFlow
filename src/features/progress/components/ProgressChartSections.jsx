import {
  BarChart3,
  CalendarDays,
  Dumbbell,
  Flame,
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

import ResponsiveContainer from '../../../components/ui/SafeResponsiveContainer'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import { formatVolume } from '../../../components/progress/ProgressSummaryCards'
import { getShortMonth, getTooltipStyle } from '../progressUtils'

export function ChartLoadingCard({ title = 'Preparando gráfico' }) {
  return (
    <Card>
      <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-dashed border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-6 text-center">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
            <BarChart3 size={22} />
          </div>

          <p className="mt-4 text-sm font-black text-[var(--ff-text)]">
            {title}
          </p>

          <p className="mt-1 text-xs text-[var(--ff-muted)]">
            Carregando depois do conteúdo principal para melhorar a abertura da tela.
          </p>
        </div>
      </div>
    </Card>
  )
}


export function DetailStat({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">
            {label}
          </p>

          <p className="mt-2 text-xl font-black text-[var(--ff-text)]">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs leading-relaxed text-[var(--ff-muted)]">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
          <Icon size={19} />
        </div>
      </div>
    </div>
  )
}


export function ChartShell({ title, description, icon: Icon, badge, children }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[var(--ff-text)]">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {badge && <Badge>{badge}</Badge>}

          {Icon && (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
              <Icon size={22} />
            </div>
          )}
        </div>
      </div>

      {children}
    </Card>
  )
}


export function MonthlyProgressChart({ data = [], accentColor }) {
  const currentMonth = data[0] || null
  const hasComparison = data.length >= 2

  return (
    <ChartShell
      title="Resumo mensal"
      description="Mostra volume, treinos e séries por mês. Ajuda a entender se sua consistência está subindo ou caindo."
      icon={CalendarDays}
      badge={`${data.length} meses`}
    >
      <div className="mt-5 min-h-[320px]">
        {data.length === 0 ? (
          <EmptyState
            title="Sem dados mensais"
            description="Finalize treinos para gerar o resumo por mês."
          />
        ) : !hasComparison ? (
          <div className="grid h-full min-h-[260px] grid-cols-1 content-center gap-3 sm:grid-cols-3">
            <DetailStat
              icon={BarChart3}
              label="Mês atual"
              value={getShortMonth(currentMonth.month)}
              description="Ainda há só um mês com dados, então o gráfico comparativo aparece quando houver mais meses."
            />

            <DetailStat
              icon={Dumbbell}
              label="Treinos"
              value={currentMonth.workouts || 0}
              description="Treinos finalizados neste mês."
            />

            <DetailStat
              icon={Flame}
              label="Volume"
              value={formatVolume(currentMonth.volume || 0)}
              description={`${currentMonth.sets || 0} séries registradas.`}
            />
          </div>
        ) : (
          <ResponsiveContainer height={320}>
            <ComposedChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
              <XAxis
                dataKey="month"
                tickFormatter={getShortMonth}
                tick={{ fontSize: 11, fill: 'var(--ff-muted)' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="volume"
                tick={{ fontSize: 11, fill: 'var(--ff-muted)' }}
                tickLine={false}
                axisLine={false}
                width={54}
              />
              <YAxis
                yAxisId="workouts"
                orientation="right"
                tick={{ fontSize: 11, fill: 'var(--ff-muted)' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={30}
              />
              <Tooltip
                contentStyle={getTooltipStyle()}
                labelFormatter={(label) => `Mês: ${getShortMonth(label)}`}
                formatter={(value, name) => {
                  if (name === 'volume') return [formatVolume(value), 'Volume']
                  if (name === 'workouts') return [`${value} treino(s)`, 'Treinos']
                  if (name === 'sets') return [`${value} séries`, 'Séries']
                  return [value, name]
                }}
              />
              <Bar
                yAxisId="volume"
                dataKey="volume"
                fill={accentColor}
                radius={[8, 8, 0, 0]}
              />
              <Line
                yAxisId="workouts"
                type="monotone"
                dataKey="workouts"
                stroke="var(--ff-warning-text)"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartShell>
  )
}
