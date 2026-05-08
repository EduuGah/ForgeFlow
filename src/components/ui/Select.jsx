function Select({ label, children, className = '', ...props }) {
  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm font-bold text-[var(--ff-text-soft)]">
          {label}
        </label>
      )}

      <select
        className={`
          h-12
          w-full
          rounded-2xl
          border
          border-[var(--ff-border)]
          bg-[var(--ff-input)]
          px-4
          text-sm
          font-bold
          text-[var(--ff-text)]
          outline-none
          transition
          hover:border-[var(--ff-border-strong)]
          focus:border-[var(--ff-accent-border)]
          focus:ring-2
          focus:ring-[var(--ff-accent)]/10
          disabled:cursor-not-allowed
          disabled:opacity-50
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

export default Select
