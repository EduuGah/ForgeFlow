import { Bell, CircleHelp, Dumbbell, Palette, UserRound } from 'lucide-react'

const SETTINGS_CATEGORIES = [
  { id: 'visual', label: 'Visual', icon: Palette },
  { id: 'training', label: 'Treino', icon: Dumbbell },
  { id: 'reminders', label: 'Lembretes', icon: Bell },
  { id: 'account', label: 'Conta', icon: UserRound },
  { id: 'help', label: 'Ajuda', icon: CircleHelp },
]

export function getSettingsCategory(panel = '') {
  if (['appearance', 'visual'].includes(panel)) return 'visual'
  if (['training', 'workout', 'nutrition'].includes(panel)) return 'training'
  if (['notifications', 'reminders'].includes(panel)) return 'reminders'
  if (['profile', 'privacy', 'security', 'account', 'advanced'].includes(panel)) return 'account'
  if (['tutorial', 'help'].includes(panel)) return 'help'
  return 'visual'
}

export default function SettingsNavigation({ activeCategory, onChange }) {
  return (
    <nav className="ff-settings-category-tabs" aria-label="Áreas das configurações">
      {SETTINGS_CATEGORIES.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={activeCategory === id ? 'is-active' : ''}
          onClick={() => onChange(id)}
          aria-current={activeCategory === id ? 'page' : undefined}
        >
          <Icon size={18} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
