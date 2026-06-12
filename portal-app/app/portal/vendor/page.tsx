import { redirect } from 'next/navigation';

import { getSession } from '@/lib/session';
import CoordinationFeedPanel from '@/app/portal/vendor/components/CoordinationFeedPanel';
import VendorMilestoneBoard from '@/app/portal/vendor/components/VendorMilestoneBoard';
import ShareWithCouplePanel from '@/app/portal/vendor/components/ShareWithCouplePanel';
import EventTimelineCard from '@/app/portal/components/EventTimelineCard';
import LiveModeCard from '@/app/portal/components/LiveModeCard';

export default async function VendorPortalPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const isDecorator = session.role === 'decorator';

  const eyebrow = isDecorator ? 'Decorator Workspace' : 'Vendor Workspace';
  const title = isDecorator
    ? 'Design Coordination and Vision Sharing'
    : 'Vendor Team Tasks and Execution Feed';
  const subtitle = isDecorator
    ? 'Your assigned coordination tasks, event timeline, and tools to share your vision board directly with the couple.'
    : 'For photographer, videographer, decor, and partner teams: assigned-event tasks, load-in notes, timing updates, and acknowledgement feed.';

  return (
    <section className="page-wrap">
      <header className="portal-page-header">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </header>

      {isDecorator ? <ShareWithCouplePanel /> : null}

      <div className="portal-card-grid">
        <VendorMilestoneBoard />
        <CoordinationFeedPanel />
        <EventTimelineCard />
        <LiveModeCard />
      </div>
    </section>
  );
}
