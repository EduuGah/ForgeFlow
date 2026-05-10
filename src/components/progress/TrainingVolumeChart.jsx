import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'
import { chartItemStyle, chartLabelStyle, formatDuration, formatVolume, getChartTooltipStyle } from '../../utils/chartUtils'

function formatWeekLabel(value) { return String(value || 'Semana') }
function ChartBlock({ title, description, badge, children, hasData, emptyTitle, emptyDescription }) {
  return <Card><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black text-[var(--ff-text)]">{title}</h2><p className="mt-1 text-sm text-[var(--ff-muted)]">{description}</p></div>{badge && <Badge>{badge}</Badge>}</div><div className="mt-5 h-[320px] min-h-[320px]" data-chart>{hasData ? children : <EmptyState title={emptyTitle} description={emptyDescription} />}</div></Card>
}
function TrainingVolumeChart({ data = [], accentColor = 'var(--ff-accent)' }) {
  const chartData = data.map((item) => ({ ...item, weekLabel: formatWeekLabel(item.week), volume: Number(item.volume || 0), workouts: Number(item.workouts || 0), averageDurationSeconds: Number(item.averageDurationSeconds || 0) }))
  const volumeData = chartData.filter((x) => x.volume > 0)
  const workoutData = chartData.filter((x) => x.workouts > 0)
  const durationData = chartData.filter((x) => x.averageDurationSeconds > 0)
  return <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
    <ChartBlock title="Volume semanal" description="Soma de carga × repetições por semana." badge={`${volumeData.length} semanas`} hasData={volumeData.length > 0} emptyTitle="Sem volume registrado" emptyDescription="Finalize treinos com séries para gerar o gráfico.">
      <ResponsiveContainer width="100%" height="100%"><BarChart data={volumeData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" /><XAxis dataKey="weekLabel" stroke="var(--ff-muted)" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} /><YAxis stroke="var(--ff-muted)" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} /><Tooltip formatter={(value) => [formatVolume(value), 'Volume']} contentStyle={getChartTooltipStyle()} labelStyle={chartLabelStyle} itemStyle={chartItemStyle} /><Bar dataKey="volume" fill={accentColor} radius={[10,10,0,0]} /></BarChart></ResponsiveContainer>
    </ChartBlock>
    <ChartBlock title="Treinos por semana" description="Frequência de treinos ao longo das semanas." badge="frequência" hasData={workoutData.length > 0} emptyTitle="Sem frequência" emptyDescription="Finalize treinos para acompanhar frequência.">
      <ResponsiveContainer width="100%" height="100%"><BarChart data={workoutData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" /><XAxis dataKey="weekLabel" stroke="var(--ff-muted)" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} /><YAxis allowDecimals={false} stroke="var(--ff-muted)" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} /><Tooltip formatter={(value) => [`${value} treino(s)`, 'Treinos']} contentStyle={getChartTooltipStyle()} labelStyle={chartLabelStyle} itemStyle={chartItemStyle} /><Bar dataKey="workouts" fill={accentColor} radius={[10,10,0,0]} /></BarChart></ResponsiveContainer>
    </ChartBlock>
    <div className="xl:col-span-2"><ChartBlock title="Duração média semanal" description="Tempo médio dos treinos por semana." badge="tempo" hasData={durationData.length > 0} emptyTitle="Sem duração registrada" emptyDescription="Finalize treinos com duração para gerar o gráfico.">
      <ResponsiveContainer width="100%" height="100%"><LineChart data={durationData} margin={{ top: 18, right: 12, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" /><XAxis dataKey="weekLabel" stroke="var(--ff-muted)" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} /><YAxis stroke="var(--ff-muted)" tick={{ fontSize: 11, fill: 'var(--ff-muted)' }} tickLine={false} axisLine={false} tickFormatter={(value) => Math.round(Number(value || 0) / 60)} /><Tooltip formatter={(value) => [formatDuration(value), 'Duração média']} contentStyle={getChartTooltipStyle()} labelStyle={chartLabelStyle} itemStyle={chartItemStyle} /><Line type="monotone" dataKey="averageDurationSeconds" stroke={accentColor} strokeWidth={3} dot={{ r: 5, strokeWidth: 2, stroke: accentColor, fill: 'var(--ff-card)' }} /></LineChart></ResponsiveContainer>
    </ChartBlock></div>
  </div>
}
export default TrainingVolumeChart
