function Input({
  label,
  className = '',
  error = '',
  ...props
}) {
  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm font-bold text-[var(--ff-text-soft)]">
          {label}
        </label>
      )}

      <input
        className={`
          h-12
          w-full
          rounded-2xl
          border
          border-[var(--ff-border)]
          bg-[var(--ff-input)]
          px-4
          text-sm
          font-medium
          text-[var(--ff-text)]
          outline-none
          transition
          placeholder:text-[var(--ff-muted-2)]
          hover:border-[var(--ff-border-strong)]
          focus:border-[var(--ff-accent-border)]
          focus:ring-2
          focus:ring-[var(--ff-accent)]/10
          disabled:cursor-not-allowed
          disabled:opacity-50
          ${className}
        `}
        {...props}
      />

      {error && (
        <p className="mt-2 text-xs font-bold text-[var(--ff-danger-text)]">
          {error}
        </p>
      )}
    </div>
  )
}

export default Input
