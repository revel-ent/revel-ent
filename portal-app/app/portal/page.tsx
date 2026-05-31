export default function PortalHomePage() {
  return (
    <section className="page-wrap">
      <header className="portal-page-header">
        <span className="eyebrow">Event Command Center</span>
        <h1 className="page-title">Portal Dashboard</h1>
        <p className="page-subtitle">
          This workspace keeps every planning stream aligned, from onboarding to day-of execution. Enter the role pages
          below to run specific workflows.
        </p>
        <div className="portal-page-kpis">
          <div className="kpi-card">
            <span className="kpi-label">Decision Speed</span>
            <span className="kpi-value">Faster venue-fit approvals</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Coordination</span>
            <span className="kpi-value">Shared timeline + alerts</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Execution</span>
            <span className="kpi-value">Live mode for day-of changes</span>
          </div>
        </div>
      </header>

      <div className="portal-card-grid">
        <article className="card">
          <div className="card-header">
            <h3>Fusion Flow Intake</h3>
            <span className="chip">Couple</span>
          </div>
          <p>Collect cultural blend and event priorities with assumptions logging.</p>
        </article>
        <article className="card">
          <div className="card-header">
            <h3>Venue Analyzer Workflow</h3>
            <span className="chip">Planner</span>
          </div>
          <p>Attach constraints, risk flags, and trust metadata to venue records.</p>
        </article>
        <article className="card">
          <div className="card-header">
            <h3>Coordination Feed</h3>
            <span className="chip">Vendor</span>
          </div>
          <p>Track timeline updates and acknowledgements by participant role.</p>
        </article>
      </div>
    </section>
  );
}
