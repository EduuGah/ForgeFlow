import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'

import { useTutorial } from '../../context/TutorialContext'
import TutorialCoachCard from './TutorialCoachCard'

const MOBILE_BREAKPOINT = 760
const TARGET_RETRY_LIMIT = 12
const TARGET_RETRY_DELAY = 90
const SAFE_GAP = 12

const HEADER_SELECTORS = [
  '[data-tutorial="app-header"]',
  '[data-app-header]',
  '.ff-app-header',
  '.app-header',
  'header[role="banner"]',
  'header',
]

const BOTTOM_NAV_SELECTORS = [
  '[data-tutorial="bottom-nav"]',
  '.ff-mobile-bottom-nav',
  '.mobile-bottom-nav',
  '.bottom-nav',
]

const ACTIVE_MINI_SELECTORS = [
  '[data-tutorial="active-workout-mini"]',
  '.ff-active-workout-mini',
  '.active-workout-mini',
  '.workout-mini-card',
]

function getViewport() {
  if (typeof window === 'undefined') return { width: 0, height: 0, top: 0, left: 0, bottom: 0 }
  const visualViewport = window.visualViewport
  const width = visualViewport?.width || window.innerWidth
  const height = visualViewport?.height || window.innerHeight
  const top = visualViewport?.offsetTop || 0
  const left = visualViewport?.offsetLeft || 0
  return { width, height, top, left, bottom: top + height }
}

function isMobile() {
  return getViewport().width <= MOBILE_BREAKPOINT
}

function isElementUsable(element) {
  if (!element || typeof window === 'undefined') return false
  const rect = element.getBoundingClientRect()
  const style = window.getComputedStyle(element)
  return (
    rect.width >= 8 &&
    rect.height >= 8 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    Number(style.opacity) !== 0 &&
    !element.closest('[hidden], [aria-hidden="true"]')
  )
}

function findVisibleTarget(selector = '') {
  if (!selector || typeof document === 'undefined') return null

  const selectors = String(selector)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  for (const item of selectors) {
    try {
      const elements = Array.from(document.querySelectorAll(item)).filter(isElementUsable)
      if (!elements.length) continue

      const viewport = getViewport()
      const visible = elements.find((element) => {
        const rect = element.getBoundingClientRect()
        return rect.bottom > viewport.top + SAFE_GAP && rect.top < viewport.bottom - SAFE_GAP
      })

      return visible || elements[0]
    } catch {
      // Seletores antigos/experimentais não devem derrubar o tutorial.
    }
  }

  return null
}

function getScrollParent(element) {
  if (!element || typeof document === 'undefined') return document.scrollingElement || document.documentElement

  let parent = element.parentElement
  while (parent && parent !== document.body && parent !== document.documentElement) {
    const style = window.getComputedStyle(parent)
    const overflowY = style.overflowY || style.overflow
    if (/(auto|scroll|overlay)/i.test(overflowY) && parent.scrollHeight > parent.clientHeight + 8) {
      return parent
    }
    parent = parent.parentElement
  }

  return document.scrollingElement || document.documentElement
}

function queryVisibleFixed(selectors = []) {
  if (typeof document === 'undefined') return null

  for (const selector of selectors) {
    try {
      const elements = Array.from(document.querySelectorAll(selector)).filter(isElementUsable)
      const fixed = elements.find((element) => {
        const style = window.getComputedStyle(element)
        return style.position === 'fixed' || style.position === 'sticky'
      })
      if (fixed) return fixed
      if (elements[0]) return elements[0]
    } catch {
      // Ignora seletor inválido.
    }
  }

  return null
}

function getSafeAreaBottom() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return 0
  const probe = document.createElement('div')
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;height:env(safe-area-inset-bottom);'
  document.body.appendChild(probe)
  const value = Number.parseFloat(window.getComputedStyle(probe).height) || 0
  probe.remove()
  return value
}

function measureSafeArea() {
  const viewport = getViewport()
  const header = queryVisibleFixed(HEADER_SELECTORS)
  const bottomNav = queryVisibleFixed(BOTTOM_NAV_SELECTORS)
  const activeMini = queryVisibleFixed(ACTIVE_MINI_SELECTORS)

  let safeTop = viewport.top + SAFE_GAP
  let safeBottom = viewport.bottom - SAFE_GAP - getSafeAreaBottom()

  if (header) {
    const rect = header.getBoundingClientRect()
    if (rect.bottom > viewport.top && rect.top < viewport.bottom * 0.45) {
      safeTop = Math.max(safeTop, rect.bottom + SAFE_GAP)
    }
  }

  if (bottomNav) {
    const rect = bottomNav.getBoundingClientRect()
    if (rect.top < viewport.bottom && rect.bottom > viewport.top) {
      safeBottom = Math.min(safeBottom, rect.top - SAFE_GAP)
    }
  }

  if (activeMini) {
    const rect = activeMini.getBoundingClientRect()
    if (rect.top < viewport.bottom && rect.bottom > viewport.top) {
      safeBottom = Math.min(safeBottom, rect.top - SAFE_GAP)
    }
  }

  return {
    viewport,
    safeTop,
    safeBottom,
    safeHeight: Math.max(100, safeBottom - safeTop),
  }
}

