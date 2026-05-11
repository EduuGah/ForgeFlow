import { Search } from 'lucide-react'
import {
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
import Select from '../ui/Select'
import { chartItemStyle, chartLabelStyle, formatVolume, getChartTooltipStyle } from '../../utils/chartUtils'

function ExercisePrChart({
  exerciseOptions = [],
  selectedExercise = '',
  onSelectExercise,
  timeline = [],
  accentColor = '#8b5cf6',
}) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
            <Search size={22} />
          </div>

          <div>
            <h2 className="text-xl font-black text-[var(--ff-text)]">
              Exercício
            </h2>

            <p className="text-sm text-[var(--ff-muted)]">
              Selecione para ver evolução detalhada.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Select
            label="Exercício"
            value={selectedExercise}
            onChange={(event) => onSelectExercise(event.target.value)}
          >
            <option value="">Selecione um exercício</option>

            {exerciseOptions.map((item) => (
              <option key={item.exerciseName} value={item.exerciseName}>
                {item.exerciseName}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-5 space-y-3">
          {exerciseOptions.slice(0, 8).map((item) => (
            <button
              key={item.exerciseName}
              type="button"
              onClick={() => onSelectExercise(item.exerciseName)}
              className={
                selectedExercise === item.exerciseName
                  ? 'w-full rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] p-3 text-left shadow-[0_0_22px_var(--ff-accent-shadow)]/20'
                  : 'w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 text-left transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-card-hover)]'
              }
            >
              <p className="line-clamp-1 font-bold text-[var(--ff-text)]">
                {item.exerciseName}
              </p>

              <p className="mt-1 text-xs text-[var(--ff-muted)]">
                {item.bestWeight}kg × {item.bestWeightReps} reps • {item.muscleGroup}
              </p>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-[var(--ff-text)]">
              Evolução por exercício
            </h2>

            <p className="mt-1 text-sm text-[var(--ff-muted)]">
              Carga máxima e volume ao longo do tempo.
            </p>
          </div>

          <Badge>{selectedExercise || 'Nenhum'}</Badge>
        </div>

        <div className="mt-5 h-[330px]">
          {!selectedExercise || timeline.length === 0 ? (
            <EmptyState
              title="Selecione um exercício"
              description="Escolha um exercício com histórico para visualizar a evolução."
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ top: 18, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
                <XAxis
                  dataKey="label"
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
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'bestWeight') return [`${value}kg`, 'Melhor carga']
                    if (name === 'volume') return [formatVolume(value), 'Volume']
                    if (name === 'sets') return [`${value} séries`, 'Séries']
                    return [value, name]
                  }}
                  contentStyle={getChartTooltipStyle()}
                  labelStyle={chartLabelStyle}
                  itemStyle={chartItemStyle}
                />
                <Line
                  type="monotone"
                  dataKey="bestWeight"
                  stroke={accentColor}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, stroke: accentColor, fill: 'var(--ff-card)' }}
                  activeDot={{ r: 7, strokeWidth: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="var(--ff-warning-text)"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, stroke: 'var(--ff-warning-text)', fill: 'var(--ff-card)' }}
                  activeDot={{ r: 7, strokeWidth: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </section>
  )
}

export default ExercisePrChart
