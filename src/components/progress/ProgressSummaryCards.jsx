import {
  Activity,
  Dumbbell,
  Timer,
  Trophy,
  Weight,
} from 'lucide-react'

import Card from '../ui/Card'

export function formatVolume(value) {
  return `${Number(value || 0).toLocaleString('pt-BR')}kg`
}

export function formatDuration(seconds) {
  const totalSeconds = Number(seconds) || 0
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (hours > 0) return `${hours}h ${minutes}min`

  return `${minutes}min`
}

export function formatWeight(value) {
  if (value === null || value === undefined || value === '') return '—'

  return `${Number(value).toLocaleString('pt-BR')}kg`
}

export function formatSignedWeight(value) {
  const number = Number(value || 0)

  if (number > 0) return `+${number.toLocaleString('pt-BR')}kg`
  if (number < 0) return `${number.toLocaleString('pt-BR')}kg`

  return '0kg'
}

function SummaryCard({ title, value, description, icon: Icon, accent = false }) {
  return (
    <Card className="ff-progress-summary-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--ff-muted)]">
          {title}
        </p>

        <Icon size={20} className="text-[var(--ff-accent-text)]" />
      </div>

      <h2
        className={
          accent
            ? 'mt-2 text-2xl font-black text-[var(--ff-accent-text)] sm:text-3xl'
            : 'mt-2 text-2xl font-black text-[var(--ff-text)] sm:text-3xl'
        }
      >
        {value}
      </h2>

      <p className="mt-2 text-xs font-semibold text-[var(--ff-muted)]">
        {description}
      </p>
    </Card>
  )
}

function InsightCard({ title, value, description, icon: Icon }) {
  return (
    <Card className="ff-progress-insight-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--ff-muted)]">
            {title}
          </p>

          <h3 className="mt-2 line-clamp-1 text-xl font-black text-[var(--ff-text)]">
            {value}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm text-[var(--ff-muted)]">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
          <Icon size={19} />
        </div>
      </div>
    </Card>
  )
}

function ProgressSummaryCards({ summary = {}, insights = {} }) {
  return (
    <div className="space-y-6">
      <section className="ff-progress-summary-grid grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Treinos finalizados"
          value={summary.totalFinishedWorkouts || 0}
          description="sessões registradas"
          icon={Dumbbell}
        />

        <SummaryCard
          title="Volume total"
          value={formatVolume(summary.totalVolume)}
          description="peso × reps"
          icon={Weight}
          accent
        />

        <SummaryCard
          title="Peso atual"
          value={formatWeight(summary.currentWeight)}
          description={`${formatSignedWeight(summary.weightChange)} desde o início`}
          icon={Activity}
        />

        <SummaryCard
          title="Tempo total"
          value={formatDuration(summary.totalDurationSeconds)}
          description="treinando"
          icon={Timer}
        />
      </section>

      <section className="ff-progress-insight-grid grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          title="Melhor semana"
          value={insights.bestWeek?.week || '—'}
          description={
            insights.bestWeek
              ? `${formatVolume(insights.bestWeek.volume)} • ${insights.bestWeek.workouts} treino(s)`
              : 'Sem dados suficientes'
          }
          icon={Trophy}
        />

        <InsightCard
          title="Grupo mais treinado"
          value={insights.mostTrainedMuscle?.muscleGroup || '—'}
          description={
            insights.mostTrainedMuscle
              ? `${insights.mostTrainedMuscle.sets} séries • ${formatVolume(insights.mostTrainedMuscle.volume)}`
              : 'Sem dados suficientes'
          }
          icon={Activity}
        />

        <InsightCard
          title="Maior carga"
          value={insights.bestWeightPr ? `${insights.bestWeightPr.bestWeight}kg` : '—'}
          description={insights.bestWeightPr?.exerciseName || 'Sem PR registrado'}
          icon={Weight}
        />

        <InsightCard
          title="Maior volume em série"
          value={insights.bestVolumePr ? formatVolume(insights.bestVolumePr.bestVolume) : '—'}
          description={insights.bestVolumePr?.exerciseName || 'Sem PR registrado'}
          icon={Trophy}
        />
      </section>
    </div>
  )
}

export default ProgressSummaryCards
