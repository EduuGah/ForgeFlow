function TodayWorkout() {
  return (
    <div className="bg-[var(--ff-surface)] border border-[var(--ff-border)] rounded-2xl p-5">
      <h2 className="text-xl font-bold">Treino de hoje</h2>
      <p className="text-sm text-[var(--ff-muted)] mt-1">
        Continue sua rotina de evolução.
      </p>

      <div className="mt-5 bg-[var(--ff-accent-soft)]/10 border border-[var(--ff-accent-border)]/20 rounded-2xl p-5">
        <p className="text-[var(--ff-accent-text)] text-sm font-medium">Treino A</p>
        <h3 className="text-2xl font-bold mt-2">Peito, ombro e tríceps</h3>
        <p className="text-sm text-[var(--ff-muted)] mt-2">
          6 exercícios planejados para hoje.
        </p>

        <button className="mt-5 w-full bg-[var(--ff-accent)] hover:bg-[var(--ff-accent-hover)] transition-colors rounded-xl py-3 font-medium">
          Iniciar treino
        </button>
      </div>
    </div>
  )
}

export default TodayWorkout