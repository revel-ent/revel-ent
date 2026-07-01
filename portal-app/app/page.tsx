import Link from 'next/link';

import VenueMatchmaker from '@/app/components/VenueMatchmaker';

const navLinks = [
  { href: '#how', label: 'How It Works' },
  { href: '#planners', label: 'For Planners' },
  { href: '#couples', label: 'For Couples' },
  { href: '#venues', label: 'Venue Matchmaker' },
];

const trustBadges = [
  { title: 'AI-Verified Venue Data', detail: 'Continuously researched and validated — not brochure numbers.', icon: 'shield' },
  { title: 'Risk Detection Before You Book', detail: 'We surface issues others miss — before you sign or pay.', icon: 'search' },
  { title: 'Trusted by Event Professionals', detail: 'Planners, vendors & venues across Georgia.', icon: 'users' },
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
  { icon: 'globe', title: 'Georgia Coverage', detail: 'Starting with 55 Georgia venues. Expanding fast.' },
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
  { value: 'Georgia', label: 'Coverage, expanding' },
];

// Standing showcase of Atlas-verified Georgia venues (a sample, not live matches).
// NOTE: capacity ranges are placeholders — swap for each venue's published seated
// figure before publish. No match % here: a score requires a user query.
// `photo` is an optional licensed/owned image URL. None are cleared for use yet —
// every card falls back to the gradient + monogram treatment until real photography
// (Revel Entertainment's own event photos, or a licensed shoot) is supplied per venue.
const featuredVenues: {
  name: string;
  city: string;
  setting: string;
  capacity: string;
  cover: string;
  photo?: string;
}[] = [
  { name: 'InterContinental Buckhead', city: 'Atlanta, GA', setting: 'Grand Ballroom', capacity: '150–650 guests', cover: 'cover-a' },
  { name: 'Four Seasons Atlanta', city: 'Midtown, GA', setting: 'Ballroom + Terrace', capacity: '120–480 guests', cover: 'cover-b' },
  { name: 'The St. Regis Atlanta', city: 'Buckhead, GA', setting: 'Astor Ballroom', capacity: '100–550 guests', cover: 'cover-e' },
  { name: 'Château Élan', city: 'Braselton, GA', setting: 'Estate + Vineyard', capacity: '200–800 guests', cover: 'cover-c' },
  { name: 'Grand Hyatt Atlanta', city: 'Buckhead, GA', setting: 'Grand Ballroom', capacity: '180–700 guests', cover: 'cover-f' },
];

