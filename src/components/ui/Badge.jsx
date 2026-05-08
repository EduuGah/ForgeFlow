function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: `border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)]`,
    purple: `border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] shadow-[0_0_14px_var(--ff-accent-shadow)]`,
    green: `border-emerald-500/30 bg-emerald-500/10 text-[var(--ff-success-text)]`,
    red: `border-red-500/30 bg-red-500/10 text-[var(--ff-danger-text)]`,
    yellow: `border-yellow-500/30 bg-yellow-500/10 text-[var(--ff-warning-text)]`,
    orange: `border-orange-500/30 bg-orange-500/10 text-orange-500`,
  }

  return (
    <span
      className={`inline-flex w-fit max-w-full items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold leading-none whitespace-nowrap ${variants[variant] || variants.default} ${className}`}
    >
      {children}
    </span>
  )
}

export default Badge
