import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getSession } from '@/lib/session';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="portal-shell">
      <header className="portal-nav">
        <div className="portal-nav-inner">
          <div>
            <strong>REVEL Portal</strong>
            <span style={{ marginLeft: '0.6rem' }} className="badge">
              user: {session.displayName}
            </span>
            <span style={{ marginLeft: '0.6rem' }} className="badge">
              role: {session.role}
            </span>
            <span style={{ marginLeft: '0.45rem' }} className="badge">
              event: {session.eventId || 'n/a'}
            </span>
          </div>
          <nav className="portal-nav-links">
            <Link className="btn" href="/portal">
              Dashboard
            </Link>
            <Link className="btn" href="/portal/onboarding">
              Onboarding
            </Link>
            <Link className="btn" href="/portal/live">
              Live Mode
            </Link>
            <Link className="btn" href="/portal/couple">
              Couple
            </Link>
            <Link className="btn" href="/portal/planner">
              Planner
            </Link>
            <Link className="btn" href="/portal/vendor">
              Vendor
            </Link>
            <Link className="btn" href="/portal/guest">
              Guest
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button className="btn" type="submit">
                Logout
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}
