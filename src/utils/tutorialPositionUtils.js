const VIEWPORT_MARGIN = 12
const TARGET_PADDING = 8
const POPUP_GAP = 14
const DEFAULT_POPUP_SIZE = { width: 320, height: 170 }
const MIN_POPUP_HEIGHT = 148

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function getViewportRect() {
  const visualViewport = window.visualViewport

  return {
    top: visualViewport?.offsetTop || 0,
    left: visualViewport?.offsetLeft || 0,
    width: visualViewport?.width || window.innerWidth || document.documentElement.clientWidth,
    height: visualViewport?.height || window.innerHeight || document.documentElement.clientHeight,
  }
}

export function calculateHighlight(element, padding = TARGET_PADDING) {
  if (!element) return null

  const rect = element.getBoundingClientRect()
  const viewport = getViewportRect()
  const left = clamp(rect.left - padding, viewport.left + VIEWPORT_MARGIN, viewport.left + viewport.width - VIEWPORT_MARGIN)
  const top = clamp(rect.top - padding, viewport.top + VIEWPORT_MARGIN, viewport.top + viewport.height - VIEWPORT_MARGIN)
  const right = clamp(rect.right + padding, viewport.left + VIEWPORT_MARGIN, viewport.left + viewport.width - VIEWPORT_MARGIN)
  const bottom = clamp(rect.bottom + padding, viewport.top + VIEWPORT_MARGIN, viewport.top + viewport.height - VIEWPORT_MARGIN)

  return {
    top,
    left,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
    right,
    bottom,
    radius: Math.min(24, Math.max(14, Math.min(rect.width, rect.height) / 5)),
  }
}

function hasRoom(candidate, popupSize, viewport) {
  return candidate.left >= viewport.left + VIEWPORT_MARGIN &&
    candidate.top >= viewport.top + VIEWPORT_MARGIN &&
    candidate.left + popupSize.width <= viewport.left + viewport.width - VIEWPORT_MARGIN &&
    candidate.top + popupSize.height <= viewport.top + viewport.height - VIEWPORT_MARGIN
}

function overlapsTarget(candidate, popupSize, target) {
  const popup = {
    left: candidate.left,
    top: candidate.top,
    right: candidate.left + popupSize.width,
    bottom: candidate.top + popupSize.height,
  }

  return !(popup.right <= target.left || popup.left >= target.right || popup.bottom <= target.top || popup.top >= target.bottom)
}

export function calculatePopupPosition(highlight, popupSize = DEFAULT_POPUP_SIZE) {
  const viewport = getViewportRect()
  const size = {
    width: Math.min(Math.max(260, popupSize.width || DEFAULT_POPUP_SIZE.width), Math.min(340, viewport.width - VIEWPORT_MARGIN * 2)),
    height: Math.min(Math.max(120, popupSize.height || DEFAULT_POPUP_SIZE.height), viewport.height - VIEWPORT_MARGIN * 2),
  }
  const centerY = highlight.top + highlight.height / 2 - size.height / 2
  const centerX = highlight.left + highlight.width / 2 - size.width / 2
  const candidates = [
    {
      placement: 'right',
      left: highlight.right + POPUP_GAP,
      top: centerY,
    },
    {
      placement: 'left',
      left: highlight.left - size.width - POPUP_GAP,
      top: centerY,
    },
    {
      placement: 'bottom',
      left: centerX,
      top: highlight.bottom + POPUP_GAP,
    },
    {
      placement: 'top',
      left: centerX,
      top: highlight.top - size.height - POPUP_GAP,
    },
  ]

  const fittingCandidate = candidates.find((candidate) => hasRoom(candidate, size, viewport) && !overlapsTarget(candidate, size, highlight))
  let chosen = fittingCandidate
  let renderedHeight = size.height

  if (!chosen) {
    const verticalCandidates = [
      {
        placement: 'bottom',
        left: centerX,
        top: highlight.bottom + POPUP_GAP,
        availableHeight: viewport.top + viewport.height - VIEWPORT_MARGIN - highlight.bottom - POPUP_GAP,
      },
      {
        placement: 'top',
        left: centerX,
        availableHeight: highlight.top - viewport.top - VIEWPORT_MARGIN - POPUP_GAP,
      },
    ]
      .filter((candidate) => candidate.availableHeight >= MIN_POPUP_HEIGHT)
      .sort((a, b) => b.availableHeight - a.availableHeight)

    const adaptiveCandidate = verticalCandidates[0]
    if (adaptiveCandidate) {
      renderedHeight = Math.min(size.height, adaptiveCandidate.availableHeight)
      chosen = {
        ...adaptiveCandidate,
        top: adaptiveCandidate.placement === 'top'
          ? highlight.top - POPUP_GAP - renderedHeight
          : adaptiveCandidate.top,
      }
    }
  }

  if (!chosen) {
    return {
      placement: 'detached',
      overlapsTarget: true,
      style: {
        width: size.width,
        left: clamp(centerX, viewport.left + VIEWPORT_MARGIN, viewport.left + viewport.width - size.width - VIEWPORT_MARGIN),
        top: viewport.top + VIEWPORT_MARGIN,
        maxHeight: Math.max(MIN_POPUP_HEIGHT, viewport.height - VIEWPORT_MARGIN * 2),
      },
    }
  }

  const finalLeft = clamp(chosen.left, viewport.left + VIEWPORT_MARGIN, viewport.left + viewport.width - size.width - VIEWPORT_MARGIN)
  const finalTop = clamp(chosen.top, viewport.top + VIEWPORT_MARGIN, viewport.top + viewport.height - renderedHeight - VIEWPORT_MARGIN)
  const finalCandidate = { left: finalLeft, top: finalTop }

  return {
    placement: chosen.placement,
    overlapsTarget: overlapsTarget(finalCandidate, { ...size, height: renderedHeight }, highlight),
    style: {
      width: size.width,
      left: finalLeft,
      top: finalTop,
      maxHeight: renderedHeight < size.height ? renderedHeight : undefined,
    },
  }
}

export function calculateOverlayPanes(highlight) {
  const viewport = getViewportRect()
  if (!highlight) return []

  return [
    {
      key: 'top',
      style: {
        left: viewport.left,
        top: viewport.top,
        width: viewport.width,
        height: Math.max(0, highlight.top - viewport.top),
      },
    },
    {
      key: 'bottom',
      style: {
        left: viewport.left,
        top: highlight.bottom,
        width: viewport.width,
        height: Math.max(0, viewport.top + viewport.height - highlight.bottom),
      },
    },
    {
      key: 'left',
      style: {
        left: viewport.left,
        top: highlight.top,
        width: Math.max(0, highlight.left - viewport.left),
        height: highlight.height,
      },
    },
    {
      key: 'right',
      style: {
        left: highlight.right,
        top: highlight.top,
        width: Math.max(0, viewport.left + viewport.width - highlight.right),
        height: highlight.height,
      },
    },
  ]
}
