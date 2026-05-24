import { X } from 'lucide-react'

export function PageSection({ eyebrow, title, description, action, children, className = '' }) {
  return (
    <section className={['space-y-4', className].filter(Boolean).join(' ')}>
      {(eyebrow || title || description || action) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {eyebrow && <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-accent-text)]">{eyebrow}</p>}
            {title && <h2 className="mt-1 text-xl font-black tracking-tight text-[var(--ff-text)]">{title}</h2>}
            {description && <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatChip({ label, value, icon: Icon, tone = 'default' }) {
  const toneClass = tone === 'accent' ? 'bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] border-[var(--ff-accent-border)]' : 'bg-[var(--ff-surface-2)] text-[var(--ff-text-soft)] border-[var(--ff-border)]'
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-black ${toneClass}`}>
      {Icon && <Icon size={16} />}
      <span>{value}</span>
      <span className="font-bold text-[var(--ff-muted)]">{label}</span>
    </div>
  )
}

export function SegmentedTabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`overflow-x-auto rounded-[1.25rem] border border-[var(--ff-border)] bg-[var(--ff-surface)] p-1 ${className}`}>
      <div className="flex min-w-max gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={[
              'rounded-2xl px-4 py-2 text-sm font-black transition',
              activeTab === tab.id
                ? 'bg-[var(--ff-accent)] text-white shadow-[0_10px_28px_var(--ff-accent-shadow)]'
                : 'text-[var(--ff-muted)] hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)]',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ActionCard({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`rounded-[1.35rem] border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 shadow-[var(--ff-shadow-card)] ${className}`}>
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
            <Icon size={22} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-black text-[var(--ff-text)]">{title}</h3>
          {description && <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">{description}</p>}
        </div>
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function MetricCard({ label, value, helper, icon: Icon }) {
  return (
    <div className="rounded-[1.25rem] border border-[var(--ff-border)] bg-[var(--ff-surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--ff-muted)]">{label}</p>
        {Icon && <Icon size={18} className="text-[var(--ff-accent-text)]" />}
      </div>
      <p className="mt-3 text-2xl font-black tracking-tight text-[var(--ff-text)]">{value}</p>
      {helper && <p className="mt-1 text-xs font-bold text-[var(--ff-muted)]">{helper}</p>}
    </div>
  )
}

export function BottomSheet({ open, title, children, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/70 px-3 pb-3" role="dialog" aria-modal="true">
      <div className="mx-auto max-h-[82dvh] w-full max-w-xl overflow-y-auto rounded-t-[1.7rem] border border-[var(--ff-border)] bg-[var(--ff-card)] shadow-2xl shadow-black/50">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--ff-border)] bg-[var(--ff-card)] p-4">
          <div>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--ff-border-strong)]" />
            {title && <h2 className="text-lg font-black">{title}</h2>}
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ff-surface-2)] text-[var(--ff-text)]">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
