import { Inbox } from 'lucide-react'

function EmptyState({
  title = 'Nada encontrado',
  description = 'Não há dados para exibir no momento.',
  action,
  icon: Icon = Inbox,
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-[#101014] p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-violet-500/20 bg-violet-500/10 text-violet-400 shadow-[0_0_24px_rgba(139,92,246,0.18)]">
        <Icon size={30} />
      </div>

      <h3 className="mt-5 text-lg font-black text-white">
        {title}
      </h3>

      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </div>
  )
}

export default EmptyState