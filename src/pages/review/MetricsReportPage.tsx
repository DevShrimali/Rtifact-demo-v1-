import { useEffect, useRef, useState } from 'react'
import {
  CalendarClock, ChevronDown, Clock, Download, FileText,
  Library, Sparkles, ArrowDownToLine, FileArchive,
} from 'lucide-react'
import { useEnv } from '../../state/env'
import {
  aggregateCostTotal,
  aggregateReliability,
  aggregateRollup,
  aggregateSecurity,
  formatUsd,
} from '../../mock/review'
import { Sparkline } from '../../components/Sparkline'
import { useEnvLoad, ListSkeleton } from '../../components/PageLoad'

/* Review › Reports (DEV-29). Two views: Report (live-data) and History
   (download history with export info). */

const REPORT_TEMPLATES = [
  { id: 'weekly-exec',  name: 'Weekly executive package',  cadence: 'Every Mon 08:00', pillars: 'Security · Cost · Reliability' },
  { id: 'finops',       name: 'FinOps savings deep-dive',  cadence: 'Monthly',          pillars: 'Cost' },
  { id: 'soc2',         name: 'SOC2 audit snapshot',       cadence: 'On demand',        pillars: 'Security · Access' },
  { id: 'reliability',  name: 'Reliability & SLO review',  cadence: 'Bi-weekly',        pillars: 'Reliability' },
]

const HISTORY: {
  id: string; name: string; when: string; by: string
  format: 'PDF' | 'ZIP'; sizeMb: number; status: 'ready' | 'generating'
}[] = [
  { id: 'r-4471', name: 'Weekly executive package', when: 'Mon Jul 7, 08:00', by: 'Scheduled',    format: 'PDF', sizeMb: 1.2, status: 'ready'      },
  { id: 'r-4460', name: 'FinOps savings deep-dive', when: 'Jul 1, 09:12',     by: 'Raj Patel',    format: 'PDF', sizeMb: 0.8, status: 'ready'      },
  { id: 'r-4455', name: 'SOC2 audit snapshot',      when: 'Jun 28, 14:03',    by: 'Priya Sharma', format: 'ZIP', sizeMb: 4.6, status: 'ready'      },
  { id: 'r-4441', name: 'Weekly executive package', when: 'Mon Jun 30, 08:00',by: 'Scheduled',    format: 'PDF', sizeMb: 1.1, status: 'ready'      },
  { id: 'r-4438', name: 'Reliability & SLO review', when: 'Jun 25, 11:45',    by: 'J. Okafor',    format: 'PDF', sizeMb: 0.6, status: 'ready'      },
  { id: 'r-4490', name: 'Weekly executive package', when: 'Jul 8, 08:00',     by: 'Scheduled',    format: 'PDF', sizeMb: 0,   status: 'generating' },
]

type View = 'report' | 'history'

const VIEWS: { key: View; label: string }[] = [
  { key: 'report',  label: 'Report' },
  { key: 'history', label: 'History' },
]

