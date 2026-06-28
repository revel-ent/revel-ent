import Link from 'next/link';

import VenueMatchmaker from '@/app/components/VenueMatchmaker';

const navLinks = [
  { href: '#how', label: 'How It Works' },
  { href: '#planners', label: 'For Planners' },
  { href: '#couples', label: 'For Couples' },
  { href: '#venues', label: 'Venue Matchmaker' },
];

const trustBadges = [
  { title: 'AI-Verified Venue Data', detail: 'Continuously researched and validated — not brochure numbers.' },
  { title: 'Risk Detection Before You Book', detail: 'We surface issues others miss — before you sign or pay.' },
  { title: 'Trusted by Event Professionals', detail: 'Planners, vendors & venues across Georgia.' },
];

const venueRisks = [
  { label: 'Stage blocks emergency exit', sev: 'High', cls: 'high' },
  { label: 'Ceiling height limits rigging', sev: 'Medium', cls: 'med' },
  { label: 'Load-in window is tight', sev: 'High', cls: 'high' },
  { label: 'Outside catering restricted', sev: 'Medium', cls: 'med' },
];

const features = [
  {
    icon: 'shield',
    title: 'Detect Expensive Risks',
    body: 'We find the costly mistakes — curfews, overlaps, capacity gaps — before they become your reality.',
  },
  {
    icon: 'building',
    title: 'Know Your Venue Limits',
    body: 'Real seated capacity, noise policies, flip windows, and load-in rules for the actual room.',
  },
  {
    icon: 'wallet',
    title: 'Budget With Clarity',
    body: 'Understand true costs and avoid the last-minute blowups that derail a celebration.',
  },
  {
    icon: 'clock',
    title: 'Stress-Test Your Timeline',
    body: 'Catch bottlenecks, overlaps, and risky transitions across every function of the weekend.',
  },
  {
    icon: 'heart',
    title: 'Respect Every Tradition',
    body: 'Cultural and religious moments — mehndi to vidaai — sequenced with care, not as afterthoughts.',
  },
  {
    icon: 'users',
    title: 'Everyone Runs One Plan',
    body: 'Couples, planners, vendors, and venues all follow the same living plan, projected role by role.',
  },
];

const advantages = [
  { icon: 'doc', title: 'AI Contract Analysis', detail: 'Extracts key details & hidden clauses in seconds.' },
  { icon: 'building', title: 'Venue Intelligence', detail: 'Verified capacity, policies, diagrams & logistics.' },
  { icon: 'shield', title: 'Risk Detection', detail: 'Flag issues early & avoid costly day-of problems.' },
  { icon: 'clock', title: 'Timeline Confidence', detail: 'AI checks for gaps, conflicts & unrealistic transitions.' },
  { icon: 'globe', title: 'Global Coverage', detail: 'Starting with 55 Georgia venues. Expanding fast.' },
];

const flowSteps = [
  { title: 'Plan', detail: 'Match a venue that fits, then build a multi-day timeline Atlas checks against the room.' },
  { title: 'Coordinate', detail: 'Track tasks, approvals, payments, and vendor handoffs in one place.' },
  { title: 'Communicate', detail: 'Every role sees the same plan and the same change the moment it happens.' },
  { title: 'Execute', detail: 'Run each function with fewer surprises and a clear next action for every team.' },
];

const stats = [
  { value: '55', label: 'Verified venues, Georgia' },
  { value: 'Multi-day', label: 'Mehndi through vidaai' },
  { value: '10', label: 'Coordinated roles' },
  { value: 'Nationwide', label: 'Coverage, expanding' },
];

const viControls: [string, boolean][] = [
  ['Seating', true],
  ['Measurements', true],
  ['Pathways', true],
  ['Utilities', false],
];

function Icon({ name }: { name: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'shield':
      return (
        <svg {...common}><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>
      );
    case 'building':
      return (
        <svg {...common}><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2" /></svg>
      );
    case 'wallet':
      return (
        <svg {...common}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /><circle cx="16.5" cy="13.5" r="1" /></svg>
      );
    case 'clock':
      return (
        <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
      );
    case 'heart':
      return (
        <svg {...common}><path d="M12 20s-7-4.6-7-9.6A3.9 3.9 0 0 1 12 7a3.9 3.9 0 0 1 7 2.8c0 5-7 9.6-7 9.6z" /></svg>
      );
    case 'users':
      return (
        <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5" /><path d="M16 6a3 3 0 0 1 0 6M21 20c0-2.2-1.4-3.9-3.5-4.6" /></svg>
      );
    case 'doc':
      return (
        <svg {...common}><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4M10 12h6M10 16h6" /></svg>
      );
    case 'globe':
      return (
        <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></svg>
      );
    default:
      return null;
  }
}

