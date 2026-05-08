function PageHeader({ title, description, action }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-4 h-1 w-20 rounded-full bg-[var(--ff-accent)] shadow-[0_0_22px_var(--ff-accent-shadow)]" />

        <h1 className="text-3xl font-black tracking-tight text-[var(--ff-text)] md:text-4xl">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ff-muted)]">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export default PageHeader
