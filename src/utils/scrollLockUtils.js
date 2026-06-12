const GLOBAL_SCROLL_LOCK_CLASSES = [
  'ff-modal-open',
  'ff-sidebar-open',
  'ff-notification-menu-open',
  'ff-notification-detail-open',
  'ff-finish-workout-open',
  'ff-scroll-locked-by-workout-modal',
  'overflow-hidden',
]

const SCROLL_STYLE_PROPS = [
  'overflow',
  'overflowX',
  'overflowY',
  'position',
  'height',
  'top',
  'left',
  'right',
  'width',
  'touchAction',
  'overscrollBehavior',
]

export function unlockGlobalScroll() {
  if (typeof document === 'undefined') return

  const targets = [document.documentElement, document.body].filter(Boolean)

  targets.forEach((target) => {
    target.classList.remove(...GLOBAL_SCROLL_LOCK_CLASSES)

    SCROLL_STYLE_PROPS.forEach((prop) => {
      target.style[prop] = ''
    })
  })

  document.querySelectorAll('.ff-page-scroll-shell').forEach((shell) => {
    shell.classList.remove('ff-scroll-locked-by-workout-modal')
    shell.style.overflow = ''
  })
}
