import { Link, useSearchParams } from 'react-router-dom'
import { Globe, Lock, Plus } from 'lucide-react'
import { sites, siteIncidents } from '../../mock/support'
import { SupportSubnav } from './CasesPage'
import { ListSkeleton, useEnvLoad } from '../../components/PageLoad'

const LIVE_CLS: Record<string, { label: string; cls: string }> = {
  operational: { label: 'Operational', cls: 'sev-healthy' },
  degraded: { label: 'Degraded', cls: 'sev-warning' },
  outage: { label: 'Outage', cls: 'sev-critical' },
}

/* Screen 34 — Status Page sites list. */
export function SitesPage() {
  const [searchParams] = useSearchParams()
  const list = searchParams.get('state') === 'empty' ? [] : sites
  const loading = useEnvLoad()

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Support</div>
          <h1 className="page-title">Status Pages</h1>
          <p className="page-sub">
            {list.length > 0
              ? `${list.length} sites · ${list.filter((s) => s.visibility === 'public').length} public`
              : 'No status pages yet'}
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus size={14} strokeWidth={2.2} />
          Create site
        </button>
      </div>

      <SupportSubnav />

      {loading ? (
        <ListSkeleton rows={3} />
      ) : list.length === 0 ? (
        <div className="placeholder-panel">
          No status pages yet.
          <span className="mono">public pages keep customers informed without support load</span>
        </div>
      ) : (
        <div className="row-list">
          {list.map((s) => {
            const live = LIVE_CLS[s.live]
            const openIncidents = (siteIncidents[s.id] ?? []).filter((i) => !i.resolved).length
            return (
              <Link key={s.id} to={`/support/status-pages/${s.id}`} className="row">
                {s.visibility === 'public' ? (
                  <Globe size={15} strokeWidth={2} className="nav-icon" aria-label="Public" />
                ) : (
                  <Lock size={15} strokeWidth={2} className="nav-icon" aria-label="Private" />
                )}
                <span className="row-title" style={{ flex: '0 0 220px' }}>
                  {s.name}
                </span>
                <span className={`badge ${s.visibility === 'public' ? 'sev-healthy' : 'neutral'}`}>
                  {s.visibility}
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--faint)', flex: 1 }}>
                  {s.url}
                </span>
                <span className={`badge ${live.cls}`}>{live.label}</span>
                <span className="mono pod-stat">
                  {openIncidents > 0 ? `${openIncidents} open` : '—'}
                </span>
                <span className="mono pod-stat">{s.subscribers.toLocaleString()} subs</span>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
