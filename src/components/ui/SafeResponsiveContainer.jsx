import { cloneElement, isValidElement, useEffect, useRef, useState } from 'react'

function getNumericHeight(height, minHeight) {
  if (typeof height === 'number' && Number.isFinite(height)) return height
  return minHeight
}

function SafeResponsiveContainer({
  children,
  height = 320,
  minHeight = 280,
  className = '',
}) {
  const containerRef = useRef(null)
  const numericHeight = getNumericHeight(height, minHeight)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return undefined

    function updateWidth() {
      const rect = element.getBoundingClientRect()
      const nextWidth = Math.floor(rect.width || element.offsetWidth || 0)
      setWidth(Math.max(0, nextWidth))
    }

    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(element)

    window.addEventListener('resize', updateWidth)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateWidth)
    }
  }, [])

  const canRenderChart = width > 24 && numericHeight > 24

  return (
    <div
      ref={containerRef}
      className={`min-w-0 ${className}`.trim()}
      style={{
        width: '100%',
        height: numericHeight,
        minHeight: numericHeight,
      }}
      data-chart-container="true"
    >
      {canRenderChart && isValidElement(children)
        ? cloneElement(children, {
            width,
            height: numericHeight,
          })
        : null}
    </div>
  )
}

export default SafeResponsiveContainer
