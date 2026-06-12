import Link from 'next/link';
import { redirect } from 'next/navigation';

import { canAccessModule, type ModuleCapability } from '@/lib/auth';
import { getSession } from '@/lib/session';
import { getEventRecord } from '@/lib/event-context';

const DASHBOARD_ACTIONS: Array<{
  href: string;
  label: string;
  title: string;
  body: string;
  capability: ModuleCapability;
}> = [
  {
    href: '/portal/couple',
    label: 'Couple',
    title: 'Approvals, Payments, and Upgrades',
    body: 'Start here for client decisions, open approvals, and shared wedding context.',
    capability: 'couple.workspace'
  },
  {
    href: '/portal/planner',
    label: 'Planner',
    title: 'Timeline, Venue, and Dispatch',
    body: 'Use this lane for timeline control, risk tracking, and event execution orchestration.',
    capability: 'planner.workspace'
  },
  {
    href: '/portal/production',
    label: 'Production',
    title: 'Venue Risks, Equipment, and Cues',
    body: 'Use this lane to resolve blockers and keep run-of-show execution on track.',
    capability: 'production.command'
  },
  {
    href: '/portal/venue',
    label: 'Venue',
    title: 'Venue Intelligence and Constraints',
    body: 'Track venue constraints and operational risk factors tied to the active event.',
    capability: 'venue.intelligence'
  },
  {
    href: '/portal/dj',
    label: 'DJ / MC',
    title: 'Cue Timing and Handoff Control',
    body: 'Run cue sequencing and timing handoffs for ceremony and reception phases.',
    capability: 'dj.booth'
  },
  {
    href: '/portal/vendor',
    label: 'Vendor',
    title: 'Assigned Tasks and Acknowledgements',
    body: 'For photographer, videographer, decor, and partner teams. See load-in notes, timing updates, and assigned coordination actions for this event.',
    capability: 'vendor.coordination'
  },
  {
    href: '/portal/guest',
    label: 'Guest',
    title: 'Schedule, Arrival, and FAQ',
    body: 'Open concierge guidance for schedule, arrival, parking, and day-of guest support.',
    capability: 'guest.concierge'
  }
];

export default async function PortalHomePage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const eventRecord = session.eventId ? await getEventRecord(session.eventId) : null;
  const eventTitle = eventRecord?.title ?? null;
  const visibleActions = DASHBOARD_ACTIONS.filter((action) => canAccessModule(session.role, action.capability));

  return (
    <section className="page-wrap">
      <header className="portal-page-header">
        <span className="eyebrow">Event Command Center</span>
        <h1 className="page-title">Portal Dashboard</h1>
        <p className="page-subtitle">
          {eventTitle
            ? `Active event: ${eventTitle}. Open the workspace lane that matches your operational responsibility.`
            : 'Open the workspace lane that matches your operational responsibility for the active event.'}
        </p>
        <div className="portal-page-kpis">
          <div className="kpi-card">
            <span className="kpi-label">First Priority</span>
            <span className="kpi-value">Clear next action</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Wedding Weekend</span>
            <span className="kpi-value">Multi-day visibility</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Day-of</span>
            <span className="kpi-value">Live changes in one place</span>
          </div>
        </div>
      </header>

      <div className="portal-card-grid" aria-label="Portal workspaces">
        {visibleActions.map((action) => (
          <Link key={action.href} className="card portal-action-card" href={action.href}>
            <div className="card-header">
              <h3>{action.title}</h3>
              <span className="chip">{action.label}</span>
            </div>
            <p>{action.body}</p>
            <span className="portal-action-card__cue">Open workspace</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
