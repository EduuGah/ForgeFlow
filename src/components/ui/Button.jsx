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
    active:scale-[0.98]
  `

  const variants = {
    primary: `
      bg-[var(--ff-accent)]
      text-white
      shadow-[0_0_18px_var(--ff-accent-shadow)]
      hover:bg-[var(--ff-accent-hover)]
    `,

    secondary: `
      border
      border-[var(--ff-border)]
      bg-[var(--ff-surface-2)]
      text-[var(--ff-text)]
      hover:border-[var(--ff-accent-border)]
      hover:bg-[var(--ff-card-hover)]
    `,

    ghost: `
      bg-transparent
      text-[var(--ff-muted)]
      hover:bg-[var(--ff-surface-2)]
      hover:text-[var(--ff-text)]
    `,

    danger: `
      border
      border-red-500/25
      bg-red-500/10
      text-[var(--ff-danger-text)]
      hover:border-red-500/40
      hover:bg-red-500/15
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
