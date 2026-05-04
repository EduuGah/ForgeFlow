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
      text-white
      active:scale-[0.98]
    `,

    secondary: `
      border
      border-zinc-700
      bg-zinc-900
      text-white
      hover:border-[var(--ff-accent-border)]
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

  const primaryStyle =
    variant === 'primary'
      ? {
          backgroundColor: 'var(--ff-accent)',
          boxShadow: '0 0 18px var(--ff-accent-shadow)',
        }
      : undefined

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={primaryStyle}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${className}`}
      onMouseEnter={(event) => {
        if (variant === 'primary') {
          event.currentTarget.style.backgroundColor = 'var(--ff-accent-hover)'
          event.currentTarget.style.boxShadow = '0 0 26px var(--ff-accent-shadow)'
        }
      }}
      onMouseLeave={(event) => {
        if (variant === 'primary') {
          event.currentTarget.style.backgroundColor = 'var(--ff-accent)'
          event.currentTarget.style.boxShadow = '0 0 18px var(--ff-accent-shadow)'
        }
      }}
    >
      {children}
    </button>
  )
}

export default Button