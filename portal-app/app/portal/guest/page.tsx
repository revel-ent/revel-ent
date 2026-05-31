import GuestConciergeTool from '@/app/portal/guest/components/GuestConciergeTool';
import GuestExperienceHub from '@/app/portal/guest/components/GuestExperienceHub';
import EventTimelineCard from '@/app/portal/components/EventTimelineCard';
import LiveModeCard from '@/app/portal/components/LiveModeCard';

export default function GuestPortalPage() {
  return (
    <section className="page-wrap">
      <header className="portal-page-header">
        <span className="eyebrow">Guest Concierge</span>
        <h1 className="page-title">Stay Informed, Arrive Prepared</h1>
        <p className="page-subtitle">Read-only event guidance: schedule, attire notes, arrival tips, and FAQ.</p>
      </header>

      <div className="portal-card-grid">
        <GuestExperienceHub />
        <GuestConciergeTool />
        <EventTimelineCard />
        <LiveModeCard />
      </div>
    </section>
  );
}
