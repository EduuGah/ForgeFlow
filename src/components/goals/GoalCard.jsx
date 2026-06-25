import { useMemo, useState } from 'react'
import {
  Archive,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Dumbbell,
  Edit3,
  MoreHorizontal,
  RotateCcw,
  Target,
  Trash2,
  Trophy,
} from 'lucide-react'

import Badge from '../ui/Badge'
import Card from '../ui/Card'
import GoalProgressBar from './GoalProgressBar'
import { formatGoalValue, getGoalDeadlineState, parseLocalDate } from '../../features/goals/goalUtils'

const GOAL_TYPE_LABELS = {
  weekly_workouts: 'Treinos por semana',
  monthly_workouts: 'Frequência mensal',
  body_weight: 'Peso corporal',
  exercise_pr_weight: 'PR em exercício',
  monthly_volume: 'Volume total',
  streak_days: 'Sequência de dias',
  progress_photos: 'Fotos de progresso',
  nutrition: 'Água/nutrição futura',
  custom: 'Personalizada',
}

const STATUS_LABELS = {
  active: 'Em andamento',
  completed: 'Concluída',
  archived: 'Arquivada',
}

function formatDate(dateString) {
  const date = parseLocalDate(dateString)
  if (!date) return ''

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function getGoalTypeLabel(type) {
  return GOAL_TYPE_LABELS[type] || 'Meta'
}

function getStatusVariant(goal, deadlineState) {
  if (goal.status === 'completed' || goal.isCompleted) return 'green'
  if (goal.status === 'archived') return 'default'
  if (deadlineState === 'overdue') return 'yellow'

  return 'purple'
}

function getGoalExplanation(goal) {
  if (goal.type === 'weekly_workouts') return 'Conta os treinos finalizados na semana atual.'
  if (goal.type === 'monthly_workouts') return 'Conta os treinos finalizados no mês atual.'
  if (goal.type === 'body_weight') return 'Usa o último peso corporal registrado no perfil.'
  if (goal.type === 'exercise_pr_weight') return `Procura sua maior carga registrada em ${goal.exerciseName || 'um exercício'}.`
  if (goal.type === 'monthly_volume') return 'Soma o volume dos treinos finalizados no mês.'
  if (goal.type === 'streak_days') return 'Conta quantos dias seguidos você treinou até hoje.'
  if (goal.type === 'progress_photos') return 'Conta as fotos de evolução registradas no mês.'

  return 'Meta manual. Atualize o valor atual ao editar.'
}

function getRemainingText(goal) {
  const target = Number(goal.targetValue || 0)
  const current = Number(goal.currentValue || 0)
  const remaining = Math.max(0, target - current)

  if (goal.status === 'completed' || goal.isCompleted || Number(goal.progressPercent || 0) >= 100) {
    return 'Meta concluída'
  }

  if (remaining <= 0) return 'Pronto para concluir'

  return `Faltam ${formatGoalValue(remaining, goal.unit)}`
}

function getDeadlineText(goal, deadlineState) {
  if (!goal.deadline) return 'Sem prazo definido'
  if (deadlineState === 'overdue') return `Atrasada desde ${formatDate(goal.deadline)}`
  if (deadlineState === 'soon') return `Prazo próximo: ${formatDate(goal.deadline)}`
  if (deadlineState === 'completed') return `Concluída até ${formatDate(goal.deadline)}`

  return `Prazo: ${formatDate(goal.deadline)}`
}

function getCardTone(goal, deadlineState) {
  if (goal.status === 'archived') return 'is-archived'
  if (goal.status === 'completed' || goal.isCompleted) return 'is-completed'
  if (deadlineState === 'overdue') return 'is-overdue'
  if (Number(goal.progressPercent || 0) >= 75) return 'is-near'

  return 'is-active'
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
  const [expanded, setExpanded] = useState(false)
  const deadlineState = getGoalDeadlineState(goal)
  const isCompleted = goal.status === 'completed' || goal.isCompleted
  const isArchived = goal.status === 'archived'
  const canComplete = !isCompleted && !isArchived
  const percent = Math.max(0, Math.min(100, Number(goal.progressPercent || 0)))
  const statusLabel = deadlineState === 'overdue' && !isCompleted ? 'Atrasada' : STATUS_LABELS[goal.status] || 'Em andamento'

  const primaryIcon = useMemo(() => {
    if (isCompleted) return Trophy
    if (deadlineState === 'overdue') return AlertTriangle
    if (goal.type === 'exercise_pr_weight') return Dumbbell
    return Target
  }, [deadlineState, goal.type, isCompleted])

  const PrimaryIcon = primaryIcon

  return (
    <Card className={`ff-goal-native-card ${getCardTone(goal, deadlineState)}`}>
      <div className="ff-goal-card-hero">
        <div className="ff-goal-card-hero__icon">
          <PrimaryIcon size={20} />
        </div>

        <div className="ff-goal-card-hero__content">
          <div className="ff-goal-card-badges">
            <Badge variant="purple">{getGoalTypeLabel(goal.type)}</Badge>
            <Badge variant={getStatusVariant(goal, deadlineState)}>{statusLabel}</Badge>
            {goal.period && goal.period !== 'none' && <Badge>{goal.period === 'weekly' ? 'Semanal' : 'Mensal'}</Badge>}
          </div>

          <h2 className="ff-goal-card-title">{goal.title}</h2>

          {goal.description && (
            <p className="ff-goal-card-description">{goal.description}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="ff-goal-card-more"
          aria-label={expanded ? 'Ocultar detalhes da meta' : 'Mostrar detalhes da meta'}
          aria-expanded={expanded}
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="ff-goal-card-progress-ring" aria-label={`Progresso ${percent}%`}>
        <div className="ff-goal-card-progress-ring__circle" style={{ '--goal-progress': `${percent * 3.6}deg` }}>
          <strong>{percent}%</strong>
          <span>feito</span>
        </div>
        <div className="ff-goal-card-progress-ring__meta">
          <p>{formatGoalValue(goal.currentValue, goal.unit)} / {formatGoalValue(goal.targetValue, goal.unit)}</p>
          <span>{getRemainingText(goal)}</span>
        </div>
      </div>

      <GoalProgressBar
        currentValue={goal.currentValue}
        targetValue={goal.targetValue}
        unit={goal.unit}
        progressPercent={goal.progressPercent}
      />

      <div className="ff-goal-card-footer">
        <span className={deadlineState === 'overdue' ? 'is-danger' : ''}>
          <Clock3 size={15} />
          {getDeadlineText(goal, deadlineState)}
        </span>

        {goal.exerciseName && (
          <span>
            <Dumbbell size={15} />
            {goal.exerciseName}
          </span>
        )}
      </div>

      {expanded && (
        <div className="ff-goal-card-details">
          <div>
            <p>Como calcula</p>
            <span>{getGoalExplanation(goal)}</span>
          </div>

          <div className="ff-goal-card-actions">
            <button type="button" onClick={() => onEdit(goal)}>
              <Edit3 size={16} />
              Editar
            </button>

            {canComplete && (
              <button type="button" className="is-success" onClick={() => onComplete(goal)}>
                <CheckCircle2 size={16} />
                Concluir
              </button>
            )}

            {isCompleted && (
              <button type="button" onClick={() => onReactivate(goal)}>
                <RotateCcw size={16} />
                Reativar
              </button>
            )}

            {isArchived ? (
              <button type="button" onClick={() => onUnarchive(goal)}>
                <RotateCcw size={16} />
                Desarquivar
              </button>
            ) : (
              <button type="button" onClick={() => onArchive(goal)}>
                <Archive size={16} />
                Arquivar
              </button>
            )}

            <button type="button" className="is-danger" onClick={() => onDelete(goal)}>
              <Trash2 size={16} />
              Excluir
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="ff-goal-card-expand"
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? 'Menos detalhes' : 'Detalhes e ações'}
        <ChevronDown size={16} className={expanded ? 'rotate-180' : ''} />
      </button>
    </Card>
  )
}

export default GoalCard
