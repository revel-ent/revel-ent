import { formatDate } from '@/lib/mock-client-milestones';

// Couple-facing timeline view. Until the planning team publishes a real day-of
// timeline, this stays a calm placeholder — never auto-generated times the
// couple might mistake for their actual schedule.
export default function CoupleTimelinePanel({
  plannerName,
  eventDates
}: {
  plannerName?: string | null;
  eventDates: string[];
}) {
  return (
    <article className="client-panel concierge-timeline-panel">
      <div className="client-panel__header">
        <div>
          <h2 className="client-panel__title">Your Weekend Timeline</h2>
          <p className="client-panel__sub">The minute-by-minute flow of your celebration, crafted around you.</p>
        </div>
      </div>

      <div className="concierge-timeline-wait">
        <p className="concierge-timeline-wait__lead">
          {plannerName ? `${plannerName} is` : 'Your planning team is'} crafting your personalized timeline for{' '}
          {eventDates.map((d) => formatDate(d)).join(' & ')}.
        </p>
        <p className="concierge-timeline-wait__body">
          It will appear right here for your review the moment it&apos;s ready — and we&apos;ll reach out so you never
          have to check back. Nothing is needed from you yet.
        </p>
      </div>
    </article>
  );
}
