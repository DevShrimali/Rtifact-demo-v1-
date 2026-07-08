import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, CircleDot, Megaphone } from 'lucide-react'
import { cases } from '../../mock/support'
import { SeverityBadge } from '../../components/SeverityBadge'
import { TimeAgo } from '../../components/TimeAgo'

/* Screen 33 — case detail: context, timeline, resolution actions.
   "Nothing fancy — clean case view." */
export function CaseDetailPage() {
  const { caseId } = useParams()
  const c = cases.find((x) => x.id === caseId)
  const [resolved, setResolved] = useState(false)
  const [escalated, setEscalated] = useState(false)

  if (!c) {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Case {caseId} not found</div>
      </div>
    )
  }

  return (
    <>
      <div className={`sev-banner sev-${c.severity}${resolved ? ' resolved' : ''}`}>
        <SeverityBadge severity={c.severity} />
        <span className="row-id">{c.id}</span>
        <span className="sev-banner-title">{c.title}</span>
        <span className="badge neutral">{resolved ? 'Resolved' : c.status}</span>
        <TimeAgo timestamp={c.openedAt} />
      </div>

      <div className="incident-actions">
        <button className="btn btn-primary" disabled={resolved} onClick={() => setResolved(true)}>
          <CheckCircle2 size={14} strokeWidth={2.2} />
          {resolved ? 'Resolved' : 'Resolve case'}
        </button>
        <button className="btn btn-secondary" disabled={escalated || resolved} onClick={() => setEscalated(true)}>
          <Megaphone size={14} strokeWidth={2.2} />
          {escalated ? 'Escalated to engineering' : 'Escalate to engineering'}
        </button>
        <span className="incident-owner">
          Assignee: <span className="mono">{c.assignee}</span>
        </span>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel">
            <div className="panel-title">Timeline</div>
            <ul className="pipeline">
              {c.timeline.map((t) => (
                <li key={t.label} className="pipe-step">
                  <CircleDot size={15} strokeWidth={2} className="pipe-icon pending" />
                  <span>
                    {t.label}
                    <span style={{ color: 'var(--faint)' }}> — {t.actor}</span>
                  </span>
                  <span style={{ marginLeft: 'auto' }}>
                    <TimeAgo timestamp={t.at} />
                  </span>
                </li>
              ))}
              {resolved && (
                <li className="pipe-step">
                  <CheckCircle2 size={15} strokeWidth={2} className="pipe-icon done" />
                  <span>Case resolved</span>
                  <span style={{ marginLeft: 'auto' }} className="time-ref">
                    just now
                  </span>
                </li>
              )}
            </ul>
          </section>
        </div>
        <div className="detail-side">
          <section className="panel">
            <div className="panel-title">Context</div>
            {c.context.map((kv) => (
              <div key={kv.label} className="kv-row">
                <span className="kv-label">{kv.label}</span>
                <span className="kv-value" style={{ fontSize: 11.5 }}>
                  {kv.value}
                </span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  )
}
