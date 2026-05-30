import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container">
      <section className="hero">
        <h1>REVEL Portal App Scaffold</h1>
        <p>
          This app is the authenticated build surface for event-scoped, role-based workflows.
          Your live marketing site stays separate while this layer handles protected operations.
        </p>
      </section>

      <div className="grid">
        <article className="card">
          <h3>Event-Scoped Access</h3>
          <p>Users are granted role permissions only for weddings they are assigned to.</p>
        </article>
        <article className="card">
          <h3>Role Guards</h3>
          <p>Routes are restricted by role to prevent data leaks across participants.</p>
        </article>
        <article className="card">
          <h3>Next Step</h3>
          <p>Implement real auth provider and persist role/event claims from your backend.</p>
        </article>
      </div>

      <p style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link className="btn primary" href="/login">
          Open Mock Login
        </Link>
      </p>
    </main>
  );
}
