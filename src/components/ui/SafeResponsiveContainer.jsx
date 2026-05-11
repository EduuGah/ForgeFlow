import { useEffect, useRef, useState } from 'react'

function SafeResponsiveContainer({
  children,
  height = 320,
  minWidth = 120,
  fallback = null,
}) {
  const containerRef = useRef(null)
  const [size, setSize] = useState({
    width: 0,
    height,
  })

  useEffect(() => {
    const element = containerRef.current

    if (!element) return undefined

    function updateSize() {
      const rect = element.getBoundingClientRect()
      const nextWidth = Math.floor(rect.width)
      const nextHeight = Math.floor(rect.height || height)

      if (nextWidth > 0 && nextHeight > 0) {
        setSize({
          width: nextWidth,
          height: nextHeight,
        })
      }
    }

    updateSize()

    const observer = new ResizeObserver(updateSize)
    observer.observe(element)

    window.addEventListener('resize', updateSize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateSize)
    }
  }, [height])

  const canRender = size.width >= minWidth && size.height > 0

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[280px] w-full min-w-0"
      style={{
        height,
        minHeight: height,
      }}
      data-safe-chart-container="true"
    >
      {canRender ? children(size) : fallback}
    </div>
  )
}

export default SafeResponsiveContainer
