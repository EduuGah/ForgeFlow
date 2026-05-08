const SETTINGS_KEY = 'forgeflow:settings'
const THEME_STYLE_ID = 'forgeflow-theme-style'

export const defaultSettings = {
  // Aparência
  themeMode: 'dark',
  accentColor: 'violet',
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

  // Mantidos por compatibilidade com versões antigas do app.
  autoOpenCalendar: false,
  autoStartRestTimer: false,
  showPRDuringWorkout: true,
  showLastWorkoutComparison: true,
  syncWithDatabase: false,
  accountName: '',
  currentWeight: '',
  mainGoal: '',
}

export const accentColors = {
  violet: {
    name: 'Violeta',
    description: 'Padrão ForgeFlow',
    primary: '#8b5cf6',
    primaryHover: '#a78bfa',
    soft: 'rgba(139, 92, 246, 0.14)',
    border: 'rgba(139, 92, 246, 0.36)',
    text: '#c4b5fd',
    shadow: 'rgba(139, 92, 246, 0.36)',
    lightText: '#6d28d9',
    lightSoft: 'rgba(139, 92, 246, 0.10)',
    lightBorder: 'rgba(139, 92, 246, 0.24)',
  },

  blue: {
    name: 'Azul',
    description: 'Limpo e profissional',
    primary: '#2563eb',
    primaryHover: '#3b82f6',
    soft: 'rgba(37, 99, 235, 0.14)',
    border: 'rgba(37, 99, 235, 0.34)',
    text: '#93c5fd',
    shadow: 'rgba(37, 99, 235, 0.32)',
    lightText: '#1d4ed8',
    lightSoft: 'rgba(37, 99, 235, 0.09)',
    lightBorder: 'rgba(37, 99, 235, 0.22)',
  },

  cyan: {
    name: 'Ciano',
    description: 'Tecnológico',
    primary: '#0891b2',
    primaryHover: '#06b6d4',
    soft: 'rgba(8, 145, 178, 0.14)',
    border: 'rgba(8, 145, 178, 0.34)',
    text: '#67e8f9',
    shadow: 'rgba(8, 145, 178, 0.30)',
    lightText: '#0e7490',
    lightSoft: 'rgba(8, 145, 178, 0.09)',
    lightBorder: 'rgba(8, 145, 178, 0.22)',
  },

  emerald: {
    name: 'Esmeralda',
    description: 'Saúde e evolução',
    primary: '#059669',
    primaryHover: '#10b981',
    soft: 'rgba(5, 150, 105, 0.14)',
    border: 'rgba(5, 150, 105, 0.34)',
    text: '#6ee7b7',
    shadow: 'rgba(5, 150, 105, 0.30)',
    lightText: '#047857',
    lightSoft: 'rgba(5, 150, 105, 0.09)',
    lightBorder: 'rgba(5, 150, 105, 0.22)',
  },

  amber: {
    name: 'Âmbar',
    description: 'Quente e energético',
    primary: '#d97706',
    primaryHover: '#f59e0b',
    soft: 'rgba(217, 119, 6, 0.14)',
    border: 'rgba(217, 119, 6, 0.34)',
    text: '#fcd34d',
    shadow: 'rgba(217, 119, 6, 0.30)',
    lightText: '#b45309',
    lightSoft: 'rgba(217, 119, 6, 0.10)',
    lightBorder: 'rgba(217, 119, 6, 0.24)',
  },

  rose: {
    name: 'Rose',
    description: 'Forte e moderno',
    primary: '#e11d48',
    primaryHover: '#f43f5e',
    soft: 'rgba(225, 29, 72, 0.14)',
    border: 'rgba(225, 29, 72, 0.34)',
    text: '#fda4af',
    shadow: 'rgba(225, 29, 72, 0.30)',
    lightText: '#be123c',
    lightSoft: 'rgba(225, 29, 72, 0.09)',
    lightBorder: 'rgba(225, 29, 72, 0.22)',
  },

  slate: {
    name: 'Grafite',
    description: 'Neutro premium',
    primary: '#475569',
    primaryHover: '#64748b',
    soft: 'rgba(71, 85, 105, 0.14)',
    border: 'rgba(71, 85, 105, 0.34)',
    text: '#cbd5e1',
    shadow: 'rgba(71, 85, 105, 0.28)',
    lightText: '#334155',
    lightSoft: 'rgba(71, 85, 105, 0.08)',
    lightBorder: 'rgba(71, 85, 105, 0.18)',
  },
}

