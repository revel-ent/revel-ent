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
  event_access_ended: 'Access for this event has ended. Contact your planner or admin if you still need in.',
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

  const hasPrefilledInvite = Boolean(tokenFromUrl && emailFromUrl);

  return (
    <main className="container login-landing">
      <section className="login-showcase">
        <div className="login-showcase-head">
          <span className="eyebrow">Atlas by Revel</span>
          <h1>Where your celebration comes together</h1>
          <p>
            Your timeline, your music, your team — one beautiful place for everyone who is making your weekend
            unforgettable.
          </p>
        </div>

        <div className="login-value-grid">
          <article className="login-value-card">
            <strong className="kpi-value">Always know what&apos;s next</strong>
            <p>One clear next step at a time — never a to-do list avalanche.</p>
          </article>
          <article className="login-value-card">
            <strong className="kpi-value">Your whole team, in step</strong>
            <p>Planner, DJ, and decorator see the same plan you do. Nothing slips.</p>
          </article>
          <article className="login-value-card">
            <strong className="kpi-value">Calm on the big day</strong>
            <p>Every cue and moment choreographed before you walk in.</p>
          </article>
        </div>
      </section>

      <section className="login-access-panel">
        <article className="card login-form-card">
          <div className="card-header">
            <h3>{hasPrefilledInvite ? 'Welcome back' : 'Your Private Access'}</h3>
          </div>
          <p className="card-muted">
            {hasPrefilledInvite
              ? 'Your details are already filled in — one tap and you are in.'
              : 'Use the personal link from your invitation, or enter your details below.'}
          </p>

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
                <input id="email" name="email" type="email" placeholder="you@example.com" defaultValue={emailFromUrl} required />
              </div>

              <div>
                <label htmlFor="inviteToken">Access Code</label>
                <input id="inviteToken" name="inviteToken" type="text" placeholder="From your invitation" defaultValue={tokenFromUrl} required />
              </div>

              <button className="btn primary" type="submit">
                {hasPrefilledInvite ? 'Continue' : 'Continue to Atlas'}
              </button>
            </form>
          ) : (
            <div className="alert error" role="status">
              <strong>Sign-in is being set up. Please try again shortly or contact your planner.</strong>
            </div>
          )}

          <p className="card-muted">
            Atlas is invite-only. If you need access, ask your planner or the couple to send you a personal link.
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
