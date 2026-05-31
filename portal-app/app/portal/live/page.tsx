import EventTimelineCard from '@/app/portal/components/EventTimelineCard';
import LiveModeCard from '@/app/portal/components/LiveModeCard';

export default function LiveModePage() {
  return (
    <section className="page-wrap">
      <header className="portal-page-header">
        <span className="eyebrow">Day-of Operations</span>
        <h1 className="page-title">Live Mode</h1>
        <p className="page-subtitle">
          Day-of execution command center for planners, family coordinators, and active stakeholders.
        </p>
      </header>

      <div className="portal-card-grid">
        <LiveModeCard />
        <EventTimelineCard />
      </div>
    </section>
  );
}
