import { forwardRef } from 'react'

const Card = forwardRef(function Card({ children, className = '' }, ref) {
  return (
    <div
      ref={ref}
      className={`rounded-[1.35rem] border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 text-[var(--ff-text)] transition-colors duration-200 sm:p-5 ${className}`}
    >
      {children}
    </div>
  )
})

export default Card
