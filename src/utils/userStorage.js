export function getUserId(user) {
  return user?.id || user?._id || 'guest'
}

export function getUserStorageKey(user, key) {
  return `forgeflow:${getUserId(user)}:${key}`
}

export function getUserStorageData(user, key, fallback = null) {
  const storageKey = getUserStorageKey(user, key)
  const value = localStorage.getItem(storageKey)

  if (!value) return fallback

  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function saveUserStorageData(user, key, value) {
  const storageKey = getUserStorageKey(user, key)

  localStorage.setItem(storageKey, JSON.stringify(value))
}

export function removeUserStorageData(user, key) {
  const storageKey = getUserStorageKey(user, key)

  localStorage.removeItem(storageKey)
}

export function clearUserStorageData(user, keys = []) {
  keys.forEach((key) => {
    removeUserStorageData(user, key)
  })
}