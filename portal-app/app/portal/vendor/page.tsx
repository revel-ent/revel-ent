import CoordinationFeedPanel from '@/app/portal/vendor/components/CoordinationFeedPanel';
import VendorMilestoneBoard from '@/app/portal/vendor/components/VendorMilestoneBoard';
import EventTimelineCard from '@/app/portal/components/EventTimelineCard';
import LiveModeCard from '@/app/portal/components/LiveModeCard';

export default function VendorPortalPage() {
  return (
    <section className="page-wrap">
      <header className="portal-page-header">
        <span className="eyebrow">Vendor Workspace</span>
        <h1 className="page-title">Assigned Tasks and Execution Feed</h1>
        <p className="page-subtitle">Assigned-event tasks, load-in notes, timing updates, and acknowledgement feed.</p>
      </header>

      <div className="portal-card-grid">
        <VendorMilestoneBoard />
        <CoordinationFeedPanel />
        <EventTimelineCard />
        <LiveModeCard />
      </div>
    </section>
  );
}
