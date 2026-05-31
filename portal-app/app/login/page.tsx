import ProfileIntentPanel from '@/app/login/components/ProfileIntentPanel';
import { isDemoAuthEnabled } from '@/lib/runtime-flags';

const ERROR_MAP: Record<string, string> = {
  missing_fields: 'Please enter both email and event access code.',
  membership_not_found: 'No event membership was found for those credentials.',
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

  return (
    <main className="container login-landing">
      <section className="login-showcase">
        <div className="login-showcase-head">
          <span className="eyebrow">ATLAS PORTAL by REVEL</span>
          <h1>Seamless Luxury Wedding Operations</h1>
          <p>
            One workspace for couples, planners, decorators, vendors, and family coordinators. Atlas keeps timelines,
            venue constraints, and live execution aligned so decisions happen faster and costly surprises are avoided.
          </p>
        </div>

        <div className="login-value-grid">
          <article className="login-value-card">
            <span className="kpi-label">Efficiency</span>
            <strong className="kpi-value">30% less coordination back-and-forth</strong>
            <p>Role-based guidance and one source of truth for timeline status.</p>
          </article>
          <article className="login-value-card">
            <span className="kpi-label">Trust Layer</span>
            <strong className="kpi-value">Venue-aware recommendations</strong>
            <p>Atlas verifies operational assumptions before they become expensive mistakes.</p>
          </article>
          <article className="login-value-card">
            <span className="kpi-label">Day-Of Clarity</span>
            <strong className="kpi-value">Live mode for high-pressure moments</strong>
            <p>Now/next actions, delay handling, and escalation paths in one screen.</p>
          </article>
        </div>

        <section className="login-audience-card">
          <h3>Built for South Asian Wedding Complexity</h3>
          <p>
            Multi-day celebrations need more than checklists. ATLAS supports parallel ceremonies, vendor handoffs,
            and family-led execution with premium, concierge-level clarity.
          </p>
        </section>
      </section>

      <section className="login-access-panel">
        <article className="card login-form-card">
          <div className="card-header">
            <h3>Secure Sign In</h3>
            <span className="chip">Event Scoped</span>
          </div>
          <p className="card-muted">Enter your email and event access code to continue.</p>

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
            </form>
          ) : (
            <div className="alert error" role="status">
              <strong>Demo access is disabled outside local development.</strong>
            </div>
          )}
        </article>

        {demoAuthEnabled ? (
          <section className="card demo-credentials">
            <div className="card-header">
              <h3>Demo Credentials</h3>
              <span className="chip">Sandbox</span>
            </div>
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
          </section>
        ) : null}

        <ProfileIntentPanel />
      </section>
    </main>
  );
}
