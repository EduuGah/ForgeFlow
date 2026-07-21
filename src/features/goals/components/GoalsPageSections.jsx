import {
  AlertTriangle,
  CheckCircle2,
  Flame,
  Flag,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from 'lucide-react'

import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import ConfirmModal from '../../../components/ui/ConfirmModal'
import Toast from '../../../components/ui/Toast'
import GoalCard from '../../../components/goals/GoalCard'
import GoalFormModal from '../../../components/goals/GoalFormModal'

function GoalsHeader({ source, loading, stats, onRefresh, onCreate }) {
  return (
    <PageHeader
      title="Metas"
      description={`${stats.active} metas ativas • ${stats.completedThisWeek} concluída${stats.completedThisWeek === 1 ? '' : 's'} esta semana • ${stats.averageProgress}% de progresso médio.`}
      action={
        <div className="ff-goals-header-actions">
          <Badge variant={source === 'database' ? 'purple' : 'default'}>
            {loading ? 'Carregando...' : source === 'database' ? 'Sincronizado' : 'Local'}
          </Badge>

          <Button type="button" variant="secondary" onClick={onRefresh} className="ff-goals-refresh-button">
            <RefreshCcw size={16} />
            Atualizar
          </Button>

          <Button type="button" onClick={onCreate} className="ff-goals-create-button" data-tutorial="goals-create-button">
            <Plus size={16} />
            Nova meta
          </Button>
        </div>
      }
    />
  )
}

function GoalsStats({ stats }) {
  const cards = [
    {
      label: 'Ativas',
      value: stats.active,
      description: stats.overdue > 0 ? `${stats.overdue} atrasada${stats.overdue === 1 ? '' : 's'}` : 'em andamento',
      icon: Flag,
      tone: 'accent',
    },
    {
      label: 'Concluídas',
      value: stats.completed,
      description: `${stats.completedThisWeek} esta semana`,
      icon: CheckCircle2,
      tone: 'success',
    },
    {
      label: 'Sequência',
      value: `${stats.streak} dia${stats.streak === 1 ? '' : 's'}`,
      description: stats.streak > 0 ? 'treinando sem parar' : 'comece hoje',
      icon: Flame,
      tone: 'warning',
    },
    {
      label: 'Progresso',
      value: `${stats.averageProgress}%`,
      description: stats.behind > 0 ? `${stats.behind} fora do ritmo` : stats.almostDone > 0 ? `${stats.almostDone} quase lá` : 'média ativa',
      icon: TrendingUp,
      tone: 'accent',
    },
  ]

  return (
    <section className="ff-goals-stats-grid" aria-label="Resumo das metas" data-tutorial="goals-overview">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <Card key={card.label} className={`ff-goal-summary-card is-${card.tone}`}>
            <div className="ff-goal-summary-card__top">
              <p>{card.label}</p>
              <Icon size={19} />
            </div>
            <strong>{card.value}</strong>
            <span>{card.description}</span>
          </Card>
        )
      })}
    </section>
  )
}

const FILTERS = [
  { value: 'active', label: 'Ativas' },
  { value: 'completed', label: 'Concluídas' },
  { value: 'overdue', label: 'Atrasadas' },
  { value: 'archived', label: 'Arquivadas' },
  { value: 'all', label: 'Todas' },
]

