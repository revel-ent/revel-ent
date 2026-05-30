import FusionFlowTool from '@/app/portal/couple/components/FusionFlowTool';

export default function CouplePortalPage() {
  return (
    <section>
      <h1 style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Couple Workspace
      </h1>
      <p style={{ color: '#4e4339' }}>
        Budget, venue-fit, and planning intelligence modules for the active wedding.
      </p>

      <div className="grid">
        <FusionFlowTool />
      </div>
    </section>
  );
}
