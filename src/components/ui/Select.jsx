function Select({
  label,
  value,
  onChange,
  children,
  className = '',
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-bold text-zinc-300">
          {label}
        </label>
      )}

      <select
        value={value}
        onChange={onChange}
        className={`
          h-12
          w-full
          cursor-pointer
          rounded-2xl
          border border-zinc-800
          bg-[#101014]
          px-4
          text-sm
          font-medium
          text-white
          outline-none
          transition
          hover:border-zinc-700
          focus:border-violet-500
          focus:bg-[#141419]
          focus:ring-2
          focus:ring-violet-500/10
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