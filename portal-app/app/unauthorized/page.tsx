import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <main className="container">
      <section className="hero">
        <h1>Access Restricted</h1>
        <p>You do not currently have permission to view that workflow.</p>
      </section>
      <p style={{ textAlign: 'center' }}>
        <Link className="btn primary" href="/login">
          Switch Role
        </Link>
      </p>
    </main>
  );
}
