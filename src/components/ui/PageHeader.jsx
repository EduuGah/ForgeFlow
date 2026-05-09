function PageHeader({ title, description, action, eyebrow = 'ForgeFlow' }) {
  return (
    <div className="mb-5 min-w-0 sm:mb-8">
      <div className="lg:hidden">
        <div className="rounded-[1.75rem] border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 shadow-lg shadow-black/10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ff-accent-text)]">
                {eyebrow}
              </p>

              <h1 className="mt-1 break-words text-2xl font-black leading-tight tracking-tight text-[var(--ff-text)]">
                {title}
              </h1>

              {description && (
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--ff-muted)]">
                  {description}
                </p>
              )}
            </div>
          </div>

          {action && (
            <div className="mt-4 grid grid-cols-1 gap-2">
              {action}
            </div>
          )}
        </div>
      </div>

      <div className="hidden min-w-0 items-start justify-between gap-6 lg:flex">
        <div className="min-w-0">
          <div className="mb-4 h-1 w-24 rounded-full bg-[var(--ff-accent)] shadow-[0_0_22px_var(--ff-accent-shadow)]" />

          <h1 className="break-words text-4xl font-black tracking-tight text-[var(--ff-text)]">
            {title}
          </h1>

          {description && (
            <p className="mt-3 max-w-4xl text-base leading-relaxed text-[var(--ff-muted)]">
              {description}
            </p>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}

export default PageHeader
