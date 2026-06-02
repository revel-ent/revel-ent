'use client';

import { useMemo, useState } from 'react';

type PersonaId =
  | 'couple'
  | 'planner'
  | 'vendor'
  | 'guest'
  | 'delegate_coordinator'
  | 'venue_coordinator'
  | 'decorator'
  | 'dj_mc'
  | 'admin';

interface PersonaGuide {
  id: PersonaId;
  label: string;
  headline: string;
  outcome: string;
  timeSaved: string;
  costImpact: string;
  steps: string[];
  nextBestAction: string;
}

const GUIDES: PersonaGuide[] = [
  {
    id: 'couple',
    label: 'Couple',
    headline: 'Make confident decisions without planning fatigue',
    outcome: 'Fewer revisions and faster approvals across venue, timeline, and experience choices.',
    timeSaved: '2-4 hours/week',
    costImpact: 'Avoids rushed premium-change fees',
    steps: [
      'Confirm venue baseline and guest range first.',
      'Approve generated timeline as your starting plan.',
      'Use Live Mode only for final-day decisions and alerts.'
    ],
    nextBestAction: 'Complete onboarding in one pass so every downstream tool starts with your real event context.'
  },
  {
    id: 'planner',
    label: 'Planner',
    headline: 'Run parallel ceremonies with fewer coordination loops',
    outcome: 'Less back-and-forth with vendors and cleaner day-of execution sequencing.',
    timeSaved: '4-8 hours/week',
    costImpact: 'Reduces overtime and rework from timeline drift',
    steps: [
      'Run venue analyzer before dispatching any production plan.',
      'Use dispatch summaries for daily alignment and acknowledgements.',
      'Track live delays inside Live Mode to preserve source-of-truth timing.'
    ],
    nextBestAction: 'Open Planner Workspace and run Venue Production Analyzer before final vendor confirmations.'
  },
  {
    id: 'decorator',
    label: 'Decorator',
    headline: 'Convert decor ideas into feasible plans quickly',
    outcome: 'Design choices align earlier with power, load-in, and venue policy limits.',
    timeSaved: '3-6 hours/week',
    costImpact: 'Prevents expensive redesigns after site constraints surface',
    steps: [
      'Validate venue infrastructure before locking decor scope.',
      'Review timeline windows for setup and strike operations.',
      'Flag blocking constraints early in coordination feed for planner approval.'
    ],
    nextBestAction: 'Use Decorator orientation as your operating checklist even before dedicated decorator routes are enabled.'
  },
  {
    id: 'vendor',
    label: 'Vendor',
    headline: 'Know exactly what is expected and when',
    outcome: 'Assigned updates are visible in one place with clear status handoffs.',
    timeSaved: '2-5 hours/week',
    costImpact: 'Cuts missed-cue penalties and rushed staffing add-ons',
    steps: [
      'Check Coordination Feed first, before setup begins.',
      'Acknowledge updates as they change to reduce planner follow-up.',
      'Use timeline owner/status chips to prioritize immediate actions.'
    ],
    nextBestAction: 'Open Vendor Workspace and clear pending/attention updates before event-day load-in.'
  },
  {
    id: 'guest',
    label: 'Guest',
    headline: 'Get answers fast without messaging the family group',
    outcome: 'Guests self-serve logistics and arrival info with fewer interruptions.',
    timeSaved: '1-2 hours/week (family coordination)',
    costImpact: 'Reduces avoidable transport and timing mistakes',
    steps: [
      'Use concierge for arrival, parking, and schedule questions.',
      'Check timeline highlights before leaving for venue.',
      'Use live alerts for schedule shifts.'
    ],
    nextBestAction: 'Ask concierge your top day-of question now to avoid last-minute confusion.'
  },
  {
    id: 'delegate_coordinator',
    label: 'Family Coordinator',
    headline: 'Execute confidently without planner-level complexity',
    outcome: 'Run day-of flow with a minimal, action-sequenced view.',
    timeSaved: '3-5 hours/day-of',
    costImpact: 'Avoids emergency staffing and timing escalations',
    steps: [
      'Stay in Live Mode during active event windows.',
      'Update delays immediately with concise notes.',
      'Escalate blockers through contacts block, not group chat.'
    ],
    nextBestAction: 'Start in Live Mode and update one critical step as rehearsal before event day.'
  },
  {
    id: 'venue_coordinator',
    label: 'Venue Coordinator',
    headline: 'Coordinate compliance and access windows without noise',
    outcome: 'Fewer day-of surprises from policy, load-in, and turnover constraints.',
    timeSaved: '2-4 hours/week',
    costImpact: 'Prevents violation fees and delayed access penalties',
    steps: [
      'Confirm load-in and room turnover windows before dispatch starts.',
      'Post venue advisories early when restrictions change.',
      'Use timeline checkpoints to confirm readiness at each handoff.'
    ],
    nextBestAction: 'Review Venue Workspace checkpoints and publish one advisory for your current event window.'
  },
  {
    id: 'dj_mc',
    label: 'DJ / MC',
    headline: 'Protect cue timing and crowd energy across transitions',
    outcome: 'Cleaner handoffs between moments, fewer missed production cues.',
    timeSaved: '2-4 hours/week',
    costImpact: 'Avoids overtime from delayed transitions',
    steps: [
      'Sync now/next steps from Live Mode before each phase.',
      'Confirm alerts and aisle timing before ceremonial transitions.',
      'Log timing shifts immediately so all teams stay aligned.'
    ],
    nextBestAction: 'Use Live Mode now/next block as your single cue source on event day.'
  },
  {
    id: 'admin',
    label: 'Admin',
    headline: 'Keep every lane aligned while preserving trust',
    outcome: 'Fast issue triage and clean role handoffs across the full event graph.',
    timeSaved: '5-9 hours/week',
    costImpact: 'Reduces operational escalation and miscommunication costs',
    steps: [
      'Review onboarding completion and timeline approvals first.',
      'Use role workspaces to validate end-user clarity, not only data correctness.',
      'Track recurring blockers to refine guidance and trust copy.'
    ],
    nextBestAction: 'Select each persona briefly and verify the orientation guidance is clear before launch.'
  }
];

