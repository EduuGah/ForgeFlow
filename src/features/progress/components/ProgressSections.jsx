import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  CalendarDays,
  Camera,
  Clock3,
  Dumbbell,
  Flame,
  History,
  Info,
  Medal,
  Sparkles,
  Target,
  Weight,
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
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import { formatDuration, formatVolume } from '../../../components/progress/ProgressSummaryCards'
import {
  formatDate,
  formatLongDate,
  formatWeight,
  getSessionDate,
  getSessionSets,
  getShortMonth,
  getTooltipStyle,
} from '../progressUtils'

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

export function SetVolumeDetails({ data = [] }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [openDateKeys, setOpenDateKeys] = useState([])

  const validRows = useMemo(() => {
    return data
      .filter((row) => row.isValid)
      .slice()
      .reverse()
      .slice(-36)
      .map((row, index) => ({
        ...row,
        index: index + 1,
      }))
  }, [data])

  const groupedRows = useMemo(() => {
    const map = new Map()

    validRows
      .slice()
      .reverse()
      .forEach((row) => {
        const key = row.date ? String(row.date).slice(0, 10) : 'sem-data'
        const current = map.get(key) || {
          key,
          label: formatLongDate(row.date),
          rows: [],
          totalVolume: 0,
        }

        current.rows.push(row)
        current.totalVolume += Number(row.volume || 0)

        map.set(key, current)
      })

    return Array.from(map.values())
  }, [validRows])

  const visibleGroups = isExpanded ? groupedRows : groupedRows.slice(0, 3)
  const defaultOpenKey = groupedRows[0]?.key || null

  const biggestVolume = useMemo(() => {
    return validRows.slice().sort((a, b) => Number(b.volume || 0) - Number(a.volume || 0))[0]
  }, [validRows])

  const biggestWeight = useMemo(() => {
    return validRows.slice().sort((a, b) => Number(b.weight || 0) - Number(a.weight || 0))[0]
  }, [validRows])

  function toggleDateGroup(key) {
    setOpenDateKeys((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    )
  }

  return (
    <ChartShell
      title="Séries recentes detalhadas"
      description="Agrupadas por data, com expansão por dia e scroll interno para a página não ficar longa demais."
      icon={Sparkles}
      badge={`${validRows.length} séries`}
    >
      <div className="mt-5">
        {validRows.length === 0 ? (
          <EmptyState
            title="Sem séries recentes"
            description="Finalize treinos com peso e repetições para gerar detalhes por série."
          />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailStat
                icon={Weight}
                label="Maior carga recente"
                value={biggestWeight ? formatWeight(biggestWeight.weight) : '—'}
                description={
                  biggestWeight
                    ? `${biggestWeight.exerciseName} • Série ${biggestWeight.setNumber} • ${biggestWeight.reps} reps • ${formatDate(biggestWeight.date)}`
                    : 'Sem carga recente.'
                }
              />

              <DetailStat
                icon={Flame}
                label="Maior volume recente"
                value={biggestVolume ? formatVolume(biggestVolume.volume) : '—'}
                description={
                  biggestVolume
                    ? `${biggestVolume.exerciseName} • ${formatWeight(biggestVolume.weight)} × ${biggestVolume.reps} • ${formatDate(biggestVolume.date)}`
                    : 'Sem volume recente.'
                }
              />
            </div>

            <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black text-[var(--ff-text)]">Histórico por data</p>
                  <p className="text-xs text-[var(--ff-muted)]">{groupedRows.length} dia(s) com séries válidas nos registros recentes.</p>
                </div>

                {groupedRows.length > 3 && (
                  <Button type="button" variant="secondary" onClick={() => setIsExpanded((current) => !current)} className="w-full sm:w-auto">
                    {isExpanded ? 'Mostrar menos' : 'Mostrar todos'}
                  </Button>
                )}
              </div>

              <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                {visibleGroups.map((group) => {
                  const isOpen = openDateKeys.includes(group.key) || (openDateKeys.length === 0 && group.key === defaultOpenKey)

                  return (
                    <div key={group.key} className="overflow-hidden rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)]">
                      <button
                        type="button"
                        onClick={() => toggleDateGroup(group.key)}
                        className="flex w-full flex-col gap-2 p-4 text-left transition hover:bg-[var(--ff-card-hover)] sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-black text-[var(--ff-text)]">{group.label}</p>
                          <p className="mt-1 text-xs text-[var(--ff-muted)]">{group.rows.length} série(s) • <span className="inline-block max-w-full break-words">{formatVolume(group.totalVolume)}</span></p>
                        </div>

                        <Badge>{isOpen ? 'Minimizar' : 'Expandir'}</Badge>
                      </button>

                      {isOpen && (
                        <div className="border-t border-[var(--ff-border)] p-3">
                          <div className="space-y-2">
                            {group.rows.map((row) => (
                              <div
                                key={row.id}
                                className="grid grid-cols-2 gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 text-sm lg:grid-cols-[minmax(160px,1fr)_80px_80px_110px]"
                              >
                                <div className="col-span-2 min-w-0 lg:col-span-1">
                                  <p className="truncate font-black text-[var(--ff-text)]">{row.exerciseName}</p>
                                  <p className="mt-1 truncate text-xs text-[var(--ff-muted)]">{row.workoutName} • {row.muscleGroup} • {row.equipment}</p>
                                </div>

                                <div>
                                  <p className="text-[11px] uppercase tracking-wide text-[var(--ff-muted)] lg:hidden">Peso</p>
                                  <p className="font-black text-[var(--ff-accent-text)]">{formatWeight(row.weight)}</p>
                                </div>

                                <div>
                                  <p className="text-[11px] uppercase tracking-wide text-[var(--ff-muted)] lg:hidden">Reps</p>
                                  <p className="font-bold text-[var(--ff-text)]">{row.reps}</p>
                                </div>

                                <div className="col-span-2 flex items-center justify-between gap-2 lg:col-span-1">
                                  <Badge>Série {row.setNumber}</Badge>
                                  <p className="max-w-[120px] break-words text-right font-black text-[var(--ff-warning-text)]">{formatVolume(row.volume)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </ChartShell>
  )
}

export function RecentWorkoutDetails({ workouts = [] }) {
  const [expandedId, setExpandedId] = useState(null)
  const [visibleCount, setVisibleCount] = useState(5)
  const visibleWorkouts = workouts.slice(0, visibleCount)

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

      <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-1">
        {visibleWorkouts.length === 0 ? (
          <EmptyState
            title="Sem treinos recentes"
            description="Finalize treinos para ver detalhes por série."
          />
        ) : (
          visibleWorkouts.map((session) => {
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
                        <table className="w-full min-w-[820px] text-left text-sm">
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

        {visibleCount < workouts.length && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setVisibleCount((current) => current + 5)}
            className="w-full"
          >
            Mostrar mais treinos
          </Button>
        )}
      </div>
    </Card>
  )
}

export function BodyWeightLog({ data = [] }) {
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

      <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-1">
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


export function ProgressQuickLinksSection() {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Link
        to="/exercise-progress"
        className="rounded-3xl border border-yellow-400/25 bg-yellow-500/10 p-4 text-yellow-100 transition hover:border-yellow-400/45"
      >
        <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-200/80">
          Ranking de PRs
        </p>
        <h2 className="mt-2 text-xl font-black">Ver evolução por exercício</h2>
        <p className="mt-2 text-sm text-yellow-100/70">
          Carga, volume e histórico de séries em uma tela dedicada.
        </p>
      </Link>

      <Link
        to="/history"
        className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 transition hover:border-[var(--ff-accent-border)]"
      >
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-accent-text)]">
          Histórico
        </p>
        <h2 className="mt-2 text-xl font-black text-[var(--ff-text)]">Revisar treinos</h2>
        <p className="mt-2 text-sm text-[var(--ff-muted)]">
          Veja sessões antigas e detalhes por data.
        </p>
      </Link>

      <Link
        to="/progress-photos"
        className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 transition hover:border-[var(--ff-accent-border)]"
      >
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-accent-text)]">
          Fotos
        </p>
        <h2 className="mt-2 text-xl font-black text-[var(--ff-text)]">Comparar evolução</h2>
        <p className="mt-2 text-sm text-[var(--ff-muted)]">
          Acompanhe mudanças visuais ao longo do tempo.
        </p>
      </Link>
    </section>
  )
}

export function ProgressRecentHighlights({ recentSetSummary }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DetailStat
        icon={Medal}
        label="Melhor série recente"
        value={recentSetSummary.strongestRecentSet ? formatWeight(recentSetSummary.strongestRecentSet.weight) : '—'}
        description={
          recentSetSummary.strongestRecentSet
            ? `${recentSetSummary.strongestRecentSet.exerciseName} • Série ${recentSetSummary.strongestRecentSet.setNumber} • ${recentSetSummary.strongestRecentSet.reps} reps • ${formatDate(recentSetSummary.strongestRecentSet.date)}`
            : 'Sem séries recentes válidas.'
        }
      />

      <DetailStat
        icon={Flame}
        label="Maior volume recente"
        value={recentSetSummary.biggestVolumeRecentSet ? formatVolume(recentSetSummary.biggestVolumeRecentSet.volume) : '—'}
        description={
          recentSetSummary.biggestVolumeRecentSet
            ? `${recentSetSummary.biggestVolumeRecentSet.exerciseName} • ${formatWeight(recentSetSummary.biggestVolumeRecentSet.weight)} × ${recentSetSummary.biggestVolumeRecentSet.reps}`
            : 'Sem volume recente.'
        }
      />

      <DetailStat
        icon={Clock3}
        label="Último treino"
        value={recentSetSummary.latestWorkout?.workoutName || '—'}
        description={
          recentSetSummary.latestWorkout
            ? `${formatLongDate(getSessionDate(recentSetSummary.latestWorkout))} • ${formatDuration(recentSetSummary.latestWorkout.durationSeconds || recentSetSummary.latestWorkout.duration)}`
            : 'Nenhum treino recente encontrado.'
        }
      />

      <DetailStat
        icon={Target}
        label="Séries recentes"
        value={recentSetSummary.validRecentSetRows.length}
        description="Quantidade de séries válidas nos últimos treinos retornados pela rota de evolução."
      />
    </section>
  )
}

export function ProgressPhotosAndReadingSection({ normalizedProgress }) {
  return (
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
          {normalizedProgress.progressPhotos.length === 0 ? (
            <EmptyState
              title="Sem fotos"
              description="Envie fotos de evolução para complementar seus gráficos."
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {normalizedProgress.progressPhotos.slice(0, 8).map((photo) => (
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
                      loading="lazy"
                      decoding="async"
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
            Você tem <strong className="text-[var(--ff-text)]">{normalizedProgress.summary.totalFinishedWorkouts || 0}</strong> treino(s)
            finalizado(s), com volume total de{' '}
            <strong className="text-[var(--ff-accent-text)]">{formatVolume(normalizedProgress.summary.totalVolume || 0)}</strong>.
          </p>

          <p>
            Seu volume médio por treino está em{' '}
            <strong className="text-[var(--ff-text)]">{formatVolume(normalizedProgress.summary.averageVolumePerWorkout || 0)}</strong>,
            e sua duração média é de{' '}
            <strong className="text-[var(--ff-text)]">{formatDuration(normalizedProgress.summary.averageDurationSeconds || 0)}</strong>.
          </p>

          {normalizedProgress.insights.mostTrainedMuscle && (
            <p>
              O grupo com maior volume/séries no período é{' '}
              <strong className="text-[var(--ff-accent-text)]">{normalizedProgress.insights.mostTrainedMuscle.muscleGroup}</strong>,
              com {normalizedProgress.insights.mostTrainedMuscle.sets || 0} série(s).
            </p>
          )}

          {normalizedProgress.insights.bestWeightPr && (
            <p>
              Sua maior carga registrada foi em{' '}
              <strong className="text-[var(--ff-text)]">{normalizedProgress.insights.bestWeightPr.exerciseName}</strong>:
              {' '}
              <strong className="text-[var(--ff-accent-text)]">{formatWeight(normalizedProgress.insights.bestWeightPr.bestWeight)}</strong>
              {' '}por {normalizedProgress.insights.bestWeightPr.bestWeightReps || 0} rep(s), no treino{' '}
              <strong className="text-[var(--ff-text)]">{normalizedProgress.insights.bestWeightPr.bestWeightWorkoutName || 'Treino'}</strong>.
            </p>
          )}

          {normalizedProgress.insights.bestVolumePr && (
            <p>
              A melhor série em volume foi em{' '}
              <strong className="text-[var(--ff-text)]">{normalizedProgress.insights.bestVolumePr.exerciseName}</strong>,
              somando <strong className="text-[var(--ff-warning-text)]">{formatVolume(normalizedProgress.insights.bestVolumePr.bestVolume)}</strong>.
            </p>
          )}
        </div>
      </Card>
    </section>
  )
}
