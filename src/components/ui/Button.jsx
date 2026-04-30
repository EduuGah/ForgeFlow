function Button({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  onClick,
  disabled = false,
}) {
  const baseClasses = `
    inline-flex
    h-11
    items-center
    justify-center
    gap-2
    rounded-2xl
    px-4
    text-sm
    font-bold
    transition
    duration-200
    disabled:cursor-not-allowed
    disabled:opacity-50
  `

  const variants = {
    primary: `
      bg-violet-600
      text-white
      shadow-[0_0_18px_rgba(139,92,246,0.28)]
      hover:bg-violet-500
      hover:shadow-[0_0_26px_rgba(139,92,246,0.45)]
      active:scale-[0.98]
    `,

    secondary: `
      border
      border-zinc-700
      bg-zinc-900
      text-white
      hover:border-violet-500/40
      hover:bg-zinc-800
      active:scale-[0.98]
    `,

    ghost: `
      bg-transparent
      text-zinc-300
      hover:bg-zinc-800
      hover:text-white
      active:scale-[0.98]
    `,

    danger: `
      border
      border-red-500/20
      bg-red-500/10
      text-red-300
      hover:border-red-400/40
      hover:bg-red-500/20
      active:scale-[0.98]
    `,
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${className}`}
    >
      {children}
    </button>
  )
}

export default Button