function normalizeToPersona(role: string): PersonaId {
  if (role === 'delegate_coordinator') {
    return 'delegate_coordinator';
  }

  if (role === 'venue_coordinator') {
    return 'venue_coordinator';
  }

  if (
    role === 'couple' ||
    role === 'planner' ||
    role === 'vendor' ||
    role === 'guest' ||
    role === 'admin'
  ) {
    return role;
  }

  return 'admin';
}

export default function RoleOrientationPanel({
  sessionRole,
  displayName
}: {
  sessionRole: string;
  displayName: string;
}) {
  const basePersona = normalizeToPersona(sessionRole);
  const [persona, setPersona] = useState<PersonaId>(() => {
    if (typeof window === 'undefined') {
      return basePersona;
    }

    const storedPersona = window.localStorage.getItem('revel.portal.persona');
    if (!storedPersona) {
      return basePersona;
    }

    return GUIDES.some((item) => item.id === storedPersona) ? (storedPersona as PersonaId) : basePersona;
  });

  const guide = useMemo(() => {
    return GUIDES.find((item) => item.id === persona) ?? GUIDES.find((item) => item.id === basePersona) ?? GUIDES[0];
  }, [persona, basePersona]);

  function onPersonaChange(nextPersona: PersonaId) {
    setPersona(nextPersona);
    window.localStorage.setItem('revel.portal.persona', nextPersona);
  }

  return (
    <section className="orientation-shell">
      <div className="orientation-header">
        <div>
          <span className="eyebrow">Role Orientation</span>
          <h2 className="orientation-title">{guide.headline}</h2>
          <p className="orientation-subtitle">{guide.outcome}</p>
        </div>
        <div className="orientation-select-wrap">
          <label htmlFor="orientationPersona">I am using REVEL as</label>
          <select
            id="orientationPersona"
            value={persona}
            onChange={(event) => onPersonaChange(event.target.value as PersonaId)}
          >
            {GUIDES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <span className="chip">Signed in: {displayName}</span>
        </div>
      </div>

      <div className="orientation-kpis">
        <article className="orientation-kpi-card">
          <span className="kpi-label">Time Saved</span>
          <strong className="kpi-value">{guide.timeSaved}</strong>
        </article>
        <article className="orientation-kpi-card">
          <span className="kpi-label">Cost Protection</span>
          <strong className="kpi-value">{guide.costImpact}</strong>
        </article>
        <article className="orientation-kpi-card">
          <span className="kpi-label">Focus</span>
          <strong className="kpi-value">{guide.label} Workflow</strong>
        </article>
      </div>

      <div className="orientation-steps">
        <h3>How This Benefits Your Work</h3>
        <ol>
          {guide.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="orientation-next-action">
        <span className="status-chip safe">Next Best Action</span>
        <p>{guide.nextBestAction}</p>
      </div>
    </section>
  );
}
