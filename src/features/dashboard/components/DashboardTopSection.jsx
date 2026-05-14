import { Link } from 'react-router-dom'
import { LineChart, Play, Sparkles } from 'lucide-react'

import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'

function DashboardTopSection({
  dashboardSource,
  loadingDashboard,
  history,
  recentPRs,
  formatShortDate,
}) {
  return (
    <>
<PageHeader
  title="Dashboard"
  description={
    dashboardSource === 'database'
      ? 'Resumo geral da sua evolução com dados sincronizados do banco.'
      : 'Resumo geral da sua evolução usando dados locais.'
  }
  action={
    <div className="flex items-center gap-3">
      <Badge variant={dashboardSource === 'database' ? 'purple' : 'default'}>
        {loadingDashboard
          ? 'Carregando...'
          : dashboardSource === 'database'
            ? 'Sincronizado'
            : 'Local'}
      </Badge>

      <Link to="/workouts">
        <button
          type="button"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-5 text-sm font-bold text-white shadow-[0_0_20px_var(--ff-accent-shadow)] transition hover:bg-[var(--ff-accent-hover)] hover:shadow-[0_0_20px_var(--ff-accent-shadow)]"
        >
          <Play size={18} />
          Novo treino
        </button>
      </Link>
    </div>
  }
/>

<section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
  <Card className="overflow-hidden border-[var(--ff-accent-border)]/30 bg-[linear-gradient(135deg,var(--ff-card),var(--ff-surface-2))] p-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--ff-accent-text)]">
          Início personalizado
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--ff-text)]">
          {history.length > 0 ? 'Continue evoluindo hoje' : 'Comece sua jornada no ForgeFlow'}
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ff-muted)]">
          {history.length > 0
            ? `Você já registrou ${history.length} treino${history.length === 1 ? '' : 's'}. Use o painel para voltar ao treino, acompanhar PRs e revisar seu progresso.`
            : 'Crie sua primeira rotina, inicie o treino e acompanhe evolução, PRs e histórico.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:min-w-[260px]">
        <Link
          to="/workouts"
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-4 text-sm font-black text-white shadow-[0_0_18px_var(--ff-accent-shadow)]"
        >
          <Play size={17} />
          Treinar
        </Link>

        <Link
          to="/exercise-progress"
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm font-black text-[var(--ff-text-soft)]"
        >
          <LineChart size={17} />
          PRs
        </Link>
      </div>
    </div>
  </Card>

  <Card className="p-5">
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-yellow-400/25 bg-yellow-500/10 text-yellow-200">
        <Sparkles size={20} />
      </div>

      <div>
        <p className="text-sm font-black text-[var(--ff-text)]">
          Ranking rápido
        </p>
        <p className="text-xs text-[var(--ff-muted)]">
          Seus destaques recentes
        </p>
      </div>
    </div>

    <div className="ff-dashboard-hero-card mt-4 space-y-2">
      {recentPRs.length > 0 ? (
        recentPRs.slice(0, 3).map((pr, index) => (
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
          Registre treinos para montar seu ranking.
        </p>
      )}
    </div>
  </Card>
</section>



<nav className="mb-6 rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.18)]">
  <p className="px-2 pb-2 text-xs font-black uppercase tracking-wide text-[var(--ff-muted)]">
    Mapa rápido
  </p>

  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
    <a href="#dashboard-overview" className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 py-2 text-center text-xs font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]">
      Resumo
    </a>
    <a href="#dashboard-goals" className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 py-2 text-center text-xs font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]">
      Metas
    </a>
    <a href="#dashboard-today" className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 py-2 text-center text-xs font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]">
      Hoje
    </a>
    <a href="#dashboard-performance" className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 py-2 text-center text-xs font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]">
      Evolução
    </a>
    <a href="#dashboard-prs" className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 py-2 text-center text-xs font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]">
      PRs
    </a>
    <a href="#dashboard-notifications" className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 py-2 text-center text-xs font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]">
      Alertas
    </a>
  </div>
</nav>
    </>
  )
}

export default DashboardTopSection
