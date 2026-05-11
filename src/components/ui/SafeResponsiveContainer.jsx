import { useEffect, useRef, useState } from 'react'
import { ResponsiveContainer as RechartsResponsiveContainer } from 'recharts'

function getFallbackHeight(height, minHeight) {
  if (typeof height === 'number') return height
  return minHeight
}

function SafeResponsiveContainer({
  children,
  height = '100%',
  minHeight = 260,
  className = '',
  ...props
}) {
  const containerRef = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const element = containerRef.current
    if (!element) return undefined

    function updateSize() {
      const rect = element.getBoundingClientRect()
      const fallbackHeight = getFallbackHeight(height, minHeight)
      setSize({
        width: Math.max(0, Math.floor(rect.width)),
        height: Math.max(0, Math.floor(rect.height || fallbackHeight)),
      })
    }

    updateSize()

    const observer = new ResizeObserver(updateSize)
    observer.observe(element)

    window.addEventListener('resize', updateSize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateSize)
    }
  }, [height, minHeight])

  const fallbackHeight = getFallbackHeight(height, minHeight)
  const canRenderChart = size.width > 8 && size.height > 8

  return (
    <div
      ref={containerRef}
      className={`min-w-0 ${className}`.trim()}
      style={{
        width: '100%',
        height,
        minHeight: fallbackHeight,
      }}
    >
      {canRenderChart ? (
        <RechartsResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          minHeight={fallbackHeight}
          {...props}
        >
          {children}
        </RechartsResponsiveContainer>
      ) : null}
    </div>
  )
}

export default SafeResponsiveContainer
