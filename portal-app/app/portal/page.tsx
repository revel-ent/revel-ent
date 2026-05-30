export default function PortalHomePage() {
  return (
    <section>
      <h1 style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Portal Dashboard
      </h1>
      <p style={{ color: '#4e4339' }}>
        This is the protected shell for event-scoped workflows. Use role pages for role-specific modules.
      </p>

      <div className="grid">
        <article className="card">
          <h3>Fusion Flow Intake</h3>
          <p>Collect cultural blend and event priorities with assumptions logging.</p>
        </article>
        <article className="card">
          <h3>Venue Analyzer Workflow</h3>
          <p>Attach constraints, risk flags, and trust metadata to venue records.</p>
        </article>
        <article className="card">
          <h3>Coordination Feed</h3>
          <p>Track timeline updates and acknowledgements by participant role.</p>
        </article>
      </div>
    </section>
  );
}
