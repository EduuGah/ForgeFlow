import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useTutorial } from '../../context/TutorialContext'
import TutorialTooltip from './TutorialTooltip'

const TARGET_WAIT_TIMEOUT_MS = 5000
const TARGET_PADDING = 10
const CARD_MARGIN = 12

function getViewport() {
  if (typeof window === 'undefined') return { width: 0, height: 0, top: 0, left: 0 }
  const visualViewport = window.visualViewport
  return {
    width: visualViewport?.width || window.innerWidth,
    height: visualViewport?.height || window.innerHeight,
    top: visualViewport?.offsetTop || 0,
    left: visualViewport?.offsetLeft || 0,
  }
}

function clamp(value, min, max) {
  if (max < min) return min
  return Math.min(Math.max(value, min), max)
}

function findTarget(selector) {
  if (!selector || typeof document === 'undefined') return null

  return selector
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      try {
        return document.querySelector(item)
      } catch {
        return null
      }
    })
    .find((element) => {
      if (!(element instanceof HTMLElement)) return false

      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)

      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden'
      )
    }) || null
}

function waitForElement(selector, { timeoutMs = TARGET_WAIT_TIMEOUT_MS, signal } = {}) {
  if (!selector || typeof document === 'undefined') return Promise.resolve(null)

  return new Promise((resolve) => {
    let frameId = null
    let timeoutId = null
    let observer = null

    const cleanup = () => {
      if (frameId) window.cancelAnimationFrame(frameId)
      window.clearTimeout(timeoutId)
      observer?.disconnect()
      window.removeEventListener('resize', scheduleCheck)
      signal?.removeEventListener('abort', handleAbort)
    }

    const finish = (element) => {
      cleanup()
      resolve(element)
    }

    const check = () => {
      frameId = null
      const element = findTarget(selector)
      if (element) finish(element)
    }

    const scheduleCheck = () => {
      if (frameId) return
      frameId = window.requestAnimationFrame(check)
    }

    function handleAbort() {
      finish(null)
    }

    if (signal?.aborted) {
      finish(null)
      return
    }

    const immediateTarget = findTarget(selector)
    if (immediateTarget) {
      finish(immediateTarget)
      return
    }

    observer = new MutationObserver(scheduleCheck)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'data-tutorial'],
    })

    window.addEventListener('resize', scheduleCheck)
    signal?.addEventListener('abort', handleAbort, { once: true })
    timeoutId = window.setTimeout(() => finish(null), timeoutMs)
  })
}

function getSafeRect(element) {
  if (!element) return null
  const rect = element.getBoundingClientRect()
  if (!rect || rect.width <= 0 || rect.height <= 0) return null
  return {
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  }
}

function scrollTargetIntoSafeViewSafely(element, { signal } = {}) {
  if (!element || typeof window === 'undefined') return Promise.resolve()

  return new Promise((resolve) => {
    const startedAt = performance.now()
    let frameId = null
    let lastTop = Number.POSITIVE_INFINITY
    let stableFrames = 0

    const cleanup = () => {
      if (frameId) window.cancelAnimationFrame(frameId)
      signal?.removeEventListener('abort', handleAbort)
    }

    const finish = () => {
      cleanup()
      resolve()
    }

    function handleAbort() {
      finish()
    }

    function keepTargetInsideSafeArea() {
      const viewport = getViewport()
      const rect = element.getBoundingClientRect()
      const topReserve = 96 + viewport.top
      const bottomReserve = 170
      const safeBottom = viewport.top + viewport.height - bottomReserve

      if (rect.top < topReserve) {
        window.scrollBy({ top: rect.top - topReserve, behavior: 'auto' })
      } else if (rect.bottom > safeBottom) {
        window.scrollBy({ top: rect.bottom - safeBottom, behavior: 'auto' })
      }
    }

    function tick() {
      if (signal?.aborted) {
        finish()
        return
      }

      keepTargetInsideSafeArea()

      const rect = element.getBoundingClientRect()
      const topDelta = Math.abs(rect.top - lastTop)
      lastTop = rect.top
      stableFrames = topDelta < 1 ? stableFrames + 1 : 0

      if (stableFrames >= 3 || performance.now() - startedAt > 900) {
        finish()
        return
      }

      frameId = window.requestAnimationFrame(tick)
    }

    signal?.addEventListener('abort', handleAbort, { once: true })
    element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
    frameId = window.requestAnimationFrame(tick)
  })
}

