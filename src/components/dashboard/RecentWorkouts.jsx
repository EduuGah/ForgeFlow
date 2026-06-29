function RecentWorkouts() {
  return (
    <div className="bg-[var(--ff-surface)] border border-[var(--ff-border)] rounded-2xl p-5">
      <h2 className="text-xl font-bold">Últimos treinos</h2>
      <p className="text-sm text-[var(--ff-muted)] mt-1">
        Seus treinos mais recentes.
      </p>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between bg-[var(--ff-card)] border border-[var(--ff-border)] rounded-xl p-4">
          <div>
            <p className="font-medium">Peito e tríceps</p>
            <p className="text-sm text-[var(--ff-muted-2)]">Hoje</p>
          </div>
          <span className="text-sm text-[var(--ff-accent-text)]">Concluído</span>
        </div>

        <div className="flex items-center justify-between bg-[var(--ff-card)] border border-[var(--ff-border)] rounded-xl p-4">
          <div>
            <p className="font-medium">Costas e bíceps</p>
            <p className="text-sm text-[var(--ff-muted-2)]">Ontem</p>
          </div>
          <span className="text-sm text-[var(--ff-accent-text)]">Concluído</span>
        </div>
      </div>
    </div>
  )
}

export default RecentWorkouts