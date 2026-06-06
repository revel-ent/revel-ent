import Link from 'next/link';

export default function HomePage() {
  const productPreviewRows = [
    {
      label: 'Timeline Updated',
      detail: 'Start time changes to 5:30 PM.',
      state: 'Updated',
    },
    {
      label: 'Planner Approved',
      detail: 'Run-of-show locks for all teams.',
      state: 'Approved',
    },
    {
      label: 'Deposit Released',
      detail: 'Payment milestone opens automatically.',
      state: 'Released',
    },
    {
      label: 'Vendor Confirmed',
      detail: 'Vendors get the final timeline instantly.',
      state: 'Confirmed',
    },
  ];

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
          <h1>One Shared Plan For The Entire Event</h1>
          <p>
            Atlas is the command center for couples, planners, vendors, venues, and families running one event
            together.
          </p>
          <p>
            Unlike texting threads, spreadsheets, or scattered group chats, Atlas connects timeline changes,
            approvals, payments, and hand-offs to one live plan everyone follows.
          </p>
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
            <a className="btn secondary" href="#atlas-flow">
              See How It Works
            </a>
          </div>
        </div>
      </section>

      <section className="atlas-home-role-matrix container">
        <header>
          <p className="atlas-home-kicker atlas-home-role-kicker">The Moment Everything Clicks</p>
          <h2>Everyone Moves As One</h2>
          <p className="atlas-home-role-subtitle">
            When everyone sees the same plan, decisions happen faster and stress drops.
          </p>
        </header>

        <blockquote className="atlas-home-moment-quote">Everyone knew what came next. The event just flowed.</blockquote>

        <div className="atlas-home-emotion-grid" aria-label="Atlas emotional outcomes">
          <article className="atlas-home-emotion-card">
            <h3>Same Plan</h3>
            <p>Everyone works from a single source of truth.</p>
          </article>
          <article className="atlas-home-emotion-card">
            <h3>Clear Hand-Offs</h3>
            <p>Nothing falls through the cracks.</p>
          </article>
          <article className="atlas-home-emotion-card">
            <h3>Calm Event Day</h3>
            <p>Fewer surprises. More presence.</p>
          </article>
        </div>
      </section>

      <section id="atlas-flow" className="atlas-home-flow container">
        <header>
          <p className="atlas-home-kicker">How Atlas Runs The Event</p>
          <h2>The command center behind timelines, approvals, and event-day execution</h2>
        </header>
        <div className="atlas-home-flow-grid">
          <article className="atlas-home-flow-card">
            <h3>Plan</h3>
            <p>Build your timeline and assign responsibilities before the event week starts.</p>
          </article>
          <article className="atlas-home-flow-card">
            <h3>Coordinate</h3>
            <p>Track tasks, approvals, payments, and vendor handoffs in one place.</p>
          </article>
          <article className="atlas-home-flow-card">
            <h3>Communicate</h3>
            <p>Share updates so everyone sees the same plan and the same changes.</p>
          </article>
          <article className="atlas-home-flow-card">
            <h3>Execute</h3>
            <p>Run event day with fewer surprises and clearer next actions for every team.</p>
          </article>
        </div>
      </section>

      <section className="atlas-home-cta container">
        <div>
          <p className="atlas-home-kicker">Ready To Replace The Chaos</p>
          <h2>Run your event from one shared plan, not a dozen message threads.</h2>
          <p className="atlas-home-cta-note">Invite-only at launch so every event gets secure role setup and white-glove onboarding.</p>
        </div>
        <Link className="btn primary" href="/login">
          Enter Atlas
        </Link>
      </section>
    </main>
  );
}
