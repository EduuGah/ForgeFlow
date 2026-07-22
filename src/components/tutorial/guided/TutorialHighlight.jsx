import { calculateOverlayPanes } from '../../../utils/tutorialPositionUtils'

export default function TutorialHighlight({ highlight, onOutsidePointerDown }) {
  if (!highlight) return null

  const panes = calculateOverlayPanes(highlight)

  return (
    <>
      {panes.map((pane) => (
        <div
          key={pane.key}
          className="ff-guided-tutorial-pane"
          style={pane.style}
          onPointerDown={onOutsidePointerDown}
          aria-hidden="true"
        />
      ))}

      <div
        className="ff-guided-tutorial-ring"
        style={{
          top: highlight.top,
          left: highlight.left,
          width: highlight.width,
          height: highlight.height,
          borderRadius: highlight.radius,
        }}
        aria-hidden="true"
      />
    </>
  )
}

