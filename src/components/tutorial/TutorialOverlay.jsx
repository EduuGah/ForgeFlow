import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'

import { useTutorial } from '../../context/TutorialContext'
import TutorialTooltip from './TutorialTooltip'

const TARGET_RETRY_LIMIT = 10
const TARGET_RETRY_DELAY = 100
const MOBILE_BREAKPOINT = 760
const DEFAULT_DOCK_HEIGHT = 132
const SAFE_GAP = 14

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
  'nav[aria-label*="inferior" i]',
]

const ACTIVE_MINI_SELECTORS = [
  '[data-tutorial="active-workout-mini"]',
  '.ff-active-workout-mini',
  '.active-workout-mini',
  '.workout-mini-card',
]

function getViewport() {
  if (typeof window === 'undefined') return { width: 0, height: 0, offsetTop: 0, offsetLeft: 0 }
  const viewport = window.visualViewport
  return {
    width: viewport?.width || window.innerWidth,
    height: viewport?.height || window.innerHeight,
    offsetTop: viewport?.offsetTop || 0,
    offsetLeft: viewport?.offsetLeft || 0,
  }
}

function isMobileViewport() {
  return getViewport().width <= MOBILE_BREAKPOINT
}

function clamp(value, min, max) {
  if (max < min) return min
  return Math.min(Math.max(value, min), max)
}

function isUsableTarget(element) {
  if (!element || typeof window === 'undefined') return false
  const rect = element.getBoundingClientRect()
  const style = window.getComputedStyle(element)

  if (rect.width < 4 || rect.height < 4) return false
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false
  if (element.closest('[hidden], [aria-hidden="true"]')) return false

  return true
}

function getFirstMatchingElement(selector = '') {
  if (typeof document === 'undefined' || !selector) return null

  const selectors = String(selector)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  for (const item of selectors) {
    try {
      const elements = Array.from(document.querySelectorAll(item)).filter(isUsableTarget)
      if (!elements.length) continue

      const viewport = getViewport()
      const visible = elements.find((element) => {
        const rect = element.getBoundingClientRect()
        return (
          rect.bottom > viewport.offsetTop &&
          rect.top < viewport.offsetTop + viewport.height &&
          rect.right > viewport.offsetLeft &&
          rect.left < viewport.offsetLeft + viewport.width
        )
      })

      return visible || elements[0]
    } catch {
      // Seletor legado inválido não pode derrubar o tutorial.
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

function queryFirstVisible(selectors = []) {
  if (typeof document === 'undefined') return null

  for (const selector of selectors) {
    try {
      const elements = Array.from(document.querySelectorAll(selector)).filter(isUsableTarget)
      const fixedish = elements.find((element) => {
        const style = window.getComputedStyle(element)
        return style.position === 'fixed' || style.position === 'sticky'
      })
      if (fixedish) return fixedish
      if (elements[0]) return elements[0]
    } catch {
      // Ignora seletor inválido.
    }
  }

  return null
}

function getCssSafeAreaBottom() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return 0
  const probe = document.createElement('div')
  probe.style.cssText = 'position:absolute;visibility:hidden;height:env(safe-area-inset-bottom);bottom:0;'
  document.body.appendChild(probe)
  const value = Number.parseFloat(window.getComputedStyle(probe).height) || 0
  probe.remove()
  return value
}

function getFixedObstructions(dock = 'bottom', dockHeight = DEFAULT_DOCK_HEIGHT) {
  const viewport = getViewport()
  const viewportTop = viewport.offsetTop
  const viewportBottom = viewport.offsetTop + viewport.height
  const header = queryFirstVisible(HEADER_SELECTORS)
  const bottomNav = queryFirstVisible(BOTTOM_NAV_SELECTORS)
  const activeMini = queryFirstVisible(ACTIVE_MINI_SELECTORS)

  let top = viewportTop + SAFE_GAP
  let bottom = SAFE_GAP + getCssSafeAreaBottom()

  if (header) {
    const rect = header.getBoundingClientRect()
    if (rect.bottom > viewportTop && rect.top < viewportTop + viewport.height * 0.45) {
      top = Math.max(top, rect.bottom + SAFE_GAP)
    }
  }

  if (bottomNav) {
    const rect = bottomNav.getBoundingClientRect()
    if (rect.bottom > viewportTop && rect.top < viewportBottom) {
      bottom = Math.max(bottom, viewportBottom - rect.top + SAFE_GAP)
    }
  }

  if (activeMini) {
    const rect = activeMini.getBoundingClientRect()
    if (rect.bottom > viewportTop && rect.top < viewportBottom) {
      bottom = Math.max(bottom, viewportBottom - rect.top + SAFE_GAP)
    }
  }

  if (dock === 'top') top += dockHeight + SAFE_GAP
  if (dock === 'bottom') bottom += dockHeight + SAFE_GAP

  const safeTop = top
  const safeBottom = viewportBottom - bottom
  return {
    viewport,
    safeTop,
    safeBottom,
    safeHeight: Math.max(80, safeBottom - safeTop),
  }
}

function chooseDock(step, target) {
  if (step?.dock === 'top' || step?.dock === 'bottom') return step.dock
  if (!target) return 'bottom'

  const rect = target.getBoundingClientRect()
  const viewport = getViewport()
  const center = rect.top + rect.height / 2
  return center < viewport.offsetTop + viewport.height * 0.5 ? 'bottom' : 'top'
}

function isTargetTooLarge(target, dock, dockHeight) {
  if (!target) return true
  const rect = target.getBoundingClientRect()
  const { safeHeight, viewport } = getFixedObstructions(dock, dockHeight)

  if (rect.height > safeHeight * 0.82) return true
  if (rect.width > viewport.width - 18) return true
  return false
}

function scrollByDelta(scrollParent, delta) {
  if (!Number.isFinite(delta) || Math.abs(delta) < 1) return

  if (
    !scrollParent ||
    scrollParent === document.documentElement ||
    scrollParent === document.body ||
    scrollParent === document.scrollingElement
  ) {
    window.scrollBy({ top: delta, left: 0, behavior: 'auto' })
    return
  }

  scrollParent.scrollTop += delta
}

async function waitFrame() {
  await new Promise((resolve) => window.requestAnimationFrame(() => resolve()))
}

async function scrollTargetIntoTutorialSafeArea(target, dock, dockHeight) {
  if (!target || typeof window === 'undefined') return { ok: false, reason: 'missing' }

  const scrollParent = getScrollParent(target)
  let result = { ok: false, reason: 'unknown' }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const rect = target.getBoundingClientRect()
    const safe = getFixedObstructions(dock, dockHeight)
    const targetTooLarge = rect.height > safe.safeHeight * 0.82

    if (targetTooLarge) {
      const delta = rect.top - safe.safeTop
      scrollByDelta(scrollParent, delta)
      result = { ok: false, reason: 'too-large' }
    } else {
      const currentCenter = rect.top + rect.height / 2
      const wantedCenter = safe.safeTop + safe.safeHeight / 2
      const delta = currentCenter - wantedCenter
      scrollByDelta(scrollParent, delta)
      result = { ok: true, reason: 'scrolled' }
    }

    await waitFrame()
  }

  const finalRect = target.getBoundingClientRect()
  const finalSafe = getFixedObstructions(dock, dockHeight)
  const finalOk =
    finalRect.top >= finalSafe.safeTop - 2 &&
    finalRect.bottom <= finalSafe.safeBottom + 2 &&
    finalRect.height <= finalSafe.safeHeight * 0.82

  return finalOk ? { ok: true, reason: 'safe' } : { ok: false, reason: 'unsafe' }
}

function useTutorialTarget(step, pathname) {
  const [target, setTarget] = useState(null)
  const [targetMissing, setTargetMissing] = useState(false)

  const updateTarget = useCallback(() => {
    if (!step?.target && !step?.selector) {
      setTarget(null)
      setTargetMissing(false)
      return false
    }

    const element = getFirstMatchingElement(step?.target || step?.selector)
    setTarget(element)
    return Boolean(element)
  }, [step?.selector, step?.target])

  useEffect(() => {
    setTarget(null)
    setTargetMissing(false)

    if (!step?.target && !step?.selector) return undefined
    if (step?.mode === 'panel' || step?.mode === 'welcome' || step?.mode === 'demo') return undefined

    let cancelled = false
    let attempts = 0
    let timeoutId = 0

    const run = () => {
      if (cancelled) return
      attempts += 1
      const found = updateTarget()

      if (found) {
        setTargetMissing(false)
        return
      }

      if (attempts >= TARGET_RETRY_LIMIT) {
        setTargetMissing(true)
        return
      }

      timeoutId = window.setTimeout(run, TARGET_RETRY_DELAY)
    }

    run()

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [pathname, step?.id, step?.mode, step?.selector, step?.target, updateTarget])

  useEffect(() => {
    if (!target) return undefined

    const handleUpdate = () => {
      if (!isUsableTarget(target)) updateTarget()
    }

    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleUpdate) : null
    observer?.observe(target)
    window.addEventListener('resize', handleUpdate)
    window.addEventListener('orientationchange', handleUpdate)
    window.visualViewport?.addEventListener('resize', handleUpdate)

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', handleUpdate)
      window.removeEventListener('orientationchange', handleUpdate)
      window.visualViewport?.removeEventListener('resize', handleUpdate)
    }
  }, [target, updateTarget])

  return { target, targetMissing }
}

