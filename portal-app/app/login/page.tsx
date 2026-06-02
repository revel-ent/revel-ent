import { isDemoAuthEnabled } from '@/lib/runtime-flags';

const ERROR_MAP: Record<string, string> = {
  missing_fields: 'Please enter both email and event access code.',
  membership_not_found: 'No event membership was found for those credentials.',
  configuration_error:
    'Portal login is temporarily unavailable due to server configuration. Please contact support.'
};

const WORKSPACE_OPTIONS = [
  { href: '/login?next=%2Fportal%2Fcouple', label: 'Couple', path: '/portal/couple' },
  { href: '/login?next=%2Fportal%2Fplanner', label: 'Planner', path: '/portal/planner' },
  { href: '/login?next=%2Fportal%2Fvendor', label: 'Vendor', path: '/portal/vendor' },
  { href: '/login?next=%2Fportal%2Fguest', label: 'Guest', path: '/portal/guest' }
];

const DESTINATION_LABELS: Record<string, string> = {
  '/portal': 'Portal dashboard',
  '/portal/couple': 'Couple workspace',
  '/portal/planner': 'Planner workspace',
  '/portal/vendor': 'Vendor workspace',
  '/portal/guest': 'Guest concierge'
};

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; next?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const errorCode = resolvedSearchParams?.error || '';
  const errorMessage = ERROR_MAP[errorCode] || '';
  const requestedNext = resolvedSearchParams?.next || '/portal';
  const nextPath = requestedNext.startsWith('/portal') ? requestedNext : '/portal';
  const demoAuthEnabled = isDemoAuthEnabled();
  const destinationLabel = DESTINATION_LABELS[nextPath] || 'Portal dashboard';

  return (
    <main className="container login-landing">
      <section className="login-showcase">
        <div className="login-showcase-head">
          <span className="eyebrow">ATLAS PORTAL by REVEL</span>
          <h1>One Calm Place for the Wedding Weekend</h1>
          <p>
            Sign in for approvals, payment visibility, timeline changes, and day-of coordination across your full
            event circle.
          </p>
        </div>

        <div className="login-priority-list" aria-label="Portal priorities">
          <div>
            <span className="kpi-label">Couples</span>
            <strong>Approve what matters next.</strong>
          </div>
          <div>
            <span className="kpi-label">Planners</span>
            <strong>See risks before they hit the timeline.</strong>
          </div>
          <div>
            <span className="kpi-label">Families + Guests</span>
            <strong>Get clear answers without group-chat noise.</strong>
          </div>
        </div>

        <section className="login-audience-card">
          <h3>Built for South Asian Wedding Complexity</h3>
          <p>
            Multi-day schedules, baraat logistics, vendor load-ins, family coordinators, and guest movement all stay
            visible without making every person learn every workflow.
          </p>
        </section>
      </section>

      <section className="login-access-panel">
        <article className="card login-form-card">
          <div className="card-header">
            <h3>Sign In to Your Event</h3>
            <span className="chip">Private</span>
          </div>
          <p className="card-muted">Use your email and event code. We will open the right workspace after sign-in.</p>

          {errorMessage ? (
            <div className="alert error">
              <strong>{errorMessage}</strong>
            </div>
          ) : null}

          {demoAuthEnabled ? (
            <form className="form-grid" action="/api/auth/mock-login" method="POST">
              <input type="hidden" name="next" value={nextPath} />

              <div>
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" placeholder="maulin@revel-ent.com" required />
              </div>

              <div>
                <label htmlFor="eventCode">Event Access Code</label>
                <input id="eventCode" name="eventCode" type="text" placeholder="REVEL-NOV-2026" required />
              </div>

              <button className="btn primary" type="submit">
                Continue to Portal
              </button>

              <p className="login-destination-note">Next stop: {destinationLabel}</p>
            </form>
          ) : (
            <div className="alert error" role="status">
              <strong>Portal sign-in is temporarily unavailable in this environment.</strong>
            </div>
          )}

          <div className="login-workspace-picker">
            <span className="kpi-label">Open a specific workspace</span>
            <div className="login-role-shortcuts" aria-label="Workspace shortcuts">
              {WORKSPACE_OPTIONS.map((option) => (
                <a
                  key={option.path}
                  className="login-role-link"
                  href={option.href}
                  aria-current={nextPath === option.path ? 'page' : undefined}
                >
                  {option.label}
                </a>
              ))}
            </div>
          </div>
        </article>

        {demoAuthEnabled ? (
          <details className="card demo-credentials login-dev-details">
            <summary>
              <span>Local access profiles</span>
              <span className="chip">Development</span>
            </summary>
            <div className="demo-credential-list">
              <p>
                <strong>Admin:</strong> jigar@revel-ent.com + REVEL-NOV-2026
              </p>
              <p>
                <strong>Planner:</strong> maulin@revel-ent.com + REVEL-NOV-2026
              </p>
              <p>
                <strong>Couple:</strong> jayati@example.com + REVEL-NOV-2026
              </p>
              <p>
                <strong>Vendor:</strong> heckno@revel-ent.com + REVEL-NOV-2026
              </p>
              <p>
                <strong>Guest:</strong> guestfamily@example.com + REVEL-NOV-2026
              </p>
              <p>
                <strong>Family Coordinator:</strong> priya@example.com + REVEL-NOV-2026
              </p>
              <p>
                <strong>Venue Coordinator:</strong> anita.venue@example.com + REVEL-NOV-2026
              </p>
            </div>
          </details>
        ) : null}
      </section>
    </main>
  );
}
