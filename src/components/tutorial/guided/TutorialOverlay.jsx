import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { calculatePopupPosition } from '../../../utils/tutorialPositionUtils'
import TutorialHighlight from './TutorialHighlight'
import TutorialPopup from './TutorialPopup'

export default function TutorialOverlay({
  step,
  flowTitle,
  current,
  total,
  canGoBack,
  targetState,
  onBack,
  onNext,
  onRetry,
  onSkip,
}) {
  const popupRef = useRef(null)
  const [popupSize, setPopupSize] = useState({ width: 320, height: 250 })
  const [feedback, setFeedback] = useState('')
  const [outsidePulse, setOutsidePulse] = useState(0)

  useEffect(() => {
    const popup = popupRef.current
    if (!popup || typeof ResizeObserver === 'undefined') return undefined

    const observer = new ResizeObserver(() => {
      const box = popup.getBoundingClientRect()
      if (!box.width || !box.height) return
      setPopupSize((currentSize) => {
        if (Math.abs(currentSize.width - box.width) < 0.5 && Math.abs(currentSize.height - box.height) < 0.5) {
          return currentSize
        }

        return { width: box.width, height: box.height }
      })
    })

    observer.observe(popup)
    return () => observer.disconnect()
  }, [step?.id])

  useEffect(() => {
    setFeedback('')
  }, [step?.id])

  const popupPosition = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        placement: 'bottom',
        style: { width: 320, left: 12, top: 80 },
      }
    }

    if (!targetState.highlight) {
      const width = Math.min(320, Math.max(260, window.innerWidth - 24))
      const viewport = window.visualViewport
      const viewportTop = viewport?.offsetTop || 0
      const viewportHeight = viewport?.height || window.innerHeight
      return {
        placement: 'bottom',
        style: {
          width,
          left: Math.max(12, (window.innerWidth - width) / 2),
          top: viewportTop + Math.max(12, Math.min(80, (viewportHeight - Math.min(popupSize.height, 250)) / 2)),
          maxHeight: Math.max(180, viewportHeight - 24),
        },
      }
    }

    const minimumHeight = step?.validation === 'input-value' ? 160 : 250
    return calculatePopupPosition(targetState.highlight, {
      ...popupSize,
      height: Math.max(minimumHeight, popupSize.height),
    })
  }, [popupSize, step?.validation, targetState.highlight])

  if (typeof document === 'undefined' || !step) return null

  function handleOutsidePointerDown(event) {
    event.preventDefault()
    event.stopPropagation()
    setOutsidePulse((value) => value + 1)
    setFeedback('Use o item destacado para continuar.')
  }

  function handleNext() {
    if (targetState.status === 'missing') {
      setFeedback('Procurando o campo novamente...')
      onRetry?.()
      return
    }

    const result = onNext?.()
    if (result && result.advanced === false) {
      setOutsidePulse((value) => value + 1)
      setFeedback(result.message || 'Conclua a ação destacada para avançar.')
    }
  }

  const overlay = (
    <div className={`ff-guided-tutorial-root ${outsidePulse ? 'has-feedback' : ''}`} data-pulse={outsidePulse}>
      {targetState.highlight ? (
        <TutorialHighlight
          highlight={targetState.highlight}
          onOutsidePointerDown={handleOutsidePointerDown}
        />
      ) : targetState.status !== 'ready' ? (
        <div className="ff-guided-tutorial-pane ff-guided-tutorial-pane--full" onPointerDown={handleOutsidePointerDown} />
      ) : null}

      <TutorialPopup
        popupRef={popupRef}
        step={step}
        flowTitle={flowTitle}
        current={current}
        total={total}
        placement={popupPosition.placement}
        style={popupPosition.style}
        compact={step.validation === 'input-value'}
        canGoBack={canGoBack}
        feedback={feedback || (targetState.status === 'missing' ? targetState.message : '')}
        status={targetState.status}
        onBack={onBack}
        onNext={handleNext}
        onSkip={onSkip}
      />
    </div>
  )

  return createPortal(overlay, document.body)
}
