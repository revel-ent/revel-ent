import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container">
      <section className="hero">
        <h1>REVEL Event Portal</h1>
        <p>
          Secure, role-aware workspace for couples, planners, vendors, and guests. Track timelines,
          approvals, and event-day execution in one coordinated command center.
        </p>
      </section>

      <div className="grid">
        <article className="card">
          <h3>Role-Based Access</h3>
          <p>Every user sees only the workflows mapped to their event role and responsibilities.</p>
        </article>
        <article className="card">
          <h3>Operational Clarity</h3>
          <p>From onboarding to live mode, teams coordinate from a shared, trusted source of truth.</p>
        </article>
        <article className="card">
          <h3>Concierge Experience</h3>
          <p>Premium planning guidance, decisive escalation paths, and faster approvals at every phase.</p>
        </article>
      </div>

      <p style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link className="btn primary" href="/login">
          Enter Portal
        </Link>
      </p>
    </main>
  );
}
