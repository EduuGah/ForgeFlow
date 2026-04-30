function Input({
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
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

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`
          h-12
          w-full
          rounded-2xl
          border border-zinc-800
          bg-[#101014]
          px-4
          text-sm
          font-medium
          text-white
          outline-none
          transition
          placeholder:text-zinc-600
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
      />
    </div>
  )
}

export default Input