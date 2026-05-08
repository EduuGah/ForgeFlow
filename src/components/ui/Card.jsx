function Card({ children, className = '' }) {
  return (
    <div
      className={`
        rounded-3xl
        border
        border-[var(--ff-border)]
        bg-[var(--ff-card)]
        p-5
        text-[var(--ff-text)]
        shadow-sm
        shadow-black/5
        transition-colors
        duration-200
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export default Card
