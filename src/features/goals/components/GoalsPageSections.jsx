import {
  Archive,
  CheckCircle2,
  Flag,
  Plus,
  RefreshCcw,
  Search,
  Target,
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

function GoalsHeader({ source, loading, onRefresh, onCreate }) {
  return (
    <PageHeader
      title="Metas"
      description="Crie objetivos claros e acompanhe automaticamente com base nos seus treinos, peso, fotos e PRs."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={source === 'database' ? 'purple' : 'default'}>
            {loading ? 'Carregando...' : source === 'database' ? 'Sincronizado' : 'Local'}
          </Badge>

          <Button type="button" variant="secondary" onClick={onRefresh}>
            <RefreshCcw size={16} />
            Atualizar
          </Button>

          <Button type="button" onClick={onCreate}>
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
      label: 'Metas ativas',
      value: stats.active,
      description: 'em andamento',
      icon: Flag,
      valueClass: 'text-[var(--ff-text)]',
      iconClass: 'text-[var(--ff-accent-text)]',
    },
    {
      label: 'Progresso médio',
      value: `${stats.averageProgress}%`,
      description: 'das metas ativas',
      icon: Target,
      valueClass: 'text-[var(--ff-accent-text)]',
      iconClass: 'text-[var(--ff-accent-text)]',
    },
    {
      label: 'Concluídas',
      value: stats.completed,
      description: 'metas finalizadas',
      icon: CheckCircle2,
      valueClass: 'text-[var(--ff-text)]',
      iconClass: 'text-[var(--ff-success-text)]',
    },
    {
      label: 'Arquivadas',
      value: stats.archived,
      description: 'guardadas para depois',
      icon: Archive,
      valueClass: 'text-[var(--ff-text)]',
      iconClass: 'text-[var(--ff-muted)]',
    },
  ]

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <Card key={card.label} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--ff-muted)]">{card.label}</p>
              <Icon size={20} className={card.iconClass} />
            </div>
            <h2 className={`mt-2 text-3xl font-black ${card.valueClass}`}>{card.value}</h2>
            <p className="mt-2 text-xs text-[var(--ff-muted)]">{card.description}</p>
          </Card>
        )
      })}
    </section>
  )
}

function GoalsFilters({ search, statusFilter, onSearchChange, onStatusFilterChange, onCreate }) {
  return (
    <Card className="mt-6">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
        <div className="flex h-12 items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-[var(--ff-muted)]">
          <Search size={18} />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar meta, exercício ou descrição..."
            className="w-full bg-transparent text-sm text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted)]"
          />
          {search && (
            <button type="button" onClick={() => onSearchChange('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value)}
          className="h-12 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm font-bold text-[var(--ff-text)] outline-none"
        >
          <option value="active">Ativas</option>
          <option value="completed">Concluídas</option>
          <option value="archived">Arquivadas</option>
          <option value="all">Todas</option>
        </select>

        <Button type="button" onClick={onCreate}>
          <Plus size={16} />
          Criar meta
        </Button>
      </div>
    </Card>
  )
}

function GoalsList({ goals, filteredGoals, onCreate, onEdit, onDelete, onComplete, onArchive, onUnarchive, onReactivate }) {
  return (
    <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-5">
      {filteredGoals.length === 0 ? (
        <div className="xl:col-span-2">
          <Card>
            <EmptyState
              title={goals.length === 0 ? 'Nenhuma meta criada' : 'Nenhuma meta encontrada'}
              description={
                goals.length === 0
                  ? 'Crie metas como treinar 4x na semana, bater PR, chegar em certo peso ou registrar fotos no mês.'
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
        </div>
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
      <GoalsHeader source={source} loading={loading} onRefresh={onRefresh} onCreate={onCreate} />
      <GoalsStats stats={stats} />
      <GoalsFilters
        search={search}
        statusFilter={statusFilter}
        onSearchChange={onSearchChange}
        onStatusFilterChange={onStatusFilterChange}
        onCreate={onCreate}
      />
      <GoalsList
        goals={goals}
        filteredGoals={filteredGoals}
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
