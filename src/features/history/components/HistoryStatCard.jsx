import Card from '../../../components/ui/Card'

export default function HistoryStatCard({ title, value, description, icon: Icon, accent = false }) {
  return (
    <Card className={accent ? 'ff-history-stat-card is-accent p-4' : 'ff-history-stat-card p-4'}>
      <div className="ff-history-stat-card__inner flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">
            {title}
          </p>

          <h3
            className={
              accent
                ? 'mt-2 text-3xl font-black text-[var(--ff-accent-text)]'
                : 'mt-2 text-3xl font-black text-[var(--ff-text)]'
            }
          >
            {value}
          </h3>

          <p className="mt-2 text-xs text-[var(--ff-accent-text)]">
            {description}
          </p>
        </div>

        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
            <Icon size={21} />
          </div>
        )}
      </div>
    </Card>
  )
}
