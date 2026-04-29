function EmptyState({
  title = 'Nada encontrado',
  description = 'Não há dados para mostrar no momento.',
  action,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/70 p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
        ✦
      </div>

      <h3 className="text-lg font-bold text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm text-zinc-500">
        {description}
      </p>

      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </div>
  )
}

export default EmptyState