export const themeOptions = {
  light: {
    name: 'Claro',
    description: 'Mais limpo para usar durante o dia.',
  },
  dark: {
    name: 'Escuro',
    description: 'Visual padrão com fundo preto.',
  },
  system: {
    name: 'Sistema',
    description: 'Segue o tema do dispositivo.',
  },
}

export function getUserId(user) {
  return user?.id || user?._id || 'guest'
}

export function getUserSettingsKey(user) {
  return `forgeflow:${getUserId(user)}:settings`
}

function normalizeThemeMode(themeMode) {
  if (themeMode === 'auto') return 'system'
  if (themeMode === 'purple') return 'dark'
  if (['light', 'dark', 'system'].includes(themeMode)) return themeMode

  return defaultSettings.themeMode
}

function normalizeAccentColor(accentColor) {
  if (accentColors[accentColor]) return accentColor

  const legacyAccentMap = {
    purple: 'violet',
    pink: 'rose',
    fuchsia: 'rose',
    green: 'emerald',
    teal: 'cyan',
    sky: 'cyan',
    orange: 'amber',
    yellow: 'amber',
    lime: 'emerald',
    red: 'rose',
    crimson: 'rose',
    zinc: 'slate',
    indigo: 'violet',
  }

  return legacyAccentMap[accentColor] || defaultSettings.accentColor
}

export function normalizeSettings(settings = {}) {
  return {
    ...defaultSettings,
    ...settings,
    themeMode: normalizeThemeMode(settings.themeMode),
    accentColor: normalizeAccentColor(settings.accentColor),
    workoutsVisibleLimit: Number(settings.workoutsVisibleLimit || defaultSettings.workoutsVisibleLimit),
    compactMobile: Boolean(settings.compactMobile),
    collapseSeriesByDefault: Boolean(settings.collapseSeriesByDefault),
    collapseWorkoutsByDefault: Boolean(settings.collapseWorkoutsByDefault),
    autoSaveWorkout: settings.autoSaveWorkout !== false,
    confirmBeforeFinishWorkout: settings.confirmBeforeFinishWorkout !== false,
    confirmBeforeCancelWorkout: settings.confirmBeforeCancelWorkout !== false,
  }
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
  applyAppSettingsToDocument(updatedSettings)

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

  applyAppSettingsToDocument(updatedSettings)

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
  return accentColors[settings.accentColor] || accentColors.violet
}

export function getResolvedThemeMode(settings = getAppSettings()) {
  const normalizedTheme = normalizeThemeMode(settings.themeMode)

  if (normalizedTheme !== 'system') return normalizedTheme

  if (typeof window === 'undefined') return 'dark'

  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

function ensureThemeStyleElement() {
  if (typeof document === 'undefined') return null

  let styleElement = document.getElementById(THEME_STYLE_ID)

  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.id = THEME_STYLE_ID
    document.head.appendChild(styleElement)
  }

  return styleElement
}

function applyThemeVariables(root, resolvedTheme, accent) {
  const isLight = resolvedTheme === 'light'

  root.style.setProperty('--ff-accent', accent.primary)
  root.style.setProperty('--ff-accent-hover', accent.primaryHover)
  root.style.setProperty('--ff-accent-soft', isLight ? accent.lightSoft : accent.soft)
  root.style.setProperty('--ff-accent-border', isLight ? accent.lightBorder : accent.border)
  root.style.setProperty('--ff-accent-text', isLight ? accent.lightText : accent.text)
  root.style.setProperty('--ff-accent-shadow', accent.shadow)

  root.style.setProperty('--ff-bg', isLight ? '#f8fafc' : '#050505')
  root.style.setProperty('--ff-surface', isLight ? '#ffffff' : '#18181b')
  root.style.setProperty('--ff-surface-2', isLight ? '#f1f5f9' : '#101014')
  root.style.setProperty('--ff-border', isLight ? '#e2e8f0' : '#27272a')
  root.style.setProperty('--ff-text', isLight ? '#0f172a' : '#fafafa')
  root.style.setProperty('--ff-muted', isLight ? '#64748b' : '#71717a')
}

