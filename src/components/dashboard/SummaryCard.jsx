function SummaryCard({ title, value, description }) {
  return (
    <div className="bg-[var(--ff-surface)] border border-[var(--ff-border)] rounded-2xl p-5">
      <p className="text-sm text-[var(--ff-muted)]">{title}</p>

      <h2 className="text-3xl font-bold text-[var(--ff-text)] mt-3">
        {value}
      </h2>

      <p className="text-xs text-[var(--ff-accent-text)] mt-2">
        {description}
      </p>
    </div>
  )
}

export default SummaryCard