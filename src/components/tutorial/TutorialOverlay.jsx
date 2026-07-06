import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { useTutorial } from '../../context/TutorialContext'
import TutorialTooltip from './TutorialTooltip'

const TARGET_RETRY_MS = 90
const TARGET_RETRY_LIMIT = 24
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
    .map((item) => document.querySelector(item))
    .find((element) => element instanceof HTMLElement && element.offsetParent !== null) || null
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

function scrollTargetIntoSafeView(element) {
  if (!element || typeof window === 'undefined') return

  element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })

  // Segunda correção após o scroll nativo: evita que barras fixas superiores/inferiores
  // escondam o alvo em telas pequenas ou dentro do APK.
  window.setTimeout(() => {
    const viewport = getViewport()
    const rect = element.getBoundingClientRect()
    const topReserve = 96 + viewport.top
    const bottomReserve = 170

    if (rect.top < topReserve) {
      window.scrollBy({ top: rect.top - topReserve, behavior: 'smooth' })
      return
    }

    if (rect.bottom > viewport.top + viewport.height - bottomReserve) {
      window.scrollBy({ top: rect.bottom - (viewport.top + viewport.height - bottomReserve), behavior: 'smooth' })
    }
  }, 280)
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
  const [targetMissing, setTargetMissing] = useState(false)

  const selector = activeStep?.target || ''
  const spotlight = useMemo(() => buildSpotlight(targetRect), [targetRect])
  const placement = useMemo(() => getTooltipPlacement(targetRect), [targetRect])
  const tooltipStyle = useMemo(() => getTooltipStyle(targetRect, placement), [targetRect, placement])

  useEffect(() => {
    if (!isRunning || !activeStep) return undefined

    let cancelled = false
    let attempts = 0
    let retryId = null

    setTargetElement(null)
    setTargetRect(null)
    setTargetMissing(false)

    const resolveTarget = () => {
      if (cancelled) return
      const element = findTarget(selector)

      if (element) {
        setTargetElement(element)
        setTargetMissing(false)
        scrollTargetIntoSafeView(element)
        return
      }

      attempts += 1
      if (attempts >= TARGET_RETRY_LIMIT) {
        setTargetMissing(Boolean(activeStep.requireTarget || selector))
        setTargetElement(null)
        setTargetRect(null)
        return
      }

      retryId = window.setTimeout(resolveTarget, TARGET_RETRY_MS)
    }

    retryId = window.setTimeout(resolveTarget, 80)

    return () => {
      cancelled = true
      window.clearTimeout(retryId)
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
    scheduleUpdate()

    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('scroll', scheduleUpdate, true)
    window.visualViewport?.addEventListener('resize', scheduleUpdate)
    window.visualViewport?.addEventListener('scroll', scheduleUpdate)

    return () => {
      targetElement.removeAttribute('data-tutorial-active')
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
    window.setTimeout(() => tooltipRef.current?.focus({ preventScroll: true }), 60)

    return () => {
      document.body.style.overflowX = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isRunning, pauseTutorial])

  if (!isRunning || !activeStep) return null

  return (
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
        targetMissing={targetMissing}
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
}
