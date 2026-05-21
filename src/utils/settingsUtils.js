const SETTINGS_KEY = 'forgeflow:settings'

export const defaultSettings = {
  // Aparência
  themeMode: 'dark',
  accentColor: 'purple',
  compactMobile: false,

  // Treino
  defaultSetModel: 'hypertrophy',
  defaultRestTimer: 'Desligado',
  weightUnit: 'kg',
  collapseSeriesByDefault: false,
  collapseWorkoutsByDefault: false,
  workoutsVisibleLimit: 5,
  autoSaveWorkout: true,
  confirmBeforeFinishWorkout: true,
  confirmBeforeCancelWorkout: true,

  // Agenda e notificações nativas
  weeklySchedule: {
    monday: { type: 'empty' },
    tuesday: { type: 'empty' },
    wednesday: { type: 'empty' },
    thursday: { type: 'empty' },
    friday: { type: 'empty' },
    saturday: { type: 'empty' },
    sunday: { type: 'empty' },
  },
  weightReminderEnabled: false,
  weightReminderTime: '08:00',
  workoutReminderEnabled: false,
  workoutReminderTime: '18:00',
  hydrationReminderEnabled: false,
  hydrationReminderTime: '10:00',
  preWorkoutMealReminderEnabled: false,
  preWorkoutMealReminderTime: '16:30',
  postWorkoutMealReminderEnabled: false,
  postWorkoutMealReminderTime: '20:30',
  progressPhotoReminderEnabled: false,
  progressPhotoReminderTime: '09:00',
  sleepReminderEnabled: false,
  sleepReminderTime: '22:30',

  // Mantidos só por compatibilidade com backups/configs antigas.
  // Não aparecem mais na tela de configurações.
  autoOpenCalendar: false,
  autoStartRestTimer: false,
  showPRDuringWorkout: false,
  showLastWorkoutComparison: false,
  syncWithDatabase: false,
  accountName: '',
  currentWeight: '',
  mainGoal: '',
}