function applyScrollDelta(scroller, delta) {
  if (!Number.isFinite(delta) || Math.abs(delta) < 1) return

  if (
    !scroller ||
    scroller === document.body ||
    scroller === document.documentElement ||
    scroller === document.scrollingElement
  ) {
    window.scrollBy({ top: delta, left: 0, behavior: 'auto' })
    return
  }

  scroller.scrollTop += delta
}

function rectUnion(rects) {
  const filtered = rects.filter(Boolean)
  if (!filtered.length) return null
  return filtered.reduce(
    (acc, rect) => ({
      top: Math.min(acc.top, rect.top),
      bottom: Math.max(acc.bottom, rect.bottom),
      left: Math.min(acc.left, rect.left),
      right: Math.max(acc.right, rect.right),
      width: Math.max(acc.right, rect.right) - Math.min(acc.left, rect.left),
      height: Math.max(acc.bottom, rect.bottom) - Math.min(acc.top, rect.top),
    }),
    filtered[0]
  )
}

function waitFrame() {
  return new Promise((resolve) => window.requestAnimationFrame(resolve))
}

function isInlineSafeTarget(target) {
  if (!target) return false
  const tag = target.tagName?.toLowerCase()
  if (['button', 'a', 'input', 'select', 'textarea', 'label', 'svg'].includes(tag)) return false
  if (target.closest('nav, header, [role="navigation"]')) return false
  const rect = target.getBoundingClientRect()
  const viewport = getViewport()
  return rect.width >= Math.min(220, viewport.width * 0.55) && rect.height >= 44
}

function createInlineHost(target, stepId) {
  if (!target || !target.parentElement || typeof document === 'undefined') return null

  const host = document.createElement('div')
  host.className = 'ff-tutorial-v5-inline-host'
  host.setAttribute('data-tutorial-inline-host', stepId || 'active')
  host.setAttribute('role', 'presentation')

  target.insertAdjacentElement('afterend', host)
  return host
}

function useTarget(step, pathname) {
  const [target, setTarget] = useState(null)
  const [status, setStatus] = useState('idle')

  const shouldSearch = Boolean(step?.mode === 'highlight' && (step?.target || step?.selector))
  const selector = step?.target || step?.selector || ''

  const resolveTarget = useCallback(() => {
    const found = shouldSearch ? findVisibleTarget(selector) : null
    setTarget(found)
    setStatus(found ? 'found' : shouldSearch ? 'missing' : 'panel')
    return Boolean(found)
  }, [selector, shouldSearch])

  useEffect(() => {
    setTarget(null)
    setStatus(shouldSearch ? 'searching' : 'panel')
    if (!shouldSearch) return undefined

    let cancelled = false
    let attempts = 0
    let timeoutId = 0

    const run = () => {
      if (cancelled) return
      attempts += 1
      if (resolveTarget()) return
      if (attempts >= TARGET_RETRY_LIMIT) return
      timeoutId = window.setTimeout(run, TARGET_RETRY_DELAY)
    }

    run()

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [pathname, resolveTarget, shouldSearch, step?.id])

  return { target, targetStatus: status, refreshTarget: resolveTarget }
}

function useInlineCardHost({ target, enabled, stepId }) {
  const [host, setHost] = useState(null)

  useLayoutEffect(() => {
    setHost(null)
    if (!enabled || !target) return undefined

    const created = createInlineHost(target, stepId)
    setHost(created)

    return () => {
      created?.remove()
      setHost(null)
    }
  }, [enabled, stepId, target])

  return host
}

async function scrollGroupIntoView(target, host) {
  if (!target || typeof window === 'undefined') return { ok: false, reason: 'missing' }

  const scroller = getScrollParent(target)

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const targetRect = target.getBoundingClientRect()
    const hostRect = host?.getBoundingClientRect?.()
    const groupRect = rectUnion([targetRect, hostRect]) || targetRect
    const safe = measureSafeArea()
    const groupFits = groupRect.height <= safe.safeHeight - SAFE_GAP

    let delta = 0

    if (groupFits) {
      const groupCenter = groupRect.top + groupRect.height / 2
      const safeCenter = safe.safeTop + safe.safeHeight / 2
      delta = groupCenter - safeCenter
    } else {
      delta = groupRect.top - safe.safeTop
    }

    applyScrollDelta(scroller, delta)
    await waitFrame()
  }

  const finalTargetRect = target.getBoundingClientRect()
  const finalHostRect = host?.getBoundingClientRect?.()
  const finalGroup = rectUnion([finalTargetRect, finalHostRect]) || finalTargetRect
  const finalSafe = measureSafeArea()
  const targetMostlyVisible = finalTargetRect.bottom > finalSafe.safeTop && finalTargetRect.top < finalSafe.safeBottom
  const groupMostlyVisible = finalGroup.bottom > finalSafe.safeTop && finalGroup.top < finalSafe.safeBottom

  return targetMostlyVisible && groupMostlyVisible
    ? { ok: true, reason: 'visible' }
    : { ok: false, reason: 'unsafe' }
}

