import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BellOff, RefreshCw, TrendingDown, TrendingUp, WifiOff, Sparkles, LayoutGrid, List } from 'lucide-react'
import { useEnv } from '../state/env'
import { getBoard } from '../mock/alerts'
import { primaryCluster } from '../mock/infra'
import type { Alert, AlertColumn } from '../mock/alerts'
import { SeverityBadge } from '../components/SeverityBadge'
import { TimeAgo } from '../components/TimeAgo'
import { OptimizationGoals } from '../components/OptimizationGoals'

const COLUMNS: { key: AlertColumn; title: string }[] = [
  { key: 'new', title: 'New' },
  { key: 'in_progress', title: 'In Progress' },
  { key: 'resolved', title: 'Resolved' },
]

type ViewState = 'loading' | 'default' | 'empty' | 'error'

/* Screen 01 — Alerts board, Command's entry surface (no separate Overview).
   `?state=loading|empty|error` pins a designed state for review; a cold
   entry plays the real loading → data sequence. */
export function CommandPage() {
  const { env } = useEnv()
  const [searchParams] = useSearchParams()
  const forced = searchParams.get('state')
  const [loaded, setLoaded] = useState(false)
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  useEffect(() => {
    setLoaded(false)
    const t = setTimeout(() => setLoaded(true), 550)
    return () => clearTimeout(t)
  }, [env.id])

  const board = getBoard(env.id)
  const state: ViewState =
    forced === 'loading' || forced === 'empty' || forced === 'error'
      ? forced
      : !loaded
        ? 'loading'
        : board.alerts.length === 0
          ? 'empty'
          : 'default'

  const rawAlerts = state === 'default' ? board.alerts : []
  const active = rawAlerts.filter((a) => a.column !== 'resolved')
  const criticalCount = active.filter((a) => a.severity === 'critical').length

  const filteredAlerts = priorityFilter === 'all'
    ? rawAlerts
    : rawAlerts.filter((a) => a.severity === priorityFilter)

  const SEVERITY_RANK = {
    critical: 1,
    high: 2,
    medium: 3,
    low: 4,
  }

  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    return SEVERITY_RANK[a.severity as keyof typeof SEVERITY_RANK] - SEVERITY_RANK[b.severity as keyof typeof SEVERITY_RANK]
  })

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Command</div>
          <h1 className="page-title">Alerts</h1>
          <p className="page-sub">
            {state === 'default'
              ? `${active.length} active in ${env.name} — ${criticalCount} critical`
              : state === 'loading'
                ? `Loading alerts for ${env.name}…`
                : state === 'error'
                  ? `Alert stream unavailable for ${env.name}`
                  : `No active alerts in ${env.name}`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--fg)',
              fontSize: '12.5px',
              cursor: 'pointer',
              outline: 'none',
              fontWeight: 500,
            }}
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
            <option value="low">Low Only</option>
          </select>

          {/* View mode toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', background: 'var(--surface)' }}>
            <button
              onClick={() => setViewMode('board')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 10px',
                border: 'none',
                background: viewMode === 'board' ? 'var(--chip)' : 'transparent',
                color: viewMode === 'board' ? 'var(--fg)' : 'var(--muted)',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
              title="Board View"
            >
              <LayoutGrid size={14} strokeWidth={2.2} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 10px',
                border: 'none',
                background: viewMode === 'list' ? 'var(--chip)' : 'transparent',
                color: viewMode === 'list' ? 'var(--fg)' : 'var(--muted)',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
              title="List View"
            >
              <List size={14} strokeWidth={2.2} />
            </button>
          </div>

          <button className="btn btn-primary" disabled={state !== 'default'}>
            <BellOff size={14} strokeWidth={2.2} />
            Silence noise
          </button>
        </div>
      </div>

      {state === 'error' ? (
        <ErrorPanel envName={env.name} />
      ) : (
        <>
          <MetricsBanner board={board} loading={state === 'loading'} />
          <HealthTiles board={board} loading={state === 'loading'} />

          <div className="section-label">Optimization goals</div>
          {state === 'loading' ? <GoalsSkeleton /> : <OptimizationGoals goals={board.goals} />}

          <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{viewMode === 'board' ? 'Board' : 'List'}</span>
            {viewMode === 'list' && (
              <span className="mono" style={{ fontSize: 10, color: 'var(--faint)' }}>
                Priority View (Critical › High › Medium › Low)
              </span>
            )}
          </div>

          {state === 'loading' ? (
            viewMode === 'board' ? <BoardSkeleton /> : <ListSkeleton />
          ) : state === 'empty' || filteredAlerts.length === 0 ? (
            <EmptyBoard envName={env.name} />
          ) : viewMode === 'board' ? (
            <div className="kanban">
              {COLUMNS.map((col) => {
                const items = filteredAlerts.filter((a) => a.column === col.key)
                return (
                  <section key={col.key} className="kanban-col" aria-label={col.title}>
                    <header className="kanban-head">
                      <span className="kanban-title">{col.title}</span>
                      <span className="kanban-count mono">{items.length}</span>
                    </header>
                    {items.map((a) => (
                      <AlertCard key={a.id} alert={a} />
                    ))}
                    {items.length === 0 && <div className="kanban-empty">None</div>}
                  </section>
                )
              })}
            </div>
          ) : (
            <div className="row-list">
              {sortedAlerts.map((a) => (
                <Link key={a.id} to={`/command/alerts/${a.id}`} className="row incident-row">
                  <span className="row-id">{a.id}</span>
                  <SeverityBadge severity={a.severity} />
                  <span className="row-title" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {a.title}
                    {a.aiOutcome && (
                      <span className="ai-tag">
                        <Sparkles size={10} strokeWidth={2.2} />
                        {a.aiOutcome}
                      </span>
                    )}
                  </span>
                  <span className="mono service">{a.service}</span>
                  <TimeAgo timestamp={a.startedAt} />
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}

function AlertCard({ alert }: { alert: Alert }) {
  return (
    <Link to={`/command/alerts/${alert.id}`} className="alert-card">
      <div className="alert-card-top">
        <span className="row-id">{alert.id}</span>
        <SeverityBadge severity={alert.severity} />
        <TimeAgo timestamp={alert.startedAt} />
      </div>
      <div className="alert-card-title">{alert.title}</div>
      <div className="alert-card-meta">
        <span className="mono service">{alert.service}</span>
        {alert.activity && <span className="alert-activity">{alert.activity}</span>}
        {alert.aiOutcome && <span className="alert-ai-outcome">{alert.aiOutcome}</span>}
      </div>
    </Link>
  )
}

function MetricsBanner({ board, loading }: { board: ReturnType<typeof getBoard>; loading: boolean }) {
  const m = board.metrics
  const stats = [
    { label: 'MTTD', value: m.mttd, delta: m.mttdDelta },
    { label: 'MTTR', value: m.mttr, delta: m.mttrDelta },
    { label: 'Noise ratio', value: m.noiseRatio, delta: m.noiseDelta },
  ]
  return (
    <div className="metrics-banner">
      {stats.map((s) => (
        <div key={s.label} className="metric">
          <span className="stat-label">{s.label}</span>
          {loading ? (
            <span className="skeleton skeleton-text" />
          ) : (
            <span className="metric-value mono">
              {s.value}
              <span className={`delta ${s.delta.good ? 'good' : 'bad'}`}>
                {s.delta.good ? (
                  <TrendingDown size={12} strokeWidth={2.2} />
                ) : (
                  <TrendingUp size={12} strokeWidth={2.2} />
                )}
                {s.delta.value}
              </span>
            </span>
          )}
        </div>
      ))}
      <div className="metric ai-metric">
        <span className="stat-label">Rtifact AI contribution</span>
        {loading ? (
          <span className="skeleton skeleton-text" />
        ) : (
          <span className="metric-value" style={{ fontSize: 13, fontWeight: 600 }}>
            {m.aiContribution}
          </span>
        )}
      </div>
    </div>
  )
}

function HealthTiles({ board, loading }: { board: ReturnType<typeof getBoard>; loading: boolean }) {
  const { env } = useEnv()
  const cluster = primaryCluster(env.id)

  return (
    <div className="tiles-row">
      {board.tiles.map((t) => {
        const inner = loading ? (
          <span className="skeleton skeleton-text" style={{ width: '80%' }} />
        ) : (
          <>
            <span className="tile-top">
              <span className={`dot ${t.health}`} />
              <span className="tile-name">{t.name}</span>
            </span>
            <span className="tile-metric mono">{t.metric}</span>
            <TimeAgo timestamp={t.checkedAt} />
          </>
        )
        /* Compute tile drills into the cluster (env › cluster › pod, DEV-8) */
        if (t.id === 'compute' && cluster && !loading) {
          return (
            <Link key={t.id} to={`/command/clusters/${cluster.id}`} className="health-tile">
              {inner}
            </Link>
          )
        }
        return (
          <button key={t.id} className="health-tile" disabled={loading}>
            {inner}
          </button>
        )
      })}
    </div>
  )
}

