import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'

import { useTutorial } from '../../context/TutorialContext'
import TutorialTooltip from './TutorialTooltip'

const TARGET_RETRY_LIMIT = 12
const TARGET_RETRY_DELAY = 120
const MOBILE_BREAKPOINT = 720

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

function isMobileViewport() {
  return getViewport().width <= MOBILE_BREAKPOINT
}

function isUsableTarget(element) {
  if (!element || typeof window === 'undefined') return false
  const rect = element.getBoundingClientRect()
  const style = window.getComputedStyle(element)

  if (rect.width <= 0 || rect.height <= 0) return false
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
      const elements = Array.from(document.querySelectorAll(item))
      const usable = elements.filter(isUsableTarget)
      if (!usable.length) continue

      const viewport = getViewport()
      const viewportBottom = viewport.offsetTop + viewport.height
      const viewportRight = viewport.offsetLeft + viewport.width
      const visible = usable.find((element) => {
        const rect = element.getBoundingClientRect()
        return rect.bottom > viewport.offsetTop && rect.top < viewportBottom && rect.right > viewport.offsetLeft && rect.left < viewportRight
      })

      return visible || usable[0]
    } catch {
      // Mantém o tutorial vivo mesmo se um seletor antigo estiver inválido.
    }
  }

  return null
}

function getScrollParent(element) {
  if (!element || typeof window === 'undefined') return document.scrollingElement || document.documentElement

  let parent = element.parentElement
  while (parent && parent !== document.body && parent !== document.documentElement) {
    const style = window.getComputedStyle(parent)
    const overflow = `${style.overflowY}${style.overflow}`
    if (/(auto|scroll|overlay)/i.test(overflow) && parent.scrollHeight > parent.clientHeight) {
      return parent
    }
    parent = parent.parentElement
  }

  return document.scrollingElement || document.documentElement
}

function hasFixedContext(element) {
  if (!element || typeof window === 'undefined') return false
  let node = element

  while (node && node !== document.body && node !== document.documentElement) {
    const style = window.getComputedStyle(node)
    if (style.position === 'fixed' || style.position === 'sticky') return true
    node = node.parentElement
  }

  return false
}

function canUseInlineCard(target, step) {
  if (!target || !step) return false
  if (step.presentation === 'panel' || step.placement === 'center') return false
  if (hasFixedContext(target)) return false

  const rect = target.getBoundingClientRect()
  const viewport = getViewport()
  if (rect.height > viewport.height * 0.62) return false

  return true
}

function scrollTargetIntoView(target, host) {
  if (!target || typeof window === 'undefined') return

  const scrollParent = getScrollParent(target)
  const options = { block: 'center', inline: 'nearest', behavior: 'auto' }

  try {
    target.scrollIntoView(options)
  } catch {
    // fallback manual para WebViews antigos
    const rect = target.getBoundingClientRect()
    const viewport = getViewport()
    const desiredCenter = viewport.offsetTop + viewport.height * 0.48
    const delta = rect.top + rect.height / 2 - desiredCenter

    if (scrollParent && scrollParent !== document.documentElement && scrollParent !== document.body) {
      scrollParent.scrollTop += delta
    } else {
      window.scrollTo({ top: Math.max(0, window.scrollY + delta), behavior: 'auto' })
    }
  }

  window.setTimeout(() => {
    try {
      const viewport = getViewport()
      const rect = target.getBoundingClientRect()
      const topLimit = viewport.offsetTop + 88
      const bottomLimit = viewport.offsetTop + viewport.height - 132

      if (rect.top < topLimit || rect.bottom > bottomLimit) {
        target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' })
      }

      // Se o card inline ficou logo abaixo e fora da tela, aproxima só o necessário.
      if (host && isMobileViewport()) {
        const hostRect = host.getBoundingClientRect()
        if (hostRect.bottom > viewport.offsetTop + viewport.height - 18) {
          host.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' })
        }
      }
    } catch {
      // sem ação
    }
  }, 80)
}

function useTutorialTarget(step, pathname) {
  const [target, setTarget] = useState(null)
  const [targetMissing, setTargetMissing] = useState(false)

  const updateTarget = useCallback(() => {
    const element = getFirstMatchingElement(step?.target || step?.selector)
    setTarget(element)
    return Boolean(element)
  }, [step?.selector, step?.target])

  useEffect(() => {
    setTarget(null)
    setTargetMissing(false)

    if (!step?.target && !step?.selector) return undefined

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
  }, [pathname, step?.id, step?.selector, step?.target, updateTarget])

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

function useInlineTutorialHost(target, step) {
  const [host, setHost] = useState(null)

  useEffect(() => {
    setHost(null)
    if (!canUseInlineCard(target, step)) return undefined

    const hostElement = document.createElement('div')
    const position = step?.inlinePlacement === 'before' ? 'beforebegin' : 'afterend'

    hostElement.className = `ff-tutorial-inline-host ff-tutorial-inline-host--${step?.inlinePlacement === 'before' ? 'before' : 'after'}`
    hostElement.setAttribute('data-tutorial-inline-host', step?.id || '')

    target.insertAdjacentElement(position, hostElement)
    target.classList.add('ff-tutorial-active-target')
    setHost(hostElement)

    window.setTimeout(() => scrollTargetIntoView(target, hostElement), 50)
    window.setTimeout(() => scrollTargetIntoView(target, hostElement), 180)

    return () => {
      target.classList.remove('ff-tutorial-active-target')
      hostElement.remove()
      setHost(null)
    }
  }, [step?.id, step?.inlinePlacement, step?.placement, step?.presentation, target])

  return host
}

function useGlobalTutorialKeys(isEnabled, handlers) {
  useEffect(() => {
    if (!isEnabled) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handlers?.onEscape?.()
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
  const tooltipRef = useRef(null)

  const { target, targetMissing } = useTutorialTarget(activeStep, location.pathname)
  const inlineHost = useInlineTutorialHost(target, activeStep)
  const useInline = Boolean(inlineHost)

  useGlobalTutorialKeys(isTutorialOpen, useMemo(() => ({ onEscape: pauseTutorial }), [pauseTutorial]))

  useEffect(() => {
    if (!isTutorialOpen || !tooltipRef.current) return undefined
    const id = window.setTimeout(() => {
      tooltipRef.current?.focus?.({ preventScroll: true })
    }, 30)
    return () => window.clearTimeout(id)
  }, [activeStep?.id, isTutorialOpen, useInline])

  if (!isTutorialOpen || !activeStep) return null

  const isLastStep = activeFlow ? activeStepIndex >= activeFlow.steps.length - 1 : false
  const canGoBack = activeStepIndex > 0

  const tooltip = (
    <TutorialTooltip
      step={activeStep}
      section={currentSection}
      progress={progress}
      isLastStep={isLastStep}
      canGoBack={canGoBack}
      targetMissing={targetMissing && Boolean(activeStep?.target || activeStep?.selector)}
      tooltipRef={tooltipRef}
      variant={useInline ? 'inline' : 'panel'}
      onClose={pauseTutorial}
      onBack={previousStep}
      onNext={nextStep}
      onSkipStep={skipStep}
      onPause={pauseTutorial}
      onSkipAll={skipAll}
    />
  )

  if (useInline && inlineHost) {
    return createPortal(tooltip, inlineHost)
  }

  return (
    <div className="ff-tutorial-overlay ff-tutorial-overlay--panel" aria-live="polite">
      {tooltip}
    </div>
  )
}