export const accentColors = {
  purple: {
    name: 'Roxo',
    primary: '#8b5cf6',
    primaryHover: '#a78bfa',
    soft: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.32)',
    text: '#c4b5fd',
    shadow: 'rgba(139, 92, 246, 0.35)',
  },

  violet: {
    name: 'Violeta',
    primary: '#7c3aed',
    primaryHover: '#8b5cf6',
    soft: 'rgba(124, 58, 237, 0.12)',
    border: 'rgba(124, 58, 237, 0.32)',
    text: '#ddd6fe',
    shadow: 'rgba(124, 58, 237, 0.35)',
  },

  indigo: {
    name: 'Índigo',
    primary: '#6366f1',
    primaryHover: '#818cf8',
    soft: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.32)',
    text: '#a5b4fc',
    shadow: 'rgba(99, 102, 241, 0.35)',
  },

  blue: {
    name: 'Azul',
    primary: '#3b82f6',
    primaryHover: '#60a5fa',
    soft: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.32)',
    text: '#93c5fd',
    shadow: 'rgba(59, 130, 246, 0.35)',
  },

  sky: {
    name: 'Azul Céu',
    primary: '#0ea5e9',
    primaryHover: '#38bdf8',
    soft: 'rgba(14, 165, 233, 0.12)',
    border: 'rgba(14, 165, 233, 0.32)',
    text: '#7dd3fc',
    shadow: 'rgba(14, 165, 233, 0.35)',
  },

  cyan: {
    name: 'Ciano',
    primary: '#06b6d4',
    primaryHover: '#22d3ee',
    soft: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.32)',
    text: '#67e8f9',
    shadow: 'rgba(6, 182, 212, 0.35)',
  },

  teal: {
    name: 'Turquesa',
    primary: '#14b8a6',
    primaryHover: '#2dd4bf',
    soft: 'rgba(20, 184, 166, 0.12)',
    border: 'rgba(20, 184, 166, 0.32)',
    text: '#5eead4',
    shadow: 'rgba(20, 184, 166, 0.35)',
  },

  green: {
    name: 'Verde',
    primary: '#10b981',
    primaryHover: '#34d399',
    soft: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.32)',
    text: '#6ee7b7',
    shadow: 'rgba(16, 185, 129, 0.35)',
  },

  emerald: {
    name: 'Esmeralda',
    primary: '#059669',
    primaryHover: '#10b981',
    soft: 'rgba(5, 150, 105, 0.12)',
    border: 'rgba(5, 150, 105, 0.32)',
    text: '#6ee7b7',
    shadow: 'rgba(5, 150, 105, 0.35)',
  },

  lime: {
    name: 'Limão',
    primary: '#84cc16',
    primaryHover: '#a3e635',
    soft: 'rgba(132, 204, 22, 0.12)',
    border: 'rgba(132, 204, 22, 0.32)',
    text: '#bef264',
    shadow: 'rgba(132, 204, 22, 0.35)',
  },

  yellow: {
    name: 'Amarelo',
    primary: '#eab308',
    primaryHover: '#facc15',
    soft: 'rgba(234, 179, 8, 0.12)',
    border: 'rgba(234, 179, 8, 0.32)',
    text: '#854d0e',
    shadow: 'rgba(234, 179, 8, 0.35)',
  },

  amber: {
    name: 'Âmbar',
    primary: '#f59e0b',
    primaryHover: '#fbbf24',
    soft: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.32)',
    text: '#92400e',
    shadow: 'rgba(245, 158, 11, 0.35)',
  },

  orange: {
    name: 'Laranja',
    primary: '#f97316',
    primaryHover: '#fb923c',
    soft: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(249, 115, 22, 0.32)',
    text: '#c2410c',
    shadow: 'rgba(249, 115, 22, 0.35)',
  },

  rose: {
    name: 'Rosa',
    primary: '#f43f5e',
    primaryHover: '#fb7185',
    soft: 'rgba(244, 63, 94, 0.12)',
    border: 'rgba(244, 63, 94, 0.32)',
    text: '#fb7185',
    shadow: 'rgba(244, 63, 94, 0.35)',
  },

  pink: {
    name: 'Pink',
    primary: '#ec4899',
    primaryHover: '#f472b6',
    soft: 'rgba(236, 72, 153, 0.12)',
    border: 'rgba(236, 72, 153, 0.32)',
    text: '#f472b6',
    shadow: 'rgba(236, 72, 153, 0.35)',
  },

  fuchsia: {
    name: 'Fúcsia',
    primary: '#d946ef',
    primaryHover: '#e879f9',
    soft: 'rgba(217, 70, 239, 0.12)',
    border: 'rgba(217, 70, 239, 0.32)',
    text: '#e879f9',
    shadow: 'rgba(217, 70, 239, 0.35)',
  },

  red: {
    name: 'Vermelho',
    primary: '#ef4444',
    primaryHover: '#f87171',
    soft: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.32)',
    text: '#f87171',
    shadow: 'rgba(239, 68, 68, 0.35)',
  },

  crimson: {
    name: 'Carmesim',
    primary: '#dc2626',
    primaryHover: '#ef4444',
    soft: 'rgba(220, 38, 38, 0.12)',
    border: 'rgba(220, 38, 38, 0.32)',
    text: '#ef4444',
    shadow: 'rgba(220, 38, 38, 0.35)',
  },

  slate: {
    name: 'Grafite',
    primary: '#64748b',
    primaryHover: '#94a3b8',
    soft: 'rgba(100, 116, 139, 0.12)',
    border: 'rgba(100, 116, 139, 0.32)',
    text: '#94a3b8',
    shadow: 'rgba(100, 116, 139, 0.35)',
  },

  zinc: {
    name: 'Cinza',
    primary: '#71717a',
    primaryHover: '#a1a1aa',
    soft: 'rgba(113, 113, 122, 0.12)',
    border: 'rgba(113, 113, 122, 0.32)',
    text: '#a1a1aa',
    shadow: 'rgba(113, 113, 122, 0.35)',
  },
}

const validThemeModes = ['dark', 'light', 'system']
const validAccentColors = Object.keys(accentColors)