function GoalsFilters({ search, statusFilter, onSearchChange, onStatusFilterChange, onCreate }) {
  return (
    <Card className="ff-goals-filter-card">
      <div className="ff-goals-filter-card__top">
        <label className="ff-goals-search-field">
          <Search size={18} />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar meta, exercício ou descrição..."
          />
          {search && (
            <button type="button" onClick={() => onSearchChange('')} aria-label="Limpar busca">
              <X size={16} />
            </button>
          )}
        </label>

        <Button type="button" onClick={onCreate} className="ff-goals-inline-create" data-tutorial="goals-create-button">
          <Plus size={16} />
          Nova meta
        </Button>
      </div>

      <div className="ff-goals-filter-chips" role="tablist" aria-label="Filtrar metas">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            aria-pressed={statusFilter === filter.value}
            className={statusFilter === filter.value ? 'is-active' : ''}
            onClick={() => onStatusFilterChange(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </Card>
  )
}

function GoalsMotivation({ stats, onCreate }) {
  const hasOverdue = stats.overdue > 0
  const hasBehind = stats.behind > 0
  const hasAlmostDone = stats.almostDone > 0

  return (
    <Card className="ff-goals-motivation-card">
      <div className="ff-goals-motivation-card__icon">
        {hasOverdue || hasBehind ? <AlertTriangle size={20} /> : hasAlmostDone ? <Sparkles size={20} /> : <Target size={20} />}
      </div>
      <div className="min-w-0">
        <p>{hasOverdue ? 'Atenção nas metas atrasadas' : hasBehind ? 'Ajuste o ritmo da semana' : hasAlmostDone ? 'Você está perto de concluir' : 'Escolha um alvo simples'}</p>
        <span>
          {hasOverdue
            ? 'Revise prazos ou conclua o que já evoluiu para manter sua lista limpa.'
            : hasBehind
              ? 'Algumas metas estão abaixo do ritmo esperado para o prazo. Priorize uma ação pequena hoje.'
            : hasAlmostDone
              ? 'Priorize as metas acima de 75% e transforme progresso em vitória.'
              : 'Uma boa meta para começar é treinar 3 ou 4 vezes na semana.'}
        </span>
      </div>
      <button type="button" onClick={onCreate}>Criar</button>
    </Card>
  )
}

function GoalsList({ goals, filteredGoals, loading, onCreate, onEdit, onDelete, onComplete, onArchive, onUnarchive, onReactivate }) {
  return (
    <section className="ff-goals-list" aria-label="Lista de metas">
      {loading && filteredGoals.length === 0 ? (
        <Card className="ff-goals-empty-card">
          <EmptyState
            title="Carregando metas"
            description="Buscando suas metas salvas e calculando o progresso com os treinos registrados."
          />
        </Card>
      ) : filteredGoals.length === 0 ? (
        <Card className="ff-goals-empty-card">
          <EmptyState
            title={goals.length === 0 ? 'Nenhuma meta criada' : 'Nenhuma meta encontrada'}
            description={
              goals.length === 0
                ? 'Crie uma meta simples, como treinar 4x na semana, bater um PR ou aumentar o volume mensal.'
                : 'Tente mudar o filtro ou buscar por outro termo.'
            }
            action={
              <Button type="button" onClick={onCreate}>
                <Plus size={16} />
                Criar primeira meta
              </Button>
            }
          />
        </Card>
      ) : (
        filteredGoals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onEdit={onEdit}
            onDelete={onDelete}
            onComplete={onComplete}
            onArchive={onArchive}
            onUnarchive={onUnarchive}
            onReactivate={onReactivate}
          />
        ))
      )}
    </section>
  )
}

export default function GoalsPageSections({
  source,
  loading,
  stats,
  search,
  statusFilter,
  goals,
  filteredGoals,
  isModalOpen,
  modalGoal,
  exerciseOptions,
  exercises,
  confirmModal,
  toast,
  onRefresh,
  onCreate,
  onSearchChange,
  onStatusFilterChange,
  onEdit,
  onDelete,
  onComplete,
  onArchive,
  onUnarchive,
  onReactivate,
  onCloseModal,
  onSubmitGoal,
  onCancelConfirm,
  onCloseToast,
}) {
  return (
    <>
      <GoalsHeader source={source} loading={loading} stats={stats} onRefresh={onRefresh} onCreate={onCreate} />
      <GoalsStats stats={stats} />
      <GoalsFilters
        search={search}
        statusFilter={statusFilter}
        onSearchChange={onSearchChange}
        onStatusFilterChange={onStatusFilterChange}
        onCreate={onCreate}
      />
      <GoalsMotivation stats={stats} onCreate={onCreate} />
      <GoalsList
        goals={goals}
        filteredGoals={filteredGoals}
        loading={loading}
        onCreate={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
        onComplete={onComplete}
        onArchive={onArchive}
        onUnarchive={onUnarchive}
        onReactivate={onReactivate}
      />

      <GoalFormModal
        open={isModalOpen}
        goal={modalGoal}
        exerciseOptions={exerciseOptions}
        exercises={exercises}
        onClose={onCloseModal}
        onSubmit={onSubmitGoal}
      />

      <ConfirmModal
        open={Boolean(confirmModal)}
        title={confirmModal?.title}
        description={confirmModal?.description}
        confirmText={confirmModal?.confirmText}
        variant={confirmModal?.variant}
        onConfirm={confirmModal?.onConfirm}
        onCancel={onCancelConfirm}
      />

      <Toast
        show={Boolean(toast)}
        type={toast?.type}
        title={toast?.title}
        message={toast?.message}
        onClose={onCloseToast}
      />
    </>
  )
}
