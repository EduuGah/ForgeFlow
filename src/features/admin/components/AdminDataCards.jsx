import { LineChart, Trophy } from 'lucide-react'

import Card from '../../../components/ui/Card'
import { formatDate, formatShortDate, getSeriesMax } from '../adminUtils'

export function MiniBarChart({ title, description, series = [], valueKey = 'count' }) {
  const max = getSeriesMax(series, valueKey)

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-[var(--ff-text)]">{title}</h3>
          {description && (
            <p className="mt-1 text-xs text-[var(--ff-muted)]">{description}</p>
          )}
        </div>

        <LineChart size={19} className="text-[var(--ff-accent-text)]" />
      </div>

      <div className="mt-4 flex h-28 items-end gap-1.5 overflow-hidden rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
        {series.length === 0 || series.every((item) => Number(item?.[valueKey] || 0) === 0) ? (
          <div className="flex h-full w-full items-center justify-center text-center text-xs font-bold text-[var(--ff-muted)]">
            Sem dados neste período
          </div>
        ) : (
          series.map((item) => {
            const value = Number(item?.[valueKey] || 0)
            const height = Math.max(6, Math.round((value / max) * 100))

            return (
              <div
                key={item.date}
                className="group relative flex min-w-[10px] flex-1 items-end justify-center"
                title={`${formatShortDate(item.date)}: ${value}`}
              >
                <div
                  className="w-full max-w-5 rounded-t-lg bg-[var(--ff-accent)]/75 transition group-hover:bg-[var(--ff-accent)]"
                  style={{ height: `${height}%` }}
                />
              </div>
            )
          })
        )}
      </div>

      <div className="mt-2 flex justify-between text-[10px] font-bold text-[var(--ff-muted)]">
        <span>{formatShortDate(series[0]?.date)}</span>
        <span>{formatShortDate(series[series.length - 1]?.date)}</span>
      </div>
    </Card>
  )
}

export function RankingCard({
  title,
  description,
  icon: Icon = Trophy,
  items = [],
  valueLabel = '',
  formatValue = (value) => value,
  empty = 'Sem dados neste período.',
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-[var(--ff-text)]">{title}</h3>
          {description && (
            <p className="mt-1 text-xs text-[var(--ff-muted)]">{description}</p>
          )}
        </div>

        <Icon size={19} className="text-[var(--ff-accent-text)]" />
      </div>

      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 text-sm text-[var(--ff-muted)]">
            {empty}
          </p>
        ) : (
          items.map((item, index) => (
            <div
              key={item.userId || item.email || item.id || index}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[var(--ff-text)]">
                  {index + 1}. {item.name || 'Usuário'}
                </p>
                <p className="truncate text-xs text-[var(--ff-muted)]">
                  {item.email || 'sem e-mail'}
                </p>
                {item.lastLoginAt && (
                  <p className="truncate text-[11px] text-[var(--ff-muted-2)]">
                    Último acesso: {formatDate(item.lastLoginAt, true)}
                  </p>
                )}
                {item.updatedAt && (
                  <p className="truncate text-[11px] text-[var(--ff-muted-2)]">
                    Atualizado: {formatDate(item.updatedAt, true)}
                  </p>
                )}
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-black text-[var(--ff-text)]">
                  {formatValue(item.value ?? item.count ?? item.exerciseCount ?? 0)}
                </p>
                <p className="text-[11px] text-[var(--ff-muted)]">
                  {valueLabel}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
