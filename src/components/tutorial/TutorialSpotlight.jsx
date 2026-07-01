function getViewport() {
  if (typeof window === 'undefined') return { width: 0, height: 0, offsetTop: 0, offsetLeft: 0 }
  const vv = window.visualViewport
  return {
    width: vv?.width || window.innerWidth,
    height: vv?.height || window.innerHeight,
    offsetTop: vv?.offsetTop || 0,
    offsetLeft: vv?.offsetLeft || 0,
  }
}

function clamp(value, min, max) {
  if (max < min) return min
  return Math.min(Math.max(value, min), max)
}

export default function TutorialSpotlight({ rect, label, visible }) {
  if (!visible || !rect) return null

  const viewport = getViewport()
  const padding = 8
  const edge = 8
  const viewportTop = viewport.offsetTop + edge
  const viewportLeft = viewport.offsetLeft + edge
  const viewportRight = viewport.offsetLeft + viewport.width - edge
  const viewportBottom = viewport.offsetTop + viewport.height - edge

  const desiredTop = rect.top - padding
  const desiredLeft = rect.left - padding
  const desiredRight = rect.right + padding
  const desiredBottom = rect.bottom + padding

  const top = clamp(desiredTop, viewportTop, Math.max(viewportTop, viewportBottom - 28))
  const left = clamp(desiredLeft, viewportLeft, Math.max(viewportLeft, viewportRight - 28))
  const right = clamp(desiredRight, left + 28, viewportRight)
  const bottom = clamp(desiredBottom, top + 28, viewportBottom)

  const style = {
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
    width: `${Math.round(Math.max(28, right - left))}px`,
    height: `${Math.round(Math.max(28, bottom - top))}px`,
  }

  return (
    <div className="ff-tutorial-spotlight ff-tutorial-highlight-pulse" style={style} aria-hidden="true">
      {label ? <span className="ff-tutorial-target-label">{label}</span> : null}
    </div>
  )
}
