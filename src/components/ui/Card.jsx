import { forwardRef } from 'react'

const Card = forwardRef(function Card({ children, className = '' }, ref) {
  return (
    <div
      ref={ref}
      className={`rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 text-[var(--ff-text)] shadow-sm shadow-black/5 transition-colors duration-200 sm:p-5 ${className}`}
    >
      {children}
    </div>
  )
})

export default Card
