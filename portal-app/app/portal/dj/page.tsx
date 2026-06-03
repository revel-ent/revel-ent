import DjMusicProfilePanel from '@/app/portal/dj/components/DjMusicProfilePanel';
import EventTimelineCard from '@/app/portal/components/EventTimelineCard';
import LiveModeCard from '@/app/portal/components/LiveModeCard';

export default function DjPortalPage() {
  return (
    <section className="page-wrap">
      <header className="portal-page-header">
        <span className="eyebrow">DJ / MC Workspace</span>
        <h1 className="page-title">Music Profile and Cue Alignment</h1>
        <p className="page-subtitle">Structured couple music preferences arrive here automatically without email, PDF handoff, or manual forwarding.</p>
      </header>

      <div className="portal-card-grid">
        <DjMusicProfilePanel />
        <EventTimelineCard />
        <LiveModeCard />
      </div>
    </section>
  );
}