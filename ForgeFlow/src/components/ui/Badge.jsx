function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default:
      'bg-zinc-800 text-zinc-300 border-zinc-700',
    purple:
      'bg-violet-500/10 text-violet-400 border-violet-500/20',
    green:
      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red:
      'bg-red-500/10 text-red-400 border-red-500/20',
    yellow:
      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

export default Badge