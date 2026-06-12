import Link from 'next/link';
import { redirect } from 'next/navigation';

import { canAccessModule } from '@/lib/auth';
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
  const isCoupleView = session.role === 'couple';

  return (
    <div className="portal-shell">
      <header className={`portal-nav${isCoupleView ? ' portal-nav--couple' : ''}`}>
        <div className="portal-nav-inner">
          <div className="portal-brand">
            <strong className="portal-brand-title">ATLAS</strong>
            {!isCoupleView ? (
              <div className="portal-meta">
                <span className="badge">User: {session.displayName}</span>
                <span className="badge">Role: {session.role}</span>
                <span className="badge">Event: {eventLabel}</span>
              </div>
            ) : null}
          </div>
          <nav className="portal-nav-links">
            {isDevRoleSwitchEnabled() && !isCoupleView ? (
              <DevRoleSwitcher currentRole={session.role} currentEventId={session.eventId} events={demoEvents} />
            ) : null}
            {isCoupleView ? null : (
              <>
                <Link className="portal-nav-link" href="/portal">
                  Dashboard
                </Link>
                {canAccessModule(session.role, 'onboarding.workspace') ? (
                  <Link className="portal-nav-link" href="/portal/onboarding">
                    Onboarding
                  </Link>
                ) : null}
                {canAccessModule(session.role, 'intake.workspace') ? (
                  <Link className="portal-nav-link" href="/portal/intake">
                    Intake
                  </Link>
                ) : null}
                {canAccessModule(session.role, 'live.command') ? (
                  <Link className="portal-nav-link" href="/portal/live">
                    Live Mode
                  </Link>
                ) : null}
                {canAccessModule(session.role, 'production.command') ? (
                  <Link className="portal-nav-link" href="/portal/production">
                    Production
                  </Link>
                ) : null}
                {canAccessModule(session.role, 'venue.intelligence') ? (
                  <Link className="portal-nav-link" href="/portal/venue">
                    Venue
                  </Link>
                ) : null}
                {canAccessModule(session.role, 'dj.booth') ? (
                  <Link className="portal-nav-link" href="/portal/dj">
                    DJ / MC
                  </Link>
                ) : null}
              </>
            )}
            <form action="/api/auth/logout" method="POST">
              <button className="portal-nav-link" type="submit">
                Logout
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="container">
        {!isCoupleView ? <RoleOrientationPanel sessionRole={session.role} displayName={session.displayName} /> : null}
        {children}
      </main>
    </div>
  );
}
