import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LifeBuoy,
  LineChart,
  PanelLeftClose,
  PanelLeftOpen,
  Radar,
  Settings,
  Workflow,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useEnv } from '../state/env'
import { usePersona } from '../state/persona'
import { RtifactLogo } from '../components/RtifactLogo'


interface SubItem {
  to: string
  label: string
  end?: boolean
  badge?: number
  badgeType?: 'red' | 'gray' | 'yellow'
}

interface GroupItem {
  label: string
  Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  to?: string
  subItems?: SubItem[]
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { env } = useEnv()
  const { persona } = usePersona()
  const location = useLocation()

  // State to manage group expansion, reading/saving to localStorage
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const stored = localStorage.getItem('rtifact.sidebar.expandedGroups')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {}
    }
    return { Command: true, Review: true }
  })

  const toggleGroup = (groupLabel: string) => {
    setExpanded((prev) => {
      const next = { ...prev, [groupLabel]: !prev[groupLabel] }
      localStorage.setItem('rtifact.sidebar.expandedGroups', JSON.stringify(next))
      return next
    })
  }

  // Groups and items structure
  const groups: GroupItem[] = [
    {
      label: 'Command',
      Icon: Radar,
      to: '/command',
      subItems: [
        { to: '/command', label: 'Alerts', end: true, badge: env.criticalAlerts || 3, badgeType: 'red' },
        { to: '/command/incidents', label: 'Incidents', badge: 9, badgeType: 'gray' },
        { to: '/command/telemetry', label: 'Telemetry', badge: 3, badgeType: 'yellow' },
      ],
    },
    {
      label: 'Review',
      Icon: LineChart,
      to: '/review',
      subItems: [
        { to: '/review', label: 'Overview', end: true },
        { to: '/review/metrics', label: 'Reports' },
        { to: '/review/inventory', label: 'Inventory' },
      ],
    },
    {
      label: 'Automate',
      Icon: Workflow,
      to: '/automate',
    },
    {
      label: 'Support',
      Icon: LifeBuoy,
      to: '/support',
    },
    {
      label: 'Settings',
      Icon: Settings,
      to: '/settings',
    },
  ]

  // Helper to check if a group is currently active
  const isGroupActive = (group: GroupItem) => {
    if (group.subItems) {
      return group.subItems.some((sub) => {
        if (sub.end) {
          return location.pathname === sub.to
        }
        return location.pathname.startsWith(sub.to)
      })
    }
    return group.to ? location.pathname.startsWith(group.to) : false
  }

  return (
    <aside className="sidebar">
      <div className="wordmark">
        <RtifactLogo showText={!collapsed} height={20} />

        <button
          className="sb-toggle"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggle}
        >
          {collapsed ? (
            <PanelLeftOpen size={15} strokeWidth={2} />
          ) : (
            <PanelLeftClose size={15} strokeWidth={2} />
          )}
        </button>
      </div>

      <nav className="nav-section" aria-label="Modules">
        <div className="nav-label nav-text">Modules</div>
        {groups.map((group) => {
          const hasSubs = !!group.subItems
          const isExpanded = expanded[group.label]
          const showSubs = !collapsed && hasSubs && isExpanded
          const groupActive = isGroupActive(group)

          return (
            <div key={group.label} className="sidebar-group-container" style={{ display: 'flex', flexDirection: 'column' }}>
              {hasSubs ? (
                <>
                  <NavLink
                    to={group.to!}
                    title={collapsed ? group.label : undefined}
                    onClick={() => {
                      if (!isExpanded) {
                        setExpanded((prev) => ({ ...prev, [group.label]: true }))
                      } else if (groupActive) {
                        toggleGroup(group.label)
                      }
                    }}
                    className={`nav-item nav-group-header${groupActive ? ' active' : ''}`}
                    end={true}
                  >
                    <group.Icon size={17} className="nav-icon" strokeWidth={2} />
                    <span className="nav-text">{group.label}</span>
                    <span
                      className="nav-chevron nav-text"
                      style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleGroup(group.label)
                      }}
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  </NavLink>
                  {showSubs && (
                    <div className="sidebar-sub-items">
                      {group.subItems!.map((sub) => (
                        <NavLink
                          key={sub.to}
                          to={sub.to}
                          end={sub.end}
                          className={({ isActive }) => `nav-item sub-item${isActive ? ' active' : ''}`}
                        >
                          <span className="nav-text">{sub.label}</span>
                          {sub.badge !== undefined && (
                            <span className={`sub-badge ${sub.badgeType}`}>{sub.badge}</span>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavLink
                  to={group.to!}
                  title={collapsed ? group.label : undefined}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <group.Icon size={17} className="nav-icon" strokeWidth={2} />
                  <span className="nav-text">{group.label}</span>
                </NavLink>
              )}
            </div>
          )
        })}
      </nav>

      <NavLink
        to="/settings/profile"
        className="user-block"
        aria-label="Personal profile"
        title={collapsed ? `${persona.name} — profile` : undefined}
      >
        <span className="avatar">{persona.initials}</span>
        <span className="nav-text">
          <span className="user-name" style={{ display: 'block' }}>
            {persona.name}
          </span>
          <span className="user-role">{persona.role}</span>
        </span>
      </NavLink>
    </aside>
  )
}
