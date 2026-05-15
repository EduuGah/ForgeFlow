import { CalendarDays, Trophy } from 'lucide-react'

import Badge from '../../../components/ui/Badge'
import Card from '../../../components/ui/Card'
import { formatDate } from '../adminUtils'
import { MiniBarChart, RankingCard } from './AdminDataCards'

function StatGrid({ cards, columnsClass = 'grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6' }) {
  return (
    <div className={`grid ${columnsClass}`}>
      {cards.map(([label, value, Icon]) => (
        <Card key={label} className="ff-admin-stat-card p-4">
          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-black uppercase tracking-[0.14em] text-[var(--ff-muted)]">
                {label}
              </p>
              <p className="mt-2 break-words text-xl font-black leading-tight text-[var(--ff-text)] sm:text-2xl">
                {value}
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
              <Icon size={19} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function SystemStatGrid({ cards }) {
  return (
    <details className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4">
      <summary className="cursor-pointer text-sm font-black text-[var(--ff-text)]">
        Métricas de sistema
      </summary>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map(([label, value, Icon]) => (
          <Card key={label} className="ff-admin-stat-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-black uppercase tracking-[0.14em] text-[var(--ff-muted)]">
                  {label}
                </p>
                <p className="mt-2 break-words text-xl font-black leading-tight text-[var(--ff-text)]">
                  {value}
                </p>
              </div>

              <Icon size={18} className="shrink-0 text-[var(--ff-accent-text)]" />
            </div>
          </Card>
        ))}
      </div>
    </details>
  )
}

export default function AdminOverviewSection({
  overviewCards,
  systemCards,
  analytics,
  analyticsDays,
  analyticsSeries,
  recentLogins,
  topWorkoutUsers,
}) {
  return (
    <section className="space-y-5">
      <StatGrid cards={overviewCards} />

      <SystemStatGrid cards={systemCards} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <MiniBarChart
          title="Acessos por dia"
          description={`Últimos ${analytics?.period?.days || analyticsDays} dias`}
          series={analyticsSeries.logins || []}
        />

        <MiniBarChart
          title="Novos usuários"
          description="Cadastros por dia"
          series={analyticsSeries.newUsers || []}
        />

        <MiniBarChart
          title="Treinos finalizados"
          description="Históricos salvos por dia"
          series={analyticsSeries.history || []}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-[var(--ff-text)]">
                Últimos acessos
              </h3>
              <p className="mt-1 text-xs text-[var(--ff-muted)]">
                Entradas recentes registradas pelo sistema.
              </p>
            </div>

            <CalendarDays size={19} className="text-[var(--ff-accent-text)]" />
          </div>

          <div className="mt-4 space-y-2">
            {recentLogins.length === 0 ? (
              <p className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 text-sm text-[var(--ff-muted)]">
                Nenhum acesso registrado ainda.
              </p>
            ) : (
              recentLogins.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[var(--ff-text)]">
                      {item.email}
                    </p>
                    <p className="text-xs text-[var(--ff-muted)]">
                      {item.provider} · {formatDate(item.createdAt, true)}
                    </p>
                  </div>

                  <Badge>{item.provider}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <RankingCard
          title="Top treinos"
          description="Ranking rápido por treinos finalizados."
          icon={Trophy}
          items={topWorkoutUsers}
          valueLabel="treinos"
          empty="Nenhum histórico encontrado ainda."
        />
      </div>
    </section>
  )
}
