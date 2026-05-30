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

  return (
    <main className="container">
      <section className="hero">
        <h1>Portal Login</h1>
        <p>
          Membership-based login for event-scoped access. Enter your email and event access code.
        </p>
      </section>

      {errorMessage ? (
        <p style={{ color: '#7a1f1f', textAlign: 'center', marginTop: '1rem' }}>{errorMessage}</p>
      ) : null}

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

      <section className="card demo-credentials" style={{ maxWidth: '560px', margin: '1rem auto 0' }}>
        <h3>Demo Credentials</h3>
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
      </section>
    </main>
  );
}