function useHighlight({ target, host, enabled, stepId }) {
  const [status, setStatus] = useState(enabled ? 'pending' : 'fallback')

  useEffect(() => {
    setStatus(enabled ? 'pending' : 'fallback')
    if (!enabled || !target) return undefined

    let cancelled = false
    const previousScrollMarginTop = target.style.scrollMarginTop
    const previousScrollMarginBottom = target.style.scrollMarginBottom

    target.style.scrollMarginTop = 'calc(96px + env(safe-area-inset-top, 0px))'
    target.style.scrollMarginBottom = 'calc(132px + env(safe-area-inset-bottom, 0px))'
    target.setAttribute('data-tutorial-active', 'true')
    target.classList.add('ff-tutorial-v5-active-target')

    const run = async () => {
      const result = await scrollGroupIntoView(target, host)
      if (!cancelled) setStatus(result.ok ? 'highlight' : 'fallback')
    }

    const timeoutId = window.setTimeout(run, 40)

    const refresh = () => {
      window.clearTimeout(timeoutId)
      run()
    }

    window.addEventListener('resize', refresh)
    window.addEventListener('orientationchange', refresh)
    window.visualViewport?.addEventListener('resize', refresh)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      window.removeEventListener('resize', refresh)
      window.removeEventListener('orientationchange', refresh)
      window.visualViewport?.removeEventListener('resize', refresh)
      target.style.scrollMarginTop = previousScrollMarginTop
      target.style.scrollMarginBottom = previousScrollMarginBottom
      target.removeAttribute('data-tutorial-active')
      target.classList.remove('ff-tutorial-v5-active-target')
      setStatus('fallback')
    }
  }, [enabled, host, stepId, target])

  return status
}

function useTutorialKeys(enabled, handlers) {
  useEffect(() => {
    if (!enabled) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handlers.onClose?.()
      }
      if (event.key === 'Enter' && event.target === document.body) {
        event.preventDefault()
        handlers.onNext?.()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, handlers])
}

export default function TutorialOverlay() {
  const location = useLocation()
  const {
    activeFlow,
    activeStep,
    activeStepIndex,
    currentSection,
    isTutorialOpen,
    progress,
    nextStep,
    previousStep,
    skipStep,
    pauseTutorial,
  } = useTutorial()

  const panelRef = useRef(null)
  const { target, targetStatus } = useTarget(activeStep, location.pathname)
  const inlineEnabled = Boolean(isTutorialOpen && activeStep?.mode === 'highlight' && target && isInlineSafeTarget(target))
  const inlineHost = useInlineCardHost({ target, enabled: inlineEnabled, stepId: activeStep?.id })
  const highlightStatus = useHighlight({ target, host: inlineHost, enabled: inlineEnabled, stepId: activeStep?.id })

  const isLastStep = activeFlow ? activeStepIndex >= activeFlow.steps.length - 1 : false
  const canGoBack = activeStepIndex > 0

  const handlers = useMemo(
    () => ({ onClose: pauseTutorial, onNext: nextStep }),
    [nextStep, pauseTutorial]
  )
  useTutorialKeys(isTutorialOpen, handlers)

  useEffect(() => {
    if (!isTutorialOpen) return undefined
    document.body.classList.add('ff-tutorial-v5-running')
    return () => document.body.classList.remove('ff-tutorial-v5-running')
  }, [isTutorialOpen])

  useEffect(() => {
    if (!isTutorialOpen || !panelRef.current) return undefined
    const id = window.setTimeout(() => panelRef.current?.focus?.({ preventScroll: true }), 80)
    return () => window.clearTimeout(id)
  }, [activeStep?.id, isTutorialOpen])

  if (!isTutorialOpen || !activeStep) return null

  const useInline = Boolean(inlineEnabled && inlineHost)
  const resolvedStep = !useInline && activeStep?.mode === 'highlight'
    ? {
        ...activeStep,
        title: activeStep.fallbackTitle || activeStep.title,
        description: activeStep.fallbackDescription || activeStep.description,
        mode: 'panel',
      }
    : activeStep

  const card = (
    <TutorialCoachCard
      step={resolvedStep}
      section={currentSection}
      progress={progress}
      isLastStep={isLastStep}
      canGoBack={canGoBack}
      isInline={useInline}
      targetStatus={useInline ? highlightStatus : targetStatus === 'missing' ? 'fallback' : ''}
      onClose={pauseTutorial}
      onBack={previousStep}
      onNext={nextStep}
      onSkipStep={skipStep}
      onPause={pauseTutorial}
    />
  )

  if (useInline && inlineHost) {
    return createPortal(card, inlineHost)
  }

  return createPortal(
    <div className="ff-tutorial-v5-panel-wrap" data-tutorial-mode={activeStep.mode || 'panel'}>
      <div ref={panelRef}>{card}</div>
    </div>,
    document.body
  )
}
