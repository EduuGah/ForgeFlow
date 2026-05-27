function PageHeader({ title, description, action }) {
  return (
    <header className="ff-native-page-header mb-5">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-[1.7rem] font-black leading-tight tracking-[-0.055em] text-[var(--ff-text)] sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[var(--ff-muted)]">
              {description}
            </p>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  )
}

export default PageHeader
