import ProductionWorkspacePanel from '@/app/portal/production/components/ProductionWorkspacePanel';

export default function ProductionPortalPage() {
  return (
    <section className="page-wrap">
      <header className="portal-page-header">
        <span className="eyebrow">Production Workspace</span>
        <h1 className="page-title">Production Command and Cue Readiness</h1>
        <p className="page-subtitle">
          Monitor venue constraints, equipment readiness, and cue health in one execution-focused workspace.
        </p>
      </header>

      <ProductionWorkspacePanel />
    </section>
  );
}
