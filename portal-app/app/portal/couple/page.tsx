import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { findEventById } from '@/lib/mock-data';
import { getClientPlanForEvent, formatDate, getDaysUntil } from '@/lib/mock-client-milestones';
import ClientPaymentPanel from '@/app/portal/couple/components/ClientPaymentPanel';
import ClientTodoPanel from '@/app/portal/couple/components/ClientTodoPanel';
import ClientUpgradesPanel from '@/app/portal/couple/components/ClientUpgradesPanel';
import EventTimelineCard from '@/app/portal/components/EventTimelineCard';

export default async function CouplePortalPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const event = session.eventId ? findEventById(session.eventId) : undefined;
  const plan = session.eventId ? getClientPlanForEvent(session.eventId) : undefined;

  const primaryDate = plan?.primaryDates[0];
  const dayCount = primaryDate ? getDaysUntil(primaryDate) : null;

  return (
    <section className="page-wrap">
      <header className="portal-page-header">
        <span className="eyebrow">Your Wedding Portal</span>
        <h1 className="page-title">
          {event?.title ?? 'Your Wedding'}
        </h1>
        <div className="couple-event-meta">
          {event?.venueName && (
            <span className="couple-meta-chip">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M7 1.5C5.07 1.5 3.5 3.07 3.5 5c0 2.63 3.5 7 3.5 7s3.5-4.37 3.5-7c0-1.93-1.57-3.5-3.5-3.5zm0 4.75a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" fill="currentColor"/>
              </svg>
              {event.venueName}
            </span>
          )}
          {plan && (
            <span className="couple-meta-chip">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                <path d="M1.5 5.5h11" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M4.5 1.5v2M9.5 1.5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {plan.primaryDates.map((d) => formatDate(d)).join(' & ')}
            </span>
          )}
          {plan && (
            <span className="couple-meta-chip">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                <path d="M7 4v3.5l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {event?.guestCountEstimate} guests
            </span>
          )}
          {dayCount !== null && dayCount > 0 && (
            <span className="couple-meta-chip couple-meta-chip--countdown">
              {dayCount} days away
            </span>
          )}
        </div>
      </header>

      {!plan && (
        <div className="portal-notice">
          <strong>Your event plan is being prepared.</strong> Your REVEL team will have your full dashboard ready within 24 hours of contract signing.
        </div>
      )}

      {plan && (
        <>
          <div className="couple-dashboard-grid">
            <ClientPaymentPanel plan={plan} />
            <ClientTodoPanel plan={plan} />
            <ClientUpgradesPanel plan={plan} />
            <EventTimelineCard />
          </div>

          <section className="couple-premium-grid" aria-label="Premium production highlights">
            <article className="couple-premium-card">
              <div className="couple-premium-card__header">
                <span className="couple-premium-card__eyebrow">Procession Signature</span>
                <h2 className="couple-premium-card__title">Baraat Mobile Production &amp; FX</h2>
              </div>
              <p className="couple-premium-card__body">
                Ensure high-impact energy for the procession with completely wireless, festival-grade audio and visual
                effects.
              </p>
              <ul className="couple-premium-card__list">
                <li>High-Fidelity Distributed Audio (Zero-Drop Wireless)</li>
                <li>Dedicated MC &amp; Dhol Integration</li>
                <li>Precision Procession Cueing</li>
                <li>Cold Spark Fountains &amp; Atmospheric FX</li>
              </ul>
              <a className="couple-premium-card__cta" href="#premium-upgrades">
                Explore Baraat Upgrades
              </a>
            </article>

            <article className="couple-premium-card">
              <div className="couple-premium-card__header">
                <span className="couple-premium-card__eyebrow">Ballroom Transformation</span>
                <h2 className="couple-premium-card__title">Intelligent Reception Architecture</h2>
              </div>
              <p className="couple-premium-card__body">
                Transform your ballroom with custom light mapping and club-tier sound reinforcement spanning grand
                entrance through after-party.
              </p>
              <ul className="couple-premium-card__list">
                <li>Line-Array Audio &amp; Subwoofer Extension</li>
                <li>Geometric LED Wall Integration</li>
                <li>Pixel-Mapped Architectural Uplighting</li>
                <li>Moving-Head Spotlights (Entrance &amp; First Dance Tracking)</li>
              </ul>
              <a className="couple-premium-card__cta" href="#premium-upgrades">
                View Atmosphere Packages
              </a>
            </article>
          </section>
        </>
      )}
    </section>
  );
}
