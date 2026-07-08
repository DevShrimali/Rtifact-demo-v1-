import { Outlet, useSearchParams } from 'react-router-dom'
import { useEnv } from '../../state/env'

const INTERVALS = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const

const INTERVAL_DETAILS: Record<string, { title: string; dateText: string }> = {
  daily: { title: 'Daily review', dateText: 'Jul 7, 2026' },
  weekly: { title: 'Weekly review', dateText: 'week of Jul 1 – Jul 7' },
  monthly: { title: 'Monthly review', dateText: 'July 2026' },
  quarterly: { title: 'Quarterly review', dateText: 'Q3 2026' },
  yearly: { title: 'Yearly review', dateText: '2026' },
}

export function ReviewLayout() {
  const { selectedEnvs, aggregating } = useEnv()
  const [searchParams, setSearchParams] = useSearchParams()

  const scope = aggregating ? `${selectedEnvs.length} environments` : selectedEnvs[0]?.name || 'default'

  const intervalParam = searchParams.get('interval') || 'daily'
  const interval = INTERVALS.includes(intervalParam as any)
    ? intervalParam
    : 'daily'

  const { title, dateText } = INTERVAL_DETAILS[interval]

  const handleIntervalChange = (newInterval: string) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('interval', newInterval)
    setSearchParams(newParams)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Review</div>
          <h1 className="page-title">{title}</h1>
          <p className="page-sub">
            {scope} · {dateText} · <span className="time-ref">updated 1h ago</span>
          </p>
        </div>

        <div className="pipeline-tabs" style={{ marginBottom: 0 }}>
          {INTERVALS.map((int) => (
            <button
              key={int}
              role="tab"
              aria-selected={interval === int}
              className={`pipeline-tab${interval === int ? ' active' : ''}`}
              onClick={() => handleIntervalChange(int)}
              style={{ textTransform: 'capitalize' }}
            >
              {int}
            </button>
          ))}
        </div>
      </div>

      <Outlet />
    </>
  )
}
