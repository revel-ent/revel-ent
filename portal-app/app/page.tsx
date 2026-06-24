import Link from 'next/link';

const audiences = ['Couples', 'Planners', 'Vendors', 'Venues', 'Family Coordinators'];

const productPreviewRows = [
  {
    label: 'Venue Checked',
    detail: 'Capacity, curfew, and room-flip validated against the real room.',
    state: 'Cleared',
  },
  {
    label: 'Timeline Updated',
    detail: 'Ceremony start moves to 5:30 PM across every function.',
    state: 'Updated',
  },
  {
    label: 'Planner Approved',
    detail: 'Run-of-show locks for all teams at once.',
    state: 'Approved',
  },
  {
    label: 'Vendors Synced',
    detail: 'Every vendor gets the final timeline instantly.',
    state: 'Confirmed',
  },
];

const metrics = [
  { label: 'One Living Timeline', value: 'Mehndi through vidaai, every function in sequence' },
  { label: 'Ten Coordinated Roles', value: 'Couples, planners, vendors, venues, and family' },
  { label: 'Four Venue Checks', value: 'Capacity, curfew, room-flip, and rigging clearance' },
  { label: 'Operational Truth', value: 'Verified venue data over brochure numbers' },
];

const depthLayers = [
  {
    className: 'atlas-home-depth-layer atlas-home-depth-layer-a',
    title: 'It Knows The Venue',
    body:
      'Atlas models every room from verified data — seated capacity, noise curfew, ceremony-to-reception flip time, and ceiling clearance — instead of the marketing number on the brochure.',
  },
  {
    className: 'atlas-home-depth-layer atlas-home-depth-layer-b',
    title: 'It Checks The Plan',
    body:
      'Every timeline is validated against that venue: a reception running past curfew, a flip window that is too tight, a load-in that closes too early. Risks surface while there is still time to fix them.',
  },
  {
    className: 'atlas-home-depth-layer atlas-home-depth-layer-c',
    title: 'Everyone Runs The Same Plan',
    body:
      'Couples see their checklist and payments. Planners hold the full run-of-show. Vendors and venues see only their slice. One source of truth, projected role by role.',
  },
];

const flowSteps = [
  { title: 'Plan', detail: 'Lock your venue, then build a multi-day timeline Atlas checks against the room.' },
  { title: 'Coordinate', detail: 'Track tasks, approvals, payments, and vendor handoffs in one place.' },
  { title: 'Communicate', detail: 'Every role sees the same plan and the same change the moment it happens.' },
  { title: 'Execute', detail: 'Run each function with fewer surprises and a clear next action for every team.' },
];

const emotions = [
  { title: 'Same Plan', detail: 'Every role works from a single source of truth.' },
  { title: 'Clear Hand-Offs', detail: 'Nothing falls through the cracks between functions.' },
  { title: 'Calm Event Days', detail: 'Fewer surprises across the whole weekend. More presence.' },
];

export default function HomePage() {
  return (
    <main className="atlas-home">
      <section className="atlas-home-hero">
        <video
          className="atlas-home-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/atlas-hero-poster.svg"
        >
          <source src="/atlas-hero.mp4" type="video/mp4" />
        </video>
        <div className="atlas-home-hero-backdrop" aria-hidden="true" />
        <div className="atlas-home-overlay" />

        <div className="atlas-home-hero-content container">
          <p className="atlas-home-kicker">Atlas Platform</p>
          <h1>One Plan For Every Function</h1>
          <p>
            Mehndi, sangeet, baraat, ceremony, reception — Atlas runs every function of a multi-day wedding from one
            live plan that couples, planners, vendors, venues, and family all follow.
          </p>
          <p>
            And it is not just a shared document. Atlas reads each venue&apos;s real constraints and checks your
            timeline against them, so the plan everyone follows is one that actually works.
          </p>

          <div className="atlas-home-audience-strip" aria-label="Who Atlas is for">
            {audiences.map((audience) => (
              <span key={audience}>{audience}</span>
            ))}
          </div>

          <section className="atlas-home-product-preview" aria-label="Atlas product preview">
            <p className="atlas-home-preview-intro">See one live update move across the whole event:</p>
            <div className="atlas-home-preview-board">
              {productPreviewRows.map((row) => (
                <article className="atlas-home-preview-row" key={row.label}>
                  <div>
                    <h3>{row.label}</h3>
                    <p>{row.detail}</p>
                  </div>
                  <div className="atlas-home-preview-meta">
                    <span className="atlas-home-preview-tag">{row.state}</span>
                  </div>
                </article>
              ))}
            </div>
            <p className="atlas-home-preview-footnote">One change. One shared plan. Every team aligned.</p>
          </section>

          <div className="atlas-home-hero-actions">
            <Link className="btn primary" href="/login">
              Enter Atlas
            </Link>
            <a className="btn secondary" href="#atlas-intelligence">
              See How It Works
            </a>
          </div>
        </div>
      </section>

      <section className="atlas-home-metrics container" aria-label="What Atlas coordinates">
        {metrics.map((metric) => (
          <article key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      <section className="atlas-home-role-matrix container">
        <header>
          <p className="atlas-home-kicker atlas-home-role-kicker">The Moment Everything Clicks</p>
          <h2>Everyone Moves As One</h2>
          <p className="atlas-home-role-subtitle">
            When every role sees the same plan, decisions happen faster and stress drops — across every function of the
            weekend.
          </p>
        </header>

        <blockquote className="atlas-home-moment-quote">Everyone knew what came next. The weekend just flowed.</blockquote>

        <div className="atlas-home-emotion-grid" aria-label="Atlas emotional outcomes">
          {emotions.map((emotion) => (
            <article className="atlas-home-emotion-card" key={emotion.title}>
              <h3>{emotion.title}</h3>
              <p>{emotion.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="atlas-intelligence" className="atlas-home-depth container" aria-label="How Atlas thinks">
        {depthLayers.map((layer) => (
          <article className={layer.className} key={layer.title}>
            <h3>{layer.title}</h3>
            <p>{layer.body}</p>
          </article>
        ))}
      </section>

      <section id="atlas-flow" className="atlas-home-flow container">
        <header>
          <p className="atlas-home-kicker">How Atlas Runs The Weekend</p>
          <h2>The command center behind timelines, approvals, and event-day execution</h2>
        </header>
        <div className="atlas-home-flow-grid">
          {flowSteps.map((step) => (
            <article className="atlas-home-flow-card" key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="atlas-home-cta container">
        <div>
          <p className="atlas-home-kicker">Ready To Replace The Chaos</p>
          <h2>Run the whole weekend from one shared plan, not a dozen message threads.</h2>
          <p className="atlas-home-cta-note">Invite-only at launch so every event gets secure role setup and white-glove onboarding.</p>
        </div>
        <Link className="btn primary" href="/login">
          Enter Atlas
        </Link>
      </section>
    </main>
  );
}
