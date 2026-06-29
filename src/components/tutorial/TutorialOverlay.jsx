import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { useTutorial } from '../../context/TutorialContext'
import TutorialSpotlight from './TutorialSpotlight'
import TutorialTooltip from './TutorialTooltip'

const TARGET_RETRY_LIMIT = 18
const TARGET_RETRY_DELAY = 90
const EDGE_MARGIN = 12
const BOTTOM_SAFE_GAP = 92

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

function getFirstMatchingElement(selector = '') {
  if (typeof document === 'undefined' || !selector) return null

  const selectors = String(selector)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  for (const item of selectors) {
    try {
      const element = document.querySelector(item)
      if (element) return element
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

function computeTooltipPosition({ rect, tooltipSize, placement = 'auto', targetMissing = false }) {
  const viewport = getViewport()
  const width = tooltipSize.width || Math.min(360, viewport.width - EDGE_MARGIN * 2)
  const height = tooltipSize.height || 260
  const minTop = EDGE_MARGIN + viewport.offsetTop
  const maxTop = viewport.height + viewport.offsetTop - height - BOTTOM_SAFE_GAP
  const minLeft = EDGE_MARGIN + viewport.offsetLeft
  const maxLeft = viewport.width + viewport.offsetLeft - width - EDGE_MARGIN

  if (targetMissing || !rect || placement === 'center') {
    return {
      top: clamp((viewport.height - height) / 2 + viewport.offsetTop, minTop, maxTop),
      left: clamp((viewport.width - width) / 2 + viewport.offsetLeft, minLeft, maxLeft),
    }
  }

  const gap = 16
  const centeredLeft = rect.left + rect.width / 2 - width / 2
  const centeredTop = rect.top + rect.height / 2 - height / 2
  const normalizedPlacement = placement === 'auto'
    ? rect.top > viewport.height * 0.48
      ? 'top'
      : 'bottom'
    : placement

  const candidates = {
    top: { top: rect.top - height - gap, left: centeredLeft },
    bottom: { top: rect.bottom + gap, left: centeredLeft },
    left: { top: centeredTop, left: rect.left - width - gap },
    right: { top: centeredTop, left: rect.right + gap },
  }

  let selected = candidates[normalizedPlacement] || candidates.bottom

  if (selected.top < minTop || selected.top > maxTop) {
    const opposite = normalizedPlacement === 'top' ? candidates.bottom : candidates.top
    if (opposite.top >= minTop && opposite.top <= maxTop) selected = opposite
  }

  return {
    top: clamp(selected.top, minTop, maxTop),
    left: clamp(selected.left, minLeft, maxLeft),
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

function useTutorialTarget(step, pathname) {
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
      try {
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      } catch {
        target.scrollIntoView()
      }
      window.setTimeout(updateRect, 260)
    }, 90)
  }, [step?.id, step?.scrollIntoView, target, updateRect])

  useEffect(() => {
    if (!target) return undefined

    target.classList.add('ff-tutorial-active-target')
    updateRect()

    const scrollParents = findScrollableParents(target)
    const handleUpdate = () => window.requestAnimationFrame(updateRect)
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleUpdate) : null

    observer?.observe(target)
    scrollParents.forEach((item) => item.addEventListener('scroll', handleUpdate, { passive: true }))
    window.addEventListener('resize', handleUpdate)
    window.addEventListener('orientationchange', handleUpdate)
    window.visualViewport?.addEventListener('resize', handleUpdate)
    window.visualViewport?.addEventListener('scroll', handleUpdate)

    return () => {
      target.classList.remove('ff-tutorial-active-target')
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
    skipSection,
    pauseTutorial,
    skipAll,
  } = useTutorial()
  const tooltipRef = useRef(null)
  const [tooltipSize, setTooltipSize] = useState({ width: 340, height: 260 })

  const { rect, targetMissing } = useTutorialTarget(activeStep, location.pathname)
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
        onSkipSection={skipSection}
        onPause={pauseTutorial}
        onSkipAll={skipAll}
      />
    </div>
  )
}
