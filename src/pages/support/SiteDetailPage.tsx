import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Globe,
  Megaphone,
  ChevronRight,
} from 'lucide-react'
import {
  maintenanceWindows,
  siteIncidents as seedIncidents,
  sites,
  subscribersSample,
} from '../../mock/support'
import type { SiteIncident } from '../../mock/support'
import { TimeAgo } from '../../components/TimeAgo'
import { minutesAgo } from '../../lib/time'

const TABS = ['Structure', 'Status updates', 'Maintenance', 'Subscribers', 'Translations'] as const
type Tab = (typeof TABS)[number]

const LIVE_CLS: Record<string, { label: string; cls: string }> = {
  operational: { label: 'Operational', cls: 'sev-healthy' },
  degraded: { label: 'Degraded', cls: 'sev-warning' },
  outage: { label: 'Outage', cls: 'sev-critical' },
}

export function SiteDetailPage() {
  const { siteId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const site = sites.find((s) => s.id === siteId)
  const tabParam = searchParams.get('tab')
  
  // Find matching tab from param
  const tab: Tab = TABS.find((t) => t.toLowerCase().replace(' ', '').startsWith(tabParam ?? '')) ?? 'Structure'

  const [incidents, setIncidents] = useState<SiteIncident[]>(seedIncidents[siteId ?? ''] ?? [])
  const [draftTitle, setDraftTitle] = useState('')
  const [draftMsg, setDraftMsg] = useState('')
  const [posting, setPosting] = useState(false)

  // Local site settings states (for the Structure form)
  const [siteName, setSiteName] = useState(site?.name ?? '')
  const [siteSubdomain, setSiteSubdomain] = useState(siteId ?? '')
  const [logoPointUrl, setLogoPointUrl] = useState('https://rtifact.io')
  const [contactUrl, setContactUrl] = useState('https://rtifact.io/support')
  const [design, setDesign] = useState('modern')
  const [theme, setTheme] = useState('dark')
  const [headerLayout, setHeaderLayout] = useState<'vertical' | 'horizontal'>('vertical')
  const [customDomain, setCustomDomain] = useState(site?.customDomain ?? '')
  const [showAdvanced, setShowAdvanced] = useState(false)

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

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulated success alert
    alert('Settings saved successfully!')
  }

  return (
    <>
      {/* Back button and page head */}
      <div className="page-head" style={{ marginBottom: 14 }}>
        <div>
          <Link to="/support/status-pages" className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={12} /> Back to Status Pages
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <h1 className="page-title" style={{ fontSize: 21 }}>
              {siteName}
            </h1>
            <span className="badge" style={{
              background: site.visibility === 'public' ? 'var(--brand-soft)' : 'var(--chip)',
              color: site.visibility === 'public' ? 'var(--brand)' : 'var(--muted)',
              fontSize: 10,
              padding: '2px 7px',
            }}>
              {site.visibility}
            </span>
          </div>
          <p className="page-sub mono" style={{ fontSize: 11.5 }}>
            {site.url}
          </p>
        </div>
        
        {/* Render post button if on status updates tab */}
        {tab === 'Status updates' && (
          <button className="btn btn-primary" onClick={() => setPosting(true)}>
            <Megaphone size={14} strokeWidth={2.2} />
            Post incident update
          </button>
        )}
      </div>

      {/* Tabs list (screenshot 2 tabs) */}
      <div className="pipeline-tabs" role="tablist" aria-label="Site sections" style={{ marginBottom: 18 }}>
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`pipeline-tab${tab === t ? ' active' : ''}`}
            onClick={() => setSearchParams({ tab: t.toLowerCase().replace(' ', '') })}
          >
            {t}
          </button>
        ))}
      </div>

      {/* TAB 1: Structure Settings Form (matches screenshot 2 layout) */}
      {tab === 'Structure' && (
        <div className="detail-grid" style={{ gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Left Column Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingRight: 8 }}>
            <div>
              <span className="badge neutral" style={{ marginBottom: 8, fontSize: 10, padding: '2px 6px' }}>Billable</span>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>
                A public status page informs your users about the uptime of your services.
              </p>
            </div>

            <div>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>
                Where should we point your users when they want to visit your website?
              </p>
            </div>

            <div>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>
                Upload your logo to personalize the look & feel of your status page.
                Use modern look for refreshed design with latest features like dark theme, translations, and custom favicon.
              </p>
            </div>

            <div>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>
                Deploy your status page to a custom subdomain for a branded experience. Need help with the setup? <a href="#" style={{ color: 'var(--brand)', textDecoration: 'underline' }}>Let us know</a>
              </p>
            </div>
          </div>

          {/* Right Column Form Card */}
          <form onSubmit={handleSaveChanges} className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field">
                <span className="field-label">Company name *</span>
                <input
                  required
                  className="text-input"
                  value={siteName}
                  placeholder="e.g. Acme Corporation"
                  onChange={(e) => setSiteName(e.target.value)}
                />
              </div>

              <div className="field">
                <span className="field-label">Subdomain *</span>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <input
                    required
                    className="text-input"
                    value={siteSubdomain}
                    placeholder="acme"
                    onChange={(e) => setSiteSubdomain(e.target.value)}
                    style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, flex: 1, minWidth: 0 }}
                  />
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    background: 'var(--chip)',
                    border: '1px solid var(--border-strong)',
                    borderLeft: 'none',
                    borderTopRightRadius: 9,
                    borderBottomRightRadius: 9,
                    fontSize: 12.5,
                    color: 'var(--faint)',
                  }}>
                    .rtifact.io
                  </span>
                </div>
              </div>
            </div>

            {/* Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field">
                <span className="field-label">What URL should your logo point to?</span>
                <input
                  className="text-input"
                  value={logoPointUrl}
                  placeholder="https://acme.com"
                  onChange={(e) => setLogoPointUrl(e.target.value)}
                />
              </div>

              <div className="field">
                <span className="field-label">Get in touch URL</span>
                <input
                  className="text-input"
                  value={contactUrl}
                  placeholder="https://acme.com/support"
                  onChange={(e) => setContactUrl(e.target.value)}
                />
              </div>
            </div>

            {/* Row 3 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field">
                <span className="field-label">Status page design</span>
                <select className="text-input select" style={{ width: '100%' }} value={design} onChange={(e) => setDesign(e.target.value)}>
                  <option value="classic">Classic Minimalist</option>
                  <option value="modern">Modern Glassmorphic</option>
                  <option value="compact">Compact Grid</option>
                </select>
              </div>

              <div className="field">
                <span className="field-label">Color theme</span>
                <select className="text-input select" style={{ width: '100%' }} value={theme} onChange={(e) => setTheme(e.target.value)}>
                  <option value="dark">Dark Theme (Standard)</option>
                  <option value="light">Light Theme</option>
                  <option value="system">Auto System Theme</option>
                </select>
              </div>
            </div>

            {/* Header layout */}
            <div className="field">
              <span className="field-label">Header layout</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Vertical option */}
                <div
                  style={{
                    border: `1.5px solid ${headerLayout === 'vertical' ? 'var(--brand)' : 'var(--border-strong)'}`,
                    borderRadius: 10,
                    padding: 14,
                    cursor: 'pointer',
                    background: headerLayout === 'vertical' ? 'var(--brand-soft)' : 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setHeaderLayout('vertical')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      border: '1.5px solid var(--faint)',
                      display: 'grid',
                      placeItems: 'center',
                    }}>
                      {headerLayout === 'vertical' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)' }} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Vertical layout</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
                    Prominently display your overall status banner.
                  </span>
                  <div style={{ height: 40, background: 'var(--border)', borderRadius: 6, display: 'flex', flexDirection: 'column', padding: 6, gap: 4, marginTop: 4 }}>
                    <div style={{ height: 8, width: '40%', background: 'var(--border-strong)', borderRadius: 2, alignSelf: 'center' }} />
                    <div style={{ height: 12, background: 'var(--success-soft)', border: '1px solid var(--success)', borderRadius: 3 }} />
                  </div>
                </div>

                {/* Horizontal option */}
                <div
                  style={{
                    border: `1.5px solid ${headerLayout === 'horizontal' ? 'var(--brand)' : 'var(--border-strong)'}`,
                    borderRadius: 10,
                    padding: 14,
                    cursor: 'pointer',
                    background: headerLayout === 'horizontal' ? 'var(--brand-soft)' : 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setHeaderLayout('horizontal')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      border: '1.5px solid var(--faint)',
                      display: 'grid',
                      placeItems: 'center',
                    }}>
                      {headerLayout === 'horizontal' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)' }} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Horizontal layout</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
                    Save vertical space to show more content.
                  </span>
                  <div style={{ height: 40, background: 'var(--border)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', padding: 8, marginTop: 4 }}>
                    <div style={{ height: 8, width: '30%', background: 'var(--border-strong)', borderRadius: 2 }} />
                    <div style={{ height: 12, width: '40%', background: 'var(--success-soft)', border: '1px solid var(--success)', borderRadius: 3 }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Logo uploaders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field">
                <span className="field-label">Logo for a light background</span>
                <div style={{
                  border: '1.5px dashed var(--border-strong)',
                  borderRadius: 10,
                  padding: '20px 12px',
                  textAlign: 'center',
                  background: 'var(--surface)',
                  fontSize: 12,
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  transition: 'border-color 0.12s ease',
                }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--brand)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-strong)'}>
                  Drag & drop or click to choose
                </div>
              </div>

              <div className="field">
                <span className="field-label">Logo for a dark background</span>
                <div style={{
                  border: '1.5px dashed var(--border-strong)',
                  borderRadius: 10,
                  padding: '20px 12px',
                  textAlign: 'center',
                  background: 'var(--surface)',
                  fontSize: 12,
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  transition: 'border-color 0.12s ease',
                }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--brand)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-strong)'}>
                  Drag & drop or click to choose
                </div>
              </div>
            </div>

            {/* Custom domain */}
            <div className="field">
              <span className="field-label">Custom domain</span>
              <input
                className="text-input"
                value={customDomain}
                placeholder="status.example.com"
                onChange={(e) => setCustomDomain(e.target.value)}
              />
            </div>

            {/* CNAME setup box */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: 10,
              padding: 16,
              fontSize: 12.5,
            }}>
              <span style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>DNS Configuration CNAME records</span>
              <p style={{ color: 'var(--muted)', marginBottom: 12, lineHeight: 1.4 }}>
                Please point <span className="mono" style={{ color: 'var(--fg)', fontWeight: 600 }}>{customDomain || 'status.example.com'}</span> to Rtifact SRE nodes by configuring the following CNAME records:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 150px 1fr', gap: 12, padding: '8px 12px', background: 'var(--chip)', borderRadius: 6, fontFamily: 'monospace', fontSize: 11 }}>
                <div><span style={{ color: 'var(--faint)' }}>Record:</span> CNAME</div>
                <div><span style={{ color: 'var(--faint)' }}>Host:</span> {customDomain || 'status.example.com'}</div>
                <div><span style={{ color: 'var(--faint)' }}>Target:</span> statuspage.rtifact.io</div>
              </div>
            </div>

            {/* Advanced Settings fold */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}
              >
                <ChevronRight size={14} style={{ transform: showAdvanced ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease' }} />
                Advanced settings
              </div>
              {showAdvanced && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="field">
                    <span className="field-label">Default Page Language</span>
                    <select className="text-input select" style={{ width: '100%' }}>
                      <option value="en">English (US)</option>
                      <option value="es">Spanish</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" id="showAttribution" defaultChecked style={{ cursor: 'pointer' }} />
                    <label htmlFor="showAttribution" style={{ fontSize: 12.5, cursor: 'pointer' }}>Show Rtifact attribution in page footer</label>
                  </div>
                </div>
              )}
            </div>

            {/* Form actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 18px' }}>
                Save changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Status updates */}
      {tab === 'Status updates' && (
        <>
          {/* inline post form */}
          {posting && (
            <section className="panel form-panel" style={{ maxWidth: 'none', marginBottom: 20 }}>
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

          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
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

          <div className="section-label">Incident Log</div>
          {incidents.length === 0 ? (
            <div className="placeholder-panel">Nothing posted yet — visitors see all-clear.</div>
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
                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', fontWeight: 400, marginTop: 4 }}>
                      {i.publicUpdate}
                    </span>
                    {i.linkedIncident && (
                      <Link to={`/command/incidents/${i.linkedIncident}`} className="mono" style={{ fontSize: 10.5, color: 'var(--faint)', display: 'inline-block', marginTop: 4 }}>
                        linked incident: {i.linkedIncident}
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

      {/* TAB 3: Maintenance */}
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

      {/* TAB 4: Subscribers */}
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

      {/* TAB 5: Translations */}
      {tab === 'Translations' && (
        <div className="panel" style={{ padding: 24 }}>
          <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '30px 0' }}>
            <Globe size={36} style={{ color: 'var(--brand)', marginBottom: 12 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Translations Settings</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
              Translate your public status message, maintenance declarations, and subscriber notification templates into multiple locales automatically.
            </p>
            <button className="btn btn-primary" disabled style={{ opacity: 0.6 }}>Configure Languages</button>
          </div>
        </div>
      )}
    </>
  )
}
