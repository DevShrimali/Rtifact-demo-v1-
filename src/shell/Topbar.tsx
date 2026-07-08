import { useEffect, useState } from 'react'
import { Breadcrumb } from './Breadcrumb'
import { EnvSelector } from './EnvSelector'
import { PersonaSwitcher } from './PersonaSwitcher'
import { AskAIButton } from '../components/AskAI'

function useUtcClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now.toISOString().slice(11, 19) + ' UTC'
}

export function Topbar() {
  const clock = useUtcClock()

  return (
    <header className="topbar">
      <Breadcrumb />
      <div className="topbar-right">
        {/* Global multi-select environment selector (DEV-27) */}
        <EnvSelector />
        <span className="clock">{clock}</span>
        {/* Theme control moved to Settings › Appearance (DEV-27) */}
        <AskAIButton />
        <PersonaSwitcher />
      </div>
    </header>
  )
}
