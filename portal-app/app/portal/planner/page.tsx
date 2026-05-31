import AtlasVenueIntelligencePanel from '@/app/portal/planner/components/AtlasVenueIntelligencePanel';
import VenueAnalyzerTool from '@/app/portal/planner/components/VenueAnalyzerTool';
import OperationsDispatchTool from '@/app/portal/planner/components/OperationsDispatchTool';
import EventTimelineCard from '@/app/portal/components/EventTimelineCard';
import LiveModeCard from '@/app/portal/components/LiveModeCard';

export default async function PlannerPortalPage() {
  return (
    <section className="page-wrap">
      <header className="portal-page-header">
        <span className="eyebrow">Planner Workspace</span>
        <h1 className="page-title">Run the Weekend Like Clockwork</h1>
        <p className="page-subtitle">
          Planner-facing timeline coordination, risk management, and venue requirements.
        </p>
      </header>

      <AtlasVenueIntelligencePanel />

      <div className="portal-card-grid">
        <VenueAnalyzerTool />
        <OperationsDispatchTool />
        <EventTimelineCard />
        <LiveModeCard />
      </div>
    </section>
  );
}
