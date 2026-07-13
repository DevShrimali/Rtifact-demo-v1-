import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Globe,
  Plus,
  AlertTriangle,
  Users,
  ExternalLink,
  ChevronRight,
  Database,
  ArrowLeft,
  Sliders,
} from 'lucide-react'
import { ListSkeleton, useEnvLoad } from '../../components/PageLoad'

export interface StatusSiteItem {
  id: string
  name: string
  url: string
  status: string
  statusType: string
  visibility: string
  incidents: number
  components: number
  subscribers: number
  customDomain: string | null
  customDomainStatus: string | null
  lastUpdated: string
}

// initial mock status sites matching screenshot 1
const initialSites: StatusSiteItem[] = [
  {
    id: 'acme-ops',
    name: 'Acme Operations',
    url: 'status.rtifact.io/acme',
    status: 'Degraded Performance',
    statusType: 'degraded',
    visibility: 'Public',
    incidents: 1,
    components: 7,
    subscribers: 142,
    customDomain: 'status.acme.com',
    customDomainStatus: 'Active',
    lastUpdated: '58m ago',
  },
  {
    id: 'internal-platform',
    name: 'Internal Platform Status',
    url: 'status.rtifact.io/platform',
    status: 'Operational',
    statusType: 'operational',
    visibility: 'Private',
    incidents: 0,
    components: 5,
    subscribers: 12,
    customDomain: null,
    customDomainStatus: null,
    lastUpdated: '3h ago',
  },
  {
    id: 'staging-env',
    name: 'Staging Environment',
    url: 'status.rtifact.io/staging',
    status: 'Partial Outage',
    statusType: 'outage',
    visibility: 'Private',
    incidents: 0,
    components: 4,
    subscribers: 3,
    customDomain: null,
    customDomainStatus: null,
    lastUpdated: '1d ago',
  },
]

type TopTab = 'sites' | 'registry' | 'incidents' | 'domains'

