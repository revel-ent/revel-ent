export default function LiveModePage() {
  return (
    <section>
      <h1 style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Live Mode
      </h1>
      <p style={{ color: '#4e4339', maxWidth: 720 }}>
        This route is reserved for day-of execution. It is the destination for Pass the Baton invites and will show
        phase-by-phase coordination actions for planners and delegate coordinators.
      </p>
      <article className="card" style={{ marginTop: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>V1 Placeholder</h3>
        <p style={{ color: '#4e4339' }}>
          Next implementation step: render current phase, next action, and one-tap escalation based on event timeline
          state.
        </p>
      </article>
    </section>
  );
}
