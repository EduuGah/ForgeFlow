function Textarea({
  label,
  rows = 4,
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

      <textarea
        rows={rows}
        className={`
          w-full
          resize-none
          rounded-2xl
          border
          border-[var(--ff-border)]
          bg-[var(--ff-input)]
          px-4
          py-3
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

export default Textarea
