function PageHeader({ title, description, action }) {
  return (
    <div className="ff-page-header mb-5 flex min-w-0 flex-col gap-4 sm:mb-7 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--ff-accent-text)]">
          ForgeFlow
        </p>

        <h1 className="break-words text-2xl font-black tracking-tight text-[var(--ff-text)] sm:text-3xl lg:text-4xl">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--ff-muted)] sm:text-base">
            {description}
          </p>
        )}
      </div>

      {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
    </div>
  )
}

export default PageHeader
