import AtlasIntakeUploader from '@/app/portal/intake/components/AtlasIntakeUploader';

export default function IntakePortalPage() {
  return (
    <section className="page-wrap">
      <header className="portal-page-header">
        <span className="eyebrow">ATLAS CRM Intake</span>
        <h1 className="page-title">Upload Event Intelligence</h1>
        <p className="page-subtitle">
          Centralize contracts, transcripts, emails, and vendor documents per wedding so ATLAS can automate milestones,
          reminders, and role-specific workflows.
        </p>
      </header>

      <div className="portal-card-grid">
        <AtlasIntakeUploader />
        <article className="card">
          <div className="card-header">
            <h3>Recommended Intake Order</h3>
            <span className="chip">Best Practice</span>
          </div>
          <ol className="clean-list">
            <li className="data-row">1. Signed contract (extract payment schedule and obligations)</li>
            <li className="data-row">2. Discovery + planning transcripts (extract goals and constraints)</li>
            <li className="data-row">3. Email threads (extract approvals, due dates, and changes)</li>
            <li className="data-row">4. Vendor docs (extract delivery timelines and dependencies)</li>
          </ol>
        </article>
      </div>
    </section>
  );
}
