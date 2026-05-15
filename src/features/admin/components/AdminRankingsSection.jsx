import Card from '../../../components/ui/Card'
import { RankingCard } from './AdminDataCards'

export default function AdminRankingsSection({
  rankingOptions,
  selectedRanking,
  activeRankingView,
  setActiveRankingView,
}) {
  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="p-4">
        <div>
          <h2 className="text-xl font-black text-[var(--ff-text)]">
            Rankings
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
            Escolha um ranking para analisar o período selecionado.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {rankingOptions.map((item) => {
            const Icon = item.icon

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveRankingView(item.id)}
                className={[
                  'flex min-h-12 items-center gap-3 rounded-2xl border p-3 text-left transition',
                  activeRankingView === item.id
                    ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]'
                    : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]',
                ].join(' ')}
              >
                <Icon size={18} />
                <span className="text-sm font-black">{item.label}</span>
              </button>
            )
          })}
        </div>
      </Card>

      <RankingCard
        title={selectedRanking.label}
        description={selectedRanking.description}
        icon={selectedRanking.icon}
        items={selectedRanking.items}
        valueLabel={selectedRanking.valueLabel}
        formatValue={selectedRanking.formatValue || ((value) => value)}
        empty={selectedRanking.empty}
      />
    </section>
  )
}
