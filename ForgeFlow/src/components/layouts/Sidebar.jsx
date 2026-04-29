import { NavLink } from 'react-router-dom'

function Sidebar({ onClose }) {
  const links = [
    { name: 'Perfil', path: '/profile' },
    { name: 'Dashboard', path: '/' },
    { name: 'Treinos', path: '/workouts' },
    { name: 'Exercícios', path: '/exercises' },
    { name: 'Histórico', path: '/history' },
  ]

  return (
    <aside className="relative z-50 w-72 min-h-screen bg-zinc-900 border-r border-zinc-800 p-5">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h2 className="text-2xl font-bold">
            Forge<span className="text-violet-400">Flow</span>
          </h2>

          <p className="text-sm text-zinc-500 mt-1">
            Forge Your Progress
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
        >
          ×
        </button>
      </div>

      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            onClick={onClose}
            className={({ isActive }) =>
              isActive
                ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-xl px-4 py-3'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl px-4 py-3 transition'
            }
          >
            {link.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar