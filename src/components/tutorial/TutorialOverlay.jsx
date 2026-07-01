import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { useTutorial } from '../../context/TutorialContext'
import TutorialSpotlight from './TutorialSpotlight'
import TutorialTooltip from './TutorialTooltip'

const TARGET_RETRY_LIMIT = 18
const TARGET_RETRY_DELAY = 90
const EDGE_MARGIN = 12
const TOP_SAFE_GAP = 84
const BOTTOM_SAFE_GAP = 112
const TOOLTIP_TARGET_GAP = 18

function getViewport() {
  if (typeof window === 'undefined') return { width: 0, height: 0 }
  const vv = window.visualViewport
  return {
    width: vv?.width || window.innerWidth,
    height: vv?.height || window.innerHeight,
    offsetTop: vv?.offsetTop || 0,
    offsetLeft: vv?.offsetLeft || 0,
  }
}

function isUsableTarget(element) {
  if (!element || typeof window === 'undefined') return false
  const rect = element.getBoundingClientRect()
  const style = window.getComputedStyle(element)

  if (rect.width <= 0 || rect.height <= 0) return false
  if (style.display === 'none' || style.visibility === 'hidden') return false
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
      const elements = Array.from(document.querySelectorAll(item))
      const usable = elements.filter(isUsableTarget)
      if (usable.length > 0) {
        const viewport = getViewport()
        const viewportBottom = viewport.height + viewport.offsetTop
        const viewportRight = viewport.width + viewport.offsetLeft

        return usable.find((element) => {
          const rect = element.getBoundingClientRect()
          return rect.bottom > viewport.offsetTop && rect.top < viewportBottom && rect.right > viewport.offsetLeft && rect.left < viewportRight
        }) || usable[0]
      }
    } catch {
      // Ignora seletores inválidos para manter o tutorial vivo.
    }
  }

  return null
}

function findScrollableParents(element) {
  if (!element || typeof window === 'undefined') return [window]
  const parents = [window]
  let parent = element.parentElement

  while (parent && parent !== document.body) {
    const style = window.getComputedStyle(parent)
    const overflowY = `${style.overflowY}${style.overflow}`
    const canScroll = /(auto|scroll|overlay)/i.test(overflowY) && parent.scrollHeight > parent.clientHeight

    if (canScroll) parents.push(parent)
    parent = parent.parentElement
  }

  return parents
}

function getTutorialLayerAncestors(element) {
  if (!element || typeof window === 'undefined') return []
  const layers = []
  let parent = element.parentElement

  while (parent && parent !== document.body && parent !== document.documentElement) {
    const style = window.getComputedStyle(parent)
    const hasStackingContext = (
      /(fixed|sticky)/i.test(style.position) ||
      style.transform !== 'none' ||
      style.filter !== 'none' ||
      style.perspective !== 'none' ||
      Number(style.opacity) < 1 ||
      (style.position !== 'static' && style.zIndex !== 'auto')
    )

    if (hasStackingContext) layers.push(parent)
    parent = parent.parentElement
  }

  return layers
}


function getVisibleFixedRect(selector) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return null

  try {
    const elements = Array.from(document.querySelectorAll(selector)).filter(isUsableTarget)
    const viewport = getViewport()

    return elements
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0 && rect.bottom > viewport.offsetTop && rect.top < viewport.height + viewport.offsetTop)
      .sort((a, b) => (b.width * b.height) - (a.width * a.height))[0] || null
  } catch {
    return null
  }
}

function measureFixedObstructions() {
  if (typeof window === 'undefined') return { top: TOP_SAFE_GAP, bottom: BOTTOM_SAFE_GAP }

  const viewport = getViewport()
  const topCandidates = [
    getVisibleFixedRect('[data-tutorial="app-header"]'),
    getVisibleFixedRect('#app-header'),
    getVisibleFixedRect('.ff-mobile-topbar'),
    getVisibleFixedRect('.ff-app-header'),
  ].filter(Boolean)
  const bottomCandidates = [
    getVisibleFixedRect('[data-tutorial="bottom-nav"]'),
    getVisibleFixedRect('.mobile-bottom-nav'),
    getVisibleFixedRect('.ff-mobile-bottom-nav'),
    getVisibleFixedRect('.ff-active-workout-mini-floating'),
    getVisibleFixedRect('.ff-mobile-workout-action-bar.is-visible'),
    getVisibleFixedRect('.ff-mobile-workout-action-bar'),
  ].filter(Boolean)

  const top = topCandidates.reduce((max, rect) => {
    if (rect.top > viewport.height * 0.35) return max
    return Math.max(max, Math.ceil(rect.bottom - viewport.offsetTop + 14))
  }, TOP_SAFE_GAP)

  const bottom = bottomCandidates.reduce((max, rect) => {
    if (rect.bottom < viewport.height * 0.55) return max
    return Math.max(max, Math.ceil(viewport.height + viewport.offsetTop - rect.top + 14))
  }, BOTTOM_SAFE_GAP)

  return {
    top: Math.min(viewport.height * 0.42, Math.max(TOP_SAFE_GAP, top)),
    bottom: Math.min(viewport.height * 0.45, Math.max(BOTTOM_SAFE_GAP, bottom)),
  }
}

function getScrollParent(element) {
  if (!element || typeof window === 'undefined') return null
  let parent = element.parentElement

  while (parent && parent !== document.body) {
    const style = window.getComputedStyle(parent)
    const overflowY = `${style.overflowY}${style.overflow}`
    if (/(auto|scroll|overlay)/i.test(overflowY) && parent.scrollHeight > parent.clientHeight) {
      return parent
    }
    parent = parent.parentElement
  }

  return document.scrollingElement || document.documentElement
}

function scrollTargetIntoComfortZone(element, updateRect, tooltipSize = { height: 260 }) {
  if (!element || typeof window === 'undefined') return

  const viewport = getViewport()
  const obstructions = measureFixedObstructions()
  const currentRect = element.getBoundingClientRect()
  const tooltipReserve = Math.min(Math.max(Number(tooltipSize?.height) || 260, 220), viewport.height * 0.48)
  const topSafe = viewport.offsetTop + obstructions.top + EDGE_MARGIN
  const bottomSafe = viewport.height + viewport.offsetTop - obstructions.bottom - EDGE_MARGIN
  const canFitTooltipBelow = bottomSafe - currentRect.bottom >= tooltipReserve + TOOLTIP_TARGET_GAP
  const canFitTooltipAbove = currentRect.top - topSafe >= tooltipReserve + TOOLTIP_TARGET_GAP
  const isComfortable = currentRect.top >= topSafe && currentRect.bottom <= bottomSafe && (canFitTooltipBelow || canFitTooltipAbove)

  if (isComfortable) {
    window.requestAnimationFrame(updateRect)
    return
  }

  const scrollParent = getScrollParent(element)
  const safeHeight = Math.max(220, bottomSafe - topSafe)
  const targetCenterInViewport = topSafe + safeHeight * 0.38

  try {
    if (scrollParent && scrollParent !== document.documentElement && scrollParent !== document.body) {
      const parentRect = scrollParent.getBoundingClientRect()
      const currentCenter = currentRect.top + (currentRect.height / 2)
      const delta = currentCenter - targetCenterInViewport
      scrollParent.scrollTo({ top: Math.max(0, scrollParent.scrollTop + delta), behavior: 'smooth' })
    } else {
      const currentCenter = currentRect.top + window.scrollY + (currentRect.height / 2)
      const desiredTop = currentCenter - targetCenterInViewport
      window.scrollTo({ top: Math.max(0, desiredTop), behavior: 'smooth' })
    }
  } catch {
    element.scrollIntoView({ block: 'center', inline: 'nearest' })
  }

  window.setTimeout(updateRect, 80)
  window.setTimeout(updateRect, 180)
  window.setTimeout(updateRect, 340)
  window.setTimeout(updateRect, 620)
}

function toRect(element) {
  if (!element) return null
  const rect = element.getBoundingClientRect()
  const viewport = getViewport()

  if (rect.width <= 0 || rect.height <= 0) return null

  return {
    top: rect.top + viewport.offsetTop,
    left: rect.left + viewport.offsetLeft,
    right: rect.right + viewport.offsetLeft,
    bottom: rect.bottom + viewport.offsetTop,
    width: rect.width,
    height: rect.height,
  }
}

function clamp(value, min, max) {
  if (max < min) return min
  return Math.min(Math.max(value, min), max)
}

function getOverlapArea(a, b) {
  if (!a || !b) return 0
  const x = Math.max(0, Math.min(a.left + a.width, b.right) - Math.max(a.left, b.left))
  const y = Math.max(0, Math.min(a.top + a.height, b.bottom) - Math.max(a.top, b.top))
  return x * y
}

function computeTooltipPosition({ rect, tooltipSize, placement = 'auto', targetMissing = false }) {
  const viewport = getViewport()
  const width = tooltipSize.width || Math.min(360, viewport.width - EDGE_MARGIN * 2)
  const height = tooltipSize.height || 260
  const obstructions = measureFixedObstructions()
  const minTop = EDGE_MARGIN + obstructions.top + viewport.offsetTop
  const maxTop = viewport.height + viewport.offsetTop - height - obstructions.bottom - EDGE_MARGIN
  const minLeft = EDGE_MARGIN + viewport.offsetLeft
  const maxLeft = viewport.width + viewport.offsetLeft - width - EDGE_MARGIN

  if (targetMissing || !rect || placement === 'center') {
    return {
      top: clamp((viewport.height - height) / 2 + viewport.offsetTop, minTop, maxTop),
      left: clamp((viewport.width - width) / 2 + viewport.offsetLeft, minLeft, maxLeft),
    }
  }

  const gap = TOOLTIP_TARGET_GAP
  const centeredLeft = rect.left + rect.width / 2 - width / 2
  const centeredTop = rect.top + rect.height / 2 - height / 2
  const spaceAbove = rect.top - minTop
  const spaceBelow = maxTop + height - rect.bottom
  const autoPlacement = spaceBelow >= height + gap || spaceBelow >= spaceAbove ? 'bottom' : 'top'
  const preferred = placement === 'auto' ? autoPlacement : placement

  const rawCandidates = {
    top: { top: rect.top - height - gap, left: centeredLeft },
    bottom: { top: rect.bottom + gap, left: centeredLeft },
    left: { top: centeredTop, left: rect.left - width - gap },
    right: { top: centeredTop, left: rect.right + gap },
  }

  const order = [preferred, autoPlacement, 'top', 'bottom', 'right', 'left']
    .filter((item, index, arr) => item && arr.indexOf(item) === index)

  const scored = order.map((key, index) => {
    const raw = rawCandidates[key] || rawCandidates.bottom
    const top = clamp(raw.top, minTop, maxTop)
    const left = clamp(raw.left, minLeft, maxLeft)
    const box = { top, left, width, height }
    const overflow = Math.max(0, minTop - raw.top) + Math.max(0, raw.top - maxTop) + Math.max(0, minLeft - raw.left) + Math.max(0, raw.left - maxLeft)
    const overlap = getOverlapArea(box, rect)
    const preferredPenalty = index * 120

    return {
      key,
      top,
      left,
      score: overlap * 6 + overflow * 12 + preferredPenalty,
    }
  })

  scored.sort((a, b) => a.score - b.score)
  const selected = scored[0] || { top: minTop, left: minLeft }

  return {
    top: selected.top,
    left: selected.left,
  }
}

function getScrimRects(rect) {
  const viewport = getViewport()
  const width = viewport.width + viewport.offsetLeft
  const height = viewport.height + viewport.offsetTop

  if (!rect) {
    return {
      top: { top: viewport.offsetTop, left: viewport.offsetLeft, width: viewport.width, height: viewport.height },
      right: null,
      bottom: null,
      left: null,
    }
  }

  const padding = 8
  const top = Math.max(viewport.offsetTop, rect.top - padding)
  const left = Math.max(viewport.offsetLeft, rect.left - padding)
  const right = Math.min(width, rect.right + padding)
  const bottom = Math.min(height, rect.bottom + padding)

  return {
    top: { top: viewport.offsetTop, left: viewport.offsetLeft, width: viewport.width, height: Math.max(0, top - viewport.offsetTop) },
    right: { top, left: right, width: Math.max(0, width - right), height: Math.max(0, bottom - top) },
    bottom: { top: bottom, left: viewport.offsetLeft, width: viewport.width, height: Math.max(0, height - bottom) },
    left: { top, left: viewport.offsetLeft, width: Math.max(0, left - viewport.offsetLeft), height: Math.max(0, bottom - top) },
  }
}

function useTutorialTarget(step, pathname, tooltipSize) {
  const [target, setTarget] = useState(null)
  const [rect, setRect] = useState(null)
  const [targetMissing, setTargetMissing] = useState(false)
  const scrollDoneRef = useRef('')

  const updateRect = useCallback(() => {
    const element = getFirstMatchingElement(step?.target || step?.selector)

    if (!element) {
      setTarget(null)
      setRect(null)
      return false
    }

    const nextRect = toRect(element)
    setTarget(nextRect ? element : null)
    setRect(nextRect)
    return Boolean(nextRect)
  }, [step?.selector, step?.target])

  useEffect(() => {
    setTarget(null)
    setRect(null)
    setTargetMissing(false)
    scrollDoneRef.current = ''

    if (!step) return undefined
    if (!step.target && !step.selector) {
      setTargetMissing(false)
      return undefined
    }

    let cancelled = false
    let attempts = 0
    let retryId = 0

    const attemptFind = () => {
      if (cancelled) return
      attempts += 1
      const found = updateRect()

      if (found) {
        setTargetMissing(false)
        return
      }

      if (attempts >= TARGET_RETRY_LIMIT) {
        setTargetMissing(true)
        return
      }

      retryId = window.setTimeout(attemptFind, TARGET_RETRY_DELAY)
    }

    attemptFind()

    return () => {
      cancelled = true
      window.clearTimeout(retryId)
    }
  }, [pathname, step, updateRect])

  useEffect(() => {
    if (!target || !step?.scrollIntoView) return
    if (scrollDoneRef.current === step.id) return

    scrollDoneRef.current = step.id
    window.setTimeout(() => {
      scrollTargetIntoComfortZone(target, updateRect, { height: tooltipSize?.height || 260 })
    }, 90)
  }, [step?.id, step?.scrollIntoView, target, tooltipSize?.height, updateRect])

  useEffect(() => {
    if (!target) return undefined

    const layers = getTutorialLayerAncestors(target)
    target.classList.add('ff-tutorial-active-target')
    layers.forEach((layer) => layer.classList.add('ff-tutorial-active-layer'))
    updateRect()

    const scrollParents = findScrollableParents(target)
    const handleUpdate = () => window.requestAnimationFrame(updateRect)
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleUpdate) : null

    observer?.observe(target)
    layers.forEach((layer) => observer?.observe(layer))
    scrollParents.forEach((item) => item.addEventListener('scroll', handleUpdate, { passive: true }))
    window.addEventListener('resize', handleUpdate)
    window.addEventListener('orientationchange', handleUpdate)
    window.visualViewport?.addEventListener('resize', handleUpdate)
    window.visualViewport?.addEventListener('scroll', handleUpdate)

    return () => {
      target.classList.remove('ff-tutorial-active-target')
      layers.forEach((layer) => layer.classList.remove('ff-tutorial-active-layer'))
      observer?.disconnect()
      scrollParents.forEach((item) => item.removeEventListener('scroll', handleUpdate))
      window.removeEventListener('resize', handleUpdate)
      window.removeEventListener('orientationchange', handleUpdate)
      window.visualViewport?.removeEventListener('resize', handleUpdate)
      window.visualViewport?.removeEventListener('scroll', handleUpdate)
    }
  }, [target, updateRect])

  return { target, rect, targetMissing }
}

