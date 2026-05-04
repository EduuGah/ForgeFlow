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
    autoOpenCalendar: true,
    autoStartRestTimer: true,
    showPRDuringWorkout: true,
    showLastWorkoutComparison: true,
    confirmBeforeFinishWorkout: true,
    confirmBeforeCancelWorkout: true,

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
        text: '#fde047',
        shadow: 'rgba(234, 179, 8, 0.35)',
    },

    amber: {
        name: 'Âmbar',
        primary: '#f59e0b',
        primaryHover: '#fbbf24',
        soft: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.32)',
        text: '#fcd34d',
        shadow: 'rgba(245, 158, 11, 0.35)',
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

    rose: {
        name: 'Rosa',
        primary: '#f43f5e',
        primaryHover: '#fb7185',
        soft: 'rgba(244, 63, 94, 0.12)',
        border: 'rgba(244, 63, 94, 0.32)',
        text: '#fda4af',
        shadow: 'rgba(244, 63, 94, 0.35)',
    },

    pink: {
        name: 'Pink',
        primary: '#ec4899',
        primaryHover: '#f472b6',
        soft: 'rgba(236, 72, 153, 0.12)',
        border: 'rgba(236, 72, 153, 0.32)',
        text: '#f9a8d4',
        shadow: 'rgba(236, 72, 153, 0.35)',
    },

    fuchsia: {
        name: 'Fúcsia',
        primary: '#d946ef',
        primaryHover: '#e879f9',
        soft: 'rgba(217, 70, 239, 0.12)',
        border: 'rgba(217, 70, 239, 0.32)',
        text: '#f0abfc',
        shadow: 'rgba(217, 70, 239, 0.35)',
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

    crimson: {
        name: 'Carmesim',
        primary: '#dc2626',
        primaryHover: '#ef4444',
        soft: 'rgba(220, 38, 38, 0.12)',
        border: 'rgba(220, 38, 38, 0.32)',
        text: '#fca5a5',
        shadow: 'rgba(220, 38, 38, 0.35)',
    },

    slate: {
        name: 'Grafite',
        primary: '#64748b',
        primaryHover: '#94a3b8',
        soft: 'rgba(100, 116, 139, 0.12)',
        border: 'rgba(100, 116, 139, 0.32)',
        text: '#cbd5e1',
        shadow: 'rgba(100, 116, 139, 0.35)',
    },

    zinc: {
        name: 'Cinza',
        primary: '#71717a',
        primaryHover: '#a1a1aa',
        soft: 'rgba(113, 113, 122, 0.12)',
        border: 'rgba(113, 113, 122, 0.32)',
        text: '#d4d4d8',
        shadow: 'rgba(113, 113, 122, 0.35)',
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