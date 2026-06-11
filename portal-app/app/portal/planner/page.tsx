import AtlasVenueIntelligencePanel from '@/app/portal/planner/components/AtlasVenueIntelligencePanel';
import PlannerMusicStatusPanel from '@/app/portal/planner/components/PlannerMusicStatusPanel';
import VenueAnalyzerTool from '@/app/portal/planner/components/VenueAnalyzerTool';
import OperationsDispatchTool from '@/app/portal/planner/components/OperationsDispatchTool';
import PlannerTaskBoard from '@/app/portal/planner/components/PlannerTaskBoard';
import VendorAssignmentRoster from '@/app/portal/planner/components/VendorAssignmentRoster';
import EventTimelineCard from '@/app/portal/components/EventTimelineCard';
import LiveModeCard from '@/app/portal/components/LiveModeCard';
import InviteManagementPanel from '@/app/portal/components/InviteManagementPanel';
import WorkspacePaymentSettingsPanel from '@/app/portal/couple/components/WorkspacePaymentSettingsPanel';

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
      <InviteManagementPanel />
      <WorkspacePaymentSettingsPanel />

      <div className="portal-card-grid">
        <PlannerMusicStatusPanel />
        <PlannerTaskBoard />
        <VendorAssignmentRoster />
        <VenueAnalyzerTool />
        <OperationsDispatchTool />
        <EventTimelineCard />
        <LiveModeCard />
      </div>
    </section>
  );
}
