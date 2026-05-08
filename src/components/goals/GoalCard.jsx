import {
  Archive,
  CheckCircle2,
  Dumbbell,
  Edit3,
  Flag,
  ImagePlus,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Weight,
} from 'lucide-react'

import Badge from '../ui/Badge'
import Button from '../ui/Button'
import GoalProgressBar from './GoalProgressBar'

export function getGoalTypeLabel(type) {
  const labels = {
    weekly_workouts: 'Treinos na semana',
    monthly_workouts: 'Treinos no mês',
    body_weight: 'Peso corporal',
    exercise_pr_weight: 'PR de exercício',
    monthly_volume: 'Volume mensal',
    progress_photos: 'Fotos de evolução',
    custom: 'Personalizada',
  }

  return labels[type] || 'Personalizada'
}

export function getGoalTypeIcon(type) {
  const icons = {
    weekly_workouts: Dumbbell,
    monthly_workouts: Dumbbell,
    body_weight: Weight,
    exercise_pr_weight: Target,
    monthly_volume: TrendingUp,
    progress_photos: ImagePlus,
    custom: Flag,
  }

  return icons[type] || Flag
}

export function formatGoalValue(value, unit = '') {
  const number = Number(value || 0)
  const formatted = number.toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
  })

  if (!unit) return formatted

  return `${formatted}${unit}`
}

function formatDate(dateString) {
  if (!dateString) return null

  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function GoalCard({ goal, onEdit, onDelete, onComplete, onArchive }) {
  const Icon = getGoalTypeIcon(goal.type)
  const progress = Number(goal.progressPercent || 0)
  const isCompleted = goal.status === 'completed' || goal.isCompleted
  const isArchived = goal.status === 'archived'
  const DirectionIcon = goal.direction === 'decrease' ? TrendingDown : TrendingUp

  return (
    <div
      className={
        isArchived
          ? 'rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5 opacity-70'
          : isCompleted
            ? 'rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 shadow-[0_0_24px_rgba(16,185,129,.12)]'
            : 'rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--ff-accent-border)] hover:shadow-[0_0_26px_var(--ff-accent-shadow)]'
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
            <Icon size={23} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="line-clamp-2 text-lg font-black text-[var(--ff-text)]">
                {goal.title}
              </h3>

              {isCompleted && (
                <Badge variant="success">Concluída</Badge>
              )}

              {isArchived && <Badge>Arquivada</Badge>}
            </div>

            <p className="mt-1 text-sm text-[var(--ff-muted)]">
              {getGoalTypeLabel(goal.type)}
              {goal.exerciseName ? ` • ${goal.exerciseName}` : ''}
            </p>
          </div>
        </div>

        <Badge variant="purple">
          {Math.min(100, progress)}%
        </Badge>
      </div>

      {goal.description && (
        <p className="mt-4 text-sm leading-relaxed text-[var(--ff-muted)]">
          {goal.description}
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">
            Atual
          </p>
          <p className="mt-1 text-lg font-black text-[var(--ff-text)]">
            {formatGoalValue(goal.currentValue, goal.unit)}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">
            Meta
          </p>
          <p className="mt-1 text-lg font-black text-[var(--ff-accent-text)]">
            {formatGoalValue(goal.targetValue, goal.unit)}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <GoalProgressBar value={progress} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--ff-muted)]">
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-2.5 py-1 font-bold">
          <DirectionIcon size={13} />
          {goal.direction === 'decrease' ? 'Diminuir até a meta' : 'Aumentar até a meta'}
        </span>

        {goal.period && goal.period !== 'none' && (
          <span className="rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-2.5 py-1 font-bold">
            {goal.period === 'weekly' ? 'Semanal' : 'Mensal'}
          </span>
        )}

        {goal.deadline && (
          <span className="rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-2.5 py-1 font-bold">
            Até {formatDate(goal.deadline)}
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button type="button" variant="secondary" onClick={() => onEdit(goal)}>
          <Edit3 size={15} />
          Editar
        </Button>

        {!isCompleted && (
          <Button type="button" variant="secondary" onClick={() => onComplete(goal)}>
            <CheckCircle2 size={15} />
            Concluir
          </Button>
        )}

        {!isArchived && (
          <Button type="button" variant="secondary" onClick={() => onArchive(goal)}>
            <Archive size={15} />
            Arquivar
          </Button>
        )}

        <Button type="button" variant="danger" onClick={() => onDelete(goal)}>
          <Trash2 size={15} />
          Excluir
        </Button>
      </div>
    </div>
  )
}

export default GoalCard
