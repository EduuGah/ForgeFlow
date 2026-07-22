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

function isViewportAnchored(element) {
  let current = element

  while (current && current !== document.documentElement) {
    const position = window.getComputedStyle(current).position
    if (position === 'fixed') return true
    current = current.parentElement
  }

  return false
}

function getPrioritySelectors(selector = '') {
  return String(selector || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function findTutorialElement(selector = '') {
  if (typeof document === 'undefined') return null

  const prioritySelectors = getPrioritySelectors(selector)

  for (const prioritySelector of prioritySelectors) {
    try {
      const match = Array.from(document.querySelectorAll(prioritySelector)).find(isUsableElement)
      if (match) return match
    } catch {
      // Ignora apenas o seletor inválido e tenta a próxima alternativa.
    }
  }

  return null
}

export function waitForElement(selector = '', { signal, timeoutMs = DEFAULT_WAIT_MS } = {}) {
  if (typeof document === 'undefined') return Promise.resolve(null)

  return new Promise((resolve) => {
    let frameId = 0
    let timeoutId = 0
    let observer = null
    let settled = false

    function finish(element) {
      if (settled) return
      settled = true
      window.cancelAnimationFrame(frameId)
      window.clearTimeout(timeoutId)
      observer?.disconnect()
      signal?.removeEventListener('abort', handleAbort)
      resolve(element || null)
    }

    function handleAbort() {
      finish(null)
    }

    function checkNow() {
      if (signal?.aborted) {
        finish(null)
        return
      }

      const element = findTutorialElement(selector)
      if (element) {
        finish(element)
      }
    }

    function scheduleCheck() {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(checkNow)
    }

    signal?.addEventListener('abort', handleAbort, { once: true })
    observer = new MutationObserver(scheduleCheck)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'data-state', 'data-tutorial', 'open'],
    })

    timeoutId = window.setTimeout(() => finish(null), timeoutMs)
    checkNow()
  })
}

export function isTutorialElementVisible(element, margin = 72) {
  const rect = element.getBoundingClientRect()
  const viewport = getViewport()
  const viewportTop = window.visualViewport?.offsetTop || 0
  const viewportLeft = window.visualViewport?.offsetLeft || 0
  const viewportMargin = isViewportAnchored(element) ? 8 : margin

  return rect.top >= viewportTop + viewportMargin &&
    rect.left >= viewportLeft + 12 &&
    rect.bottom <= viewportTop + viewport.height - viewportMargin &&
    rect.right <= viewportLeft + viewport.width - 12
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

      const elapsed = performance.now() - startedAt
      if ((stableFrames >= SCROLL_IDLE_FRAMES && elapsed >= 220) || elapsed >= maxMs) {
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
  if (isViewportAnchored(element)) return

  for (let attempt = 0; attempt < 2 && !isTutorialElementVisible(element); attempt += 1) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    })

    await waitForScrollIdle(element, { signal })
    if (signal?.aborted) return
  }
}