function getSystemTheme() {
  if (typeof window === 'undefined') return 'dark'

  return window.matchMedia?.('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

function normalizeThemeMode(themeMode) {
  if (themeMode === 'auto') return 'system'
  if (themeMode === 'purple') return 'dark'

  return validThemeModes.includes(themeMode) ? themeMode : defaultSettings.themeMode
}

function normalizeAccentColor(accentColor) {
  return validAccentColors.includes(accentColor) ? accentColor : defaultSettings.accentColor
}

export function getUserId(user) {
  return user?.id || user?._id || 'guest'
}

export function getUserSettingsKey(user) {
  return `forgeflow:${getUserId(user)}:settings`
}

export function normalizeSettings(settings = {}) {
  const normalized = {
    ...defaultSettings,
    ...settings,
  }

  normalized.themeMode = normalizeThemeMode(normalized.themeMode)
  normalized.accentColor = normalizeAccentColor(normalized.accentColor)
  normalized.workoutsVisibleLimit = Number(normalized.workoutsVisibleLimit) || defaultSettings.workoutsVisibleLimit
  normalized.weightReminderEnabled = Boolean(normalized.weightReminderEnabled)
  normalized.workoutReminderEnabled = Boolean(normalized.workoutReminderEnabled)
  normalized.weightReminderTime = /^\d{2}:\d{2}$/.test(String(normalized.weightReminderTime || ''))
    ? normalized.weightReminderTime
    : defaultSettings.weightReminderTime
  normalized.workoutReminderTime = /^\d{2}:\d{2}$/.test(String(normalized.workoutReminderTime || ''))
    ? normalized.workoutReminderTime
    : defaultSettings.workoutReminderTime

  return normalized
}

export function getAppSettings() {
  const data = localStorage.getItem(SETTINGS_KEY)

  if (!data) return defaultSettings

  try {
    return normalizeSettings(JSON.parse(data))
  } catch {
    return defaultSettings
  }
}

export function saveAppSettings(settings) {
  const updatedSettings = normalizeSettings(settings)

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings))

  window.dispatchEvent(
    new CustomEvent('forgeflow:settings-changed', {
      detail: updatedSettings,
    })
  )

  return updatedSettings
}

export function getUserAppSettings(user) {
  const key = getUserSettingsKey(user)
  const data = localStorage.getItem(key)

  if (!data) return getAppSettings()

  try {
    return normalizeSettings(JSON.parse(data))
  } catch {
    return getAppSettings()
  }
}

export function saveUserAppSettings(user, settings) {
  const key = getUserSettingsKey(user)
  const updatedSettings = normalizeSettings(settings)

  localStorage.setItem(key, JSON.stringify(updatedSettings))
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings))

  window.dispatchEvent(
    new CustomEvent('forgeflow:settings-changed', {
      detail: updatedSettings,
    })
  )

  return updatedSettings
}

export function updateAppSetting(key, value) {
  const currentSettings = getAppSettings()

  const updatedSettings = {
    ...currentSettings,
    [key]: value,
  }

  saveAppSettings(updatedSettings)

  return updatedSettings
}

export function updateUserAppSetting(user, key, value) {
  const currentSettings = getUserAppSettings(user)

  const updatedSettings = {
    ...currentSettings,
    [key]: value,
  }

  saveUserAppSettings(user, updatedSettings)

  return updatedSettings
}

export function getAccentColor(settings = getAppSettings()) {
  return accentColors[settings.accentColor] || accentColors.purple
}

export function getEffectiveTheme(settings = getAppSettings()) {
  const themeMode = normalizeThemeMode(settings.themeMode)

  return themeMode === 'system' ? getSystemTheme() : themeMode
}


