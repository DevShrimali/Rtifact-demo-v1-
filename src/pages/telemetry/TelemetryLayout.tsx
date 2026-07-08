import { NavLink, Outlet, useSearchParams } from 'react-router-dom'
import { RefreshCw, WifiOff } from 'lucide-react'
import { useEnv } from '../../state/env'

const LENSES = [
  { to: '/command/telemetry/intelligence', label: 'Intelligence' },
  { to: '/command/telemetry/metrics', label: 'Metrics' },
  { to: '/command/telemetry/logs', label: 'Logs' },
  { to: '/command/telemetry/traces', label: 'Traces' },
  { to: '/command/telemetry/synthetic', label: 'Synthetic' },
  { to: '/command/telemetry/views', label: 'Saved Views' },
]

/* Screens 13–17 share one Telemetry umbrella: one surface, five lenses.
   Lens switching is a pill row — no fragmenting of a single investigation;
   the AI correlates across lenses and Ask AI is present on all of them. */
export function TelemetryLayout() {
  const { env } = useEnv()
  const [searchParams, setSearchParams] = useSearchParams()
  /* Screen 73 — connection-lost error, recoverable via retry */
  const offline = searchParams.get('state') === 'offline'
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Command</div>
          <h1 className="page-title">Telemetry</h1>
          <p className="page-sub">
            One surface, AI-correlated — {env.name} · <span className="time-ref">live</span>
          </p>
        </div>
      </div>

      <nav className="subnav" role="tablist" aria-label="Telemetry lenses">
        {LENSES.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `subnav-item${isActive ? ' active' : ''}`}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>

      {offline ? (
        <div className="error-panel" role="alert">
          <WifiOff size={22} strokeWidth={2} className="error-icon" />
          <div className="error-title">Telemetry connection lost</div>
          <div className="error-sub">
            The live stream from {env.name} dropped 40 seconds ago. Charts and logs are frozen at
            their last received values — nothing is being missed upstream; buffers replay on
            reconnect.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => setSearchParams({})}>
              <RefreshCw size={14} strokeWidth={2.2} />
              Reconnect now
            </button>
            <NavLink to="/support/status-pages" className="btn btn-secondary">
              Check platform status
            </NavLink>
          </div>
        </div>
      ) : (
        <Outlet />
      )}
    </>
  )
}
