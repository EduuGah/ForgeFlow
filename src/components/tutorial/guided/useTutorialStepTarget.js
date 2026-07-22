import { useEffect, useRef, useState } from 'react'

import { isTutorialElementVisible, waitForElement, scrollToTutorialTarget } from '../../../utils/tutorialElementUtils'
import { calculateHighlight } from '../../../utils/tutorialPositionUtils'

function getTargetSelector(step) {
  return step?.target || ''
}

function isOverlayMutation(record) {
  const target = record?.target
  if (target?.closest?.('.ff-guided-tutorial-root')) return true

  const changedNodes = [...(record?.addedNodes || []), ...(record?.removedNodes || [])]
  return changedNodes.length > 0 && changedNodes.every((node) =>
    node?.nodeType === Node.ELEMENT_NODE &&
    (node.matches?.('.ff-guided-tutorial-root') || node.closest?.('.ff-guided-tutorial-root'))
  )
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
    let isPositioning = false
    let preparationId = 0
    let layoutEpoch = 0

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

    function scheduleMeasure({ ensureVisible = false } = {}) {
      if (isPositioning) return
      const currentEpoch = ++layoutEpoch
      window.cancelAnimationFrame(frameRef.current)
      frameRef.current = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(async () => {
          if (currentEpoch !== layoutEpoch || abortController.signal.aborted) return

          const element = elementRef.current
          if (ensureVisible && element && !isTutorialElementVisible(element)) {
            isPositioning = true
            await scrollToTutorialTarget(element, { signal: abortController.signal })
            isPositioning = false
          }

          measure(element)
        })
      })
    }

    async function prepareTarget() {
      const currentPreparationId = ++preparationId
      isPositioning = true
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

      if (abortController.signal.aborted || currentPreparationId !== preparationId) return

      if (!element) {
        isPositioning = false
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
      if (abortController.signal.aborted || currentPreparationId !== preparationId) return

      isPositioning = false
      measure(element)

      resizeObserver = typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => scheduleMeasure({ ensureVisible: true }))
        : null

      const observedLayoutElements = [
        element,
        element.parentElement,
        element.closest?.('[data-tutorial="active-exercise-card"]'),
      ].filter((item, index, items) => item && items.indexOf(item) === index)
      observedLayoutElements.forEach((item) => resizeObserver?.observe(item))

      mutationObserver = new MutationObserver((records) => {
        if (records.length > 0 && records.every(isOverlayMutation)) return

        if (!element.isConnected) {
          disconnectObservers()
          prepareTarget()
          return
        }
        scheduleMeasure({ ensureVisible: true })
      })
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
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
    document.addEventListener('transitionend', handleViewportChange, true)

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
      document.removeEventListener('transitionend', handleViewportChange, true)
    }
  }, [step, watchKey])

  return targetState
}
