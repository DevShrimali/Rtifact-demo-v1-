import { minutesAgo } from '../lib/time'
import type { Severity } from './alerts'

/* ---------- Screens 32–33: Cases ---------- */

export type CaseStatus = 'Triage' | 'Investigating' | 'Fixing'

export interface SupportCase {
  id: string
  title: string
  status: CaseStatus
  severity: Severity
  assignee: string
  openedAt: number
  context: { label: string; value: string }[]
  timeline: { label: string; at: number; actor: string }[]
}

export const cases: SupportCase[] = [
  {
    id: 'CASE-88',
    title: 'Payment webhook retries hitting customer endpoint',
    status: 'Investigating',
    severity: 'high',
    assignee: 'A. Rivera',
    openedAt: minutesAgo(4320),
    context: [
      { label: 'Customer', value: 'Northwind Retail (enterprise)' },
      { label: 'Channel', value: 'Email → support@' },
      { label: 'Linked incident', value: 'INC-311' },
      { label: 'Affected surface', value: 'payments webhook v2' },
    ],
    timeline: [
      { label: 'Case opened from customer email', at: minutesAgo(4320), actor: 'system' },
      { label: 'Triaged as High — linked to INC-311', at: minutesAgo(4100), actor: 'M. Chen' },
      { label: 'Retry storm confirmed as root cause', at: minutesAgo(300), actor: 'A. Rivera' },
      { label: 'Awaiting rollback completion before reply', at: minutesAgo(60), actor: 'A. Rivera' },
    ],
  },
  {
    id: 'CASE-87',
    title: 'Status page shows stale incident for EU customers',
    status: 'Fixing',
    severity: 'medium',
    assignee: 'M. Chen',
    openedAt: minutesAgo(2880),
    context: [
      { label: 'Customer', value: '3 reports (EU region)' },
      { label: 'Channel', value: 'Status page feedback' },
      { label: 'Linked incident', value: '—' },
      { label: 'Affected surface', value: 'status.acme.com CDN cache' },
    ],
    timeline: [
      { label: 'Case opened', at: minutesAgo(2880), actor: 'system' },
      { label: 'Cache TTL misconfiguration found', at: minutesAgo(600), actor: 'M. Chen' },
      { label: 'Fix rolling out to EU PoPs', at: minutesAgo(90), actor: 'M. Chen' },
    ],
  },
  {
    id: 'CASE-86',
    title: 'Request: webhook signature rotation docs',
    status: 'Triage',
    severity: 'low',
    assignee: 'unassigned',
    openedAt: minutesAgo(1100),
    context: [
      { label: 'Customer', value: 'Fabrikam (growth)' },
      { label: 'Channel', value: 'In-app' },
      { label: 'Linked incident', value: '—' },
      { label: 'Affected surface', value: 'docs' },
    ],
    timeline: [{ label: 'Case opened', at: minutesAgo(1100), actor: 'system' }],
  },
  {
    id: 'CASE-85',
    title: 'API rate limits hit during checkout incident',
    status: 'Investigating',
    severity: 'medium',
    assignee: 'J. Okafor',
    openedAt: minutesAgo(700),
    context: [
      { label: 'Customer', value: 'Contoso (enterprise)' },
      { label: 'Channel', value: 'Slack shared channel' },
      { label: 'Linked incident', value: 'INC-311' },
      { label: 'Affected surface', value: 'public API' },
    ],
    timeline: [
      { label: 'Case opened', at: minutesAgo(700), actor: 'system' },
      { label: 'Correlated with retry storm traffic', at: minutesAgo(400), actor: 'J. Okafor' },
    ],
  },
  {
    id: 'CASE-84',
    title: 'SSO login loop for one workspace',
    status: 'Triage',
    severity: 'high',
    assignee: 'unassigned',
    openedAt: minutesAgo(150),
    context: [
      { label: 'Customer', value: 'Initech (enterprise)' },
      { label: 'Channel', value: 'Email → support@' },
      { label: 'Linked incident', value: '—' },
      { label: 'Affected surface', value: 'auth / SSO' },
    ],
    timeline: [{ label: 'Case opened', at: minutesAgo(150), actor: 'system' }],
  },
]

/* ---------- Screens 34–39: Status Pages ---------- */

export interface StatusSite {
  id: string
  name: string
  visibility: 'public' | 'private'
  url: string
  live: 'operational' | 'degraded' | 'outage'
  subscribers: number
  customDomain: string | null
}

export const sites: StatusSite[] = [
  { id: 'acme-ops', name: 'Acme Operations', visibility: 'public', url: 'status.acme.com', live: 'degraded', subscribers: 1841, customDomain: 'status.acme.com' },
  { id: 'internal', name: 'Internal Platform Status', visibility: 'private', url: 'internal.rtifact.app/status', live: 'operational', subscribers: 214, customDomain: null },
  { id: 'staging', name: 'Staging Status', visibility: 'private', url: 'staging.rtifact.app/status', live: 'outage', subscribers: 12, customDomain: null },
]

export interface SiteIncident {
  id: string
  title: string
  publicUpdate: string
  linkedIncident: string | null
  postedAt: number
  resolved: boolean
}

export const siteIncidents: Record<string, SiteIncident[]> = {
  'acme-ops': [
    {
      id: 'PUB-42',
      title: 'Elevated checkout errors',
      publicUpdate: 'We are seeing elevated error rates on checkout. A fix is being applied; most customers are unaffected.',
      linkedIncident: 'INC-311',
      postedAt: minutesAgo(18),
      resolved: false,
    },
    {
      id: 'PUB-41',
      title: 'CDN cache degradation',
      publicUpdate: 'Static asset delivery was slower than normal for ~40 minutes. Fully recovered.',
      linkedIncident: 'INC-305',
      postedAt: minutesAgo(1500),
      resolved: true,
    },
  ],
  internal: [],
  staging: [
    {
      id: 'PUB-40',
      title: 'Staging environment unstable',
      publicUpdate: 'Load testing is saturating staging ingress. QA pipelines paused.',
      linkedIncident: 'INC-402',
      postedAt: minutesAgo(9),
      resolved: false,
    },
  ],
}

export const subscribersSample: Record<string, { email: string; addedAt: number }[]> = {
  'acme-ops': [
    { email: 'noc@northwind.com', addedAt: minutesAgo(80000) },
    { email: 'ops-alerts@contoso.com', addedAt: minutesAgo(51000) },
    { email: 'sre@fabrikam.io', addedAt: minutesAgo(22000) },
  ],
  internal: [
    { email: 'eng-leads@rtifact.app', addedAt: minutesAgo(90000) },
    { email: 'oncall@rtifact.app', addedAt: minutesAgo(90000) },
  ],
  staging: [{ email: 'qa@rtifact.app', addedAt: minutesAgo(40000) }],
}

export interface MaintenanceWindow {
  id: string
  title: string
  startsInHours: number
  durationMin: number
  scope: string
}

export const maintenanceWindows: Record<string, MaintenanceWindow[]> = {
  'acme-ops': [
    { id: 'MW-9', title: 'orders-db failover drill', startsInHours: 52, durationMin: 30, scope: 'checkout may queue briefly' },
  ],
  internal: [
    { id: 'MW-8', title: 'K8s 1.32 upgrade — prod clusters', startsInHours: 26, durationMin: 90, scope: 'rolling, no expected impact' },
  ],
  staging: [],
}
