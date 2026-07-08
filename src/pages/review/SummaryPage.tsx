import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, Layers, Sparkles } from 'lucide-react'
import { useEnv } from '../../state/env'
import {
  aggregateRollup,
  aggregateSecurity,
  formatUsd,
  getExecParagraph,
} from '../../mock/review'
import { ConfidencePill } from '../../components/Confidence'
import { AreaChart } from '../../components/AreaChart'
import { OptimizationGoals } from '../../components/OptimizationGoals'
import { getBoard } from '../../mock/alerts'
import { useEnvLoad } from '../../components/PageLoad'

/* Review › Overview (DEV-29, was Screen 09). AI briefing + the three pillars
   (Security / Cost / Reliability). Kept for its audit/snapshot value. Figures
   aggregate across every selected environment (DEV-27 multi-select). */
export function SummaryPage() {
  const { selectedEnvs, selectedIds, env, aggregating } = useEnv()
  const [searchParams] = useSearchParams()
  const intervalParam = searchParams.get('interval') || 'daily'
  const interval = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].includes(intervalParam)
    ? intervalParam
    : 'daily'
  const loading = useEnvLoad()


  if (loading) {
    return (
      <div aria-busy="true">
        <div className="panel">
          <span className="skeleton skeleton-text" style={{ width: '30%' }} />
          <span className="skeleton skeleton-text" style={{ width: '95%', marginTop: 10 }} />
          <span className="skeleton skeleton-text" style={{ width: '80%', marginTop: 6 }} />
        </div>
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="stat-card">
              <span className="skeleton skeleton-text" style={{ width: '60%' }} />
              <span className="skeleton skeleton-text" style={{ width: '40%', marginTop: 12 }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const scopeName = aggregating ? `${selectedEnvs.length} environments` : env.name
  const exec = aggregating
    ? { text: `Aggregated across ${selectedEnvs.map((e) => e.name).join(', ')}: the platform handled ${aggregateRollup(selectedIds).incidents} incidents automatically, protecting ~${formatUsd(aggregateRollup(selectedIds).costUsd)} in revenue and saving ${aggregateRollup(selectedIds).engHours} engineer-hours this week. Security, cost, and reliability figures below sum every selected environment.`, confidence: 90 }
    : getExecParagraph(env.id, env.name)
  const rollup = aggregateRollup(selectedIds)
  const sec = aggregateSecurity(selectedIds)
  const board = getBoard(env.id)

  /* Exec trend cards (Cost / Time / Risk framing, pillar as sub-label).
     Program-to-date metrics with trend series — matches the approved
     Overview mockup. */
  const execCards = [
    {
      key: 'cost',
      label: 'Cost',
      pillar: 'Cost Optimization',
      to: '/review/inventory?cat=cost',
      value: `${formatUsd(612000)}`,
      delta: '↑ since Jan 2025',
      desc: 'Total downtime prevented + right-sizing to date',
      color: 'var(--success)',
      fill: true,
      series: [120, 180, 240, 210, 300, 360, 340, 430, 470, 520, 560, 612],
    },
    {
      key: 'time',
      label: 'Time',
      pillar: 'Reliability Risk',
      to: '/review/inventory?cat=reliability',
      value: '−54%',
      delta: 'MTTR down 54% vs baseline',
      desc: `${rollup.engHours >= 100 ? rollup.engHours : 410} eng-hrs reclaimed since rollout`,
      color: 'var(--brand)',
      fill: true,
      series: [100, 96, 92, 95, 88, 84, 80, 74, 70, 66, 60, 46],
    },
    {
      key: 'risk',
      label: 'Risk',
      pillar: 'Security Exposure',
      to: '/review/inventory?cat=security',
      value: '82%',
      delta: `${sec.topFindings.length ? 146 : 0} findings remediated to date`,
      desc: 'SLO budget held at 82%, posture trending up',
      color: 'var(--warn)',
      fill: true,
      series: [40, 44, 52, 48, 60, 58, 66, 70, 68, 74, 78, 82],
    },
  ] as const

  return (
    <>
      {aggregating && (
        <div className="agg-banner">
          <Layers size={14} strokeWidth={2.2} />
          Aggregating {selectedEnvs.length} environments — {selectedEnvs.map((e) => e.name).join(' · ')}
        </div>
      )}

      <section className="panel ai-panel">
        <div className="panel-head">
          <span className="ai-tile">
            <Sparkles size={15} strokeWidth={2} />
          </span>
          <span className="eyebrow" style={{ margin: 0, textTransform: 'capitalize' }}>
            Rtifact AI {interval} briefing
          </span>

          <ConfidencePill value={exec.confidence} />
        </div>
        <p className="panel-body-text" style={{ fontSize: 14.5 }}>
          {exec.text}
        </p>
      </section>

      {/* Contribution rollup — computed from DAAV/workflow contribution schema */}
      <div className="contrib" aria-label="AI contribution rollup">
        <span className="contrib-chip">
          <span className="contrib-k">Protected</span> {formatUsd(rollup.costUsd)} revenue
        </span>
        <span className="contrib-chip">
          <span className="contrib-k">Saved</span> {rollup.engHours} engineer-hours
        </span>
        <span className="contrib-chip">
          <span className="contrib-k">Handled</span> {rollup.incidents} incidents · {rollup.workflows} workflows
        </span>
      </div>

      {/* Exec trend cards — Cost / Time / Risk with area graphs; each drills
          into the matching Inventory pillar. */}
      <div className="exec-grid">
        {execCards.map((c) => (
          <Link key={c.key} to={c.to} className="exec-card">
            <div className="exec-head">
              <span className="exec-label" style={{ color: c.color }}>
                {c.label}
              </span>
              <ChevronRight size={14} className="pillar-go" strokeWidth={2.2} />
            </div>
            <div className="exec-value">{c.value}</div>
            <div className="exec-delta" style={{ color: c.color }}>
              {c.delta}
            </div>
            <div className="exec-chart">
              <AreaChart data={c.series as unknown as number[]} stroke={c.color} fill={c.fill} height={92} />
            </div>
            <div className="exec-desc">{c.desc}</div>
            <div className="exec-pillar">{c.pillar}</div>
          </Link>
        ))}
      </div>

      <div className="section-label">Optimization goals — {scopeName}</div>
      <OptimizationGoals goals={board.goals} />
    </>
  )
}