/* ── History view ─────────────────────────────────────────────────────────── */
function HistoryView() {
  const [downloading, setDownloading] = useState<string | null>(null)

  const handleDownload = (id: string) => {
    setDownloading(id)
    setTimeout(() => setDownloading(null), 1800)
  }

  return (
    <>
      <div className="section-label" style={{ marginTop: 0, marginBottom: 10 }}>
        Download history — {HISTORY.filter((h) => h.status === 'ready').length} reports ready
      </div>

      <div className="row-list">
        {HISTORY.map((h) => (
          <div key={h.id} className="row" style={{ alignItems: 'center', gap: 12 }}>
            {/* format icon */}
            <span className="history-format-icon" title={h.format === 'ZIP' ? 'Audit package (.zip)' : 'PDF report'}>
              {h.format === 'ZIP'
                ? <FileArchive size={15} strokeWidth={2} style={{ color: 'var(--warn)' }} />
                : <FileText size={15} strokeWidth={2} style={{ color: 'var(--brand)' }} />}
            </span>

            {/* name + meta */}
            <span className="row-title" style={{ flex: 1 }}>
              {h.name}
              <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', fontWeight: 400, marginTop: 1 }}>
                {h.when} · triggered by {h.by}
              </span>
            </span>

            {/* format badge */}
            <span className={`badge ${h.format === 'ZIP' ? 'sev-warning' : 'neutral'} mono`}
              style={{ fontSize: 10, letterSpacing: '0.04em' }}>
              {h.format}
            </span>

            {/* size */}
            {h.status === 'ready' && (
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--faint)', minWidth: 44, textAlign: 'right' }}>
                {h.sizeMb.toFixed(1)} MB
              </span>
            )}

            {/* action */}
            {h.status === 'generating' ? (
              <span className="badge neutral" style={{ minWidth: 88, justifyContent: 'center' }}>
                Generating…
              </span>
            ) : (
              <button
                className={`btn btn-secondary${downloading === h.id ? ' disabled' : ''}`}
                style={{ minWidth: 100, gap: 6 }}
                disabled={downloading === h.id}
                onClick={() => handleDownload(h.id)}
              >
                <ArrowDownToLine size={13} strokeWidth={2.2} />
                {downloading === h.id ? 'Downloading…' : 'Download'}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="panel-foot-note" style={{ marginTop: 16 }}>
        Reports are retained for 90 days. Audit packages (.zip) include raw data exports and are
        suitable for compliance handoff.
      </div>
    </>
  )
}

/* ── Report view (live data) ──────────────────────────────────────────────── */
function ReportView() {
  const { selectedIds, selectedEnvs, aggregating } = useEnv()
  const loading = useEnvLoad()
  const [template, setTemplate] = useState(REPORT_TEMPLATES[0])
  const [libOpen, setLibOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const libRef = useRef<HTMLDivElement>(null)
  const expRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!libRef.current?.contains(e.target as Node)) setLibOpen(false)
      if (!expRef.current?.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  const rollup = aggregateRollup(selectedIds)
  const sec = aggregateSecurity(selectedIds)
  const costTotal = aggregateCostTotal(selectedIds)
  const rel = aggregateReliability(selectedIds)
  const scope = aggregating ? `${selectedEnvs.length} environments` : selectedEnvs[0].name

  const kpis = [
    { label: 'Revenue protected', value: formatUsd(rollup.costUsd), series: [1.2, 1.8, 2.4, 2.1, 3.0, 3.6, 4.9], accent: 'success' as const },
    { label: 'Eng-hours saved',   value: `${rollup.engHours}h`,     series: [2, 3, 4, 5, 6, 6.5, 7.1],            accent: 'success' as const },
    { label: 'Critical findings', value: `${sec.criticalCount}`,    series: [14, 13, 12, 11, 10, 9, sec.criticalCount], accent: sec.criticalCount > 0 ? ('error' as const) : ('success' as const) },
    { label: 'Savings ready',     value: `${formatUsd(costTotal)}/mo`, series: [2.1, 2.4, 3.0, 3.6, 4.2, 4.6, 4.8], accent: 'warn' as const },
    { label: 'Change-failure',    value: `${rel.deploys.failPct}%`,  series: [12, 10, 9, 8, 7.5, 7.2, rel.deploys.failPct], accent: 'warn' as const },
  ]

  return (
    <>
      {/* toolbar */}
      <div className="metrics-actions" style={{ marginBottom: 16 }}>
        {/* library dropdown */}
        <div className="wl-inline" ref={libRef} style={{ position: 'relative' }}>
          <button className="btn btn-secondary" onClick={() => setLibOpen((o) => !o)} aria-expanded={libOpen}>
            <Library size={14} strokeWidth={2.2} />
            {template.name}
            <ChevronDown size={13} strokeWidth={2.2} />
          </button>
          {libOpen && (
            <div className="mini-menu" role="listbox" aria-label="Report library">
              <div className="mini-menu-label">Report library</div>
              {REPORT_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  role="option"
                  aria-selected={t.id === template.id}
                  className={`mini-menu-item${t.id === template.id ? ' active' : ''}`}
                  onClick={() => { setTemplate(t); setLibOpen(false) }}
                >
                  <span>{t.name}</span>
                  <span className="mini-menu-sub mono">{t.cadence}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="btn btn-secondary">
          <CalendarClock size={14} strokeWidth={2.2} />
          Schedule report
        </button>

        {/* export dropdown */}
        <div ref={expRef} style={{ position: 'relative' }}>
          <button className="btn btn-primary" onClick={() => setExportOpen((o) => !o)} aria-expanded={exportOpen}>
            <Download size={14} strokeWidth={2.2} />
            Export
            <ChevronDown size={13} strokeWidth={2.2} />
          </button>
          {exportOpen && (
            <div className="mini-menu mini-menu-right" role="menu" aria-label="Export options">
              <button className="mini-menu-item" role="menuitem" onClick={() => setExportOpen(false)}>
                <FileText size={13} strokeWidth={2.2} />
                <span>PDF export</span>
                <span className="mini-menu-sub mono">~1.2 MB</span>
              </button>
              <button className="mini-menu-item" role="menuitem" onClick={() => setExportOpen(false)}>
                <FileArchive size={13} strokeWidth={2.2} />
                <span>Audit package (.zip)</span>
                <span className="mini-menu-sub mono">~4.6 MB</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : (
        <>
          <div className="section-label" style={{ marginTop: 0 }}>
            <Sparkles size={12} strokeWidth={2.2} style={{ verticalAlign: -1, marginRight: 5, color: 'var(--brand)' }} />
            {template.name} — live data · {scope}
          </div>

          <div className="report-kpis">
            {kpis.map((k) => (
              <div key={k.label} className={`report-kpi accent-${k.accent}`}>
                <div className="stat-label">{k.label}</div>
                <div className="report-kpi-value mono">{k.value}</div>
                <Sparkline
                  data={k.series}
                  width={150}
                  height={30}
                  stroke={k.accent === 'error' ? 'var(--error)' : k.accent === 'warn' ? 'var(--warn)' : 'var(--success)'}
                />
              </div>
            ))}
          </div>

          <div className="section-label">Report sections</div>
          <div className="charts-grid">
            {[
              { t: 'Security posture',   v: `${sec.findingTypes} finding types`, s: 'across ' + sec.resourcesAtRisk + ' resources' },
              { t: 'Cost optimization',  v: `${formatUsd(costTotal)}/mo`,         s: 'ready to capture' },
              { t: 'Reliability',        v: `${rel.deploys.failPct}% CFR`,        s: `${rel.deploys.rolledBack}/${rel.deploys.total} deploys rolled back` },
              { t: 'AI contribution',    v: `${rollup.incidents} incidents`,      s: `${rollup.workflows} workflow outcomes` },
            ].map((c) => (
              <div key={c.t} className="panel chart-card">
                <div className="chart-head">
                  <span className="chart-title">{c.t}</span>
                  <span className="mono chart-current">{c.v}</span>
                </div>
                <div className="stat-meta">{c.s}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}

/* ── Page shell ───────────────────────────────────────────────────────────── */
export function MetricsReportPage() {
  const [view, setView] = useState<View>('report')

  return (
    <>
      {/* subnav tabs — same style as Workflows */}
      <nav className="subnav" role="tablist" aria-label="Reports sections">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            role="tab"
            aria-selected={view === v.key}
            className={`subnav-item${view === v.key ? ' active' : ''}`}
            onClick={() => setView(v.key)}
          >
            {v.key === 'history' && <Clock size={12} strokeWidth={2.2} style={{ marginRight: 4, verticalAlign: -1 }} />}
            {v.label}
          </button>
        ))}
      </nav>

      {view === 'report'  && <ReportView />}
      {view === 'history' && <HistoryView />}
    </>
  )
}
