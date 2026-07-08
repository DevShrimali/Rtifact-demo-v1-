import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export function ScreenStateWidget() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeState = searchParams.get('state') || 'default'

  // Position state (starting at bottom center of the page)
  const [position, setPosition] = useState(() => {
    // Try to load saved position
    const saved = localStorage.getItem('rtifact.screenstate.pos')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        // ignore
      }
    }
    return { x: window.innerWidth / 2 - 180, y: window.innerHeight - 80 }
  })

  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const widgetStart = useRef({ x: 0, y: 0 })
  const widgetRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag with left click
    if (e.button !== 0) return
    
    // Don't drag if clicking buttons
    if ((e.target as HTMLElement).closest('button')) return

    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    widgetStart.current = { ...position }
    document.body.style.userSelect = 'none'
    
    if (widgetRef.current) {
      widgetRef.current.classList.add('dragging')
    }
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return
      
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      
      const newX = widgetStart.current.x + dx
      const newY = widgetStart.current.y + dy
      
      // Boundaries check
      const maxX = window.innerWidth - (widgetRef.current?.offsetWidth || 360) - 20
      const maxY = window.innerHeight - (widgetRef.current?.offsetHeight || 50) - 20
      
      const nextPos = {
        x: Math.max(20, Math.min(maxX, newX)),
        y: Math.max(20, Math.min(maxY, newY)),
      }
      
      setPosition(nextPos)
    }

    const handlePointerUp = () => {
      if (isDragging.current) {
        isDragging.current = false
        document.body.style.userSelect = ''
        if (widgetRef.current) {
          widgetRef.current.classList.remove('dragging')
        }
        localStorage.setItem('rtifact.screenstate.pos', JSON.stringify(position))
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [position])

  const handleStateChange = (state: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (state === 'default') {
      newParams.delete('state')
    } else {
      newParams.set('state', state)
    }
    setSearchParams(newParams)
  }

  // Determine current active button label
  const getMappedState = () => {
    if (activeState === 'loading') return 'loading'
    if (activeState === 'empty') return 'empty'
    if (activeState === 'error' || activeState === 'unknown') return 'error'
    return 'default'
  }

  const mapped = getMappedState()

  return (
    <div
      ref={widgetRef}
      className="screen-state-widget"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
      }}
      onPointerDown={handlePointerDown}
    >
      <span className="widget-label">SCREEN STATE</span>
      <div className="widget-btns">
        <button
          className={mapped === 'default' ? 'active' : ''}
          onClick={() => handleStateChange('default')}
        >
          Default
        </button>
        <button
          className={mapped === 'loading' ? 'active' : ''}
          onClick={() => handleStateChange('loading')}
        >
          Loading
        </button>
        <button
          className={mapped === 'empty' ? 'active' : ''}
          onClick={() => handleStateChange('empty')}
        >
          Empty
        </button>
        <button
          className={mapped === 'error' ? 'active' : ''}
          onClick={() => handleStateChange('error')}
        >
          Unknown
        </button>
      </div>
    </div>
  )
}