function EmptyBoard({ envName }: { envName: string }) {
  return (
    <div className="placeholder-panel">
      <div className="empty-dot-wrap">
        <span className="dot healthy" />
      </div>
      All clear — no active alerts in {envName}.
      <span className="mono">Rtifact AI is watching 5 infra domains · last sweep 1m ago</span>
      <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'center' }}>
        <Link to="/automate/silences" className="btn btn-secondary">
          Review active silences
        </Link>
        <Link to="/command/telemetry/intelligence" className="btn btn-secondary">
          Watch live telemetry
        </Link>
      </div>
    </div>
  )
}

function ErrorPanel({ envName }: { envName: string }) {
  return (
    <div className="error-panel" role="alert">
      <WifiOff size={22} strokeWidth={2} className="error-icon" />
      <div className="error-title">Alert stream unavailable</div>
      <div className="error-sub">
        Lost connection to the {envName} alert stream. Data shown elsewhere may be stale.
      </div>
      <button className="btn btn-secondary" onClick={() => window.location.reload()}>
        <RefreshCw size={14} strokeWidth={2.2} />
        Retry connection
      </button>
    </div>
  )
}

function GoalsSkeleton() {
  return (
    <div className="goals">
      {[0, 1, 2].map((i) => (
        <div key={i} className="goal">
          <span className="skeleton skeleton-text" style={{ width: '60%' }} />
          <span className="skeleton skeleton-text" style={{ width: '40%' }} />
          <div className="goal-bar">
            <div className="skeleton" style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function BoardSkeleton() {
  return (
    <div className="kanban" aria-busy="true" aria-label="Loading alerts">
      {COLUMNS.map((c) => (
        <section key={c.key} className="kanban-col">
          <header className="kanban-head">
            <span className="kanban-title">{c.title}</span>
          </header>
          {[0, 1].map((i) => (
            <div key={i} className="alert-card skeleton-card">
              <span className="skeleton skeleton-text" style={{ width: '50%' }} />
              <span className="skeleton skeleton-text" style={{ width: '90%' }} />
              <span className="skeleton skeleton-text" style={{ width: '35%' }} />
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="row-list">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="row" style={{ pointerEvents: 'none', height: 44 }}>
          <span className="skeleton skeleton-text" style={{ width: '60%' }} />
        </div>
      ))}
    </div>
  )
}
