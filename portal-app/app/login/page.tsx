import { isLocalDevelopmentEnvironment } from '@/lib/runtime-flags';
import { isSupabaseConfigured } from '@/lib/supabase-server';

const ERROR_MAP: Record<string, string> = {
  missing_fields: 'Please enter both email and your invite token.',
  invalid_credentials: 'No account was found for that email and invite token.',
  invalid_invite_token: 'This invite token is not valid. Confirm the latest invite link or token and try again.',
  invite_email_mismatch: 'This invite token does not match the email entered.',
  invite_revoked: 'This invite has been revoked. Ask your planner or admin to resend a new invite.',
  invite_expired: 'This invite has expired. Ask your planner or admin to resend a fresh invite.',
  invite_already_accepted: 'This invite was already accepted. Sign in with your active access email.',
  invite_lifecycle_requires_supabase: 'Invite acceptance is not configured in this environment yet.',
  configuration_error: 'Portal login is temporarily unavailable due to server configuration. Please contact support.'
};

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; next?: string; token?: string; email?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const errorCode = resolvedSearchParams?.error || '';
  const errorMessage = ERROR_MAP[errorCode] || '';
  const requestedNext = resolvedSearchParams?.next || '/portal';
  const nextPath = requestedNext.startsWith('/portal') ? requestedNext : '/portal';
  const tokenFromUrl = resolvedSearchParams?.token || '';
  const emailFromUrl = resolvedSearchParams?.email || '';
  const supabaseConfigured = isSupabaseConfigured();
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

          {supabaseConfigured ? (
            <form className="form-grid" action="/api/auth/accept-invite" method="POST">
              <input type="hidden" name="next" value={nextPath} />

              <div>
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" placeholder="akshay.rani1128@gmail.com" defaultValue={emailFromUrl} required />
              </div>

              <div>
                <label htmlFor="inviteToken">Invite Token</label>
                <input id="inviteToken" name="inviteToken" type="text" placeholder="Paste invite token" defaultValue={tokenFromUrl} required />
              </div>

              <button className="btn primary" type="submit">
                Accept Invite and Continue
              </button>
            </form>
          ) : (
            <div className="alert error" role="status">
              <strong>Invite acceptance is not configured in this environment. Configure Supabase to continue.</strong>
            </div>
          )}

          <p className="card-muted">
            New to Atlas? Account creation and independent workspace onboarding are invite-based in this release.
          </p>
        </article>

        {localDev ? (
          <details className="card login-dev-details">
            <summary>
              <span>Local Access Profiles</span>
              <span className="chip">Development</span>
            </summary>
            <div className="demo-credential-list">
              <p>
                <strong>Admin:</strong> jigar@revel-ent.com
              </p>
              <p>
                <strong>Planner:</strong> maulin@revel-ent.com
              </p>
              <p>
                <strong>Couple (Jayati & Uppal):</strong> jayati@example.com
              </p>
              <p>
                <strong>Vendor:</strong> heckno@revel-ent.com
              </p>
              <p>
                <strong>Guest:</strong> guestfamily@example.com
              </p>
              <p>
                <strong>Family Coordinator:</strong> priya@example.com
              </p>
              <p>
                <strong>Venue Coordinator:</strong> anita.venue@example.com
              </p>
              <p>
                Use invite token from invite creation/resend response or invite link query param.
              </p>
            </div>
          </details>
        ) : null}
      </section>
    </main>
  );
}
