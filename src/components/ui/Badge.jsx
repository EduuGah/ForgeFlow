function Badge({
  children,
  variant = 'default',
  className = '',
}) {
  const variants = {
    default: `
      border-zinc-700
      bg-zinc-900
      text-zinc-300
    `,

    purple: `
  border-[var(--ff-accent-border)]
  bg-[var(--ff-accent-soft)]
  text-[var(--ff-accent-text)]
  shadow-[0_0_14px_var(--ff-accent-shadow)]
`,

    green: `
      border-emerald-500/30
      bg-emerald-500/10
      text-emerald-300
    `,

    red: `
      border-red-500/30
      bg-red-500/10
      text-red-300
    `,

    yellow: `
      border-yellow-500/30
      bg-yellow-500/10
      text-yellow-300
    `,

    orange: `
      border-orange-500/30
      bg-orange-500/10
      text-orange-300
    `,
  }

  return (
    <span
      className={`
        inline-flex
        w-fit
        items-center
        justify-center
        gap-1.5
        rounded-full
        border
        px-3
        py-1
        text-xs
        font-bold
        leading-none
        whitespace-nowrap
        ${variants[variant] || variants.default}
        ${className}
      `}
    >
      {children}
    </span>
  )
}

export default Badge