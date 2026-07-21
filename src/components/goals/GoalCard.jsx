import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Archive,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Edit3,
  Info,
  MoreHorizontal,
  Repeat2,
  RotateCcw,
  Target,
  Trash2,
  Trophy,
  X,
} from 'lucide-react'

import Badge from '../ui/Badge'
import Card from '../ui/Card'
import GoalProgressBar from './GoalProgressBar'
import {
  formatGoalDate,
  formatGoalValue,
  getGoalDeadlineState,
  getGoalEffectiveDeadline,
  getGoalPacing,
  parseLocalDate,
} from '../../features/goals/goalUtils'

const GOAL_TYPE_LABELS = {
  daily_workouts: 'Treinos por dia',
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

const PERIOD_LABELS = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
  none: 'Única',
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

function getPeriodLabel(period) {
  return PERIOD_LABELS[period] || 'Única'
}

function getStatusVariant(goal, deadlineState) {
  if (goal.status === 'completed' || goal.isCompleted) return 'green'
  if (goal.status === 'archived') return 'default'
  if (deadlineState === 'overdue') return 'yellow'

  return 'purple'
}

function getGoalExplanation(goal) {
  const period = getPeriodLabel(goal.period).toLowerCase()

  if (goal.type === 'daily_workouts') return 'Conta os treinos finalizados hoje e reinicia amanhã.'
  if (goal.type === 'weekly_workouts') return `Conta os treinos finalizados no período ${period}.`
  if (goal.type === 'monthly_workouts') return `Conta os treinos finalizados no período ${period}.`
  if (goal.type === 'body_weight') return 'Usa o último peso corporal registrado no perfil.'
  if (goal.type === 'exercise_pr_weight') return `Procura sua maior carga registrada em ${goal.exerciseName || 'um exercício'}.`
  if (goal.type === 'monthly_volume') return `Soma o volume dos treinos no período ${period}.`
  if (goal.type === 'streak_days') return 'Conta quantos dias seguidos você treinou até hoje.'
  if (goal.type === 'progress_photos') return `Conta as fotos de evolução registradas no período ${period}.`

  return goal.period && goal.period !== 'none'
    ? `Meta manual. O valor volta para 0 quando o ciclo ${period} muda.`
    : 'Meta manual. Atualize o valor atual ao editar.'
}

function getRemainingText(goal) {
  const remaining = getGoalPacing(goal).remainingValue

  if (goal.status === 'completed' || goal.isCompleted || Number(goal.progressPercent || 0) >= 100) {
    return 'Meta concluída'
  }

  if (remaining <= 0) return 'Pronto para concluir'

  return `Faltam ${formatGoalValue(remaining, goal.unit)}`
}

function getDeadlineText(goal, deadlineState) {
  const deadline = getGoalEffectiveDeadline(goal)
  const formattedDeadline = formatGoalDate(deadline) || formatDate(goal.deadline)

  if (!deadline) return 'Sem prazo definido'
  if (deadlineState === 'overdue') return `Atrasada desde ${formattedDeadline}`
  if (deadlineState === 'soon') return `Prazo próximo: ${formattedDeadline}`
  if (deadlineState === 'completed') return `Concluída até ${formattedDeadline}`

  return `Prazo: ${formattedDeadline}`
}

function getCardTone(goal, deadlineState) {
  if (goal.status === 'archived') return 'is-archived'
  if (goal.status === 'completed' || goal.isCompleted) return 'is-completed'
  if (deadlineState === 'overdue') return 'is-overdue'
  if (Number(goal.progressPercent || 0) >= 75) return 'is-near'

  return 'is-active'
}

function getPacingTone(pacing) {
  if (pacing.status === 'behind' || pacing.status === 'overdue') return 'is-danger'
  if (pacing.status === 'ahead' || pacing.status === 'completed') return 'is-success'
  return 'is-neutral'
}

function getPacingText(goal, pacing) {
  if (pacing.status === 'no_deadline') return 'Defina prazo para ver ritmo diário.'
  if (pacing.status === 'completed') return 'Meta no alvo.'
  if (pacing.status === 'overdue') return 'Prazo vencido. Revise ou conclua.'

  const daily = formatGoalValue(pacing.requiredPerDay || 0, goal.unit)
  const days = pacing.daysLeft === 0 ? 'hoje' : `${pacing.daysLeft} dia(s)`

  return `${pacing.label}: ${daily}/dia por ${days}.`
}

function GoalDetailsSheet({ goal, open, deadlineState, pacing, percent, statusLabel, canComplete, isCompleted, isArchived, onClose, onEdit, onDelete, onComplete, onArchive, onUnarchive, onReactivate }) {
  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined

    document.body.classList.add('ff-modal-open', 'ff-fullscreen-modal-open')
    document.documentElement.classList.add('ff-modal-open', 'ff-fullscreen-modal-open')

    return () => {
      document.body.classList.remove('ff-modal-open', 'ff-fullscreen-modal-open')
      document.documentElement.classList.remove('ff-modal-open', 'ff-fullscreen-modal-open')
    }
  }, [open])

  if (!open) return null

  function runAction(action) {
    onClose()
    action(goal)
  }

  const sheet = (
    <div className="ff-goal-details-sheet" role="dialog" aria-modal="true" aria-label={`Detalhes da meta ${goal.title}`}>
      <button type="button" className="ff-goal-details-sheet__backdrop" onClick={onClose} aria-label="Fechar detalhes" />

      <div className="ff-goal-details-sheet__panel">
        <div className="ff-goal-details-sheet__handle" />

        <header className="ff-goal-details-sheet__header">
          <div className="ff-goal-details-sheet__icon">
            <Target size={20} />
          </div>

          <div className="min-w-0">
            <p>Detalhes da meta</p>
            <h2>{goal.title}</h2>
          </div>

          <button type="button" onClick={onClose} aria-label="Fechar detalhes">
            <X size={18} />
          </button>
        </header>

        <div className="ff-goal-details-sheet__content">
          <div className="ff-goal-details-sheet__badges">
            <Badge variant={getStatusVariant(goal, deadlineState)}>{statusLabel}</Badge>
            <Badge variant="purple">{getGoalTypeLabel(goal.type)}</Badge>
            <Badge>{getPeriodLabel(goal.period)}</Badge>
          </div>

          <section className="ff-goal-details-sheet__progress">
            <div className="ff-goal-details-sheet__ring" style={{ '--goal-progress': `${percent * 3.6}deg` }}>
              <strong>{percent}%</strong>
              <span>feito</span>
            </div>

            <div className="min-w-0">
              <p>{formatGoalValue(goal.currentValue, goal.unit)} / {formatGoalValue(goal.targetValue, goal.unit)}</p>
              <span>{getRemainingText(goal)}</span>
            </div>
          </section>

          <section className="ff-goal-details-sheet__grid">
            <div>
              <Clock3 size={16} />
              <p>Prazo</p>
              <strong>{getDeadlineText(goal, deadlineState)}</strong>
            </div>

            <div>
              <Repeat2 size={16} />
              <p>Reset</p>
              <strong>{getPeriodLabel(goal.period)}</strong>
            </div>

            <div>
              <Target size={16} />
              <p>Ritmo</p>
              <strong>{pacing.label}</strong>
            </div>

            <div>
              <Clock3 size={16} />
              <p>Necessário</p>
              <strong>{pacing.requiredPerDay !== null ? `${formatGoalValue(pacing.requiredPerDay, goal.unit)}/dia` : 'Sem prazo'}</strong>
            </div>
          </section>

          <section className={`ff-goal-details-sheet__note ff-goal-pacing-note ${getPacingTone(pacing)}`}>
            <Info size={17} />
            <span>{getPacingText(goal, pacing)}</span>
          </section>

          {goal.exerciseName && (
            <section className="ff-goal-details-sheet__note">
              <Dumbbell size={17} />
              <span>{goal.exerciseName}</span>
            </section>
          )}

          <section className="ff-goal-details-sheet__note">
            <Info size={17} />
            <span>{getGoalExplanation(goal)}</span>
          </section>

          <section className="ff-goal-details-sheet__actions">
            <button type="button" onClick={() => runAction(onEdit)}>
              <Edit3 size={16} />
              Editar
            </button>

            {canComplete && (
              <button type="button" className="is-success" onClick={() => runAction(onComplete)}>
                <CheckCircle2 size={16} />
                Concluir
              </button>
            )}

            {isCompleted && (
              <button type="button" onClick={() => runAction(onReactivate)}>
                <RotateCcw size={16} />
                Reativar
              </button>
            )}

            {isArchived ? (
              <button type="button" onClick={() => runAction(onUnarchive)}>
                <RotateCcw size={16} />
                Desarquivar
              </button>
            ) : (
              <button type="button" onClick={() => runAction(onArchive)}>
                <Archive size={16} />
                Arquivar
              </button>
            )}

            <button type="button" className="is-danger" onClick={() => runAction(onDelete)}>
              <Trash2 size={16} />
              Excluir
            </button>
          </section>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return sheet

  return createPortal(sheet, document.body)
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
  const [detailsOpen, setDetailsOpen] = useState(false)
  const deadlineState = getGoalDeadlineState(goal)
  const isCompleted = goal.status === 'completed' || goal.isCompleted
  const isArchived = goal.status === 'archived'
  const canComplete = !isCompleted && !isArchived
  const percent = Math.max(0, Math.min(100, Number(goal.progressPercent || 0)))
  const pacing = getGoalPacing(goal)
  const statusLabel = deadlineState === 'overdue' && !isCompleted ? 'Atrasada' : STATUS_LABELS[goal.status] || 'Em andamento'

  const primaryIcon = useMemo(() => {
    if (isCompleted) return Trophy
    if (deadlineState === 'overdue') return AlertTriangle
    if (goal.type === 'exercise_pr_weight') return Dumbbell
    return Target
  }, [deadlineState, goal.type, isCompleted])

  const PrimaryIcon = primaryIcon

  return (
    <>
      <Card className={`ff-goal-native-card ${getCardTone(goal, deadlineState)}`}>
        <div className="ff-goal-card-hero">
          <div className="ff-goal-card-hero__icon">
            <PrimaryIcon size={20} />
          </div>

          <div className="ff-goal-card-hero__content">
            <div className="ff-goal-card-badges">
              <Badge variant="purple">{getGoalTypeLabel(goal.type)}</Badge>
              <Badge variant={getStatusVariant(goal, deadlineState)}>{statusLabel}</Badge>
              {goal.period && goal.period !== 'none' && <Badge>{getPeriodLabel(goal.period)}</Badge>}
            </div>

            <h2 className="ff-goal-card-title">{goal.title}</h2>

            {goal.description && (
              <p className="ff-goal-card-description">{goal.description}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="ff-goal-card-more"
            aria-label="Abrir detalhes da meta"
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

        <div className={`ff-goal-card-pacing ${getPacingTone(pacing)}`}>
          <span>{pacing.label}</span>
          <strong>{getPacingText(goal, pacing)}</strong>
        </div>

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

          {goal.reminderEnabled && (
            <span>
              <Clock3 size={15} />
              Lembrete {goal.reminderTime || '19:00'}
            </span>
          )}
        </div>

        <button
          type="button"
          className="ff-goal-card-expand"
          onClick={() => setDetailsOpen(true)}
        >
          Detalhes e ações
          <MoreHorizontal size={16} />
        </button>
      </Card>

      <GoalDetailsSheet
        goal={goal}
        open={detailsOpen}
        deadlineState={deadlineState}
        pacing={pacing}
        percent={percent}
        statusLabel={statusLabel}
        canComplete={canComplete}
        isCompleted={isCompleted}
        isArchived={isArchived}
        onClose={() => setDetailsOpen(false)}
        onEdit={onEdit}
        onDelete={onDelete}
        onComplete={onComplete}
        onArchive={onArchive}
        onUnarchive={onUnarchive}
        onReactivate={onReactivate}
      />
    </>
  )
}

export default GoalCard