export function SitesPage() {
  const loading = useEnvLoad()

  // State to manage list vs create
  const [isCreating, setIsCreating] = useState(false)

  // Local state for sites list (allows adding/deleting)
  const [sites, setSites] = useState<StatusSiteItem[]>(initialSites)

  // Empty state override toggler
  const [showEmptyState, setShowEmptyState] = useState(false)

  // Top Tabs
  const [activeTab, setActiveTab] = useState<TopTab>('sites')

  // Form states for Create Status Page (matching Structure design in screenshot 2)
  const [formName, setFormName] = useState('')
  const [formSubdomain, setFormSubdomain] = useState('')
  const [formLogoUrl, setFormLogoUrl] = useState('')
  const [formContactUrl, setFormContactUrl] = useState('')
  const [formDesign, setFormDesign] = useState('classic')
  const [formTheme, setFormTheme] = useState('dark')
  const [formHeaderLayout, setFormHeaderLayout] = useState<'vertical' | 'horizontal'>('vertical')
  const [formCustomDomain, setFormCustomDomain] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Handle form submit
  const handleCreateSite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formSubdomain.trim()) return

    const newSite: StatusSiteItem = {
      id: formSubdomain.trim().toLowerCase(),
      name: formName.trim(),
      url: `status.rtifact.io/${formSubdomain.trim().toLowerCase()}`,
      status: 'Operational',
      statusType: 'operational',
      visibility: 'Public',
      incidents: 0,
      components: 5,
      subscribers: 0,
      customDomain: formCustomDomain.trim() || null,
      customDomainStatus: formCustomDomain.trim() ? 'Active' : null,
      lastUpdated: 'Just now',
    }

    setSites((prev) => [newSite, ...prev])
    setIsCreating(false)

    // Reset form
    setFormName('')
    setFormSubdomain('')
    setFormLogoUrl('')
    setFormContactUrl('')
    setFormDesign('classic')
    setFormTheme('dark')
    setFormHeaderLayout('vertical')
    setFormCustomDomain('')
  }

  // Derived stats
  const activeList = showEmptyState ? [] : sites
  const totalSites = activeList.length
  const activeIncidents = activeList.reduce((acc, s) => acc + s.incidents, 0)
  const totalSubscribers = activeList.reduce((acc, s) => acc + s.subscribers, 0)
  const customDomains = activeList.filter((s) => s.customDomain).length

  if (isCreating) {
    return (
      <>
        {/* Breadcrumbs / Page Head */}
        <div className="page-head" style={{ marginBottom: 14 }}>
          <div>
            <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => setIsCreating(false)}>
              <ArrowLeft size={12} /> Back to Status Pages
            </div>
            <h1 className="page-title" style={{ fontSize: 21 }}>Create Status Site</h1>
            <p className="page-sub">Configure customer-facing operational tracking.</p>
          </div>
        </div>

        {/* Mocked Site Edit Tabs matching Screenshot 2 */}
        <div className="pipeline-tabs" style={{ marginBottom: 18 }}>
          <button className="pipeline-tab active">Structure</button>
          <button className="pipeline-tab" style={{ opacity: 0.5, cursor: 'not-allowed' }}>Status updates</button>
          <button className="pipeline-tab" style={{ opacity: 0.5, cursor: 'not-allowed' }}>Maintenance</button>
          <button className="pipeline-tab" style={{ opacity: 0.5, cursor: 'not-allowed' }}>Subscribers</button>
          <button className="pipeline-tab" style={{ opacity: 0.5, cursor: 'not-allowed' }}>Translations</button>
        </div>

        {/* Structure tab form container */}
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
          <form onSubmit={handleCreateSite} className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field">
                <span className="field-label">Company name *</span>
                <input
                  required
                  className="text-input"
                  value={formName}
                  placeholder="e.g. Acme Corporation"
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="field">
                <span className="field-label">Subdomain *</span>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <input
                    required
                    className="text-input"
                    value={formSubdomain}
                    placeholder="acme"
                    onChange={(e) => setFormSubdomain(e.target.value)}
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
                  value={formLogoUrl}
                  placeholder="https://acme.com"
                  onChange={(e) => setFormLogoUrl(e.target.value)}
                />
              </div>

              <div className="field">
                <span className="field-label">Get in touch URL</span>
                <input
                  className="text-input"
                  value={formContactUrl}
                  placeholder="https://acme.com/support"
                  onChange={(e) => setFormContactUrl(e.target.value)}
                />
              </div>
            </div>

            {/* Row 3 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field">
                <span className="field-label">Status page design</span>
                <select className="text-input select" style={{ width: '100%' }} value={formDesign} onChange={(e) => setFormDesign(e.target.value)}>
                  <option value="classic">Classic Minimalist</option>
                  <option value="modern">Modern Glassmorphic</option>
                  <option value="compact">Compact Grid</option>
                </select>
              </div>

              <div className="field">
                <span className="field-label">Color theme</span>
                <select className="text-input select" style={{ width: '100%' }} value={formTheme} onChange={(e) => setFormTheme(e.target.value)}>
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
                    border: `1.5px solid ${formHeaderLayout === 'vertical' ? 'var(--brand)' : 'var(--border-strong)'}`,
                    borderRadius: 10,
                    padding: 14,
                    cursor: 'pointer',
                    background: formHeaderLayout === 'vertical' ? 'var(--brand-soft)' : 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setFormHeaderLayout('vertical')}
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
                      {formHeaderLayout === 'vertical' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)' }} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Vertical layout</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
                    Prominently display your overall status banner.
                  </span>
                  {/* Mock Mini Design */}
                  <div style={{ height: 40, background: 'var(--border)', borderRadius: 6, display: 'flex', flexDirection: 'column', padding: 6, gap: 4, marginTop: 4 }}>
                    <div style={{ height: 8, width: '40%', background: 'var(--border-strong)', borderRadius: 2, alignSelf: 'center' }} />
                    <div style={{ height: 12, background: 'var(--success-soft)', border: '1px solid var(--success)', borderRadius: 3 }} />
                  </div>
                </div>

                {/* Horizontal option */}
                <div
                  style={{
                    border: `1.5px solid ${formHeaderLayout === 'horizontal' ? 'var(--brand)' : 'var(--border-strong)'}`,
                    borderRadius: 10,
                    padding: 14,
                    cursor: 'pointer',
                    background: formHeaderLayout === 'horizontal' ? 'var(--brand-soft)' : 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setFormHeaderLayout('horizontal')}
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
                      {formHeaderLayout === 'horizontal' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)' }} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Horizontal layout</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
                    Save vertical space to show more content.
                  </span>
                  {/* Mock Mini Design */}
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
                value={formCustomDomain}
                placeholder="status.example.com"
                onChange={(e) => setFormCustomDomain(e.target.value)}
              />
            </div>

            {/* CNAME setup box when custom domain is set */}
            {formCustomDomain && (
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 10,
                padding: 16,
                fontSize: 12.5,
              }}>
                <span style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>DNS Configuration Required</span>
                <p style={{ color: 'var(--muted)', marginBottom: 12, lineHeight: 1.4 }}>
                  Please point <span className="mono" style={{ color: 'var(--fg)', fontWeight: 600 }}>{formCustomDomain}</span> to Rtifact SRE nodes by configuring the following CNAME records:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 150px 1fr', gap: 12, padding: '8px 12px', background: 'var(--chip)', borderRadius: 6, fontFamily: 'monospace', fontSize: 11 }}>
                  <div><span style={{ color: 'var(--faint)' }}>Record:</span> CNAME</div>
                  <div><span style={{ color: 'var(--faint)' }}>Host:</span> {formCustomDomain}</div>
                  <div><span style={{ color: 'var(--faint)' }}>Target:</span> statuspage.rtifact.io</div>
                </div>
              </div>
            )}

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
                    <input type="checkbox" id="showFooter" defaultChecked style={{ cursor: 'pointer' }} />
                    <label htmlFor="showFooter" style={{ fontSize: 12.5, cursor: 'pointer' }}>Show Rtifact attribution in page footer</label>
                  </div>
                </div>
              )}
            </div>

            {/* Form actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 18px' }}>
                Save changes
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setIsCreating(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="page-head" style={{ marginBottom: 14 }}>
        <div>
          <div className="eyebrow">Support</div>
          <h1 className="page-title">Status Pages</h1>
          <p className="page-sub">
            {activeTab === 'sites' && (loading ? 'Loading status sites…' : `${sites.length} sites · ${sites.filter((s) => s.visibility.toLowerCase() === 'public').length} public`)}
            {activeTab === 'registry' && 'Service definitions and internal health mapping.'}
            {activeTab === 'incidents' && 'Cross-site customer notification logs.'}
            {activeTab === 'domains' && 'Global CNAME and workspace branding settings.'}
          </p>
        </div>
        {activeTab === 'sites' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setShowEmptyState(!showEmptyState)}>
              {showEmptyState ? 'Show full state' : 'Show empty state'}
            </button>
            <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
              <Plus size={14} strokeWidth={2.2} />
              Create Status Site
            </button>
          </div>
        )}
      </div>



      {/* Status Page specific top sub-tabs */}
      <div className="pipeline-tabs" style={{ marginBottom: 18 }}>
        <button className={`pipeline-tab${activeTab === 'sites' ? ' active' : ''}`} onClick={() => setActiveTab('sites')}>
          Status Sites
        </button>
        <button className={`pipeline-tab${activeTab === 'registry' ? ' active' : ''}`} onClick={() => setActiveTab('registry')}>
          Service Registry
        </button>
        <button className={`pipeline-tab${activeTab === 'incidents' ? ' active' : ''}`} onClick={() => setActiveTab('incidents')}>
          Incidents
        </button>
        <button className={`pipeline-tab${activeTab === 'domains' ? ' active' : ''}`} onClick={() => setActiveTab('domains')}>
          Domain and Branding
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <ListSkeleton rows={3} />
      ) : (
        <>
          {/* TAB 1: Status Sites */}
          {activeTab === 'sites' && (
            <>
              {/* Stat Cards Grid */}
              <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
                {/* Stat 1 */}
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'var(--brand-soft)',
                    color: 'var(--brand)',
                  }}>
                    <Globe size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{totalSites}</div>
                    <div className="stat-label" style={{ marginTop: 2, textTransform: 'none', letterSpacing: 'normal' }}>Total Sites</div>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    display: 'grid',
                    placeItems: 'center',
                    background: activeIncidents > 0 ? 'var(--error-soft)' : 'var(--success-soft)',
                    color: activeIncidents > 0 ? 'var(--error)' : 'var(--success)',
                  }}>
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{activeIncidents}</div>
                    <div className="stat-label" style={{ marginTop: 2, textTransform: 'none', letterSpacing: 'normal' }}>Active Incidents</div>
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'color-mix(in srgb, var(--brand) 12%, transparent)',
                    color: 'var(--brand-ink)',
                  }}>
                    <Users size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{totalSubscribers}</div>
                    <div className="stat-label" style={{ marginTop: 2, textTransform: 'none', letterSpacing: 'normal' }}>Total Subscribers</div>
                  </div>
                </div>

                {/* Stat 4 */}
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'var(--success-soft)',
                    color: 'var(--success)',
                  }}>
                    <ExternalLink size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{customDomains}</div>
                    <div className="stat-label" style={{ marginTop: 2, textTransform: 'none', letterSpacing: 'normal' }}>Custom Domains</div>
                  </div>
                </div>
              </div>

              {/* Table / Row list */}
              {activeList.length === 0 ? (
                <div className="placeholder-panel">
                  No status sites yet.
                  <span className="mono">public pages keep customers informed without support load</span>
                  <div style={{ marginTop: 14 }}>
                    <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
                      <Plus size={14} strokeWidth={2.2} />
                      Create Status Site
                    </button>
                  </div>
                </div>
              ) : (
                <div className="panel" style={{ overflow: 'hidden', padding: 0 }}>
                  {/* Table Header Row */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '200px 180px 100px 90px 110px 110px 180px 1fr',
                    gap: 12,
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--surface)',
                  }}>
                    <span className="stat-label" style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.07em' }}>Site</span>
                    <span className="stat-label" style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.07em' }}>Status</span>
                    <span className="stat-label" style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.07em' }}>Visibility</span>
                    <span className="stat-label" style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.07em' }}>Incidents</span>
                    <span className="stat-label" style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.07em' }}>Components</span>
                    <span className="stat-label" style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.07em' }}>Subscribers</span>
                    <span className="stat-label" style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.07em' }}>Custom Domain</span>
                    <span className="stat-label" style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.07em', textAlign: 'right' }}>Last Updated</span>
                  </div>

                  {/* Table Content Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {activeList.map((s) => {
                      const isDegraded = s.statusType === 'degraded'
                      const isOperational = s.statusType === 'operational'
                      
                      const statusClass = isOperational
                        ? 'sev-healthy'
                        : isDegraded
                        ? 'sev-warning'
                        : 'sev-critical'

                      const dotClass = isOperational
                        ? 'healthy'
                        : isDegraded
                        ? 'degraded'
                        : 'critical'

                      return (
                        <div
                          key={s.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '200px 180px 100px 90px 110px 110px 180px 1fr',
                            gap: 12,
                            padding: '14px 20px',
                            borderBottom: '1px solid var(--border)',
                            alignItems: 'center',
                            fontSize: 13,
                            transition: 'background 0.1s ease',
                          }}
                          className="hover-row"
                        >
                          {/* Site Info */}
                          <div>
                            <Link to={`/support/status-pages/${s.id}`} style={{ fontWeight: 600, display: 'block', color: 'var(--fg)' }}>
                              {s.name}
                            </Link>
                            <span style={{ fontSize: 11, color: 'var(--faint)', fontFamily: 'monospace' }}>{s.url}</span>
                          </div>

                          {/* Status Badge */}
                          <div>
                            <span className={`badge ${statusClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <span className={`dot ${dotClass}`} style={{ width: 6, height: 6 }} />
                              {s.status}
                            </span>
                          </div>

                          {/* Visibility */}
                          <div>
                            <span className="badge" style={{
                              background: s.visibility === 'Public' ? 'var(--brand-soft)' : 'var(--chip)',
                              color: s.visibility === 'Public' ? 'var(--brand)' : 'var(--muted)',
                              fontSize: 10.5,
                              fontWeight: 700,
                            }}>
                              {s.visibility}
                            </span>
                          </div>

                          {/* Incidents */}
                          <div style={{ fontWeight: 600, color: s.incidents > 0 ? 'var(--error)' : 'var(--muted)', fontFamily: 'monospace', paddingLeft: 8 }}>
                            {s.incidents}
                          </div>

                          {/* Components */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 12.5 }}>
                            <Database size={13} style={{ opacity: 0.7 }} />
                            <span>{s.components}</span>
                          </div>

                          {/* Subscribers */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 12.5 }}>
                            <Users size={13} style={{ opacity: 0.7 }} />
                            <span>{s.subscribers}</span>
                          </div>

                          {/* Custom Domain */}
                          <div>
                            {s.customDomain ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 500 }}>{s.customDomain}</span>
                                <span className="badge sev-healthy" style={{ fontSize: 9, padding: '1px 5px' }}>Active</span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--faint)', fontSize: 12 }}>Not configured</span>
                            )}
                          </div>

                          {/* Last Updated */}
                          <div style={{ textAlign: 'right', color: 'var(--faint)', fontSize: 12 }}>
                            {s.lastUpdated}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: Service Registry */}
          {activeTab === 'registry' && (
            <div className="panel" style={{ padding: 24 }}>
              <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '30px 0' }}>
                <Database size={36} style={{ color: 'var(--brand)', marginBottom: 12 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Service Registry</h3>
                <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
                  Define application services, match them with status components, and manage development team ownership.
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button className="btn btn-primary" disabled style={{ opacity: 0.6 }}>Register Service</button>
                  <button className="btn btn-secondary" disabled style={{ opacity: 0.6 }}>Import from Kubernetes</button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Incidents */}
          {activeTab === 'incidents' && (
            <div className="panel" style={{ padding: 24 }}>
              <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '30px 0' }}>
                <AlertTriangle size={36} style={{ color: 'var(--warn)', marginBottom: 12 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Global Incidents</h3>
                <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
                  View all active and historic status updates across your public and private platforms. Sync directly from alert runbooks.
                </p>
                <button className="btn btn-primary" disabled style={{ opacity: 0.6 }}>Create Incident Link</button>
              </div>
            </div>
          )}

          {/* TAB 4: Domain and Branding */}
          {activeTab === 'domains' && (
            <div className="panel" style={{ padding: 24 }}>
              <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '30px 0' }}>
                <Sliders size={36} style={{ color: 'var(--faint)', marginBottom: 12 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Domain & Branding Settings</h3>
                <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
                  Manage custom apex domains, configure wildcard SSL certificates, upload default templates, and configure webhook integrations.
                </p>
                <button className="btn btn-primary" disabled style={{ opacity: 0.6 }}>Manage Global Domains</button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
