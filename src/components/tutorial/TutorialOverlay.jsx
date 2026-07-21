import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useTutorial } from '../../context/TutorialContext'
import TutorialTooltip from './TutorialTooltip'

const TARGET_WAIT_TIMEOUT_MS = 5000
const TARGET_PADDING = 10
const MOBILE_BREAKPOINT = 760

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
    let timeoutId = null

    const cleanup = () => {
      window.clearTimeout(timeoutId)
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

    signal?.addEventListener('abort', handleAbort, { once: true })
    element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' })
    keepTargetInsideSafeArea()
    timeoutId = window.setTimeout(finish, 90)
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

function getTooltipStyle() {
  const viewport = getViewport()
  const isMobile = viewport.width <= MOBILE_BREAKPOINT
  const maxWidth = isMobile
    ? Math.max(280, viewport.width - 24)
    : Math.min(380, Math.max(300, viewport.width - 32))
  const maxHeight = isMobile
    ? Math.max(220, Math.min(330, viewport.height * 0.42))
    : Math.max(240, Math.min(360, viewport.height * 0.44))
  const left = isMobile
    ? viewport.left + 12
    : viewport.left + viewport.width - maxWidth - 16

  return {
    top: 'auto',
    right: 'auto',
    bottom: isMobile
      ? 'max(12px, calc(env(safe-area-inset-bottom, 0px) + 12px))'
      : 'max(16px, calc(env(safe-area-inset-bottom, 0px) + 16px))',
    left: `${Math.round(Math.max(viewport.left + 12, left))}px`,
    width: `${Math.round(maxWidth)}px`,
    maxWidth: isMobile ? `calc(100vw - 24px)` : `min(380px, calc(100vw - 32px))`,
    maxHeight: `${Math.round(maxHeight)}px`,
  }
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
  const [viewportVersion, setViewportVersion] = useState(0)

  const selector = activeStep?.target || ''
  const spotlight = useMemo(() => buildSpotlight(targetRect), [targetRect])
  const tooltipStyle = useMemo(() => getTooltipStyle(), [viewportVersion])
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

  useEffect(() => {
    if (!isRunning || !targetElement) return undefined

    const updateRect = () => {
      setTargetRect(getSafeRect(targetElement))
      setViewportVersion((value) => value + 1)
    }

    targetElement.setAttribute('data-tutorial-active', 'true')
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateRect)
      : null

    resizeObserver?.observe(targetElement)
    updateRect()

    window.addEventListener('resize', updateRect)
    window.visualViewport?.addEventListener('resize', updateRect)

    return () => {
      targetElement.removeAttribute('data-tutorial-active')
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateRect)
      window.visualViewport?.removeEventListener('resize', updateRect)
    }
  }, [isRunning, targetElement])

  useEffect(() => {
    if (!isRunning) return undefined

    const previousOverflow = document.body.style.overflowX
    document.body.style.overflowX = 'hidden'
    document.body.classList.add('ff-tutorial-running')
    document.documentElement.classList.add('ff-tutorial-running')

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
      document.body.classList.remove('ff-tutorial-running')
      document.documentElement.classList.remove('ff-tutorial-running')
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isRunning, pauseTutorial])

  if (!isRunning || !activeStep || typeof document === 'undefined') return null

  const overlay = (
    <div className="ff-tutorial-v3 ff-tutorial-v3--dock" role="presentation">
      {spotlight ? (
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
