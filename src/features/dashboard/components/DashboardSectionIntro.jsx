function DashboardSectionIntro({ eyebrow, title, description, className = '' }) {
  return (
    <div className={`mb-4 flex flex-col gap-1 ${className}`.trim()}>
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--ff-accent-text)]">
        {eyebrow}
      </p>

      <h2 className="text-2xl font-black tracking-tight text-[var(--ff-text)]">
        {title}
      </h2>

      {description && (
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--ff-muted)]">
          {description}
        </p>
      )}
    </div>
  )
}

export default DashboardSectionIntro
