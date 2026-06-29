export default function TutorialSpotlight({ rect, label, visible }) {
  if (!visible || !rect) return null

  const padding = 8
  const style = {
    top: `${Math.max(8, rect.top - padding)}px`,
    left: `${Math.max(8, rect.left - padding)}px`,
    width: `${Math.max(28, rect.width + padding * 2)}px`,
    height: `${Math.max(28, rect.height + padding * 2)}px`,
  }

  return (
    <div className="ff-tutorial-spotlight ff-tutorial-highlight-pulse" style={style} aria-hidden="true">
      {label ? <span className="ff-tutorial-target-label">{label}</span> : null}
    </div>
  )
}
