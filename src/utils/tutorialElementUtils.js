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

function isScrollableElement(element) {
  if (!element || element === document.body || element === document.documentElement) return false

  const style = window.getComputedStyle(element)
  const canScrollVertically = /(auto|scroll|overlay)/.test(style.overflowY)

  return canScrollVertically && element.scrollHeight > element.clientHeight + 1
}

function getScrollableAncestor(element) {
  let current = element?.parentElement

  while (current && current !== document.body && current !== document.documentElement) {
    if (isScrollableElement(current)) return current
    current = current.parentElement
  }

  return null
}

function isViewportAnchored(element) {
  let current = element

  while (current && current !== document.body && current !== document.documentElement) {
    const position = window.getComputedStyle(current).position
    if (position === 'fixed') return true
    if (isScrollableElement(current)) return false
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
  const scrollableAncestor = getScrollableAncestor(element)
  const scrollRect = scrollableAncestor?.getBoundingClientRect()
  const visibleTop = Math.max(viewportTop + viewportMargin, scrollRect ? scrollRect.top + 8 : -Infinity)
  const visibleBottom = Math.min(viewportTop + viewport.height - viewportMargin, scrollRect ? scrollRect.bottom - 8 : Infinity)
  const visibleLeft = Math.max(viewportLeft + 12, scrollRect ? scrollRect.left + 8 : -Infinity)
  const visibleRight = Math.min(viewportLeft + viewport.width - 12, scrollRect ? scrollRect.right - 8 : Infinity)

  return rect.top >= visibleTop &&
    rect.left >= visibleLeft &&
    rect.bottom <= visibleBottom &&
    rect.right <= visibleRight
}

function waitForScrollIdle(element, { signal, scrollableAncestor = null, maxMs = 1800 } = {}) {
  return new Promise((resolve) => {
    const startedAt = performance.now()
    let lastScrollX = scrollableAncestor?.scrollLeft ?? window.scrollX
    let lastScrollY = scrollableAncestor?.scrollTop ?? window.scrollY
    let lastTop = element?.getBoundingClientRect()?.top || 0
    let stableFrames = 0
    let hasMoved = false
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

      const nextScrollX = scrollableAncestor?.scrollLeft ?? window.scrollX
      const nextScrollY = scrollableAncestor?.scrollTop ?? window.scrollY
      const nextTop = element?.getBoundingClientRect()?.top || 0
      const stable = Math.abs(nextScrollX - lastScrollX) < 1 &&
        Math.abs(nextScrollY - lastScrollY) < 1 &&
        Math.abs(nextTop - lastTop) < 1
      if (!stable) hasMoved = true

      stableFrames = stable ? stableFrames + 1 : 0
      lastScrollX = nextScrollX
      lastScrollY = nextScrollY
      lastTop = nextTop

      const elapsed = performance.now() - startedAt
      const minimumWait = hasMoved ? 220 : 420
      if ((stableFrames >= SCROLL_IDLE_FRAMES && elapsed >= minimumWait) || elapsed >= maxMs) {
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
  const scrollableAncestor = getScrollableAncestor(element)

  function moveTargetIntoView(behavior) {
    if (scrollableAncestor) {
      const viewport = getViewport()
      const viewportTop = window.visualViewport?.offsetTop || 0
      const containerRect = scrollableAncestor.getBoundingClientRect()
      const targetRect = element.getBoundingClientRect()
      const visibleTop = Math.max(containerRect.top, viewportTop)
      const visibleBottom = Math.min(containerRect.bottom, viewportTop + viewport.height)
      const targetCenter = targetRect.top + targetRect.height / 2
      const visibleCenter = visibleTop + (visibleBottom - visibleTop) / 2
      const maxScrollTop = Math.max(0, scrollableAncestor.scrollHeight - scrollableAncestor.clientHeight)
      const nextScrollTop = Math.min(
        maxScrollTop,
        Math.max(0, scrollableAncestor.scrollTop + targetCenter - visibleCenter),
      )

      scrollableAncestor.scrollTo({
        top: nextScrollTop,
        left: scrollableAncestor.scrollLeft,
        behavior,
      })
    } else {
      element.scrollIntoView({
        behavior,
        block: 'center',
        inline: 'nearest',
      })
    }
  }

  for (let attempt = 0; attempt < 3 && !isTutorialElementVisible(element); attempt += 1) {
    moveTargetIntoView('smooth')

    await waitForScrollIdle(element, { signal, scrollableAncestor })
    if (signal?.aborted) return
  }

  if (!isTutorialElementVisible(element)) {
    moveTargetIntoView('auto')
    await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)))
  }
}
