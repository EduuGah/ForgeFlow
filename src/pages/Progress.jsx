import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  CalendarDays,
  Camera,
  Clock3,
  Dumbbell,
  Flame,
  History,
  Info,
  LineChart,
  Medal,
  RefreshCcw,
  Search,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Weight,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Select from '../components/ui/Select'

import ProgressSummaryCards, {
  formatDuration,
  formatVolume,
} from '../components/progress/ProgressSummaryCards'
import BodyWeightChart from '../components/progress/BodyWeightChart'
import TrainingVolumeChart from '../components/progress/TrainingVolumeChart'
import MuscleGroupChart from '../components/progress/MuscleGroupChart'
import ExercisePrChart from '../components/progress/ExercisePrChart'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import {
  getUserStorageData,
  saveUserStorageData,
} from '../utils/userStorage'

function formatDate(dateString) {
  if (!dateString) return 'Sem data'

  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function formatLongDate(dateString) {
  if (!dateString) return 'Sem data'

  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR')
}

function formatWeight(value) {
  if (value === null || value === undefined || value === '') return '—'

  return `${Number(value || 0).toLocaleString('pt-BR')}kg`
}

function getShortMonth(monthKey = '') {
  if (!monthKey) return 'Sem mês'

  const [year, month] = String(monthKey).split('-')

  if (!year || !month) return monthKey

  const date = new Date(Number(year), Number(month) - 1, 1)

  return date.toLocaleDateString('pt-BR', {
    month: 'short',
    year: '2-digit',
  })
}

function getExerciseName(item = {}) {
  return (
    item.exercise?.name ||
    item.name ||
    item.exerciseName ||
    'Sem nome'
  )
}

function getExerciseGroup(item = {}) {
  return (
    item.exercise?.muscleGroup ||
    item.exercise?.normalizedGroup ||
    item.muscleGroup ||
    'Sem grupo'
  )
}

function getExerciseEquipment(item = {}) {
  return (
    item.exercise?.equipment ||
    item.equipment ||
    'Sem equipamento'
  )
}

function isValidSet(set = {}) {
  const hasCompletionFlag =
    set.completed !== undefined ||
    set.isCompleted !== undefined ||
    set.done !== undefined

  const isCompleted = hasCompletionFlag
    ? set.completed === true || set.isCompleted === true || set.done === true
    : true

  const weight = Number(set.weight || set.load || 0)
  const reps = Number(set.reps || 0)

  return set.type !== 'warmup' && isCompleted && weight > 0 && reps > 0
}

function getSetWeight(set = {}) {
  return Number(set.weight || set.load || 0)
}

function getSetReps(set = {}) {
  return Number(set.reps || 0)
}

function getSetVolume(set = {}) {
  return getSetWeight(set) * getSetReps(set)
}

function getSessionDate(session = {}) {
  return session.finishedAt || session.createdAt || session.startedAt
}

function getSessionSets(session = {}) {
  const rows = []

  const exercises = Array.isArray(session.exercises)
    ? session.exercises
    : []

  exercises.forEach((item, exerciseIndex) => {
    const sets = Array.isArray(item.sets) ? item.sets : []
    const exerciseName = getExerciseName(item)
    const muscleGroup = getExerciseGroup(item)
    const equipment = getExerciseEquipment(item)

    sets.forEach((set, setIndex) => {
      const weight = getSetWeight(set)
      const reps = getSetReps(set)
      const volume = getSetVolume(set)

      rows.push({
        id: `${session._id || session.id || getSessionDate(session)}-${exerciseName}-${set.id || set._id || setIndex}`,
        date: getSessionDate(session),
        workoutName: session.workoutName || session.name || 'Treino',
        exerciseName,
        muscleGroup,
        equipment,
        exerciseIndex: exerciseIndex + 1,
        setNumber: Number(set.setNumber || set.order || setIndex + 1),
        setType: set.type || 'working',
        completed: set.completed === true || set.isCompleted === true || set.done === true,
        isValid: isValidSet(set),
        weight,
        reps,
        volume,
        notes: set.note || set.notes || item.note || '',
      })
    })
  })

  return rows
}

function getAllRecentSetRows(workouts = []) {
  return workouts.flatMap(getSessionSets)
}

function getTooltipStyle() {
  return {
    background: 'var(--ff-card)',
    border: '1px solid var(--ff-border)',
    borderRadius: '16px',
    color: 'var(--ff-text)',
    boxShadow: '0 22px 60px rgba(0,0,0,.35)',
  }
}

function DetailStat({ icon: Icon, label, value, description }) {
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

function ChartShell({ title, description, icon: Icon, badge, children }) {
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

function MonthlyProgressChart({ data = [], accentColor }) {
  const currentMonth = data[0] || null
  const hasComparison = data.length >= 2

  return (
    <ChartShell
      title="Resumo mensal"
      description="Mostra volume, treinos e séries por mês. Ajuda a entender se sua consistência está subindo ou caindo."
      icon={CalendarDays}
      badge={`${data.length} meses`}
    >
      <div className="mt-5 h-auto min-h-[260px] sm:h-[320px]">
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
          <ResponsiveContainer width="100%" height="100%">
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

function SetVolumeScatterChart({ data = [], accentColor }) {
  const validRows = data
    .filter((row) => row.isValid)
    .slice()
    .reverse()
    .slice(-40)
    .map((row, index) => ({
      ...row,
      index: index + 1,
    }))

  return (
    <ChartShell
      title="Séries recentes detalhadas"
      description="Cada ponto representa uma série válida dos treinos recentes. Passe o mouse para ver treino, exercício, série, peso, reps, volume e data."
      icon={Sparkles}
      badge={`${validRows.length} séries`}
    >
      <div className="mt-5 h-[340px]">
        {validRows.length === 0 ? (
          <EmptyState
            title="Sem séries recentes"
            description="Finalize treinos com peso e repetições para gerar esse gráfico."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ff-chart-grid)" />
              <XAxis
                type="number"
                dataKey="index"
                name="Ordem"
                tick={{ fontSize: 11, fill: 'var(--ff-muted)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="number"
                dataKey="weight"
                name="Peso"
                tick={{ fontSize: 11, fill: 'var(--ff-muted)' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ stroke: accentColor, strokeDasharray: '4 4' }}
                contentStyle={getTooltipStyle()}
                formatter={(value, name, props) => {
                  const row = props.payload

                  if (name === 'Peso') return [`${value}kg`, 'Peso']
                  if (name === 'Ordem') return [`#${value}`, 'Registro']

                  return [value, name]
                }}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload

                  if (!row) return 'Registro'

                  return `${row.exerciseName} • Série ${row.setNumber}`
                }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null

                  const row = payload[0].payload

                  return (
                    <div className="max-w-[320px] rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 shadow-2xl">
                      <p className="text-sm font-black text-[var(--ff-text)]">
                        {row.exerciseName}
                      </p>

                      <p className="mt-1 text-xs text-[var(--ff-muted)]">
                        {row.workoutName} • {formatLongDate(row.date)}
                      </p>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-2">
                          <span className="text-[var(--ff-muted)]">Série</span>
                          <p className="font-black text-[var(--ff-text)]">
                            {row.setNumber}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-2">
                          <span className="text-[var(--ff-muted)]">Grupo</span>
                          <p className="font-black text-[var(--ff-text)]">
                            {row.muscleGroup}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-2">
                          <span className="text-[var(--ff-muted)]">Peso</span>
                          <p className="font-black text-[var(--ff-accent-text)]">
                            {row.weight}kg
                          </p>
                        </div>

                        <div className="rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-2">
                          <span className="text-[var(--ff-muted)]">Reps</span>
                          <p className="font-black text-[var(--ff-text)]">
                            {row.reps}
                          </p>
                        </div>

                        <div className="col-span-2 rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-2">
                          <span className="text-[var(--ff-muted)]">Volume da série</span>
                          <p className="font-black text-[var(--ff-accent-text)]">
                            {formatVolume(row.volume)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }}
              />
              <Scatter data={validRows} fill={accentColor}>
                {validRows.map((row) => (
                  <Cell
                    key={row.id}
                    fill={row.volume === Math.max(...validRows.map((item) => item.volume)) ? 'var(--ff-warning-text)' : accentColor}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartShell>
  )
}

function ExercisePrTable({ data = [], onSelectExercise }) {
  const topPrs = data.slice(0, 12)

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[var(--ff-text)]">
            Ranking de PRs por exercício
          </h2>

          <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
            Lista detalhada das melhores cargas e melhores volumes encontrados no histórico.
          </p>
        </div>

        <Badge>{data.length} exercícios</Badge>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--ff-border)]">
        {topPrs.length === 0 ? (
          <EmptyState
            title="Sem PRs ainda"
            description="Finalize treinos com peso e repetições para gerar PRs."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full text-left text-sm">
              <thead className="bg-[var(--ff-surface-2)] text-xs uppercase tracking-wide text-[var(--ff-muted)]">
                <tr>
                  <th className="px-4 py-3">Exercício</th>
                  <th className="px-4 py-3">Grupo</th>
                  <th className="px-4 py-3">Maior carga</th>
                  <th className="px-4 py-3">Data / treino</th>
                  <th className="px-4 py-3">Maior volume</th>
                  <th className="px-4 py-3">Data / treino</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--ff-border)]">
                {topPrs.map((item) => (
                  <tr
                    key={item.exerciseName}
                    className="transition hover:bg-[var(--ff-card-hover)]"
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onSelectExercise(item.exerciseName)}
                        className="text-left font-black text-[var(--ff-text)] transition hover:text-[var(--ff-accent-text)]"
                      >
                        {item.exerciseName}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-[var(--ff-muted)]">
                      {item.muscleGroup || 'Sem grupo'}
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-black text-[var(--ff-accent-text)]">
                        {formatWeight(item.bestWeight)}
                      </span>
                      <span className="ml-1 text-xs text-[var(--ff-muted)]">
                        × {item.bestWeightReps || 0} reps
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-bold text-[var(--ff-text)]">
                        {formatDate(item.bestWeightDate)}
                      </p>

                      <p className="mt-1 line-clamp-1 text-xs text-[var(--ff-muted)]">
                        {item.bestWeightWorkoutName || 'Treino'}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-black text-[var(--ff-warning-text)]">
                        {formatVolume(item.bestVolume)}
                      </span>
                      <span className="ml-1 text-xs text-[var(--ff-muted)]">
                        ({formatWeight(item.bestVolumeWeight)} × {item.bestVolumeReps || 0})
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-bold text-[var(--ff-text)]">
                        {formatDate(item.bestVolumeDate)}
                      </p>

                      <p className="mt-1 line-clamp-1 text-xs text-[var(--ff-muted)]">
                        {item.bestVolumeWorkoutName || 'Treino'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  )
}

function RecentWorkoutDetails({ workouts = [] }) {
  const [expandedId, setExpandedId] = useState(null)

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[var(--ff-text)]">
            Detalhes dos últimos treinos
          </h2>

          <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
            Veja exatamente qual treino foi feito, em qual data, quais exercícios entraram e quais séries tiveram peso, reps e volume.
          </p>
        </div>

        <Link to="/history">
          <Button variant="secondary">
            <History size={16} />
            Histórico
          </Button>
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {workouts.length === 0 ? (
          <EmptyState
            title="Sem treinos recentes"
            description="Finalize treinos para ver detalhes por série."
          />
        ) : (
          workouts.slice(0, 8).map((session) => {
            const id = session._id || session.id || session.finishedAt
            const rows = getSessionSets(session)
            const validRows = rows.filter((row) => row.isValid)
            const volume = validRows.reduce((total, row) => total + row.volume, 0)
            const isOpen = expandedId === id

            return (
              <div
                key={id}
                className="overflow-hidden rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)]"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : id)}
                  className="flex w-full flex-col gap-3 p-4 text-left transition hover:bg-[var(--ff-card-hover)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-black text-[var(--ff-text)]">
                      {session.workoutName || session.name || 'Treino'}
                    </p>

                    <p className="mt-1 text-sm text-[var(--ff-muted)]">
                      {formatLongDate(getSessionDate(session))} • {session.exercises?.length || 0} exercício(s) • {formatDuration(session.durationSeconds || session.duration)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge>{validRows.length} séries válidas</Badge>
                    <Badge variant="purple">{formatVolume(volume)}</Badge>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-[var(--ff-border)] p-4">
                    {validRows.length === 0 ? (
                      <p className="text-sm text-[var(--ff-muted)]">
                        Esse treino não tem séries válidas com peso e reps.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-[820px] w-full text-left text-sm">
                          <thead className="text-xs uppercase tracking-wide text-[var(--ff-muted)]">
                            <tr>
                              <th className="px-3 py-2">Exercício</th>
                              <th className="px-3 py-2">Grupo</th>
                              <th className="px-3 py-2">Equipamento</th>
                              <th className="px-3 py-2">Série</th>
                              <th className="px-3 py-2">Peso</th>
                              <th className="px-3 py-2">Reps</th>
                              <th className="px-3 py-2">Volume</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-[var(--ff-border)]">
                            {validRows.map((row) => (
                              <tr key={row.id}>
                                <td className="px-3 py-2 font-bold text-[var(--ff-text)]">
                                  {row.exerciseName}
                                </td>

                                <td className="px-3 py-2 text-[var(--ff-muted)]">
                                  {row.muscleGroup}
                                </td>

                                <td className="px-3 py-2 text-[var(--ff-muted)]">
                                  {row.equipment}
                                </td>

                                <td className="px-3 py-2">
                                  <Badge>Série {row.setNumber}</Badge>
                                </td>

                                <td className="px-3 py-2 font-black text-[var(--ff-accent-text)]">
                                  {formatWeight(row.weight)}
                                </td>

                                <td className="px-3 py-2 font-bold text-[var(--ff-text)]">
                                  {row.reps}
                                </td>

                                <td className="px-3 py-2 font-black text-[var(--ff-warning-text)]">
                                  {formatVolume(row.volume)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </Card>
  )
}

function BodyWeightLog({ data = [] }) {
  const rows = data.slice().reverse().slice(0, 10)

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[var(--ff-text)]">
            Registros de peso corporal
          </h2>

          <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
            Últimos pesos registrados, com diferença em relação ao registro anterior.
          </p>
        </div>

        <Badge>{data.length} registros</Badge>
      </div>

      <div className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <EmptyState
            title="Sem pesos registrados"
            description="Registre seu peso no perfil para acompanhar alterações."
          />
        ) : (
          rows.map((item, index) => {
            const previous = rows[index + 1]
            const diff = previous
              ? Number(item.weight || 0) - Number(previous.weight || 0)
              : 0

            return (
              <div
                key={item.id || item._id || `${item.date}-${index}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4"
              >
                <div>
                  <p className="font-black text-[var(--ff-text)]">
                    {formatWeight(item.weight)}
                  </p>

                  <p className="mt-1 text-xs text-[var(--ff-muted)]">
                    {formatLongDate(item.date)}
                  </p>

                  {item.note && (
                    <p className="mt-2 text-xs text-[var(--ff-muted)]">
                      {item.note}
                    </p>
                  )}
                </div>

                <Badge variant={diff === 0 ? 'default' : 'purple'}>
                  {previous ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}kg` : 'Inicial'}
                </Badge>
              </div>
            )
          })
        )}
      </div>
    </Card>
  )
}

function Progress() {
  const { user } = useAuth()

  const [progressData, setProgressData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState('local')
  const [selectedExercise, setSelectedExercise] = useState('')
  const [chartAccentColor, setChartAccentColor] = useState('#8b5cf6')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    function updateChartColor() {
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue('--ff-accent')
        .trim()

      setChartAccentColor(color || '#8b5cf6')
    }

    updateChartColor()

    window.addEventListener('forgeflow:settings-changed', updateChartColor)

    return () => {
      window.removeEventListener('forgeflow:settings-changed', updateChartColor)
    }
  }, [])

  useEffect(() => {
    if (!user) return

    async function loadProgress() {
      setLoading(true)

      const cachedProgress = getUserStorageData(user, 'progress-stats', null)

      try {
        const query = selectedExercise
          ? `?exerciseName=${encodeURIComponent(selectedExercise)}`
          : ''

        const data = await apiFetch(`/stats/progress${query}`)

        setProgressData(data)
        saveUserStorageData(user, 'progress-stats', data)
        setSource('database')
      } catch (error) {
        console.error(error)

        setProgressData(cachedProgress)
        setSource('local')
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [user, selectedExercise, refreshKey])

  const summary = progressData?.summary || {}
  const insights = progressData?.insights || {}
  const charts = progressData?.charts || {}
  const recent = progressData?.recent || {}

  const exerciseOptions = useMemo(() => {
    return Array.isArray(charts.exercisePrs) ? charts.exercisePrs : []
  }, [charts.exercisePrs])

  const weeklyProgress = Array.isArray(charts.weeklyProgress)
    ? charts.weeklyProgress
    : []

  const monthlyProgress = Array.isArray(charts.monthlyProgress)
    ? charts.monthlyProgress
    : []

  const bodyWeight = Array.isArray(charts.bodyWeight)
    ? charts.bodyWeight
    : []

  const muscleGroups = Array.isArray(charts.muscleGroups)
    ? charts.muscleGroups
    : []

  const selectedExerciseTimeline = Array.isArray(charts.selectedExerciseTimeline)
    ? charts.selectedExerciseTimeline
    : []

  const recentWorkouts = Array.isArray(recent.workouts)
    ? recent.workouts
    : []

  const recentSetRows = useMemo(() => {
    return getAllRecentSetRows(recentWorkouts)
  }, [recentWorkouts])

  const validRecentSetRows = useMemo(() => {
    return recentSetRows.filter((row) => row.isValid)
  }, [recentSetRows])

  const strongestRecentSet = useMemo(() => {
    return validRecentSetRows
      .slice()
      .sort((a, b) => b.weight - a.weight || b.reps - a.reps)[0] || null
  }, [validRecentSetRows])

  const biggestVolumeRecentSet = useMemo(() => {
    return validRecentSetRows
      .slice()
      .sort((a, b) => b.volume - a.volume)[0] || null
  }, [validRecentSetRows])

  const latestWorkout = recentWorkouts[0] || null

  return (
    <>
      <PageHeader
        title="Evolução"
        description="Acompanhe peso, volume, frequência, PRs, fotos, séries e histórico detalhado."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={source === 'database' ? 'purple' : 'default'}>
              {loading
                ? 'Carregando...'
                : source === 'database'
                  ? 'Sincronizado'
                  : 'Local'}
            </Badge>

            <Button
              type="button"
              variant="secondary"
              onClick={() => setRefreshKey((key) => key + 1)}
              disabled={loading}
            >
              <RefreshCcw size={16} />
              Atualizar
            </Button>
          </div>
        }
      />

      {!progressData ? (
        <Card>
          <EmptyState
            title="Sem dados de evolução"
            description="Finalize treinos, registre seu peso ou envie fotos para começar a acompanhar sua evolução."
            action={
              <Link to="/workouts">
                <Button>Ir para treinos</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <ProgressSummaryCards summary={summary} insights={insights} />

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DetailStat
              icon={Medal}
              label="Melhor série recente"
              value={strongestRecentSet ? formatWeight(strongestRecentSet.weight) : '—'}
              description={
                strongestRecentSet
                  ? `${strongestRecentSet.exerciseName} • Série ${strongestRecentSet.setNumber} • ${strongestRecentSet.reps} reps • ${formatDate(strongestRecentSet.date)}`
                  : 'Sem séries recentes válidas.'
              }
            />

            <DetailStat
              icon={Flame}
              label="Maior volume recente"
              value={biggestVolumeRecentSet ? formatVolume(biggestVolumeRecentSet.volume) : '—'}
              description={
                biggestVolumeRecentSet
                  ? `${biggestVolumeRecentSet.exerciseName} • ${formatWeight(biggestVolumeRecentSet.weight)} × ${biggestVolumeRecentSet.reps}`
                  : 'Sem volume recente.'
              }
            />

            <DetailStat
              icon={Clock3}
              label="Último treino"
              value={latestWorkout?.workoutName || '—'}
              description={
                latestWorkout
                  ? `${formatLongDate(getSessionDate(latestWorkout))} • ${formatDuration(latestWorkout.durationSeconds || latestWorkout.duration)}`
                  : 'Nenhum treino recente encontrado.'
              }
            />

            <DetailStat
              icon={Target}
              label="Séries recentes"
              value={validRecentSetRows.length}
              description="Quantidade de séries válidas nos últimos treinos retornados pela rota de evolução."
            />
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
            <BodyWeightChart data={bodyWeight} accentColor={chartAccentColor} />

            <MuscleGroupChart data={muscleGroups} accentColor={chartAccentColor} />
          </section>

          <TrainingVolumeChart data={weeklyProgress} accentColor={chartAccentColor} />

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
            <MonthlyProgressChart
              data={monthlyProgress}
              accentColor={chartAccentColor}
            />

            <SetVolumeScatterChart
              data={recentSetRows}
              accentColor={chartAccentColor}
            />
          </section>

          <ExercisePrChart
            exerciseOptions={exerciseOptions}
            selectedExercise={selectedExercise}
            onSelectExercise={setSelectedExercise}
            timeline={selectedExerciseTimeline}
            accentColor={chartAccentColor}
          />

          <ExercisePrTable
            data={exerciseOptions}
            onSelectExercise={setSelectedExercise}
          />

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <RecentWorkoutDetails workouts={recentWorkouts} />

            <BodyWeightLog data={bodyWeight} />
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
            <Card>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[var(--ff-text)]">
                    Fotos recentes
                  </h2>

                  <p className="mt-1 text-sm text-[var(--ff-muted)]">
                    Últimos registros visuais da sua evolução.
                  </p>
                </div>

                <Link to="/progress-photos">
                  <Button variant="secondary">
                    <Camera size={16} />
                    Ver fotos
                  </Button>
                </Link>
              </div>

              <div className="mt-5">
                {!recent.progressPhotos || recent.progressPhotos.length === 0 ? (
                  <EmptyState
                    title="Sem fotos"
                    description="Envie fotos de evolução para complementar seus gráficos."
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {recent.progressPhotos.slice(0, 8).map((photo) => (
                      <Link
                        key={photo._id || photo.id}
                        to="/progress-photos"
                        className="group overflow-hidden rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] transition hover:scale-[1.02] hover:border-[var(--ff-accent-border)]"
                      >
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={photo.imageUrl}
                            alt="Foto de evolução"
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                        </div>

                        <div className="p-2">
                          <p className="truncate text-xs font-bold text-[var(--ff-text)]">
                            {formatDate(photo.date)}
                          </p>

                          {photo.weight !== null && photo.weight !== undefined && (
                            <p className="text-[11px] text-[var(--ff-muted)]">
                              {formatWeight(photo.weight)}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[var(--ff-text)]">
                    Leitura rápida
                  </h2>

                  <p className="mt-1 text-sm text-[var(--ff-muted)]">
                    Um resumo textual para entender os números sem depender só dos gráficos.
                  </p>
                </div>

                <Info size={24} className="text-[var(--ff-accent-text)]" />
              </div>

              <div className="mt-5 space-y-3 text-sm leading-relaxed text-[var(--ff-muted)]">
                <p>
                  Você tem <strong className="text-[var(--ff-text)]">{summary.totalFinishedWorkouts || 0}</strong> treino(s)
                  finalizado(s), com volume total de{' '}
                  <strong className="text-[var(--ff-accent-text)]">{formatVolume(summary.totalVolume || 0)}</strong>.
                </p>

                <p>
                  Seu volume médio por treino está em{' '}
                  <strong className="text-[var(--ff-text)]">{formatVolume(summary.averageVolumePerWorkout || 0)}</strong>,
                  e sua duração média é de{' '}
                  <strong className="text-[var(--ff-text)]">{formatDuration(summary.averageDurationSeconds || 0)}</strong>.
                </p>

                {insights.mostTrainedMuscle && (
                  <p>
                    O grupo com maior volume/séries no período é{' '}
                    <strong className="text-[var(--ff-accent-text)]">{insights.mostTrainedMuscle.muscleGroup}</strong>,
                    com {insights.mostTrainedMuscle.sets || 0} série(s).
                  </p>
                )}

                {insights.bestWeightPr && (
                  <p>
                    Sua maior carga registrada foi em{' '}
                    <strong className="text-[var(--ff-text)]">{insights.bestWeightPr.exerciseName}</strong>:
                    {' '}
                    <strong className="text-[var(--ff-accent-text)]">{formatWeight(insights.bestWeightPr.bestWeight)}</strong>
                    {' '}por {insights.bestWeightPr.bestWeightReps || 0} rep(s), no treino{' '}
                    <strong className="text-[var(--ff-text)]">{insights.bestWeightPr.bestWeightWorkoutName || 'Treino'}</strong>.
                  </p>
                )}

                {insights.bestVolumePr && (
                  <p>
                    A melhor série em volume foi em{' '}
                    <strong className="text-[var(--ff-text)]">{insights.bestVolumePr.exerciseName}</strong>,
                    somando <strong className="text-[var(--ff-warning-text)]">{formatVolume(insights.bestVolumePr.bestVolume)}</strong>.
                  </p>
                )}
              </div>
            </Card>
          </section>
        </div>
      )}
    </>
  )
}

export default Progress
