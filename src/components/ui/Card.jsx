function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-[1.55rem] border border-[var(--ff-border)] bg-[var(--ff-card)] p-3.5 text-[var(--ff-text)] shadow-sm shadow-black/5 transition-colors duration-200 sm:p-4 lg:rounded-3xl lg:p-5 ${className}`}
    >
      {children}
    </div>
  )
}

export default Card
