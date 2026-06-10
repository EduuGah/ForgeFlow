import { Link } from 'react-router-dom'
import { LineChart, Play, Sparkles } from 'lucide-react'

import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'

function DashboardTopSection({
  dashboardSource,
  loadingDashboard,
  history,
  recentPRs,
  formatShortDate,
}) {
  const hasHistory = history.length > 0
  const statusLabel = loadingDashboard
    ? 'Carregando'
    : dashboardSource === 'database'
      ? 'Sync'
      : 'Local'

  return (
    <section className="ff-dashboard-top-strip grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
      <Card className="ff-dashboard-focus-card overflow-hidden border-[var(--ff-accent-border)]/25 bg-[linear-gradient(135deg,var(--ff-card),var(--ff-surface-2))] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--ff-accent-text)]">
                Hoje
              </p>
              <Badge variant={dashboardSource === 'database' ? 'purple' : 'default'}>
                {statusLabel}
              </Badge>
            </div>

            <h2 className="mt-2 text-xl font-black tracking-tight text-[var(--ff-text)]">
              {hasHistory ? 'Continue evoluindo hoje' : 'Comece seu primeiro treino'}
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--ff-muted)]">
              {hasHistory
                ? `${history.length} treino${history.length === 1 ? '' : 's'} no historico. Volte rapido ao treino ou confira seus PRs.`
                : 'Crie uma rotina, registre o treino e deixe o ForgeFlow montar seu resumo.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:min-w-[230px]">
            <Link
              to="/workouts"
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-4 text-sm font-black text-white"
            >
              <Play size={17} />
              Treinar
            </Link>

            <Link
              to="/exercise-progress"
              className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm font-black text-[var(--ff-text-soft)]"
            >
              <LineChart size={17} />
              PRs
            </Link>
          </div>
        </div>
      </Card>

      <Card className="ff-dashboard-pr-strip p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-yellow-400/25 bg-yellow-500/10 text-yellow-200">
            <Sparkles size={19} />
          </div>

          <div>
            <p className="text-sm font-black text-[var(--ff-text)]">Destaques</p>
            <p className="text-xs text-[var(--ff-muted)]">PRs recentes</p>
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          {recentPRs.length > 0 ? (
            recentPRs.slice(0, 2).map((pr, index) => (
              <div
                key={`${pr.exerciseName}-${index}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[var(--ff-text)]">
                    {pr.exerciseName}
                  </p>
                  <p className="text-xs text-[var(--ff-muted)]">
                    {formatShortDate(pr.date)}
                  </p>
                </div>

                <span className="shrink-0 rounded-full border border-yellow-400/30 bg-yellow-500/10 px-2.5 py-1 text-xs font-black text-yellow-200">
                  PR
                </span>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 text-sm text-[var(--ff-muted)]">
              Registre treinos para ver marcas recentes.
            </p>
          )}
        </div>
      </Card>
    </section>
  )
}

export default DashboardTopSection
