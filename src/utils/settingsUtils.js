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
  showActiveWorkoutMini: true,
  autoSaveWorkout: true,
  autoOpenCalendar: true,

  // Dados
  syncWithDatabase: false,

  // Conta
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

  blue: {
    name: 'Azul',
    primary: '#3b82f6',
    primaryHover: '#60a5fa',
    soft: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.32)',
    text: '#93c5fd',
    shadow: 'rgba(59, 130, 246, 0.35)',
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

  orange: {
    name: 'Laranja',
    primary: '#f97316',
    primaryHover: '#fb923c',
    soft: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(249, 115, 22, 0.32)',
    text: '#fdba74',
    shadow: 'rgba(249, 115, 22, 0.35)',
  },

  red: {
    name: 'Vermelho',
    primary: '#ef4444',
    primaryHover: '#f87171',
    soft: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.32)',
    text: '#fca5a5',
    shadow: 'rgba(239, 68, 68, 0.35)',
  },
}

export function getAppSettings() {
  const data = localStorage.getItem(SETTINGS_KEY)

  if (!data) return defaultSettings

  try {
    return {
      ...defaultSettings,
      ...JSON.parse(data),
    }
  } catch {
    return defaultSettings
  }
}

export function saveAppSettings(settings) {
  const updatedSettings = {
    ...defaultSettings,
    ...settings,
  }

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings))

  window.dispatchEvent(
    new CustomEvent('forgeflow:settings-changed', {
      detail: updatedSettings,
    })
  )
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

export function getAccentColor(settings = getAppSettings()) {
  return accentColors[settings.accentColor] || accentColors.purple
}

export function applyAppSettingsToDocument(settings = getAppSettings()) {
  const accent = getAccentColor(settings)
  const root = document.documentElement

  root.style.setProperty('--ff-accent', accent.primary)
  root.style.setProperty('--ff-accent-hover', accent.primaryHover)
  root.style.setProperty('--ff-accent-soft', accent.soft)
  root.style.setProperty('--ff-accent-border', accent.border)
  root.style.setProperty('--ff-accent-text', accent.text)
  root.style.setProperty('--ff-accent-shadow', accent.shadow)

  root.dataset.theme = settings.themeMode
  root.dataset.accent = settings.accentColor

  if (settings.compactMobile) {
    root.classList.add('ff-compact-mobile')
  } else {
    root.classList.remove('ff-compact-mobile')
  }
}