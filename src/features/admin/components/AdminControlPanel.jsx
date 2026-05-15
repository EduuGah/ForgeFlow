import { BarChart3, Trophy, UsersRound } from 'lucide-react'

const adminViews = [
  ['overview', 'Resumo', BarChart3],
  ['rankings', 'Rankings', Trophy],
  ['users', 'Usuários', UsersRound],
]

const analyticsDayOptions = [7, 14, 30, 90]

function AdminControlPanel({
  analyticsDays,
  activeAdminView,
  orphanHistoryCount,
  cleanupLoading,
  onDaysChange,
  onRefresh,
  onCleanupOrphanHistory,
  onViewChange,
}) {
  return (
    <>
      <section className="rounded-[2rem] border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-accent-text)]">
              Central administrativa
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--ff-text)]">
              Visão limpa do ForgeFlow
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--ff-muted)]">
              Use os atalhos abaixo para alternar entre métricas, rankings e gerenciamento de usuários sem misturar tudo na mesma tela.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-2">
              {analyticsDayOptions.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => onDaysChange(days)}
                  className={[
                    'h-10 rounded-2xl border px-3 text-xs font-black transition',
                    analyticsDays === days
                      ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]'
                      : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]',
                  ].join(' ')}
                >
                  {days}d
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onRefresh}
              className="h-10 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-xs font-black text-[var(--ff-text)] transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-card-hover)]"
            >
              Atualizar
            </button>

            {Number(orphanHistoryCount || 0) > 0 && (
              <button
                type="button"
                onClick={onCleanupOrphanHistory}
                disabled={cleanupLoading}
                className="h-10 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 text-xs font-black text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cleanupLoading ? 'Limpando...' : 'Limpar órfãos'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          {adminViews.map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => onViewChange(id)}
              className={[
                'flex h-11 items-center justify-center gap-2 rounded-2xl border px-3 text-xs font-black transition',
                activeAdminView === id
                  ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] shadow-[0_0_18px_var(--ff-accent-shadow)]'
                  : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]',
              ].join(' ')}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </section>
    </>
  )
}

export default AdminControlPanel