function useDockHeight(ref, stepId) {
  const [height, setHeight] = useState(DEFAULT_DOCK_HEIGHT)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined

    const measure = () => {
      const rect = element.getBoundingClientRect()
      setHeight(Math.max(96, Math.ceil(rect.height)))
    }

    measure()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    observer?.observe(element)
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', measure)
    }
  }, [ref, stepId])

  return height
}

function useTargetHighlight({ target, enabled, dock, dockHeight, step }) {
  const [safeHighlight, setSafeHighlight] = useState(false)

  useEffect(() => {
    setSafeHighlight(false)
    if (!target || !enabled || !step) return undefined

    let cancelled = false
    let cleanupTimer = 0

    const run = async () => {
      const result = step.scroll === false
        ? { ok: !isTargetTooLarge(target, dock, dockHeight), reason: 'no-scroll' }
        : await scrollTargetIntoTutorialSafeArea(target, dock, dockHeight)

      if (cancelled) return

      const canHighlight = result.ok && !isTargetTooLarge(target, dock, dockHeight)
      setSafeHighlight(canHighlight)

      if (canHighlight) {
        target.setAttribute('data-tutorial-active', 'true')
        target.classList.add('ff-tutorial-v2-active-target')
      }
    }

    cleanupTimer = window.setTimeout(run, 40)

    return () => {
      cancelled = true
      window.clearTimeout(cleanupTimer)
      target.removeAttribute('data-tutorial-active')
      target.classList.remove('ff-tutorial-v2-active-target')
      setSafeHighlight(false)
    }
  }, [dock, dockHeight, enabled, step, target])

  return safeHighlight
}

function useGlobalTutorialKeys(isEnabled, handlers) {
  useEffect(() => {
    if (!isEnabled) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handlers?.onEscape?.()
      }
      if (event.key === 'Enter' && event.target === document.body) {
        event.preventDefault()
        handlers?.onNext?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers, isEnabled])
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
    skipAll,
  } = useTutorial()

  const dockRef = useRef(null)
  const tooltipRef = useRef(null)
  const { target, targetMissing } = useTutorialTarget(activeStep, location.pathname)
  const dock = useMemo(() => chooseDock(activeStep, target), [activeStep, target])
  const dockHeight = useDockHeight(dockRef, activeStep?.id)

  const wantsHighlight = Boolean(activeStep?.mode === 'highlight' && target)
  const safeHighlight = useTargetHighlight({
    target,
    enabled: isTutorialOpen && wantsHighlight,
    dock,
    dockHeight,
    step: activeStep,
  })

  const shouldFallback = Boolean(
    activeStep?.mode === 'highlight' &&
    ((activeStep?.requireTarget && targetMissing) || targetMissing || !target || !safeHighlight)
  )

  useGlobalTutorialKeys(
    isTutorialOpen,
    useMemo(() => ({ onEscape: pauseTutorial, onNext: nextStep }), [nextStep, pauseTutorial])
  )

  useEffect(() => {
    if (!isTutorialOpen || !tooltipRef.current) return undefined
    const id = window.setTimeout(() => tooltipRef.current?.focus?.({ preventScroll: true }), 60)
    return () => window.clearTimeout(id)
  }, [activeStep?.id, isTutorialOpen])

  if (!isTutorialOpen || !activeStep) return null

  const isLastStep = activeFlow ? activeStepIndex >= activeFlow.steps.length - 1 : false
  const canGoBack = activeStepIndex > 0
  const variant = activeStep.mode === 'demo' ? 'demo' : activeStep.mode === 'welcome' ? 'welcome' : 'dock'
  const resolvedStep = shouldFallback
    ? {
        ...activeStep,
        title: activeStep.fallbackTitle || activeStep.title,
        description: activeStep.fallbackDescription || activeStep.description,
        mode: 'panel',
      }
    : activeStep

  const tutorial = (
    <div
      className={`ff-tutorial-v2 ff-tutorial-v2--${dock} ff-tutorial-v2--${variant} ${safeHighlight ? 'ff-tutorial-v2--has-highlight' : 'ff-tutorial-v2--panel'}`}
      aria-live="polite"
      data-tutorial-dock={dock}
    >
      <div className="ff-tutorial-v2__shade" aria-hidden="true" />
      <div ref={dockRef} className="ff-tutorial-v2__dock">
        <TutorialTooltip
          step={resolvedStep}
          section={currentSection}
          progress={progress}
          isLastStep={isLastStep}
          canGoBack={canGoBack}
          targetMissing={targetMissing && Boolean(activeStep?.target || activeStep?.selector)}
          tooltipRef={tooltipRef}
          variant={variant}
          onClose={pauseTutorial}
          onBack={previousStep}
          onNext={nextStep}
          onSkipStep={skipStep}
          onPause={pauseTutorial}
          onSkipAll={skipAll}
        />
      </div>
    </div>
  )

  return createPortal(tutorial, document.body)
}
