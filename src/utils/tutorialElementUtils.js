const DEFAULT_WAIT_MS = 7000
const SCROLL_IDLE_FRAMES = 8

function getViewport() {
  return {
    width: window.visualViewport?.width || window.innerWidth || document.documentElement.clientWidth,
    height: window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight,
  }
}

function isUsableElement(element) {
  if (!element || !(element instanceof Element)) return false
  const rect = element.getBoundingClientRect()
  const style = window.getComputedStyle(element)

  return rect.width > 0 &&
    rect.height > 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    Number(style.opacity || 1) > 0.02
}

export function findTutorialElement(selector = '') {
  if (typeof document === 'undefined') return null

  const safeSelector = selector || 'main'
  try {
    const matches = Array.from(document.querySelectorAll(safeSelector))
    return matches.find(isUsableElement) || null
  } catch {
    return null
  }
}

export function waitForElement(selector = '', { signal, timeoutMs = DEFAULT_WAIT_MS } = {}) {
  if (typeof document === 'undefined') return Promise.resolve(null)

  return new Promise((resolve) => {
    const startedAt = performance.now()
    let frameId = 0
    let observer = null
    let settled = false

    function finish(element) {
      if (settled) return
      settled = true
      window.cancelAnimationFrame(frameId)
      observer?.disconnect()
      signal?.removeEventListener('abort', handleAbort)
      resolve(element || null)
    }

    function handleAbort() {
      finish(null)
    }

    function check() {
      if (signal?.aborted) {
        finish(null)
        return
      }

      const element = findTutorialElement(selector)
      if (element) {
        finish(element)
        return
      }

      if (performance.now() - startedAt >= timeoutMs) {
        finish(null)
        return
      }

      frameId = window.requestAnimationFrame(check)
    }

    signal?.addEventListener('abort', handleAbort, { once: true })
    observer = new MutationObserver(check)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'data-state', 'open'],
    })

    check()
  })
}

function isElementComfortablyVisible(element, margin = 72) {
  const rect = element.getBoundingClientRect()
  const viewport = getViewport()

  return rect.top >= margin &&
    rect.left >= 12 &&
    rect.bottom <= viewport.height - margin &&
    rect.right <= viewport.width - 12
}

function waitForScrollIdle(element, { signal, maxMs = 1800 } = {}) {
  return new Promise((resolve) => {
    const startedAt = performance.now()
    let lastWindowX = window.scrollX
    let lastWindowY = window.scrollY
    let lastTop = element?.getBoundingClientRect()?.top || 0
    let stableFrames = 0
    let frameId = 0

    function finish() {
      window.cancelAnimationFrame(frameId)
      signal?.removeEventListener('abort', finish)
      resolve()
    }

    function tick() {
      if (signal?.aborted) {
        finish()
        return
      }

      const nextWindowX = window.scrollX
      const nextWindowY = window.scrollY
      const nextTop = element?.getBoundingClientRect()?.top || 0
      const stable = Math.abs(nextWindowX - lastWindowX) < 1 &&
        Math.abs(nextWindowY - lastWindowY) < 1 &&
        Math.abs(nextTop - lastTop) < 1

      stableFrames = stable ? stableFrames + 1 : 0
      lastWindowX = nextWindowX
      lastWindowY = nextWindowY
      lastTop = nextTop

      if (stableFrames >= SCROLL_IDLE_FRAMES || performance.now() - startedAt >= maxMs) {
        finish()
        return
      }

      frameId = window.requestAnimationFrame(tick)
    }

    signal?.addEventListener('abort', finish, { once: true })
    frameId = window.requestAnimationFrame(tick)
  })
}

export async function scrollToTutorialTarget(element, { signal } = {}) {
  if (!element || signal?.aborted) return

  if (!isElementComfortablyVisible(element)) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    })
  }

  await waitForScrollIdle(element, { signal })
}

