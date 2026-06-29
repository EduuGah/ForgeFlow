import { TUTORIAL_VERSION } from './tutorialSteps'

const BASE_STORAGE_KEY = 'forgeflow:tutorial-state'
const GLOBAL_DISMISSED_KEY = 'forgeflow:tutorial-welcome-dismissed'
const WELCOME_PENDING_KEY = 'forgeflow:tutorial-welcome-pending'

export { BASE_STORAGE_KEY, GLOBAL_DISMISSED_KEY, WELCOME_PENDING_KEY }

function canUseLocalStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return false

  try {
    const key = 'forgeflow:storage-test'
    window.localStorage.setItem(key, '1')
    window.localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

function safeParseJson(rawValue, fallback) {
  try {
    if (!rawValue) return fallback
    const parsed = JSON.parse(rawValue)
    return parsed && typeof parsed === 'object' ? parsed : fallback
  } catch {
    return fallback
  }
}

export function getTutorialUserId(user) {
  return String(user?.id || user?._id || user?.email || '').trim()
}

export function getTutorialStorageKey(user) {
  const id = getTutorialUserId(user) || 'anonymous'
  return `${BASE_STORAGE_KEY}:${id}`
}

export function getWelcomePendingKey(user) {
  const id = getTutorialUserId(user)
  return id ? `${WELCOME_PENDING_KEY}:${id}` : ''
}

export function createDefaultTutorialState(overrides = {}) {
  return {
    tutorialVersion: TUTORIAL_VERSION,
    tutorialCompleted: false,
    tutorialCurrentFlow: 'welcome',
    tutorialCurrentStep: 0,
    tutorialSkipped: false,
    tutorialPaused: false,
    tutorialStartedAt: '',
    tutorialCompletedAt: '',
    tutorialSeenSections: [],
    tutorialAutoStartEnabled: true,
    hasSeenWelcome: false,
    dismissedWelcome: false,
    contextualTipsEnabled: true,
    completedFlows: {},
    completedSections: [],
    skippedSections: [],
    updatedAt: '',
    ...overrides,
  }
}

export function normalizeTutorialState(parsed = {}, user = null) {
  const globalDismissed =
    !user &&
    canUseLocalStorage() &&
    window.localStorage.getItem(GLOBAL_DISMISSED_KEY) === 'true'

  const state = createDefaultTutorialState({
    ...parsed,
    tutorialVersion: Number(parsed.tutorialVersion || parsed.version || TUTORIAL_VERSION),
    tutorialCompleted: Boolean(parsed.tutorialCompleted || parsed.completed),
    tutorialCurrentFlow: parsed.tutorialCurrentFlow || parsed.currentFlow || 'welcome',
    tutorialCurrentStep: Math.max(0, Number(parsed.tutorialCurrentStep ?? parsed.currentStep ?? 0) || 0),
    tutorialSkipped: Boolean(parsed.tutorialSkipped || parsed.skipped),
    tutorialPaused: Boolean(parsed.tutorialPaused || parsed.paused),
    tutorialSeenSections: Array.isArray(parsed.tutorialSeenSections) ? parsed.tutorialSeenSections : [],
    tutorialAutoStartEnabled: parsed.tutorialAutoStartEnabled !== false,
    hasSeenWelcome: Boolean(parsed.hasSeenWelcome || globalDismissed || parsed.tutorialCompleted),
    dismissedWelcome: Boolean(parsed.dismissedWelcome || globalDismissed || parsed.tutorialCompleted),
    contextualTipsEnabled: parsed.contextualTipsEnabled !== false,
    completedFlows: parsed.completedFlows && typeof parsed.completedFlows === 'object' ? parsed.completedFlows : {},
    completedSections: Array.isArray(parsed.completedSections)
      ? parsed.completedSections
      : parsed.completedSections && typeof parsed.completedSections === 'object'
        ? Object.keys(parsed.completedSections).filter((key) => parsed.completedSections[key])
        : [],
    skippedSections: Array.isArray(parsed.skippedSections)
      ? parsed.skippedSections
      : parsed.skippedSections && typeof parsed.skippedSections === 'object'
        ? Object.keys(parsed.skippedSections).filter((key) => parsed.skippedSections[key])
        : [],
  })

  if (state.tutorialVersion !== TUTORIAL_VERSION) {
    return {
      ...state,
      tutorialVersion: TUTORIAL_VERSION,
      tutorialCompleted: false,
      tutorialPaused: false,
      tutorialSkipped: false,
      hasSeenWelcome: false,
      dismissedWelcome: false,
      tutorialCurrentFlow: 'welcome',
      tutorialCurrentStep: 0,
      tutorialStartedAt: '',
      tutorialCompletedAt: '',
    }
  }

  return state
}

export function getTutorialState(user) {
  if (!canUseLocalStorage()) return createDefaultTutorialState()

  const parsed = safeParseJson(
    window.localStorage.getItem(getTutorialStorageKey(user)),
    {}
  )

  return normalizeTutorialState(parsed, user)
}

export function saveTutorialState(user, nextState) {
  const safeState = normalizeTutorialState({
    ...nextState,
    tutorialVersion: TUTORIAL_VERSION,
    updatedAt: new Date().toISOString(),
  }, user)

  if (!canUseLocalStorage()) return safeState

  try {
    window.localStorage.setItem(getTutorialStorageKey(user), JSON.stringify(safeState))

    if (!user && (safeState.dismissedWelcome || safeState.hasSeenWelcome || safeState.tutorialCompleted)) {
      window.localStorage.setItem(GLOBAL_DISMISSED_KEY, 'true')
    }
  } catch {
    return safeState
  }

  return safeState
}

export function resetTutorialState(user) {
  if (!canUseLocalStorage()) return

  try {
    window.localStorage.removeItem(getTutorialStorageKey(user))
    window.localStorage.removeItem(GLOBAL_DISMISSED_KEY)
    const pendingKey = getWelcomePendingKey(user)
    if (pendingKey) window.localStorage.removeItem(pendingKey)
  } catch {
    // localStorage indisponível: o provider mantém fallback em memória.
  }
}

export function markWelcomeTutorialPending(user) {
  if (!canUseLocalStorage()) return

  const pendingKey = getWelcomePendingKey(user)
  if (!pendingKey) return

  try {
    window.localStorage.setItem(pendingKey, 'true')
  } catch {
    // Ignora: o tutorial continua acessível manualmente.
  }
}

export function clearWelcomeTutorialPending(user) {
  if (!canUseLocalStorage()) return

  const pendingKey = getWelcomePendingKey(user)
  if (!pendingKey) return

  try {
    window.localStorage.removeItem(pendingKey)
  } catch {
    // Ignora.
  }
}

export function hasWelcomeTutorialPending(user) {
  if (!canUseLocalStorage()) return false

  const pendingKey = getWelcomePendingKey(user)
  if (!pendingKey) return false

  try {
    return window.localStorage.getItem(pendingKey) === 'true'
  } catch {
    return false
  }
}

export function shouldShowWelcomeTutorial(user, state = null) {
  if (!user || !user.profileCompleted) return false

  const tutorialState = state || getTutorialState(user)

  if (tutorialState.tutorialAutoStartEnabled === false) return false
  if (tutorialState.tutorialCompleted || tutorialState.hasSeenWelcome || tutorialState.dismissedWelcome) return false

  return hasWelcomeTutorialPending(user) || !tutorialState.tutorialStartedAt
}
