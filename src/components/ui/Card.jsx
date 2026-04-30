function Card({ children, className = '' }) {
  return (
    <div
      className={`
        rounded-3xl
        border border-zinc-800/90
        bg-[#18181b]
        p-5
        text-white
        shadow-[0_18px_45px_rgba(0,0,0,0.22)]
        transition
        duration-200
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export default Card