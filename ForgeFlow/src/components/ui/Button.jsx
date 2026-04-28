function Button({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  ...props
}) {
  const variants = {
    primary:
      'bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-950/30',
    secondary:
      'bg-zinc-800 text-zinc-100 border border-zinc-700 hover:bg-zinc-700',
    ghost:
      'bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500 hover:text-white',
    danger:
      'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white',
  }

  return (
    <button
      type={type}
      className={`rounded-xl px-4 py-3 font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button