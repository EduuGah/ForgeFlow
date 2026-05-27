import { forwardRef } from 'react'

const Card = forwardRef(function Card({ children, className = '' }, ref) {
  return (
    <section
      ref={ref}
      className={`ff-native-card rounded-[var(--ff-radius-lg)] border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 text-[var(--ff-text)] transition-colors duration-200 sm:p-5 ${className}`}
    >
      {children}
    </section>
  )
})

export default Card