export default function HomePage() {
  return (
    <main className="atlas-home">
      <header className="atlas-nav">
        <div className="atlas-nav-inner container">
          <Link href="/" className="atlas-nav-brand">
            <span className="atlas-mark" aria-hidden="true">▲</span>
            <span className="atlas-wordmark">
              ATLAS<span className="atlas-wordmark-sub">The Intelligence Layer for Events</span>
            </span>
          </Link>
          <nav className="atlas-nav-links" aria-label="Primary">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="atlas-nav-cta">
            <Link className="atlas-nav-login" href="/login">
              Log in
            </Link>
            <Link className="btn gold" href="/login">
              Get Early Access
            </Link>
          </div>
        </div>
      </header>

      <section className="atlas-hero">
        <div className="atlas-hero-inner container">
          <div className="atlas-hero-copy">
            <span className="atlas-pill">Global Wedding &amp; Event Intelligence</span>
            <h1>
              Plan with certainty.
              <br />
              Protect every moment.
            </h1>
            <p>
              Atlas analyzes venues, contracts, and logistics to reveal the truth behind the numbers — so you can
              plan with confidence and avoid costly surprises.
            </p>
            <div className="atlas-hero-actions">
              <a className="btn primary" href="#venues">
                Find Your Perfect Venue →
              </a>
              <a className="btn secondary atlas-hero-secondary" href="#how">
                See How It Works
              </a>
            </div>
            <ul className="atlas-trust-row">
              {trustBadges.map((badge) => (
                <li key={badge.title}>
                  <span className="atlas-trust-check" aria-hidden="true">✓</span>
                  <span>
                    <strong>{badge.title}</strong>
                    <em>{badge.detail}</em>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="atlas-venueintel" aria-label="Atlas Venue Intelligence preview">
            <div className="atlas-vi-header">
              <div className="atlas-vi-title">
                <span className="atlas-vi-vname">InterContinental Buckhead</span>
                <span className="atlas-vi-badge">✓ Verified</span>
              </div>
              <div className="atlas-vi-meta">
                <span className="atlas-vi-updated">Updated Apr 24, 2025</span>
                <span className="atlas-vi-share">Share Report</span>
              </div>
            </div>

            <div className="atlas-vi-body">
              <nav className="atlas-vi-sidenav" aria-hidden="true">
                {['Overview', 'Venue Details', 'Diagrams', 'Policies', 'Capacity', 'Risks', 'Reviews', 'Similar Venues'].map((item, i) => (
                  <span
                    key={item}
                    className={`atlas-vi-snitem${i === 0 ? ' atlas-vi-snitem--active' : i === 5 ? ' atlas-vi-snitem--risk' : ''}`}
                  >
                    {item}
                  </span>
                ))}
              </nav>
              <div className="atlas-vi-content">
                <div className="atlas-vi-floorplan">
                  <div className="atlas-vi-fp-room atlas-vi-fp-room--stage">
                    <span>Stage</span>
                    <span className="atlas-vi-fp-dim">24&prime;×30&prime;</span>
                  </div>
                  <div className="atlas-vi-fp-room atlas-vi-fp-room--dance">
                    <span>Dance Floor</span>
                    <span className="atlas-vi-fp-dim">24&prime;×32&prime;</span>
                  </div>
                  <div className="atlas-vi-fp-room atlas-vi-fp-room--head">Head Table</div>
                  <div className="atlas-vi-fp-corridor">Service Corridor</div>
                </div>
                <div className="atlas-vi-controls">
                  <div className="atlas-vi-ctrl-label">Floor</div>
                  <div className="atlas-vi-ctrl-val">Grand Ballroom</div>
                  {viControls.map(([label, on]) => (
                    <div key={label} className="atlas-vi-ctrl-row">
                      <span>{label}</span>
                      <span className={`atlas-vi-toggle${on ? ' atlas-vi-toggle--on' : ''}`} />
                    </div>
                  ))}
                  <span className="atlas-vi-3d-btn">3D View</span>
                </div>
              </div>
            </div>

            <div className="atlas-vi-stats">
              <div className="atlas-vi-stat atlas-vi-stat--green">
                <span className="atlas-vi-stat-num">612</span>
                <span className="atlas-vi-stat-label">Atlas Capacity</span>
                <span className="atlas-vi-stat-sub">Comfortable</span>
              </div>
              <div className="atlas-vi-stat">
                <span className="atlas-vi-stat-num">850</span>
                <span className="atlas-vi-stat-label">Marketing Capacity</span>
              </div>
              <div className="atlas-vi-stat atlas-vi-stat--red">
                <span className="atlas-vi-stat-num">238</span>
                <span className="atlas-vi-stat-label">Difference</span>
                <span className="atlas-vi-stat-sub">Guests</span>
              </div>
              <div className="atlas-vi-conf">
                <div className="atlas-vi-conf-ring">
                  <span className="atlas-vi-conf-num">93</span>
                </div>
                <div>
                  <div className="atlas-vi-conf-title">Confidence Score</div>
                  <div className="atlas-vi-conf-sub">High Confidence</div>
                </div>
              </div>
            </div>

            <div className="atlas-vi-risks-section">
              <div className="atlas-vi-risks-head">
                <span className="atlas-vi-risks-title">Top Risks Detected</span>
                <span className="atlas-vi-risks-link">View Full Report →</span>
              </div>
              <div className="atlas-vi-risks-grid">
                {venueRisks.map((risk) => (
                  <div key={risk.label} className={`atlas-vi-risk atlas-vi-risk--${risk.cls}`}>
                    <span className="atlas-vi-risk-label">{risk.label}</span>
                    <span className="atlas-vi-risk-sev">{risk.sev}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="atlas-strip">
        <div className="container atlas-strip-inner">
          <span className="atlas-strip-lead">Now matching venues across Georgia</span>
          <div className="atlas-strip-places">
            <span>Atlanta</span>
            <span>Buckhead</span>
            <span>Alpharetta</span>
            <span>Gwinnett</span>
            <span>Braselton</span>
            <span className="atlas-strip-soon">Nationwide soon</span>
          </div>
        </div>
      </section>

      <section className="atlas-features container">
        <header className="atlas-section-head">
          <p className="eyebrow">Beyond Checklists</p>
          <h2>
            Atlas doesn&apos;t just organize your event. <span className="atlas-accent">It evaluates reality.</span>
          </h2>
          <p className="atlas-section-sub">
            From hidden venue restrictions to budget gaps and timeline conflicts, Atlas surfaces what others miss — so
            you plan confidently and protect what matters.
          </p>
        </header>
        <div className="atlas-feature-grid">
          {features.map((feature) => (
            <article className="atlas-feature-card" key={feature.title}>
              <span className="atlas-feature-icon">
                <Icon name={feature.icon} />
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="venues" className="atlas-matchmaker-section">
        <div className="container">
          <header className="atlas-section-head">
            <p className="eyebrow">The Atlas Venue Matchmaker™</p>
            <h2>Find venues that actually fit your vision.</h2>
            <p className="atlas-section-sub">
              Not just by location or price — by real capacity, policies, and what matters most to you. Describe your
              event and Atlas matches it against verified venue data, starting with 55 venues across Georgia.
            </p>
          </header>
          <VenueMatchmaker />
        </div>
      </section>

      <section id="how" className="atlas-flow">
        <div className="container">
          <header className="atlas-section-head atlas-section-head--onnavy">
            <p className="eyebrow">How Atlas Runs The Weekend</p>
            <h2>From the first venue tour to the last dance.</h2>
          </header>
          <div className="atlas-flow-grid">
            {flowSteps.map((step, index) => (
              <article className="atlas-flow-card" key={step.title}>
                <span className="atlas-flow-num">{String(index + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="advantage" className="atlas-advantage container">
        <header className="atlas-section-head atlas-section-head--center">
          <p className="eyebrow">More Than Software. Real Intelligence.</p>
          <h2>Atlas gives you the unfair advantage.</h2>
        </header>
        <div className="atlas-advantage-grid">
          {advantages.map((item) => (
            <article className="atlas-advantage-card" key={item.title}>
              <span className="atlas-advantage-icon">
                <Icon name={item.icon} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="atlas-proof">
        <div className="container atlas-proof-inner">
          <blockquote className="atlas-proof-quote">
            <p>
              &ldquo;We built Atlas because the costliest wedding mistakes are the ones no checklist catches. The venue
              data and the plan should tell you the truth — before the day arrives, not after.&rdquo;
            </p>
            <cite>The Revel Entertainment team</cite>
          </blockquote>
          <div className="atlas-proof-stats">
            {stats.map((stat) => (
              <div className="atlas-proof-stat" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="atlas-cta">
        <div className="container atlas-cta-inner">
          <div>
            <p className="eyebrow">Ready To Plan Smarter</p>
            <h2>Find your venue match in minutes.</h2>
            <p className="atlas-cta-note">Built in Georgia for real weddings. Expanding nationwide.</p>
          </div>
          <div className="atlas-cta-actions">
            <a className="btn gold" href="#venues">
              Find Your Perfect Venue
            </a>
            <Link className="btn secondary atlas-hero-secondary" href="/login">
              Get Early Access
            </Link>
          </div>
        </div>
      </section>

      <footer className="atlas-footer">
        <div className="container atlas-footer-inner">
          <span className="atlas-footer-brand">ATLAS</span>
          <span className="atlas-footer-tag">The Intelligence Layer for Events</span>
          <nav className="atlas-footer-links" aria-label="Footer">
            <a href="#how">How It Works</a>
            <a href="#venues">Venue Matchmaker</a>
            <Link href="/login">Log in</Link>
          </nav>
          <span className="atlas-footer-legal">© 2026 Revel Entertainment</span>
        </div>
      </footer>
    </main>
  );
}
