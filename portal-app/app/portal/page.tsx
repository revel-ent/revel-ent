import Link from 'next/link';

const DASHBOARD_ACTIONS = [
  {
    href: '/portal/couple',
    label: 'Couple',
    title: 'Approvals, Payments, and Upgrades',
    body: 'Start here for what needs a client decision, what is due, and which production add-ons are under review.'
  },
  {
    href: '/portal/planner',
    label: 'Planner',
    title: 'Timeline, Venue, and Dispatch',
    body: 'Use this lane for venue intelligence, production risks, and active coordination across vendors.'
  },
  {
    href: '/portal/vendor',
    label: 'Vendor',
    title: 'Assigned Tasks and Acknowledgements',
    body: 'See load-in notes, timing updates, and the coordination feed without digging through message threads.'
  },
  {
    href: '/portal/guest',
    label: 'Guest',
    title: 'Schedule, Arrival, and FAQ',
    body: 'Open the concierge view for attire, arrival, parking, and day-of questions guests ask most often.'
  }
];

export default function PortalHomePage() {
  return (
    <section className="page-wrap">
      <header className="portal-page-header">
        <span className="eyebrow">Event Command Center</span>
        <h1 className="page-title">Portal Dashboard</h1>
        <p className="page-subtitle">
          Choose the lane that matches what you need to do right now. Each workspace keeps its own decisions, updates,
          and day-of actions focused.
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
        {DASHBOARD_ACTIONS.map((action) => (
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
