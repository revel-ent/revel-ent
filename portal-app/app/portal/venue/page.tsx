import VenueTaskWindowPanel from '@/app/portal/venue/components/VenueTaskWindowPanel';
import EventTimelineCard from '@/app/portal/components/EventTimelineCard';
import LiveModeCard from '@/app/portal/components/LiveModeCard';

export default function VenueWorkspacePage() {
  return (
    <section className="page-wrap">
      <header className="portal-page-header">
        <span className="eyebrow">Venue Workspace</span>
        <h1 className="page-title">Compliance and Operations Alignment</h1>
        <p className="page-subtitle">
          Confirm access windows, publish advisories, and keep venue constraints visible to planners and execution teams.
        </p>
      </header>

      <div className="portal-card-grid">
        <VenueTaskWindowPanel />
        <article className="card">
          <div className="card-header">
            <h3>Compliance Checklist</h3>
            <span className="chip">Venue</span>
          </div>
          <p>Track insurance docs, load-in policies, noise limits, and cutoff times.</p>
        </article>

        <article className="card">
          <div className="card-header">
            <h3>Access Windows</h3>
            <span className="chip">Timeline Slice</span>
          </div>
          <p>Confirm setup, turnover, and strike windows so downstream teams can execute without surprises.</p>
        </article>

        <article className="card">
          <div className="card-header">
            <h3>Venue Advisories</h3>
            <span className="chip">Pilot</span>
          </div>
          <p>Publish constrained updates (parking, route, weather contingencies) to the right roles at the right time.</p>
        </article>

        <EventTimelineCard />
        <LiveModeCard />
      </div>
    </section>
  );
}