export function applyAppSettingsToDocument(settings = getAppSettings()) {
  const normalizedSettings = normalizeSettings(settings)
  const accent = getAccentColor(normalizedSettings)
  const effectiveTheme = getEffectiveTheme(normalizedSettings)
  const root = document.documentElement

  const accentText = effectiveTheme === 'light' ? accent.primary : accent.text

  root.style.setProperty('--ff-accent', accent.primary)
  root.style.setProperty('--ff-accent-hover', accent.primaryHover)
  root.style.setProperty('--ff-accent-soft', accent.soft)
  root.style.setProperty('--ff-accent-border', accent.border)
  root.style.setProperty('--ff-accent-text', accentText)
  root.style.setProperty('--ff-accent-shadow', accent.shadow)

  if (effectiveTheme === 'light') {
    root.style.setProperty('--ff-bg', '#f7f7fb')
    root.style.setProperty('--ff-bg-soft', '#ffffff')
    root.style.setProperty('--ff-card', '#ffffff')
    root.style.setProperty('--ff-card-hover', '#f4f4f7')
    root.style.setProperty('--ff-surface', '#ffffff')
    root.style.setProperty('--ff-surface-2', '#f4f4f7')
    root.style.setProperty('--ff-surface-3', '#e7e7ee')
    root.style.setProperty('--ff-input', '#ffffff')
    root.style.setProperty('--ff-header', 'rgba(255, 255, 255, 0.84)')
    root.style.setProperty('--ff-sidebar', '#ffffff')
    root.style.setProperty('--ff-border', 'rgba(24, 24, 27, 0.14)')
    root.style.setProperty('--ff-border-soft', 'rgba(24, 24, 27, 0.1)')
    root.style.setProperty('--ff-border-strong', 'rgba(24, 24, 27, 0.24)')
    root.style.setProperty('--ff-text', '#18181b')
    root.style.setProperty('--ff-text-soft', '#27272a')
    root.style.setProperty('--ff-muted', '#52525b')
    root.style.setProperty('--ff-muted-2', '#71717a')
    root.style.setProperty('--ff-overlay', 'rgba(24, 24, 27, 0.45)')
    root.style.setProperty('--ff-scroll-track', 'rgba(228, 228, 231, 0.9)')
    root.style.setProperty('--ff-success-text', '#047857')
    root.style.setProperty('--ff-danger-text', '#dc2626')
    root.style.setProperty('--ff-warning-text', '#92400e')
    root.style.setProperty('--ff-warning-muted', 'rgba(120, 53, 15, 0.78)')
  } else {
    root.style.setProperty('--ff-bg', '#000000')
    root.style.setProperty('--ff-bg-soft', '#09090b')
    root.style.setProperty('--ff-card', '#18181b')
    root.style.setProperty('--ff-card-hover', '#1f1f23')
    root.style.setProperty('--ff-surface', '#18181b')
    root.style.setProperty('--ff-surface-2', '#101014')
    root.style.setProperty('--ff-surface-3', '#27272a')
    root.style.setProperty('--ff-input', '#101014')
    root.style.setProperty('--ff-header', 'rgba(0, 0, 0, 0.78)')
    root.style.setProperty('--ff-sidebar', '#121212')
    root.style.setProperty('--ff-border', 'rgba(63, 63, 70, 0.9)')
    root.style.setProperty('--ff-border-soft', 'rgba(39, 39, 42, 0.9)')
    root.style.setProperty('--ff-border-strong', '#52525b')
    root.style.setProperty('--ff-text', '#ffffff')
    root.style.setProperty('--ff-text-soft', '#e4e4e7')
    root.style.setProperty('--ff-muted', '#a1a1aa')
    root.style.setProperty('--ff-muted-2', '#71717a')
    root.style.setProperty('--ff-overlay', 'rgba(0, 0, 0, 0.75)')
    root.style.setProperty('--ff-scroll-track', 'rgba(24, 24, 27, 0.65)')
    root.style.setProperty('--ff-success-text', '#34d399')
    root.style.setProperty('--ff-danger-text', '#f87171')
    root.style.setProperty('--ff-warning-text', '#facc15')
    root.style.setProperty('--ff-warning-muted', 'rgba(254, 240, 138, 0.82)')
  }

  root.dataset.themeMode = normalizedSettings.themeMode
  root.dataset.theme = effectiveTheme
  root.dataset.accent = normalizedSettings.accentColor
  root.style.colorScheme = effectiveTheme

  if (normalizedSettings.compactMobile) {
    root.classList.add('ff-compact-mobile')
  } else {
    root.classList.remove('ff-compact-mobile')
  }
}

export function watchSystemThemeChanges() {
  if (typeof window === 'undefined') return () => {}

  const mediaQuery = window.matchMedia?.('(prefers-color-scheme: light)')

  if (!mediaQuery) return () => {}

  const handleChange = () => {
    const settings = getAppSettings()

    if (settings.themeMode === 'system') {
      applyAppSettingsToDocument(settings)
    }
  }

  mediaQuery.addEventListener?.('change', handleChange)

  return () => {
    mediaQuery.removeEventListener?.('change', handleChange)
  }
}
