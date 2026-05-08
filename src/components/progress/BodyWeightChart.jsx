import {
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
import { chartItemStyle, chartLabelStyle, getChartTooltipStyle } from '../../utils/chartUtils'

function BodyWeightChart({ data = [], accentColor = '#8b5cf6' }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[var(--ff-text)]">
            Peso corporal
          </h2>

          <p className="mt-1 text-sm text-[var(--ff-muted)]">
            Evolução dos registros de peso.
          </p>
        </div>

        <Badge>{data.length} registros</Badge>
      </div>

      <div className="mt-5 h-[300px]">
        {data.length === 0 ? (
          <EmptyState
            title="Sem peso registrado"
            description="Registre seu peso no perfil para acompanhar a evolução."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
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
                formatter={(value) => [`${value}kg`, 'Peso']}
                contentStyle={getChartTooltipStyle()}
                labelStyle={chartLabelStyle}
                itemStyle={chartItemStyle}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke={accentColor}
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, stroke: accentColor, fill: 'var(--ff-card)' }}
                activeDot={{ r: 7, strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

export default BodyWeightChart