function buildSpotlight(rect) {
  if (!rect) return null

  const viewport = getViewport()
  const left = clamp(rect.left - TARGET_PADDING, viewport.left + 6, viewport.left + viewport.width - 36)
  const top = clamp(rect.top - TARGET_PADDING, viewport.top + 6, viewport.top + viewport.height - 36)
  const right = clamp(rect.right + TARGET_PADDING, left + 36, viewport.left + viewport.width - 6)
  const bottom = clamp(rect.bottom + TARGET_PADDING, top + 36, viewport.top + viewport.height - 6)

  return {
    top,
    left,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
  }
}

function getTooltipPlacement(rect) {
  if (!rect) return 'bottom'

  const viewport = getViewport()
  const spaceAbove = rect.top - viewport.top
  const spaceBelow = viewport.top + viewport.height - rect.bottom

  return spaceBelow >= 250 || spaceBelow >= spaceAbove ? 'bottom' : 'top'
}

function getTooltipStyle(rect, placement) {
  const viewport = getViewport()
  const maxWidth = Math.min(440, Math.max(280, viewport.width - 20))
  const left = rect
    ? clamp(rect.left + rect.width / 2 - maxWidth / 2, viewport.left + 10, viewport.left + viewport.width - maxWidth - 10)
    : viewport.left + 10

  const style = {
    left: `${Math.round(left)}px`,
    width: `${Math.round(maxWidth)}px`,
    maxWidth: `calc(100vw - 20px)`,
    maxHeight: `${Math.round(Math.max(260, viewport.height - 28))}px`,
  }

  if (rect && placement === 'top') {
    const bottom = clamp(viewport.height - rect.top + CARD_MARGIN, CARD_MARGIN, Math.max(CARD_MARGIN, viewport.height - 220))
    style.bottom = `${Math.round(bottom)}px`
  } else if (rect) {
    const top = clamp(rect.bottom + CARD_MARGIN, viewport.top + CARD_MARGIN, Math.max(viewport.top + CARD_MARGIN, viewport.top + viewport.height - 220))
    style.top = `${Math.round(top)}px`
  } else {
    style.bottom = `max(12px, calc(env(safe-area-inset-bottom, 0px) + 12px))`
  }

  return style
}