function useFocusTrap(isEnabled, rootRef, handlers) {
  useEffect(() => {
    if (!isEnabled || !rootRef.current) return undefined

    const root = rootRef.current
    const focusableSelector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',')

    const focusInitial = () => {
      const first = root.querySelector(focusableSelector)
      ;(first || root).focus({ preventScroll: true })
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handlers?.onEscape?.()
        return
      }

      if (event.key === 'Enter' && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
        const tag = event.target?.tagName?.toLowerCase()
        if (!['input', 'textarea', 'select', 'button'].includes(tag)) {
          event.preventDefault()
          handlers?.onEnter?.()
        }
        return
      }

      if (event.key !== 'Tab') return

      const focusable = Array.from(root.querySelectorAll(focusableSelector))
      if (focusable.length === 0) {
        event.preventDefault()
        root.focus({ preventScroll: true })
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus({ preventScroll: true })
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus({ preventScroll: true })
      }
    }

    const id = window.setTimeout(focusInitial, 50)
    root.addEventListener('keydown', handleKeyDown)

    return () => {
      window.clearTimeout(id)
      root.removeEventListener('keydown', handleKeyDown)
    }
  }, [handlers, isEnabled, rootRef])
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
  const tooltipRef = useRef(null)
  const [tooltipSize, setTooltipSize] = useState({ width: 340, height: 260 })

  const { rect, targetMissing } = useTutorialTarget(activeStep, location.pathname, tooltipSize)
  const shouldSpotlight = Boolean(rect && !targetMissing && activeStep?.placement !== 'center')

  const scrimRects = useMemo(() => getScrimRects(shouldSpotlight ? rect : null), [rect, shouldSpotlight])
  const tooltipPosition = useMemo(
    () => computeTooltipPosition({
      rect,
      tooltipSize,
      placement: activeStep?.placement || 'auto',
      targetMissing: targetMissing || !shouldSpotlight,
    }),
    [activeStep?.placement, rect, shouldSpotlight, targetMissing, tooltipSize]
  )

  useLayoutEffect(() => {
    if (!tooltipRef.current || !isTutorialOpen) return
    const measured = tooltipRef.current.getBoundingClientRect()
    if (measured.width && measured.height) {
      setTooltipSize({ width: measured.width, height: measured.height })
    }
  }, [activeStep?.id, isTutorialOpen, tooltipPosition.left, tooltipPosition.top])

  useFocusTrap(isTutorialOpen, tooltipRef, useMemo(() => ({
    onEscape: pauseTutorial,
    onEnter: nextStep,
  }), [nextStep, pauseTutorial]))

  if (!isTutorialOpen || !activeStep) return null

  const isLastStep = activeFlow ? activeStepIndex >= activeFlow.steps.length - 1 : false
  const canGoBack = activeStepIndex > 0
  const tooltipStyle = {
    transform: `translate3d(${Math.round(tooltipPosition.left)}px, ${Math.round(tooltipPosition.top)}px, 0)`,
  }

  return (
    <div className="ff-tutorial-overlay" aria-live="polite">
      {Object.entries(scrimRects).map(([key, item]) => (
        item ? (
          <div
            key={key}
            className={`ff-tutorial-scrim ff-tutorial-scrim--${key}`}
            style={{
              top: `${item.top}px`,
              left: `${item.left}px`,
              width: `${item.width}px`,
              height: `${item.height}px`,
            }}
          />
        ) : null
      ))}

      <TutorialSpotlight
        rect={rect}
        label={activeStep.targetLabel}
        visible={shouldSpotlight}
      />

      <TutorialTooltip
        step={activeStep}
        section={currentSection}
        progress={progress}
        isLastStep={isLastStep}
        canGoBack={canGoBack}
        targetMissing={targetMissing}
        tooltipRef={tooltipRef}
        style={tooltipStyle}
        onClose={pauseTutorial}
        onBack={previousStep}
        onNext={nextStep}
        onSkipStep={skipStep}
        onPause={pauseTutorial}
        onSkipAll={skipAll}
      />
    </div>
  )
}
