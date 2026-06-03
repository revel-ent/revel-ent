import Link from 'next/link';

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
          <p className="atlas-home-kicker">Atlas Portal // Event Intelligence Engine</p>
          <h1>Your Digital Wedding Atlas</h1>
          <p>
            A future-facing command layer for complex weddings. Atlas fuses timeline intelligence, venue constraints,
            and live coordination into one decisive control plane.
          </p>
          <div className="atlas-home-audience-strip" aria-label="Atlas audience roles">
            <span>Couples</span>
            <span>Planners</span>
            <span>Vendors</span>
            <span>Guests</span>
            <span>Venues</span>
          </div>
          <div className="atlas-home-hero-actions">
            <Link className="btn primary" href="/login">
              Enter Atlas Portal
            </Link>
            <a className="btn secondary" href="#atlas-flow">
              Explore The System
            </a>
          </div>
          <div className="atlas-home-metrics">
            <article>
              <span>Decision Velocity</span>
              <strong>2.8x Faster</strong>
            </article>
            <article>
              <span>Live Accuracy</span>
              <strong>99.2% Signal Sync</strong>
            </article>
            <article>
              <span>Coordination Load</span>
              <strong>-43% Message Noise</strong>
            </article>
          </div>
        </div>
      </section>

      <section className="atlas-home-role-matrix container">
        <header>
          <p className="atlas-home-kicker">Role-Aware Access</p>
          <h2>One secure login. Personalized command views by role.</h2>
        </header>
        <div className="atlas-home-role-grid">
          <article className="atlas-home-role-card">
            <h3>For Couples</h3>
            <p>Track approvals, payments, and critical decisions without operational overload.</p>
          </article>
          <article className="atlas-home-role-card">
            <h3>For Planners</h3>
            <p>Run the full production graph with venue intelligence, dispatch updates, and live risk controls.</p>
          </article>
          <article className="atlas-home-role-card">
            <h3>For Vendors</h3>
            <p>See exactly what changed, what is due next, and where your team needs to be.</p>
          </article>
          <article className="atlas-home-role-card">
            <h3>For Guests & Family</h3>
            <p>Get concierge-level clarity for schedule, arrival logistics, and day-of questions.</p>
          </article>
          <article className="atlas-home-role-card">
            <h3>For Venues</h3>
            <p>Align floor plans, policy constraints, and load-in windows with less last-minute friction.</p>
          </article>
        </div>
      </section>

      <section id="atlas-flow" className="atlas-home-flow container">
        <header>
          <p className="atlas-home-kicker">Operating Model</p>
          <h2>A scrolling, depth-layered workflow from risk to resolution</h2>
        </header>
        <div className="atlas-home-flow-grid">
          <article className="atlas-home-flow-card">
            <h3>1. Detect</h3>
            <p>Atlas ingests venue, timeline, and payment signals in real time.</p>
          </article>
          <article className="atlas-home-flow-card">
            <h3>2. Forecast</h3>
            <p>Constraint models reveal bottlenecks before they impact guest experience.</p>
          </article>
          <article className="atlas-home-flow-card">
            <h3>3. Orchestrate</h3>
            <p>One role-scoped feed aligns planners, couples, vendors, and family coordinators.</p>
          </article>
          <article className="atlas-home-flow-card">
            <h3>4. Execute</h3>
            <p>Live mode delivers now/next/urgent actions with clean escalation paths.</p>
          </article>
        </div>
      </section>

      <section className="atlas-home-depth container">
        <div className="atlas-home-depth-layer atlas-home-depth-layer-a">
          <h3>Venue Reality Layer</h3>
          <p>Capacity truth, sound policy, rigging constraints, and turnaround windows in one view.</p>
        </div>
        <div className="atlas-home-depth-layer atlas-home-depth-layer-b">
          <h3>Commercial Layer</h3>
          <p>Independent billing, Stripe checkout, and entitlement control mapped to workspace ownership.</p>
        </div>
        <div className="atlas-home-depth-layer atlas-home-depth-layer-c">
          <h3>Execution Layer</h3>
          <p>Role-targeted dispatches, risk alerts, and timeline updates synced across the full event graph.</p>
        </div>
      </section>

      <section className="atlas-home-cta container">
        <div>
          <p className="atlas-home-kicker">Ready For Lift-Off</p>
          <h2>Step into Atlas and run the weekend with zero blind spots.</h2>
        </div>
        <Link className="btn primary" href="/login">
          Enter Atlas Portal
        </Link>
      </section>
    </main>
  );
}
