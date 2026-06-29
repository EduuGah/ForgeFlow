const SETTINGS_KEY = 'forgeflow:settings'

export const defaultSettings = {
  // Aparência
  themeMode: 'dark',
  accentColor: 'blue',
  settingsUpdatedAt: '',
  compactMobile: false,
  simpleMode: false,

  // Treino
  defaultSetModel: 'hypertrophy',
  defaultRestTimer: 'Desligado',
  weightUnit: 'kg',
  visualDensity: 'comfortable',
  showPRs: true,
  keepActiveWorkoutVisible: true,
  hapticFeedback: false,

  // Privacidade e compartilhamento
  hideProgressPhotos: false,
  confirmBeforeOpeningPhotos: false,
  hideSensitiveShareData: true,
  hideBodyWeightOnShare: true,

  // Nutrição
  dailyWaterGoalMl: 2500,
  dailyCaloriesGoal: '',
  proteinGoal: '',
  carbsGoal: '',
  fatGoal: '',
  waterReminderCadence: '2h',
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
  workoutReminderLeadMinutes: 30,
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
  normalized.settingsUpdatedAt = typeof normalized.settingsUpdatedAt === 'string' ? normalized.settingsUpdatedAt : ''
  normalized.workoutsVisibleLimit = Math.min(20, Math.max(1, Number(normalized.workoutsVisibleLimit) || defaultSettings.workoutsVisibleLimit))
  normalized.weightUnit = normalized.weightUnit === 'lb' ? 'lb' : 'kg'
  normalized.visualDensity = normalized.visualDensity === 'compact' ? 'compact' : 'comfortable'
  // Modo simples foi desativado como padrão de produto para não esconder funções.
  normalized.simpleMode = false
  normalized.showPRs = normalized.showPRs !== false
  normalized.keepActiveWorkoutVisible = normalized.keepActiveWorkoutVisible !== false
  normalized.hapticFeedback = Boolean(normalized.hapticFeedback)
  normalized.hideProgressPhotos = Boolean(normalized.hideProgressPhotos)
  normalized.confirmBeforeOpeningPhotos = Boolean(normalized.confirmBeforeOpeningPhotos)
  normalized.hideSensitiveShareData = normalized.hideSensitiveShareData !== false
  normalized.hideBodyWeightOnShare = normalized.hideBodyWeightOnShare !== false
  normalized.dailyWaterGoalMl = Math.min(30000, Math.max(500, Number(normalized.dailyWaterGoalMl) || defaultSettings.dailyWaterGoalMl))

  ;['dailyCaloriesGoal', 'proteinGoal', 'carbsGoal', 'fatGoal'].forEach((goalKey) => {
    if (normalized[goalKey] === '' || normalized[goalKey] === null || normalized[goalKey] === undefined) {
      normalized[goalKey] = ''
      return
    }

    const parsedGoal = Number(normalized[goalKey])
    normalized[goalKey] = Number.isFinite(parsedGoal) && parsedGoal > 0 ? parsedGoal : ''
  })

  normalized.waterReminderCadence = ['1h', '2h', '3h', '4h', 'off'].includes(normalized.waterReminderCadence)
    ? normalized.waterReminderCadence
    : defaultSettings.waterReminderCadence

  const reminderSettings = [
    ['weightReminderEnabled', 'weightReminderTime'],
    ['workoutReminderEnabled', 'workoutReminderTime'],
    ['hydrationReminderEnabled', 'hydrationReminderTime'],
    ['preWorkoutMealReminderEnabled', 'preWorkoutMealReminderTime'],
    ['postWorkoutMealReminderEnabled', 'postWorkoutMealReminderTime'],
    ['progressPhotoReminderEnabled', 'progressPhotoReminderTime'],
    ['sleepReminderEnabled', 'sleepReminderTime'],
  ]

  reminderSettings.forEach(([enabledKey, timeKey]) => {
    normalized[enabledKey] = Boolean(normalized[enabledKey])
    normalized[timeKey] = /^\d{2}:\d{2}$/.test(String(normalized[timeKey] || ''))
      ? normalized[timeKey]
      : defaultSettings[timeKey]
  })

  const safeLeadMinutes = Number(normalized.workoutReminderLeadMinutes)
  normalized.workoutReminderLeadMinutes = [0, 5, 10, 15, 30, 45, 60, 90, 120].includes(safeLeadMinutes)
    ? safeLeadMinutes
    : defaultSettings.workoutReminderLeadMinutes

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

function withSettingsTimestamp(settings, { touch = true } = {}) {
  if (!touch) return settings

  return {
    ...settings,
    settingsUpdatedAt: new Date().toISOString(),
  }
}

export function mergeSettingsByFreshness(localSettings = {}, remoteSettings = {}) {
  const hasRemoteSettings = remoteSettings && typeof remoteSettings === 'object' && Object.keys(remoteSettings).length > 0

  if (!hasRemoteSettings) return normalizeSettings(localSettings)

  const normalizedLocal = normalizeSettings(localSettings)
  const normalizedRemote = normalizeSettings(remoteSettings)
  const localTime = Date.parse(normalizedLocal.settingsUpdatedAt || '') || 0
  const remoteTime = Date.parse(normalizedRemote.settingsUpdatedAt || '') || 0

  if (localTime || remoteTime) {
    return normalizeSettings(
      remoteTime > localTime
        ? { ...normalizedLocal, ...normalizedRemote }
        : { ...normalizedRemote, ...normalizedLocal }
    )
  }

  return normalizeSettings({
    ...normalizedLocal,
    ...normalizedRemote,
  })
}

export function saveAppSettings(settings, options = {}) {
  const updatedSettings = normalizeSettings(withSettingsTimestamp(settings, options))

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

export function saveUserAppSettings(user, settings, options = {}) {
  const key = getUserSettingsKey(user)
  const updatedSettings = normalizeSettings(withSettingsTimestamp(settings, options))

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
  if (typeof document === 'undefined') return normalizeSettings(settings)

  const normalizedSettings = normalizeSettings(settings)
  const accent = getAccentColor(normalizedSettings)
  const effectiveTheme = getEffectiveTheme(normalizedSettings)
  const root = document.documentElement
  const body = document.body

  const lightAccentTextOverrides = {
    lime: '#3f6212',
    yellow: '#854d0e',
    amber: '#92400e',
    orange: '#c2410c',
    slate: '#475569',
    zinc: '#52525b',
  }

  const accentText = effectiveTheme === 'light'
    ? lightAccentTextOverrides[normalizedSettings.accentColor] || accent.primary
    : accent.text

  root.dataset.themeMode = normalizedSettings.themeMode
  root.dataset.theme = effectiveTheme
  root.dataset.resolvedTheme = effectiveTheme
  root.dataset.accent = normalizedSettings.accentColor
  root.style.colorScheme = effectiveTheme

  root.style.setProperty('--ff-accent', accent.primary)
  root.style.setProperty('--ff-accent-hover', accent.primaryHover)
  root.style.setProperty('--ff-accent-soft', accent.soft)
  root.style.setProperty('--ff-accent-border', accent.border)
  root.style.setProperty('--ff-accent-text', accentText)
  root.style.setProperty('--ff-accent-shadow', accent.shadow)
  root.style.setProperty('--ff-apk-bg', effectiveTheme === 'light' ? '#f7f7fb' : '#000000')

  root.classList.toggle('ff-theme-light', effectiveTheme === 'light')
  root.classList.toggle('ff-theme-dark', effectiveTheme !== 'light')

  if (body) {
    body.dataset.theme = effectiveTheme
    body.dataset.resolvedTheme = effectiveTheme
    body.classList.toggle('ff-theme-light', effectiveTheme === 'light')
    body.classList.toggle('ff-theme-dark', effectiveTheme !== 'light')
    body.style.colorScheme = effectiveTheme
  }

  let themeColorMeta = document.querySelector('meta[name="theme-color"]')
  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta')
    themeColorMeta.name = 'theme-color'
    document.head.appendChild(themeColorMeta)
  }
  themeColorMeta.content = effectiveTheme === 'light' ? '#f7f7fb' : '#000000'

  if (normalizedSettings.compactMobile) {
    root.classList.add('ff-compact-mobile')
  } else {
    root.classList.remove('ff-compact-mobile')
  }

  if (normalizedSettings.simpleMode) {
    root.classList.add('ff-simple-mode')
  } else {
    root.classList.remove('ff-simple-mode')
  }

  return normalizedSettings
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
