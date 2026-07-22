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
  onSkip,
}) {
  const popupRef = useRef(null)
  const [popupSize, setPopupSize] = useState({ width: 320, height: 170 })
  const [feedback, setFeedback] = useState('')
  const [outsidePulse, setOutsidePulse] = useState(0)

  useEffect(() => {
    const popup = popupRef.current
    if (!popup || typeof ResizeObserver === 'undefined') return undefined

    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.contentRect
      if (!box) return
      setPopupSize({
        width: box.width,
        height: box.height,
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
      return {
        placement: 'bottom',
        style: {
          width,
          left: Math.max(12, (window.innerWidth - width) / 2),
          top: Math.max(80, window.innerHeight * 0.28),
        },
      }
    }

    return calculatePopupPosition(targetState.highlight, popupSize)
  }, [popupSize, targetState.highlight])

  if (typeof document === 'undefined' || !step) return null

  function handleOutsidePointerDown(event) {
    event.preventDefault()
    event.stopPropagation()
    setOutsidePulse((value) => value + 1)
    setFeedback('Use o item destacado para continuar.')
  }

  function handleNext() {
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
      ) : (
        <div className="ff-guided-tutorial-pane ff-guided-tutorial-pane--full" onPointerDown={handleOutsidePointerDown} />
      )}

      <TutorialPopup
        popupRef={popupRef}
        step={step}
        flowTitle={flowTitle}
        current={current}
        total={total}
        placement={popupPosition.placement}
        style={popupPosition.style}
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
