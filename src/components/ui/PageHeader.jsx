function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="mb-3 h-1 w-16 rounded-full bg-[var(--ff-accent)] shadow-[0_0_22px_var(--ff-accent-shadow)] sm:mb-4 sm:w-20" />

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
