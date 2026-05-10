import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'
import { chartItemStyle, chartLabelStyle, formatVolume, getChartTooltipStyle } from '../../utils/chartUtils'

function MuscleGroupChart({ data = [], accentColor = 'var(--ff-accent)' }) {
  const chartData = data.slice(0, 10).map((item) => ({
    muscleGroup: item.muscleGroup || item.group || 'Sem grupo',
    volume: Number(item.volume || 0),
    sets: Number(item.sets || item.total || 0),
  }))
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[var(--ff-text)]">Grupos musculares</h2>
          <p className="mt-1 text-sm text-[var(--ff-muted)]">Volume acumulado por grupo muscular.</p>
        </div>
        <Badge>{chartData.length} grupos</Badge>
      </div>
      <div className="mt-5 h-[330px] min-h-[330px]" data-chart>
        {chartData.length === 0 ? <EmptyState title="Sem grupos musculares" description="Finalize treinos para gerar distribuição muscular." /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 16, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
              <XAxis dataKey="muscleGroup" stroke="var(--ff-muted)" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--ff-muted)" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value, name) => name === 'volume' ? [formatVolume(value), 'Volume'] : [`${value} séries`, 'Séries']} contentStyle={getChartTooltipStyle()} labelStyle={chartLabelStyle} itemStyle={chartItemStyle} />
              <Bar dataKey="volume" fill={accentColor} radius={[10,10,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}
export default MuscleGroupChart
