function Button({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  onClick,
  disabled = false,
  ...props
}) {
  const baseClasses = `
    inline-flex
    min-h-11
    items-center
    justify-center
    gap-2
    rounded-[var(--ff-radius-md)]
    px-4
    py-2.5
    text-sm
    font-bold
    leading-tight
    transition
    duration-200
    disabled:cursor-not-allowed
    disabled:opacity-50
    active:scale-[0.98]
  `

  const variants = {
    primary: `
      border
      border-transparent
      bg-[var(--ff-accent)]
      text-white
      hover:bg-[var(--ff-accent-hover)]
    `,

    secondary: `
      border
      border-[var(--ff-border)]
      bg-[var(--ff-surface-2)]
      text-[var(--ff-text)]
      hover:border-[var(--ff-border-strong)]
      hover:bg-[var(--ff-card-hover)]
    `,

    ghost: `
      border
      border-transparent
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
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
