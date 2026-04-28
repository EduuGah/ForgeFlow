function Textarea({ label, className = '', ...props }) {
  return (
    <div>
      {label && (
        <label className="text-sm font-medium text-zinc-400">
          {label}
        </label>
      )}

      <textarea
        className={`mt-2 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 ${className}`}
        {...props}
      />
    </div>
  )
}

export default Textarea