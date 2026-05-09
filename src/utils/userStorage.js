function getUserStoragePrefix(user) {
  const rawIdentifier =
    user?._id ||
    user?.id ||
    user?.email ||
    user?.googleId ||
    'guest'

  return String(rawIdentifier)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/gi, '_')
}

export function getUserStorageKey(user, key) {
  return `forgeflow:${getUserStoragePrefix(user)}:${key}`
}

export function getLegacyStorageKey(key) {
  return `forgeflow:${key}`
}

export function getUserStorageData(user, key, fallbackValue = null) {
  if (typeof window === 'undefined') return fallbackValue

  try {
    const userKey = getUserStorageKey(user, key)
    const storedValue = window.localStorage.getItem(userKey)

    if (storedValue !== null) {
      return JSON.parse(storedValue)
    }

    return fallbackValue
  } catch (error) {
    console.error(error)
    return fallbackValue
  }
}

export function saveUserStorageData(user, key, value) {
  if (typeof window === 'undefined') return value

  try {
    const userKey = getUserStorageKey(user, key)

    window.localStorage.setItem(userKey, JSON.stringify(value))

    return value
  } catch (error) {
    console.error(error)
    return value
  }
}

export function removeUserStorageData(user, key) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(getUserStorageKey(user, key))
  } catch (error) {
    console.error(error)
  }
}

export function clearLegacyForgeFlowStorage(keys = []) {
  if (typeof window === 'undefined') return

  try {
    const targetKeys = Array.isArray(keys) && keys.length > 0
      ? keys.map(getLegacyStorageKey)
      : []

    if (targetKeys.length > 0) {
      targetKeys.forEach((key) => window.localStorage.removeItem(key))
      return
    }

    Object.keys(window.localStorage)
      .filter((key) => key.startsWith('forgeflow:') && key.split(':').length === 2)
      .forEach((key) => window.localStorage.removeItem(key))
  } catch (error) {
    console.error(error)
  }
}

export function clearOtherUsersForgeFlowStorage(user, keys = []) {
  if (typeof window === 'undefined') return

  try {
    const currentPrefix = `forgeflow:${getUserStoragePrefix(user)}:`
    const allowedKeys = new Set(keys)

    Object.keys(window.localStorage)
      .filter((key) => key.startsWith('forgeflow:') && !key.startsWith(currentPrefix))
      .forEach((key) => {
        if (allowedKeys.size === 0) return

        const storageKey = key.split(':').slice(2).join(':')

        if (allowedKeys.has(storageKey)) {
          window.localStorage.removeItem(key)
        }
      })
  } catch (error) {
    console.error(error)
  }
}

export function migrateLegacyUserStorageData(user, key, fallbackValue = null) {
  if (typeof window === 'undefined') return fallbackValue

  const userValue = getUserStorageData(user, key, null)

  if (userValue !== null) {
    return userValue
  }

  try {
    const legacyKey = getLegacyStorageKey(key)
    const legacyValue = window.localStorage.getItem(legacyKey)

    if (legacyValue === null) return fallbackValue

    const parsedValue = JSON.parse(legacyValue)

    saveUserStorageData(user, key, parsedValue)
    window.localStorage.removeItem(legacyKey)

    return parsedValue
  } catch (error) {
    console.error(error)
    return fallbackValue
  }
}
