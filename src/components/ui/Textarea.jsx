function Textarea({
  label,
  placeholder = '',
  value,
  onChange,
  rows = 4,
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

      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className={`
          w-full
          resize-none
          rounded-2xl
          border border-zinc-800
          bg-[#101014]
          px-4
          py-3
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

export default Textarea