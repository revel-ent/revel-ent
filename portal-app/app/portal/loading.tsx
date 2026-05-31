export default function PortalLoading() {
  return (
    <section className="page-wrap">
      <header className="portal-page-header">
        <span className="eyebrow">Loading Workspace</span>
        <h1 className="page-title">Preparing Your Portal View</h1>
        <p className="page-subtitle">Fetching role permissions, timeline context, and live event signals.</p>
      </header>

      <div className="portal-card-grid">
        {Array.from({ length: 3 }).map((_, index) => (
          <article key={index} className="card">
            <div className="skeleton skeleton-line wide" />
            <div className="skeleton skeleton-line mid" />
            <div className="skeleton skeleton-line short" />
          </article>
        ))}
      </div>
    </section>
  );
}
