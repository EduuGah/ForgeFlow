function RecentWorkouts() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <h2 className="text-xl font-bold">Últimos treinos</h2>
      <p className="text-sm text-zinc-400 mt-1">
        Seus treinos mais recentes.
      </p>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <div>
            <p className="font-medium">Peito e tríceps</p>
            <p className="text-sm text-zinc-500">Hoje</p>
          </div>
          <span className="text-sm text-violet-400">Concluído</span>
        </div>

        <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <div>
            <p className="font-medium">Costas e bíceps</p>
            <p className="text-sm text-zinc-500">Ontem</p>
          </div>
          <span className="text-sm text-violet-400">Concluído</span>
        </div>
      </div>
    </div>
  )
}

export default RecentWorkouts