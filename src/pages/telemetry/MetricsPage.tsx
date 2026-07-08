import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, Play, Plus, Save, Sparkles } from 'lucide-react'
import {
  dashboards,
  exploreSample,
  METRIC_CATEGORIES,
  namedDashboards,
  PROMQL_SUGGESTIONS,
} from '../../mock/telemetry'
import type { MetricCategory } from '../../mock/telemetry'
import { Sparkline } from '../../components/Sparkline'
import { LineChart } from '../../components/LineChart'
import { useAskAI } from '../../components/AskAI'
import { useEnv } from '../../state/env'

/* Screen 14 + DEV-30 upgrade — Metrics as a dashboard system with an Explore
   mode. Dashboard selector, Create, New-with-AI and Save are solid, always-
   visible controls (never ghosted). Explore accepts a visual builder or raw
   PromQL, runs, and compares with the previous period. */
export function MetricsPage() {
  const { env } = useEnv()
  const { setOpen } = useAskAI()
  const [mode, setMode] = useState<'dashboards' | 'explore'>('dashboards')
  const [category, setCategory] = useState<MetricCategory>('Kubernetes')
  const [dash, setDash] = useState(namedDashboards[0])
  const [dashOpen, setDashOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const dashRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 550)
    return () => clearTimeout(t)
  }, [env.id, category, dash, mode])

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!dashRef.current?.contains(e.target as Node)) setDashOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  const charts = dashboards[category]

  return (
    <>
      {/* dashboard toolbar — solid, high-contrast controls (DEV-30 fix) */}
      <div className="dash-toolbar">
        <div className="dash-select" ref={dashRef}>
          <button className="btn btn-secondary" onClick={() => setDashOpen((o) => !o)} aria-expanded={dashOpen}>
            {dash.aiGenerated && <Sparkles size={13} strokeWidth={2.2} style={{ color: 'var(--brand)' }} />}
            {dash.name}
            <ChevronDown size={13} strokeWidth={2.2} />
          </button>
          {dashOpen && (
            <div className="mini-menu" role="listbox" aria-label="Dashboards">
              <div className="mini-menu-label">Dashboards</div>
              {namedDashboards.map((d) => (
                <button
                  key={d.id}
                  role="option"
                  aria-selected={d.id === dash.id}
                  className={`mini-menu-item${d.id === dash.id ? ' active' : ''}`}
                  onClick={() => {
                    setDash(d)
                    setDashOpen(false)
                    setMode('dashboards')
                  }}
                >
                  {d.aiGenerated && <Sparkles size={12} strokeWidth={2.2} style={{ color: 'var(--brand)' }} />}
                  <span>{d.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="btn btn-secondary">
          <Plus size={14} strokeWidth={2.2} />
          Create dashboard
        </button>
        <button className="btn btn-secondary" onClick={() => setOpen(true)}>
          <Sparkles size={14} strokeWidth={2.2} />
          New with AI
        </button>

        <div className="dash-toolbar-right">
          {/* mode toggle: Dashboards | Explore */}
          <div className="pipeline-tabs" style={{ marginBottom: 0 }}>
            <button
              className={`pipeline-tab${mode === 'dashboards' ? ' active' : ''}`}
              onClick={() => setMode('dashboards')}
            >
              Dashboards
            </button>
            <button
              className={`pipeline-tab${mode === 'explore' ? ' active' : ''}`}
              onClick={() => setMode('explore')}
            >
              Explore
            </button>
          </div>
          <button className="btn btn-primary">
            <Save size={14} strokeWidth={2.2} />
            Save dashboard
          </button>
        </div>
      </div>

      {mode === 'explore' ? (
        <ExploreSurface />
      ) : (
        <div className="metrics-layout">
          <aside className="metrics-cats" aria-label="Dashboard categories">
            {METRIC_CATEGORIES.map((c) => (
              <button
                key={c}
                className={`metrics-cat${c === category ? ' active' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
                <span className="mono cat-count">{dashboards[c].length}</span>
              </button>
            ))}
          </aside>

          <div className="metrics-main">
            <div className="metrics-actions">
              <button className="btn btn-secondary" onClick={() => setOpen(true)}>
                <Sparkles size={14} strokeWidth={2.2} />
                Refine with AI
              </button>
              <button className="btn btn-primary">
                <Bell size={14} strokeWidth={2.2} />
                Create alert
              </button>
            </div>

            {loading ? (
              <div className="charts-grid">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="panel chart-card" aria-busy="true">
                    <span className="skeleton skeleton-text" style={{ width: '50%' }} />
                    <span className="skeleton" style={{ width: '100%', height: 64, display: 'block', marginTop: 10 }} />
                  </div>
                ))}
              </div>
            ) : charts.length === 0 ? (
              <div className="placeholder-panel">
                No dashboards in {category} yet.
                <span className="mono">connect a cost source or create the first dashboard</span>
                <div style={{ marginTop: 14 }}>
                  <button className="btn btn-primary">Create {category} dashboard</button>
                </div>
              </div>
            ) : (
              <div className="charts-grid">
                {charts.map((chart) => (
                  <div key={chart.id} className="panel chart-card">
                    <div className="chart-head">
                      <span className="chart-title">{chart.title}</span>
                      <span className="mono chart-current">{chart.current}</span>
                    </div>
                    <Sparkline data={chart.series} width={320} height={64} stroke={chart.anomaly ? 'var(--warn)' : 'var(--muted)'} />
                    {chart.anomaly && (
                      <div className="anomaly-callout">
                        <span className="ai-tile" style={{ width: 22, height: 22, borderRadius: 6 }}>
                          <Sparkles size={12} strokeWidth={2.2} />
                        </span>
                        <span className="anomaly-text">
                          {chart.anomaly.text}{' '}
                          <span className="mono anomaly-conf">{chart.anomaly.confidence}% confidence</span>
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

/* Explore — visual builder OR raw PromQL, Run, Compare-with-previous. */
function ExploreSurface() {
  const [tab, setTab] = useState<'visual' | 'promql'>('visual')
  const [promql, setPromql] = useState(exploreSample.query)
  const [metric, setMetric] = useState('http_requests_total')
  const [agg, setAgg] = useState('rate 5m')
  const [groupBy, setGroupBy] = useState('service')
  const [compare, setCompare] = useState(false)
  const [ran, setRan] = useState(true)

  const run = () => setRan(true)

  return (
    <section className="panel">
      <div className="pipeline-tabs" role="tablist" aria-label="Query mode" style={{ marginBottom: 12 }}>
        <button role="tab" aria-selected={tab === 'visual'} className={`pipeline-tab${tab === 'visual' ? ' active' : ''}`} onClick={() => setTab('visual')}>
          Visual builder
        </button>
        <button role="tab" aria-selected={tab === 'promql'} className={`pipeline-tab${tab === 'promql' ? ' active' : ''}`} onClick={() => setTab('promql')}>
          PromQL
        </button>
      </div>

      {tab === 'visual' ? (
        <div className="explore-builder">
          <label className="explore-field">
            <span className="field-label">Metric</span>
            <select className="text-input select" value={metric} onChange={(e) => setMetric(e.target.value)}>
              {PROMQL_SUGGESTIONS.map((s) => (
                <option key={s} value={s.split('(')[0]}>{s.split('(')[0]}</option>
              ))}
              <option value="http_requests_total">http_requests_total</option>
            </select>
          </label>
          <label className="explore-field">
            <span className="field-label">Aggregation</span>
            <select className="text-input select" value={agg} onChange={(e) => setAgg(e.target.value)}>
              <option>rate 5m</option>
              <option>increase 1h</option>
              <option>avg</option>
              <option>p99</option>
            </select>
          </label>
          <label className="explore-field">
            <span className="field-label">Group by</span>
            <select className="text-input select" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
              <option>service</option>
              <option>pod</option>
              <option>status</option>
              <option>region</option>
            </select>
          </label>
          <button className="btn btn-primary explore-run" onClick={run}>
            <Play size={14} strokeWidth={2.2} />
            Run
          </button>
        </div>
      ) : (
        <div className="explore-promql">
          <textarea
            className="text-input mono"
            rows={2}
            value={promql}
            onChange={(e) => setPromql(e.target.value)}
            aria-label="PromQL query"
          />
          <button className="btn btn-primary explore-run" onClick={run}>
            <Play size={14} strokeWidth={2.2} />
            Run
          </button>
        </div>
      )}

      <div className="explore-controls">
        <label className="explore-compare">
          <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
          Compare with previous period
        </label>
      </div>

      {ran && (
        <>
          <LineChart
            data={exploreSample.current}
            compare={compare ? exploreSample.previous : undefined}
            unit={exploreSample.unit}
            stroke="var(--brand)"
          />
          <div className="section-label">Breakdown by {groupBy}</div>
          <div className="row-list">
            {exploreSample.breakdown.map((b) => (
              <div key={b.label} className="row">
                <span className="mono row-title">{b.label}</span>
                <span className="corr-bar" style={{ maxWidth: 200 }}>
                  <span className="corr-fill" style={{ width: `${b.pct}%` }} />
                </span>
                <span className="mono pod-stat">{b.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
