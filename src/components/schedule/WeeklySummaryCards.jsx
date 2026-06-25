import { BellRing, Dumbbell, Moon, Sparkles } from 'lucide-react'

function SummaryCard({ icon: Icon, label, value, detail, tone = 'default' }) {
  return (
    <article className={`ff-schedule-v2-summary-card is-${tone}`}>
      <span className="ff-schedule-v2-summary-card__icon">
        <Icon size={17} />
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

function WeeklySummaryCards({ summary, alertCount }) {
  return (
    <section className="ff-schedule-v2-summary-grid" aria-label="Resumo semanal">
      <SummaryCard
        icon={Dumbbell}
        label="Treinos"
        value={`${summary.workoutDays}/7`}
        detail="dias planejados"
        tone="accent"
      />
      <SummaryCard
        icon={Moon}
        label="Descanso"
        value={summary.restDays}
        detail={summary.restDays === 1 ? 'dia marcado' : 'dias marcados'}
      />
      <SummaryCard
        icon={BellRing}
        label="Alertas"
        value={alertCount}
        detail={alertCount === 1 ? 'ativo' : 'ativos'}
      />
      <SummaryCard
        icon={Sparkles}
        label="Vazios"
        value={summary.emptyDays}
        detail="sem configuração"
      />
    </section>
  )
}

export default WeeklySummaryCards