const footerColumns = [
  {
    heading: 'Product',
    links: [
      { label: 'How It Works', href: '#how' },
      { label: 'Venue Matchmaker', href: '#venues' },
      { label: 'The Atlas Advantage', href: '#advantage' },
      { label: 'Get Early Access', href: '/login' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'For Planners', href: '#planners' },
      { label: 'For Couples', href: '#couples' },
      { label: 'By Revel Entertainment', href: '#how' },
      { label: 'Log in', href: '/login' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Georgia Coverage', href: '#venues' },
      { label: 'Venue Intelligence', href: '#advantage' },
      { label: 'Risk Detection', href: '#how' },
      { label: 'Contact', href: 'mailto:info@revel-ent.com' },
    ],
  },
];

const viControls: [string, boolean][] = [
  ['Seating', true],
  ['Measurements', true],
  ['Pathways', true],
  ['Utilities', false],
];

// Initials for a venue monogram cover; strips accents + punctuation (Château Élan → CE).
function featInitials(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[^A-Za-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

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
    case 'search':
      return (
        <svg {...common}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
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
            <svg className="atlas-mark" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L22 21H2L12 2Z" stroke="#C8A46A" strokeWidth="1.5" strokeLinejoin="round"/>
              <line x1="6.5" y1="15" x2="17.5" y2="15" stroke="#C8A46A" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
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
            <span className="atlas-pill">AI Venue Intelligence Platform</span>
            <h1>
              Plan with certainty.
              <br />
              Protect every moment.
            </h1>
            <p>
              Atlas analyzes venues, contracts, and logistics to reveal the truth behind the numbers — so you can
              plan with confidence and avoid costly surprises.
            </p>
            <div className="atlas-hero-form">
              <p className="atlas-hero-form-title">Tell Atlas about your event</p>
              <p className="atlas-hero-form-sub">
                Atlas parses your requirements against real venue constraints — capacity math, curfews, room-flip
                windows, cultural ceremony needs — and returns ranked matches with a full risk brief.
              </p>
              <textarea
                className="atlas-hero-textarea"
                rows={3}
                defaultValue="Indian wedding in Georgia, 500–800 guests, Grand ballroom, outdoor ceremony, late night curfew, room blocks for 200, budget $150K–$200K"
                readOnly
                aria-label="Sample search query"
              />
              <div className="atlas-hero-filter-grid">
                <label className="atlas-hero-filter-sel">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <select defaultValue="atl"><option value="atl">Atlanta, GA</option><option value="">All Georgia</option></select>
                </label>
                <label className="atlas-hero-filter-sel">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="M16 6a3 3 0 0 1 0 6M21 20c0-2.2-1.4-3.9-3.5-4.6"/></svg>
                  <select defaultValue="500"><option value="500">500 – 800 Guests</option><option value="">Any Size</option></select>
                </label>
                <label className="atlas-hero-filter-sel">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  <select defaultValue="indian"><option value="indian">Indian Wedding</option><option value="">Event Type</option></select>
                </label>
                <label className="atlas-hero-filter-sel">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="16.5" cy="13.5" r="1"/></svg>
                  <select defaultValue="150"><option value="150">Budget: $150K – $200K</option><option value="">Any Budget</option></select>
                </label>
              </div>
              <a className="btn primary atlas-hero-find-btn" href="#venues">
                Run Atlas Intelligence →
              </a>
            </div>
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
        <div className="container atlas-strip-trust">
          {trustBadges.map((badge) => (
            <div className="atlas-trust-item" key={badge.title}>
              <span className="atlas-trust-item-icon" aria-hidden="true">
                <Icon name={badge.icon} />
              </span>
              <div>
                <strong>{badge.title}</strong>
                <span>{badge.detail}</span>
              </div>
            </div>
          ))}
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
          <div className="atlas-feat">
            <header className="atlas-section-head">
              <p className="eyebrow">A Sample Of Atlas-Verified Venues</p>
              <h2>Premium Georgia venues, already verified.</h2>
              <p className="atlas-section-sub">
                A standing look at venues in the Atlas network — verified by city, setting, and
                capacity. These are sample venues, not personalized matches; describe your event
                below to see how Atlas ranks them against what you actually need.
              </p>
            </header>

            <div className="vm-carousel atlas-feat-rail" aria-label="Featured Atlas-verified venues">
              {featuredVenues.map((venue) => (
                <article key={venue.name} className="vm-card atlas-feat-card">
                  <div className={`vm-card-cover ${venue.photo ? 'vm-card-cover--photo' : venue.cover}`}>
                    {venue.photo ? (
                      <img className="vm-card-photo" src={venue.photo} alt={venue.name} loading="lazy" />
                    ) : (
                      <span className="vm-card-initials" aria-hidden="true">
                        {featInitials(venue.name)}
                      </span>
                    )}
                    <span className="vm-verified">Verified</span>
                  </div>
                  <div className="vm-card-body">
                    <h3 className="vm-card-name">{venue.name}</h3>
                    <p className="vm-card-loc">
                      {venue.setting} · {venue.city}
                    </p>
                    <div className="vm-card-meta">
                      <span className="vm-card-cap atlas-feat-cap">{venue.capacity}</span>
                      <a className="atlas-feat-details" href="#venues">
                        View Details
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <p className="atlas-feat-foot">
              <span className="atlas-feat-foot-mark" aria-hidden="true" />
              55 verified venues across Georgia — coverage expanding.
            </p>
          </div>

          <header className="atlas-section-head atlas-section-head--center">
            <p className="eyebrow">Intelligence-First Venue Matching</p>
            <h2>AI matches. Real insights. Better decisions.</h2>
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

      <section id="advantage" className="atlas-advantage">
        <div className="container">
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
        </div>
      </section>

      <section className="atlas-proof">
        <div className="container atlas-proof-inner atlas-proof-inner--rich">
          {/* Identity column — champagne-gold Atlas 'A' medallion, never a stock photo */}
          <figure className="atlas-proof-identity">
            <div className="atlas-proof-medallion" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L22 21H2L12 2Z" stroke="#C8A46A" strokeWidth="1.5" strokeLinejoin="round" />
                <line x1="6.5" y1="15" x2="17.5" y2="15" stroke="#C8A46A" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <figcaption className="atlas-proof-identity-cap">
              <span className="atlas-proof-identity-name">Revel Entertainment</span>
              <span className="atlas-proof-identity-role">Founding team · Atlanta, GA</span>
            </figcaption>
          </figure>

          <div className="atlas-proof-voice">
            <p className="eyebrow atlas-proof-eyebrow">Why We Built Atlas</p>
            <blockquote className="atlas-proof-quote">
              <span className="atlas-proof-quote-mark" aria-hidden="true">&ldquo;</span>
              <p className="atlas-proof-quote-body">
                We built Atlas because the costliest wedding mistakes are the ones no checklist
                catches. The venue data and the plan should tell you the truth — before the day
                arrives, not after.
              </p>
              <cite>The Revel Entertainment team</cite>
            </blockquote>
          </div>

          <div className="atlas-proof-stats atlas-proof-stats--rich">
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
            <p className="eyebrow">The Intelligence Advantage</p>
            <h2>Stop guessing. Start knowing.</h2>
            <p className="atlas-cta-note">Every match includes real capacity math, detected risks, and timeline feasibility — not just options.</p>
          </div>
          <div className="atlas-cta-actions">
            <a className="btn gold" href="#venues">
              Get Your Intelligence Report
            </a>
            <Link className="btn secondary atlas-hero-secondary" href="/login">
              Get Early Access
            </Link>
          </div>
        </div>
      </section>

      <footer className="atlas-footer">
        <div className="container atlas-foot-inner">
          <div className="atlas-foot-top">
            <div className="atlas-foot-brand-block">
              <div className="atlas-foot-brand-row">
                <svg className="atlas-mark" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 2L22 21H2L12 2Z" stroke="#C8A46A" strokeWidth="1.5" strokeLinejoin="round" />
                  <line x1="6.5" y1="15" x2="17.5" y2="15" stroke="#C8A46A" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="atlas-foot-wordmark">ATLAS</span>
              </div>
              <p className="atlas-foot-desc">
                The intelligence layer for premium multi-day weddings — verifying venues, contracts,
                and logistics so every moment is protected. Built in Georgia, expanding.
              </p>
              <div className="atlas-foot-follow" aria-label="Contact Atlas">
                <span className="atlas-foot-follow-label">Follow</span>
                <a className="atlas-foot-social" href="mailto:info@revel-ent.com" aria-label="Email Revel Entertainment">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
                  </svg>
                </a>
                <a className="atlas-foot-social" href="/login" aria-label="Sign in to Atlas">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="M10 17l5-5-5-5M15 12H3" />
                  </svg>
                </a>
              </div>
            </div>

            <nav className="atlas-foot-cols" aria-label="Footer">
              {footerColumns.map((col) => (
                <div className="atlas-foot-col" key={col.heading}>
                  <span className="atlas-foot-col-head">{col.heading}</span>
                  <ul>
                    {col.links.map((link) => (
                      <li key={link.label}>
                        {link.href.startsWith('/') ? (
                          <Link href={link.href}>{link.label}</Link>
                        ) : (
                          <a href={link.href}>{link.label}</a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          <div className="atlas-foot-legal">
            <span>© 2026 Revel Entertainment. All rights reserved.</span>
            <span className="atlas-foot-legal-tag">
              <span className="atlas-foot-status" aria-hidden="true" />
              Georgia coverage · expanding
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
