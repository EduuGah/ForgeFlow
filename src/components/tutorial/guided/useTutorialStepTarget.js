import { useEffect, useRef, useState } from 'react'

import { waitForElement, scrollToTutorialTarget } from '../../../utils/tutorialElementUtils'
import { calculateHighlight } from '../../../utils/tutorialPositionUtils'

function getTargetSelector(step) {
  return step?.target || 'main'
}

function isOverlayMutation(record) {
  const target = record?.target
  return Boolean(target?.closest?.('.ff-guided-tutorial-root'))
}

function isSameHighlight(currentHighlight, nextHighlight) {
  if (!currentHighlight || !nextHighlight) return currentHighlight === nextHighlight

  return Math.abs(currentHighlight.top - nextHighlight.top) < 0.5 &&
    Math.abs(currentHighlight.left - nextHighlight.left) < 0.5 &&
    Math.abs(currentHighlight.width - nextHighlight.width) < 0.5 &&
    Math.abs(currentHighlight.height - nextHighlight.height) < 0.5 &&
    Math.abs(currentHighlight.radius - nextHighlight.radius) < 0.5
}

export default function useTutorialStepTarget(step, watchKey = '') {
  const [targetState, setTargetState] = useState({
    status: 'idle',
    element: null,
    highlight: null,
    message: '',
  })
  const elementRef = useRef(null)
  const frameRef = useRef(0)

  useEffect(() => {
    if (!step) {
      setTargetState({ status: 'idle', element: null, highlight: null, message: '' })
      return undefined
    }

    const abortController = new AbortController()
    let resizeObserver = null
    let mutationObserver = null

    function disconnectObservers() {
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
      resizeObserver = null
      mutationObserver = null
    }

    function cleanupTargetClass() {
      elementRef.current?.classList?.remove('ff-guided-tutorial-target')
      elementRef.current = null
    }

    function measure(element = elementRef.current) {
      if (!element || abortController.signal.aborted) return

      const nextHighlight = calculateHighlight(element)
      const nextStatus = nextHighlight ? 'ready' : 'waiting'

      setTargetState((current) => {
        if (
          current.status === nextStatus &&
          current.element === element &&
          current.message === '' &&
          isSameHighlight(current.highlight, nextHighlight)
        ) {
          return current
        }

        return {
          ...current,
          status: nextStatus,
          element,
          highlight: nextHighlight,
          message: '',
        }
      })
    }

    function scheduleMeasure() {
      window.cancelAnimationFrame(frameRef.current)
      frameRef.current = window.requestAnimationFrame(() => measure())
    }

    async function prepareTarget() {
      setTargetState({
        status: 'waiting',
        element: null,
        highlight: null,
        message: 'Localizando etapa...',
      })

      const element = await waitForElement(getTargetSelector(step), {
        signal: abortController.signal,
        timeoutMs: step.requireTarget ? 9000 : 7000,
      })

      if (abortController.signal.aborted) return

      if (!element) {
        setTargetState({
          status: 'missing',
          element: null,
          highlight: null,
          message: 'Não encontrei essa parte da tela. Tente voltar ou pular o tutorial.',
        })
        return
      }

      disconnectObservers()
      cleanupTargetClass()
      elementRef.current = element
      element.classList.add('ff-guided-tutorial-target')

      await scrollToTutorialTarget(element, { signal: abortController.signal })
      if (abortController.signal.aborted) return

      measure(element)

      resizeObserver = typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(scheduleMeasure)
        : null
      resizeObserver?.observe(element)
      resizeObserver?.observe(document.documentElement)

      mutationObserver = new MutationObserver((records) => {
        if (records.length > 0 && records.every(isOverlayMutation)) return

        if (!element.isConnected) {
          disconnectObservers()
          prepareTarget()
          return
        }
        scheduleMeasure()
      })
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'hidden', 'data-state', 'open'],
      })
    }

    function handleViewportChange() {
      scheduleMeasure()
    }

    window.addEventListener('scroll', handleViewportChange, true)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('orientationchange', handleViewportChange)
    window.visualViewport?.addEventListener('resize', handleViewportChange)
    window.visualViewport?.addEventListener('scroll', handleViewportChange)

    prepareTarget()

    return () => {
      abortController.abort()
      window.cancelAnimationFrame(frameRef.current)
      disconnectObservers()
      cleanupTargetClass()
      window.removeEventListener('scroll', handleViewportChange, true)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('orientationchange', handleViewportChange)
      window.visualViewport?.removeEventListener('resize', handleViewportChange)
      window.visualViewport?.removeEventListener('scroll', handleViewportChange)
    }
  }, [step, watchKey])

  return targetState
}
