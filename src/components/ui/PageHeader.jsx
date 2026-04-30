function PageHeader({
  title,
  description,
  action,
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="mb-2 h-1 w-12 rounded-full bg-violet-500 shadow-[0_0_16px_rgba(139,92,246,0.6)]" />

        <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="flex shrink-0 items-center gap-2">
          {action}
        </div>
      )}
    </div>
  )
}

export default PageHeader