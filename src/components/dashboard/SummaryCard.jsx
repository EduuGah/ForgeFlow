function SummaryCard({ title, value, description }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <p className="text-sm text-zinc-400">{title}</p>

      <h2 className="text-3xl font-bold text-white mt-3">
        {value}
      </h2>

      <p className="text-xs text-violet-400 mt-2">
        {description}
      </p>
    </div>
  )
}

export default SummaryCard