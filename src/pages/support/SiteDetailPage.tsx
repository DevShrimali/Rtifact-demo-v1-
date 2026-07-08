import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Globe, Lock, Megaphone, Palette } from 'lucide-react'
import {
  maintenanceWindows,
  siteIncidents as seedIncidents,
  sites,
  subscribersSample,
} from '../../mock/support'
import type { SiteIncident } from '../../mock/support'
import { TimeAgo } from '../../components/TimeAgo'
import { minutesAgo } from '../../lib/time'

const TABS = ['Overview', 'Incidents', 'Subscribers', 'Maintenance', 'Domains & Branding'] as const
type Tab = (typeof TABS)[number]

const LIVE_CLS: Record<string, { label: string; cls: string }> = {
  operational: { label: 'Operational', cls: 'sev-healthy' },
  degraded: { label: 'Degraded', cls: 'sev-warning' },
  outage: { label: 'Outage', cls: 'sev-critical' },
}

/* Screens 35–39 — site detail with Overview / Incidents / Subscribers /
   Maintenance / Domains tabs (?tab= keeps the breadcrumb at 3 tiers). */
export function SiteDetailPage() {
  const { siteId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const site = sites.find((s) => s.id === siteId)
  const tabParam = searchParams.get('tab')
  const tab: Tab = TABS.find((t) => t.toLowerCase().startsWith(tabParam ?? '')) ?? 'Overview'

  const [incidents, setIncidents] = useState<SiteIncident[]>(seedIncidents[siteId ?? ''] ?? [])
  const [draftTitle, setDraftTitle] = useState('')
  const [draftMsg, setDraftMsg] = useState('')
  const [posting, setPosting] = useState(false)

  if (!site) {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Site {siteId} not found</div>
      </div>
    )
  }

  const live = LIVE_CLS[site.live]
  const subs = subscribersSample[site.id] ?? []
  const windows = maintenanceWindows[site.id] ?? []
  const openIncidents = incidents.filter((i) => !i.resolved)

  const postIncident = () => {
    if (!draftTitle.trim()) return
    setIncidents((prev) => [
      {
        id: `PUB-${50 + prev.length}`,
        title: draftTitle.trim(),
        publicUpdate: draftMsg.trim() || 'Investigating — updates to follow.',
        linkedIncident: null,
        postedAt: minutesAgo(0),
        resolved: false,
      },
      ...prev,
    ])
    setDraftTitle('')
    setDraftMsg('')
    setPosting(false)
  }

  return (
    <>
      <div className="page-head" style={{ marginBottom: 14 }}>
        <div>
          <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {site.visibility === 'public' ? <Globe size={12} strokeWidth={2.2} /> : <Lock size={12} strokeWidth={2.2} />}
            {site.visibility} status page
          </div>
          <h1 className="page-title" style={{ fontSize: 21 }}>
            {site.name}
          </h1>
          <p className="page-sub mono" style={{ fontSize: 11.5 }}>
            {site.url}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setPosting(true)}>
          <Megaphone size={14} strokeWidth={2.2} />
          Post incident update
        </button>
      </div>

      <div className="pipeline-tabs" role="tablist" aria-label="Site sections" style={{ marginBottom: 14 }}>
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`pipeline-tab${tab === t ? ' active' : ''}`}
            onClick={() => setSearchParams(t === 'Overview' ? {} : { tab: t.split(' ')[0].toLowerCase() })}
          >
            {t}
          </button>
        ))}
      </div>

      {/* inline post form — routed page + inline reveal, never a modal */}
      {posting && (
        <section className="panel form-panel" style={{ maxWidth: 'none' }}>
          <div className="panel-title">New public incident update</div>
          <div className="field">
            <span className="field-label">Title</span>
            <input
              className="text-input"
              value={draftTitle}
              placeholder="e.g. Elevated API latency"
              onChange={(e) => setDraftTitle(e.target.value)}
            />
          </div>
          <div className="field">
            <span className="field-label">Public message</span>
            <textarea
              className="text-input"
              rows={2}
              value={draftMsg}
              placeholder="Customer-safe wording — Ask AI can draft this from the linked incident"
              onChange={(e) => setDraftMsg(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" disabled={!draftTitle.trim()} onClick={postIncident}>
              Publish update
            </button>
            <button className="btn btn-secondary" onClick={() => setPosting(false)}>
              Cancel
            </button>
          </div>
        </section>
      )}

      {tab === 'Overview' && (
        <>
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            <div className={`stat-card accent-${site.live === 'operational' ? 'success' : site.live === 'degraded' ? 'warn' : 'error'}`}>
              <div className="stat-label">Live status</div>
              <div className="stat-value" style={{ fontSize: 18 }}>
                {live.label}
              </div>
              <div className="stat-meta">
                <span className={`dot ${site.live === 'operational' ? 'healthy' : site.live === 'degraded' ? 'degraded' : 'critical'}`} />{' '}
                as shown to visitors
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Subscribers</div>
              <div className="stat-value mono">{site.subscribers.toLocaleString()}</div>
              <div className="stat-meta">email notifications on updates</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Open incidents</div>
              <div className="stat-value mono">{openIncidents.length}</div>
              <div className="stat-meta">{incidents.length} total posted</div>
            </div>
          </div>

          <div className="section-label">Recent incidents</div>
          {incidents.length === 0 ? (
            <div className="placeholder-panel">Nothing posted yet — visitors see all-clear.</div>
          ) : (
            <div className="row-list">
              {incidents.slice(0, 3).map((i) => (
                <div key={i.id} className="row">
                  <span className="row-id">{i.id}</span>
                  <span className={`badge ${i.resolved ? 'sev-healthy' : 'sev-warning'}`}>
                    {i.resolved ? 'Resolved' : 'Active'}
                  </span>
                  <span className="row-title">{i.title}</span>
                  <TimeAgo timestamp={i.postedAt} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'Incidents' && (
        <>
          {incidents.length === 0 ? (
            <div className="placeholder-panel">
              No public incidents on this page.
              <span className="mono">post one to keep customers ahead of support tickets</span>
            </div>
          ) : (
            <div className="row-list">
              {incidents.map((i) => (
                <div key={i.id} className="row" style={{ alignItems: 'flex-start' }}>
                  <span className="row-id">{i.id}</span>
                  <span className={`badge ${i.resolved ? 'sev-healthy' : 'sev-warning'}`}>
                    {i.resolved ? 'Resolved' : 'Active'}
                  </span>
                  <span className="row-title">
                    {i.title}
                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', fontWeight: 400 }}>
                      {i.publicUpdate}
                    </span>
                    {i.linkedIncident && (
                      <Link to={`/command/incidents/${i.linkedIncident}`} className="mono" style={{ fontSize: 10.5, color: 'var(--faint)' }}>
                        linked: {i.linkedIncident}
                      </Link>
                    )}
                  </span>
                  <TimeAgo timestamp={i.postedAt} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'Subscribers' && (
        <>
          <div className="stats-bar" style={{ marginBottom: 14 }}>
            <div className="stats-bar-item">
              <span className="stat-label">Total subscribers</span>
              <span className="mono stats-bar-value">{site.subscribers.toLocaleString()}</span>
            </div>
            <div className="stats-bar-item">
              <span className="stat-label">Notification channel</span>
              <span className="stats-bar-value" style={{ fontSize: 13 }}>
                Email on publish + resolve
              </span>
            </div>
          </div>
          {subs.length === 0 ? (
            <div className="placeholder-panel">No subscribers yet.</div>
          ) : (
            <div className="row-list">
              {subs.map((s) => (
                <div key={s.email} className="row">
                  <span className="mono row-title" style={{ fontSize: 12 }}>
                    {s.email}
                  </span>
                  <TimeAgo timestamp={s.addedAt} />
                </div>
              ))}
              <div className="row" style={{ color: 'var(--faint)', fontSize: 11.5 }}>
                + {Math.max(0, site.subscribers - subs.length).toLocaleString()} more via email list
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'Maintenance' && (
        <>
          {windows.length === 0 ? (
            <div className="placeholder-panel">
              No scheduled maintenance windows.
              <span className="mono">planned work posts here and notifies subscribers ahead of time</span>
            </div>
          ) : (
            <div className="row-list">
              {windows.map((w) => (
                <div key={w.id} className="row">
                  <span className="row-id">{w.id}</span>
                  <span className="row-title">
                    {w.title}
                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', fontWeight: 400 }}>
                      {w.scope}
                    </span>
                  </span>
                  <span className="badge neutral">in {w.startsInHours}h</span>
                  <span className="mono pod-stat">{w.durationMin}m window</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'Domains & Branding' && (
        <div className="detail-grid">
          <div className="detail-main">
            <section className="panel">
              <div className="panel-title">Custom domain</div>
              <div className="kv-row">
                <span className="kv-label">Domain</span>
                <span className="kv-value mono">{site.customDomain ?? 'not configured'}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">DNS</span>
                <span className={`badge ${site.customDomain ? 'sev-healthy' : 'neutral'}`}>
                  {site.customDomain ? 'verified' : 'pending setup'}
                </span>
              </div>
              <div className="kv-row">
                <span className="kv-label">TLS</span>
                <span className={`badge ${site.customDomain ? 'sev-healthy' : 'neutral'}`}>
                  {site.customDomain ? 'auto-managed' : '—'}
                </span>
              </div>
            </section>
          </div>
          <div className="detail-side">
            <section className="panel">
              <div className="panel-title">Appearance</div>
              <p className="panel-body-text" style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                Logo, accent color, product name, and fonts inherit from the workspace theming settings.
              </p>
              <Link to="/settings" className="btn btn-secondary" style={{ marginTop: 12 }}>
                <Palette size={14} strokeWidth={2.2} />
                Open Theming settings
              </Link>
            </section>
          </div>
        </div>
      )}

      {tab === 'Overview' && openIncidents.length === 0 && incidents.length > 0 && (
        <div className="contrib" style={{ marginTop: 14 }}>
          <span className="contrib-chip">
            <CheckCircle2 size={13} strokeWidth={2.2} />
            All incidents resolved — visitors see operational status
          </span>
        </div>
      )}
    </>
  )
}
