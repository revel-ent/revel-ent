import VenueAnalyzerTool from '@/app/portal/planner/components/VenueAnalyzerTool';
import OperationsDispatchTool from '@/app/portal/planner/components/OperationsDispatchTool';

export default function PlannerPortalPage() {
  return (
    <section>
      <h1 style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Planner Workspace
      </h1>
      <p style={{ color: '#4e4339' }}>
        Planner-facing timeline coordination, risk management, and venue requirements.
      </p>

      <div className="grid">
        <VenueAnalyzerTool />
        <OperationsDispatchTool />
      </div>
    </section>
  );
}
