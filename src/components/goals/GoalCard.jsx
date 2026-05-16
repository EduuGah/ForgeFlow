import {
  Archive,
  CheckCircle2,
  Edit3,
  RotateCcw,
  Target,
  Trash2,
} from 'lucide-react'

import Badge from '../ui/Badge'
import Card from '../ui/Card'
import GoalProgressBar from './GoalProgressBar'

const GOAL_TYPE_LABELS = {
  weekly_workouts: 'Treinos na semana',
  monthly_workouts: 'Treinos no mês',
  body_weight: 'Peso corporal',
  exercise_pr_weight: 'PR de exercício',
  monthly_volume: 'Volume mensal',
  progress_photos: 'Fotos no mês',
  custom: 'Personalizada',
}

const STATUS_LABELS = {
  active: 'Ativa',
  completed: 'Concluída',
  archived: 'Arquivada',
}

function formatDate(dateString) {
  if (!dateString) return ''

  return new Date(`${String(dateString).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function getGoalTypeLabel(type) {
  return GOAL_TYPE_LABELS[type] || 'Meta'
}

function getStatusVariant(status) {
  if (status === 'completed') return 'green'
  if (status === 'archived') return 'default'

  return 'purple'
}

function getGoalExplanation(goal) {
  if (goal.type === 'weekly_workouts') {
    return `O app conta automaticamente quantos treinos você finalizou nesta semana.`
  }

  if (goal.type === 'monthly_workouts') {
    return `O app conta automaticamente quantos treinos você finalizou neste mês.`
  }

  if (goal.type === 'body_weight') {
    return `O app usa seu último peso registrado.`
  }

  if (goal.type === 'exercise_pr_weight') {
    return `O app procura sua maior carga registrada em ${goal.exerciseName || 'um exercício'}.`
  }

  if (goal.type === 'monthly_volume') {
    return `O app soma o volume dos treinos finalizados neste mês.`
  }

  if (goal.type === 'progress_photos') {
    return `O app conta quantas fotos de evolução você registrou neste mês.`
  }

  return `Você atualiza o valor atual manualmente ao editar a meta.`
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onComplete,
  onArchive,
  onUnarchive,
  onReactivate,
}) {
  const isCompleted = goal.status === 'completed' || goal.isCompleted
  const isArchived = goal.status === 'archived'
  const canComplete = !isCompleted && !isArchived

  return (
    <Card className={isArchived ? 'opacity-75' : ''}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="purple">
              {getGoalTypeLabel(goal.type)}
            </Badge>

            <Badge variant={getStatusVariant(goal.status)}>
              {STATUS_LABELS[goal.status] || 'Ativa'}
            </Badge>

            {goal.deadline && (
              <Badge>
                Prazo: {formatDate(goal.deadline)}
              </Badge>
            )}
          </div>

          <h2 className="mt-3 text-xl font-black text-[var(--ff-text)]">
            {goal.title}
          </h2>

          {goal.description && (
            <p className="mt-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              {goal.description}
            </p>
          )}

          {goal.exerciseName && (
            <p className="mt-2 text-sm font-bold text-[var(--ff-accent-text)]">
              Exercício: {goal.exerciseName}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(goal)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]"
            title="Editar meta"
          >
            <Edit3 size={17} />
          </button>

          {canComplete && (
            <button
              type="button"
              onClick={() => onComplete(goal)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-[var(--ff-success-text)] transition hover:bg-emerald-500/15"
              title="Concluir meta"
            >
              <CheckCircle2 size={17} />
            </button>
          )}

          {isCompleted && (
            <button
              type="button"
              onClick={() => onReactivate(goal)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] transition hover:bg-[var(--ff-accent-soft)]/80"
              title="Reativar meta"
            >
              <RotateCcw size={17} />
            </button>
          )}

          {isArchived ? (
            <button
              type="button"
              onClick={() => onUnarchive(goal)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] transition hover:bg-[var(--ff-accent-soft)]/80"
              title="Desarquivar meta"
            >
              <RotateCcw size={17} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onArchive(goal)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]"
              title="Arquivar meta"
            >
              <Archive size={17} />
            </button>
          )}

          <button
            type="button"
            onClick={() => onDelete(goal)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 text-[var(--ff-danger-text)] transition hover:bg-red-500/15"
            title="Excluir meta"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      <div className="mt-5">
        <GoalProgressBar
          currentValue={goal.currentValue}
          targetValue={goal.targetValue}
          unit={goal.unit}
          progressPercent={goal.progressPercent}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
            <Target size={18} />
          </div>

          <div>
            <p className="text-sm font-black text-[var(--ff-text)]">
              Como essa meta é calculada?
            </p>

            <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
              {getGoalExplanation(goal)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default GoalCard
