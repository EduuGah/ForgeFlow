import Card from '../../../components/ui/Card'
import EmptyState from '../../../components/ui/EmptyState'
import { normalizeList } from '../exerciseDetailsUtils'

export function InfoList({
  icon: Icon,
  title,
  description,
  items,
  variant = 'default',
}) {
  const normalizedItems = normalizeList(items)

  const styles = {
    default: {
      iconBox: 'bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]',
      number: 'bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]',
      border: 'border-[var(--ff-border)]',
    },
    success: {
      iconBox: 'bg-emerald-500/10 text-emerald-400',
      number: 'bg-emerald-500/10 text-emerald-400',
      border: 'border-[var(--ff-border)]',
    },
    danger: {
      iconBox: 'bg-red-500/10 text-red-400',
      number: 'bg-red-500/10 text-red-400',
      border: 'border-red-500/20',
    },
  }

  const currentStyle = styles[variant] || styles.default

  return (
    <Card>
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${currentStyle.iconBox}`}
        >
          <Icon size={22} />
        </div>

        <div>
          <h2 className="text-xl font-bold">
            {title}
          </h2>

          <p className="text-sm text-[var(--ff-muted-2)]">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {normalizedItems.length > 0 ? (
          normalizedItems.map((item, index) => (
            <div
              key={index}
              className={`flex gap-3 rounded-2xl border ${currentStyle.border} bg-[var(--ff-card)] p-4`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${currentStyle.number}`}
              >
                {variant === 'danger' ? '!' : index + 1}
              </span>

              <p className="text-sm leading-relaxed text-[var(--ff-text-soft)]">
                {item}
              </p>
            </div>
          ))
        ) : (
          <EmptyState
            title={`${title} não cadastrada`}
            description="Edite o exercício para completar essas informações."
          />
        )}
      </div>
    </Card>
  )
}

export function SummaryItem({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4">
      <div className="flex items-center gap-2 text-[var(--ff-muted-2)]">
        {Icon && <Icon size={16} />}

        <p className="text-xs">
          {label}
        </p>
      </div>

      <p className="mt-1 font-bold text-[var(--ff-text)]">
        {value || 'Não informado'}
      </p>
    </div>
  )
}

