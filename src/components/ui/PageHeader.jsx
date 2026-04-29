function PageHeader({ label = 'ForgeFlow', title, description, action }) {
  return (
    <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-violet-400">
          {label}
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div>
          {action}
        </div>
      )}
    </section>
  )
}

export default PageHeader