function injectThemeOverrides() {
  const styleElement = ensureThemeStyleElement()

  if (!styleElement) return

  styleElement.textContent = `
    html[data-resolved-theme='light'] {
      color-scheme: light;
      background: var(--ff-bg);
    }

    html[data-resolved-theme='dark'] {
      color-scheme: dark;
      background: var(--ff-bg);
    }

    html[data-resolved-theme='light'] body {
      background: var(--ff-bg) !important;
      color: var(--ff-text) !important;
    }

    html[data-resolved-theme='light'] .bg-black,
    html[data-resolved-theme='light'] .bg-zinc-950,
    html[data-resolved-theme='light'] .bg-\[\#101014\],
    html[data-resolved-theme='light'] .bg-\[\#18181b\] {
      background-color: var(--ff-surface) !important;
    }

    html[data-resolved-theme='light'] .bg-zinc-900,
    html[data-resolved-theme='light'] .bg-zinc-800,
    html[data-resolved-theme='light'] .hover\:bg-zinc-900\/70:hover,
    html[data-resolved-theme='light'] .hover\:bg-zinc-900:hover,
    html[data-resolved-theme='light'] .hover\:bg-\[\#1f1f23\]:hover {
      background-color: var(--ff-surface-2) !important;
    }

    html[data-resolved-theme='light'] .border-zinc-900,
    html[data-resolved-theme='light'] .border-zinc-800,
    html[data-resolved-theme='light'] .border-zinc-700 {
      border-color: var(--ff-border) !important;
    }

    html[data-resolved-theme='light'] .text-white,
    html[data-resolved-theme='light'] .text-zinc-50,
    html[data-resolved-theme='light'] .text-zinc-100,
    html[data-resolved-theme='light'] .text-zinc-200,
    html[data-resolved-theme='light'] .text-zinc-300 {
      color: var(--ff-text) !important;
    }

    html[data-resolved-theme='light'] .text-zinc-400,
    html[data-resolved-theme='light'] .text-zinc-500,
    html[data-resolved-theme='light'] .text-zinc-600 {
      color: var(--ff-muted) !important;
    }

    html[data-resolved-theme='light'] input,
    html[data-resolved-theme='light'] textarea,
    html[data-resolved-theme='light'] select {
      background-color: #ffffff !important;
      color: var(--ff-text) !important;
      border-color: var(--ff-border) !important;
    }

    html[data-resolved-theme='light'] input::placeholder,
    html[data-resolved-theme='light'] textarea::placeholder {
      color: #94a3b8 !important;
    }

    html.ff-compact-mobile body {
      --ff-mobile-density: 0.88;
    }

    @media (max-width: 640px) {
      html.ff-compact-mobile .rounded-3xl {
        border-radius: 1rem !important;
      }

      html.ff-compact-mobile .p-5,
      html.ff-compact-mobile .p-6 {
        padding: 1rem !important;
      }

      html.ff-compact-mobile .gap-6 {
        gap: 1rem !important;
      }
    }
  `
}

export function applyAppSettingsToDocument(settings = getAppSettings()) {
  if (typeof document === 'undefined') return

  const normalizedSettings = normalizeSettings(settings)
  const accent = getAccentColor(normalizedSettings)
  const resolvedTheme = getResolvedThemeMode(normalizedSettings)
  const root = document.documentElement

  injectThemeOverrides()
  applyThemeVariables(root, resolvedTheme, accent)

  root.dataset.theme = normalizedSettings.themeMode
  root.dataset.resolvedTheme = resolvedTheme
  root.dataset.accent = normalizedSettings.accentColor

  if (normalizedSettings.compactMobile) {
    root.classList.add('ff-compact-mobile')
  } else {
    root.classList.remove('ff-compact-mobile')
  }
}

if (typeof window !== 'undefined') {
  const media = window.matchMedia('(prefers-color-scheme: light)')

  media.addEventListener?.('change', () => {
    const settings = getAppSettings()

    if (settings.themeMode === 'system') {
      applyAppSettingsToDocument(settings)
    }
  })
}
