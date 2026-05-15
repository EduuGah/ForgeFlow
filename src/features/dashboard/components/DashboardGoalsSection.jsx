import { Link } from 'react-router-dom'
import { ChevronRight, Flag, Target } from 'lucide-react'

import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import DashboardSectionIntro from './DashboardSectionIntro'

function DashboardGoalsSection({ dashboardGoals, goals }) {
  return (
    <>
      {/* Metas e notificações aparecem depois do resumo principal para não empurrar o Dashboard para baixo. */}
      <DashboardSectionIntro eyebrow="Metas" title="Próximos objetivos" description="Aqui ficam suas metas ativas e o que está mais perto de ser concluído." />

      <section id="dashboard-goals" className="scroll-mt-24 mb-8 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-3 py-1 text-xs font-black text-[var(--ff-accent-text)]">
                <Target size={14} />
                Metas ativas
              </div>

              <h2 className="mt-3 text-xl font-black text-[var(--ff-text)]">
                Seus próximos objetivos
              </h2>

              <p className="mt-1 text-sm text-[var(--ff-muted)]">
                Acompanhe metas automáticas como treinos semanais, volume mensal, peso corporal e PRs.
              </p>
            </div>

            <Link to="/goals">
              <Button variant="secondary">
                Ver metas
                <ChevronRight size={16} />
              </Button>
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            {dashboardGoals.length === 0 ? (
              <div className="md:col-span-3 rounded-2xl border border-dashed border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 text-sm text-[var(--ff-muted)]">
                Nenhuma meta criada ainda. Crie metas para treinar, evoluir peso, bater PRs ou registrar fotos.
              </div>
            ) : (
              dashboardGoals.map((goal) => (
                <Link
                  key={goal.id || goal._id}
                  to="/goals"
                  className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-card-hover)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-1 font-black text-[var(--ff-text)]">
                        {goal.title}
                      </p>

                      <p className="mt-1 text-xs text-[var(--ff-muted)]">
                        {Number(goal.currentValue || 0).toLocaleString('pt-BR')}
                        {goal.unit || ''} / {Number(goal.targetValue || 0).toLocaleString('pt-BR')}
                        {goal.unit || ''}
                      </p>
                    </div>

                    <Badge variant="purple">
                      {Math.min(100, Number(goal.progressPercent || 0))}%
                    </Badge>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--ff-border)]">
                    <div
                      className="h-full rounded-full bg-[var(--ff-accent)]"
                      style={{ width: `${Math.min(100, Number(goal.progressPercent || 0))}%` }}
                    />
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Link
          to="/goals"
          className="flex min-h-[150px] flex-col justify-between rounded-3xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] p-5 text-[var(--ff-accent-text)] transition hover:-translate-y-0.5 hover:shadow-[0_0_22px_var(--ff-accent-shadow)]"
        >
          <Flag size={26} />
          <div>
            <p className="text-3xl font-black">{goals.filter((goal) => goal.status === 'active').length}</p>
            <p className="text-sm font-bold">metas ativas</p>
          </div>
        </Link>
      </section>
    </>
  )
}

export default DashboardGoalsSection
