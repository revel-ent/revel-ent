import { isDemoAuthEnabled, isLocalDevelopmentEnvironment } from '@/lib/runtime-flags';

const ERROR_MAP: Record<string, string> = {
  missing_fields: 'Please enter both email and your invite code.',
  invalid_credentials: 'No account was found for that email and invite code.',
  configuration_error:
    'Portal login is temporarily unavailable due to server configuration. Please contact support.'
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
  const localDev = isLocalDevelopmentEnvironment();

  return (
    <main className="container login-landing">
      <section className="login-showcase">
        <div className="login-showcase-head">
          <span className="eyebrow">Atlas</span>
          <h1>Welcome to Atlas</h1>
          <p>
            Sign in to your event workspace for timeline control, venue intelligence, and day-of coordination across
            your full wedding circle.
          </p>
        </div>

        <div className="login-value-grid">
          <article className="login-value-card">
            <span className="kpi-label">Efficiency</span>
            <strong className="kpi-value">Fewer handoff delays</strong>
            <p>One source of truth for couple, planner, vendor, and family workflows.</p>
          </article>
          <article className="login-value-card">
            <span className="kpi-label">Trust Layer</span>
            <strong className="kpi-value">Venue-aware planning confidence</strong>
            <p>Atlas checks operational assumptions before they become expensive surprises.</p>
          </article>
          <article className="login-value-card">
            <span className="kpi-label">Day-Of Clarity</span>
            <strong className="kpi-value">Decisive event-day execution</strong>
            <p>Now/next actions, delay handling, and escalation paths in one command view.</p>
          </article>
        </div>

        <section className="login-audience-card">
          <h3>Built for Complex, Multi-Day Weddings</h3>
          <p>
            Atlas is built as an independent operations platform. Revel-managed events include access, and independent
            workspaces are fully supported through event-scoped permissions and billing.
          </p>
        </section>
      </section>

      <section className="login-access-panel">
        <article className="card login-form-card">
          <div className="card-header">
            <h3>Secure Event Access</h3>
            <span className="chip">Event Scoped</span>
          </div>
          <p className="card-muted">Use your personal invite credentials. Your workspace is resolved after sign-in.</p>

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
                <label htmlFor="inviteCode">Invite Code</label>
                <input id="inviteCode" name="inviteCode" type="text" placeholder="ATLAS-PLN-MAULIN-2026" required />
              </div>

              <button className="btn primary" type="submit">
                Continue to Portal
              </button>
            </form>
          ) : (
            <div className="alert error" role="status">
              <strong>Portal sign-in is temporarily unavailable in this environment.</strong>
            </div>
          )}

          <p className="card-muted">
            New to Atlas? Account creation and independent workspace onboarding are invite-based in this release.
          </p>
        </article>

        {demoAuthEnabled && localDev ? (
          <details className="card login-dev-details">
            <summary>
              <span>Local Access Profiles</span>
              <span className="chip">Development</span>
            </summary>
            <div className="demo-credential-list">
              <p>
                <strong>Admin:</strong> jigar@revel-ent.com + ATLAS-ADM-JIGAR-2026
              </p>
              <p>
                <strong>Planner:</strong> maulin@revel-ent.com + ATLAS-PLN-MAULIN-2026
              </p>
              <p>
                <strong>Couple:</strong> jayati@example.com + ATLAS-CPL-JAYATI-2026
              </p>
              <p>
                <strong>Vendor:</strong> heckno@revel-ent.com + ATLAS-VND-HECKNO-2026
              </p>
              <p>
                <strong>Guest:</strong> guestfamily@example.com + ATLAS-GST-FAMILY-2026
              </p>
              <p>
                <strong>Family Coordinator:</strong> priya@example.com + ATLAS-DEL-PRIYA-2026
              </p>
              <p>
                <strong>Venue Coordinator:</strong> anita.venue@example.com + ATLAS-VEN-ANITA-2026
              </p>
            </div>
          </details>
        ) : null}
      </section>
    </main>
  );
}
