import Link from 'next/link';
import { redirect } from 'next/navigation';

import { canUseIntake, canUseLiveMode, canUseVenueWorkspace } from '@/lib/auth';
import { getSession } from '@/lib/session';
import RoleOrientationPanel from '@/app/portal/components/RoleOrientationPanel';
import DevRoleSwitcher from '@/app/portal/components/DevRoleSwitcher';
import { findEventById, listDemoEvents } from '@/lib/mock-data';
import { isDevRoleSwitchEnabled } from '@/lib/runtime-flags';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const eventRecord = session.eventId ? findEventById(session.eventId) : undefined;
  const eventLabel = eventRecord?.title || 'No active event';
  const demoEvents = listDemoEvents();

  return (
    <div className="portal-shell">
      <header className="portal-nav">
        <div className="portal-nav-inner">
          <div className="portal-brand">
            <strong className="portal-brand-title">ATLAS PORTAL by REVEL</strong>
            <div className="portal-meta">
              <span className="badge">User: {session.displayName}</span>
              <span className="badge">Role: {session.role}</span>
              <span className="badge">Event: {eventLabel}</span>
            </div>
          </div>
          <nav className="portal-nav-links" aria-label="Portal navigation">
            {isDevRoleSwitchEnabled() ? (
              <div className="portal-nav-controls">
                <DevRoleSwitcher currentRole={session.role} currentEventId={session.eventId} events={demoEvents} />
              </div>
            ) : null}
            <div className="portal-route-links">
              <Link className="portal-nav-link" href="/portal">
                Dashboard
              </Link>
              <Link className="portal-nav-link" href="/portal/onboarding">
                Onboarding
              </Link>
              {canUseIntake(session.role) ? (
                <Link className="portal-nav-link" href="/portal/intake">
                  Intake
                </Link>
              ) : null}
              {canUseLiveMode(session.role) ? (
                <Link className="portal-nav-link" href="/portal/live">
                  Live Mode
                </Link>
              ) : null}
              {canUseVenueWorkspace(session.role) ? (
                <Link className="portal-nav-link" href="/portal/venue">
                  Venue
                </Link>
              ) : null}
              <form action="/api/auth/logout" method="POST">
                <button className="portal-nav-link" type="submit">
                  Logout
                </button>
              </form>
            </div>
          </nav>
        </div>
      </header>
      <main className="container">
        <RoleOrientationPanel sessionRole={session.role} displayName={session.displayName} />
        {children}
      </main>
    </div>
  );
}
