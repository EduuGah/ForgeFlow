function Header() {
  return (
    <header className="flex items-center justify-between">
      <div>
        <p className="text-sm text-[var(--ff-accent-text)] font-medium">ForgeFlow</p>
        <h1 className="text-3xl font-bold mt-1">Dashboard</h1>
        <p className="text-zinc-400 mt-2">
          Acompanhe seus treinos, cargas e evolução.
        </p>
      </div>

      <button className="bg-[var(--ff-accent)] hover:bg-[var(--ff-accent-hover)] transition-colors px-4 py-2 rounded-xl font-medium">
        Novo treino
      </button>
    </header>
  )
}

export default Header