export default function TutorialOverlay() {
  const {
    activeStep,
    activeStepIndex,
    currentSection,
    progress,
    isRunning,
    nextStep,
    previousStep,
    skipStep,
    pauseTutorial,
    skipAll,
  } = useTutorial()

  const tooltipRef = useRef(null)
  const [targetElement, setTargetElement] = useState(null)
  const [targetRect, setTargetRect] = useState(null)
  const [targetStatus, setTargetStatus] = useState('idle')

  const selector = activeStep?.target || ''
  const spotlight = useMemo(() => buildSpotlight(targetRect), [targetRect])
  const placement = useMemo(() => getTooltipPlacement(targetRect), [targetRect])
  const tooltipStyle = useMemo(() => getTooltipStyle(targetRect, placement), [targetRect, placement])
  const targetPending = Boolean(selector && targetStatus === 'waiting')
  const targetMissing = Boolean(selector && targetStatus === 'missing')
  const nextDisabled = targetPending || (targetMissing && activeStep?.requireTarget)

  useEffect(() => {
    if (!isRunning || !activeStep) return undefined

    const controller = new AbortController()

    setTargetElement(null)
    setTargetRect(null)
    setTargetStatus(selector ? 'waiting' : 'idle')

    waitForElement(selector, { signal: controller.signal })
      .then(async (element) => {
        if (controller.signal.aborted) return

        if (!element) {
          setTargetStatus('missing')
          setTargetElement(null)
          setTargetRect(null)
          return
        }

        setTargetElement(element)
        await scrollTargetIntoSafeViewSafely(element, { signal: controller.signal })

        if (controller.signal.aborted) return

        setTargetStatus('found')
        setTargetRect(getSafeRect(element))
      })

    return () => {
      controller.abort()
    }
  }, [activeStep, activeStepIndex, isRunning, selector])

  useLayoutEffect(() => {
    if (!isRunning || !targetElement) return undefined

    let frameId = null

    const updateRect = () => {
      frameId = null
      setTargetRect(getSafeRect(targetElement))
    }

    const scheduleUpdate = () => {
      if (frameId) return
      frameId = window.requestAnimationFrame(updateRect)
    }

    targetElement.setAttribute('data-tutorial-active', 'true')
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(scheduleUpdate)
      : null

    resizeObserver?.observe(targetElement)
    scheduleUpdate()

    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('scroll', scheduleUpdate, true)
    window.visualViewport?.addEventListener('resize', scheduleUpdate)
    window.visualViewport?.addEventListener('scroll', scheduleUpdate)

    return () => {
      targetElement.removeAttribute('data-tutorial-active')
      resizeObserver?.disconnect()
      if (frameId) window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', scheduleUpdate)
      window.removeEventListener('scroll', scheduleUpdate, true)
      window.visualViewport?.removeEventListener('resize', scheduleUpdate)
      window.visualViewport?.removeEventListener('scroll', scheduleUpdate)
    }
  }, [isRunning, targetElement])

  useEffect(() => {
    if (!isRunning) return undefined

    const previousOverflow = document.body.style.overflowX
    document.body.style.overflowX = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        pauseTutorial?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const focusFrameId = window.requestAnimationFrame(() => {
      tooltipRef.current?.focus({ preventScroll: true })
    })

    return () => {
      window.cancelAnimationFrame(focusFrameId)
      document.body.style.overflowX = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isRunning, pauseTutorial])

  if (!isRunning || !activeStep || typeof document === 'undefined') return null

  const overlay = (
    <div className={`ff-tutorial-v3 ff-tutorial-v3--${placement}`} role="presentation">
      {spotlight ? (
        <>
          <div className="ff-tutorial-v3__shade ff-tutorial-v3__shade--top" style={{ height: `${Math.max(0, spotlight.top)}px` }} />
          <div className="ff-tutorial-v3__shade ff-tutorial-v3__shade--left" style={{ top: `${spotlight.top}px`, width: `${Math.max(0, spotlight.left)}px`, height: `${spotlight.height}px` }} />
          <div className="ff-tutorial-v3__shade ff-tutorial-v3__shade--right" style={{ top: `${spotlight.top}px`, left: `${spotlight.right}px`, height: `${spotlight.height}px` }} />
          <div className="ff-tutorial-v3__shade ff-tutorial-v3__shade--bottom" style={{ top: `${spotlight.bottom}px` }} />
          <div
            className="ff-tutorial-v3__spotlight"
            style={{
              top: `${spotlight.top}px`,
              left: `${spotlight.left}px`,
              width: `${spotlight.width}px`,
              height: `${spotlight.height}px`,
            }}
            aria-hidden="true"
          />
        </>
      ) : (
        <div className="ff-tutorial-v3__shade ff-tutorial-v3__shade--full" />
      )}

      <TutorialTooltip
        step={activeStep}
        section={currentSection}
        progress={progress}
        isLastStep={progress?.currentStep >= progress?.totalSteps}
        canGoBack={activeStepIndex > 0}
        targetPending={targetPending}
        targetMissing={targetMissing}
        nextDisabled={nextDisabled}
        tooltipRef={tooltipRef}
        style={tooltipStyle}
        variant="guided"
        onClose={pauseTutorial}
        onBack={previousStep}
        onNext={nextStep}
        onSkipStep={skipStep}
        onPause={pauseTutorial}
        onSkipAll={skipAll}
      />
    </div>
  )

  return createPortal(overlay, document.body)
}
