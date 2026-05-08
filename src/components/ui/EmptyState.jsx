import { Dumbbell } from 'lucide-react'

function EmptyState({
  icon: Icon = Dumbbell,
  title = 'Nada encontrado',
  description = 'Ainda não há dados para mostrar.',
  action,
}) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5 text-center sm:min-h-[220px] sm:p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] shadow-[0_0_20px_var(--ff-accent-shadow)]/20">
        <Icon size={28} />
      </div>

      <h3 className="mt-5 text-lg font-black text-[var(--ff-text)]">
        {title}
      </h3>

      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--ff-muted)]">
          {description}
        </p>
      )}

      {action && <div className="mt-5 w-full sm:w-auto">{action}</div>}
    </div>
  )
}

export default EmptyState
