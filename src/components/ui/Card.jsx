function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg shadow-black/20 ${className}`}
    >
      {children}
    </div>
  )
}

export default Card