function PageHeader({ title, description, action }) {
  return (
    <div data-page-header="true" className="mb-5 flex min-w-0 flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="break-words text-[1.9rem] font-black tracking-[-0.04em] text-[var(--ff-text)] sm:text-4xl">
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
