import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getEventRecord } from '@/lib/event-context';
import { getCoordinationFeedByEvent } from '@/lib/mock-ops';
import { buildBaseCanonicalTimeline } from '@/lib/canonical-timeline';
import { getClientPlanForEvent, formatDate, getDaysUntil } from '@/lib/mock-client-milestones';
import { type ChecklistProjection, getApprovalProjectionForActor, getChecklistState, getMusicProjectionForActor } from '@/lib/couple-domains';
import ClientPaymentPanel from '@/app/portal/couple/components/ClientPaymentPanel';
import ClientContactsPanel from '@/app/portal/couple/components/ClientContactsPanel';
import ApprovalsStatusPanel from '@/app/portal/couple/components/ApprovalsStatusPanel';
import MusicExperienceWorkflowPanel from '@/app/portal/couple/components/MusicExperienceWorkflowPanel';
import EventTimelineCard from '@/app/portal/components/EventTimelineCard';
import InviteManagementPanel from '@/app/portal/components/InviteManagementPanel';

type HeroAction = {
  title: string;
  detail: string;
  buttonLabel: string;
  target: '#quick-music' | '#quick-timeline' | '#quick-approvals' | '#quick-payments';
};

function getRelativeTimeLabel(isoDate: string): string {
  const value = new Date(isoDate).getTime();
  if (!Number.isFinite(value)) {
    return 'Just now';
  }

  const diffMinutes = Math.max(1, Math.floor((Date.now() - value) / 60000));
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return `${Math.floor(diffHours / 24)}d ago`;
}

function titleFromPaymentLabel(label: string): string {
  if (label.toLowerCase().includes('deposit')) {
    return 'Confirm your booking deposit';
  }

  return 'Confirm your next payment milestone';
}

function findTodoByHint<T extends { id: string }>(items: T[], hint: string[]): T | undefined {
  return items.find((item) => hint.some((fragment) => item.id.includes(fragment)));
}

function getNextHeroAction(params: {
  checklist: ChecklistProjection | null;
  approvalsComplete: boolean;
}): HeroAction | null {
  const { checklist, approvalsComplete } = params;

  if (!checklist) {
    return null;
  }

  const musicTodo = checklist.checklist.find((item) => item.id.includes('music-questionnaire'));
  if (musicTodo && musicTodo.status !== 'completed' && !musicTodo.locked) {
    return {
      title: 'Complete Music Questionnaire',
      detail: 'Share your music preferences so your planner and DJ can shape a dance floor that feels like you.',
      buttonLabel: 'Start Questionnaire',
      target: '#quick-music'
    };
  }

  const nextPayment = checklist.payments.find((item) => item.status === 'pending' && item.clientCompletable);
  if (nextPayment) {
    return {
      title: titleFromPaymentLabel(nextPayment.label),
      detail: 'A quick confirmation here keeps your planning rhythm smooth and stress-free.',
      buttonLabel: 'Open Payments',
      target: '#quick-payments'
    };
  }

  if (!approvalsComplete) {
    return {
      title: 'Review Your Open Sign-offs',
      detail: 'A few final decisions are waiting on you so your team can keep moving with confidence.',
      buttonLabel: 'Review Sign-offs',
      target: '#quick-approvals'
    };
  }

  const timelineTodo = findTodoByHint(checklist.checklist, ['timeline', 'day-of-brief']);
  if (timelineTodo && timelineTodo.status !== 'completed') {
    return {
      title: 'Review Timeline Draft',
      detail: 'Take a final look at the flow of your day and share any adjustments you would love to make.',
      buttonLabel: 'Review Timeline',
      target: '#quick-timeline'
    };
  }

  return null;
}

export default async function CouplePortalPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const event = session.eventId ? await getEventRecord(session.eventId) : undefined;
  const plan = session.eventId ? getClientPlanForEvent(session.eventId) : undefined;
  const checklist = session.eventId ? getChecklistState(session.eventId) : null;
  const musicProjection = session.eventId ? getMusicProjectionForActor({ eventId: session.eventId, actorRole: session.role }) : null;
  const approvalsProjection = session.eventId ? getApprovalProjectionForActor({ eventId: session.eventId, actorRole: session.role }) : null;

  const primaryDate = plan?.primaryDates[0];
  const dayCount = primaryDate ? getDaysUntil(primaryDate) : null;
  const approvalsComplete = Boolean(approvalsProjection && approvalsProjection.summary.completeCount === approvalsProjection.summary.totalCount);
  const heroAction = getNextHeroAction({ checklist, approvalsComplete });

  const timelinePreview = session.eventId
    ? buildBaseCanonicalTimeline(session.eventId)
        .filter((item) => item.status === 'pending' || item.status === 'ready' || item.status === 'in_progress')
        .slice(0, 3)
    : [];

  const activityFeed = session.eventId ? getCoordinationFeedByEvent(session.eventId).slice(0, 4) : [];
  const signedTodo = checklist ? findTodoByHint(checklist.checklist, ['todo-contract']) : undefined;
  const depositMilestone = checklist ? checklist.payments.find((item) => item.percent === 30 || item.id.includes('deposit')) : undefined;
  const musicTodo = checklist ? findTodoByHint(checklist.checklist, ['music-questionnaire']) : undefined;
  const timelineTodo = checklist ? findTodoByHint(checklist.checklist, ['timeline', 'day-of-brief']) : undefined;

  const progressMilestones = [
    { label: 'Signed Contract', done: signedTodo?.status === 'completed', action: false },
    { label: 'Booking Deposit', done: depositMilestone?.status === 'completed', action: depositMilestone?.status === 'pending' },
    { label: 'Music Questionnaire', done: musicTodo?.status === 'completed', action: Boolean(musicTodo && musicTodo.status !== 'completed' && !musicTodo.locked) },
    { label: 'Timeline Review', done: timelineTodo?.status === 'completed', action: Boolean(timelineTodo && timelineTodo.status !== 'completed') },
    { label: 'Final Approvals', done: approvalsComplete, action: approvalsProjection ? approvalsProjection.summary.completeCount < approvalsProjection.summary.totalCount : false }
  ];

  return (
    <section className="page-wrap concierge-page">
      <header className="portal-page-header">
        <span className="eyebrow">Your Wedding Concierge</span>
        <h1 className="page-title">{event?.title ?? 'Your Wedding'}</h1>
        <div className="couple-event-meta">
          {event?.venueName ? <span className="couple-meta-chip">{event.venueName}</span> : null}
          {plan ? <span className="couple-meta-chip">{plan.primaryDates.map((d) => formatDate(d)).join(' & ')}</span> : null}
          {plan ? <span className="couple-meta-chip">{event?.guestCountEstimate} guests</span> : null}
          {dayCount !== null && dayCount > 0 ? <span className="couple-meta-chip couple-meta-chip--countdown">{dayCount} days away</span> : null}
        </div>
      </header>

      {!plan ? (
        <div className="portal-notice">
          <strong>Your event plan is being prepared.</strong> Your planning team will have your full experience ready within 24 hours of contract signing.
        </div>
      ) : (
        <>
          <section className={`concierge-hero${heroAction ? '' : ' concierge-hero--on-track'}`}>
            {heroAction ? (
              <>
                <p className="concierge-hero__kicker">Next Action</p>
                <h2 className="concierge-hero__title">{heroAction.title}</h2>
                <p className="concierge-hero__body">{heroAction.detail}</p>
                <a className="btn primary concierge-hero__cta" href={heroAction.target}>
                  {heroAction.buttonLabel}
                </a>
              </>
            ) : (
              <>
                <p className="concierge-hero__kicker">Everything Is On Track</p>
                <h2 className="concierge-hero__title">Your planning is moving beautifully.</h2>
                <p className="concierge-hero__body">
                  Everything important is in motion. Take a breath, enjoy the season, and visit anytime for thoughtful updates from your team.
                </p>
                <a className="btn primary concierge-hero__cta" href="#quick-timeline">
                  Review Timeline
                </a>
              </>
            )}
          </section>

          <div className="concierge-grid">
            <section className="client-panel concierge-progress" aria-label="Planning progress milestones">
              <div className="client-panel__header">
                <div>
                  <h2 className="client-panel__title">Progress</h2>
                  <p className="client-panel__sub">A graceful snapshot of what is complete and what is ready for your touch.</p>
                </div>
              </div>
              <ul className="concierge-progress-list">
                {progressMilestones.map((item) => (
                  <li key={item.label} className="concierge-progress-item">
                    <span className={`concierge-progress-dot${item.done ? ' concierge-progress-dot--done' : item.action ? ' concierge-progress-dot--action' : ''}`} aria-hidden>
                      {item.done ? '✓' : '•'}
                    </span>
                    <span className="concierge-progress-label">{item.label}</span>
                    <span className={`todo-badge ${item.done ? 'todo-badge--done' : item.action ? 'todo-badge--action' : 'todo-badge--upcoming'}`}>
                      {item.done ? 'Complete' : item.action ? 'Needs You' : 'In Motion'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="client-panel concierge-quick-actions" aria-label="Quick actions">
              <div className="client-panel__header">
                <div>
                  <h2 className="client-panel__title">Quick Actions</h2>
                  <p className="client-panel__sub">Go straight to the moments that need your voice.</p>
                </div>
              </div>
              <div className="concierge-quick-grid">
                <a className="concierge-quick-tile" href="#quick-music">
                  <strong>Music</strong>
                  <span>{musicTodo?.status === 'completed' ? 'Complete' : musicTodo?.locked ? 'Available after deposit confirmation' : 'Ready for you'}</span>
                </a>
                <a className="concierge-quick-tile" href="#quick-timeline">
                  <strong>Timeline</strong>
                  <span>{timelineTodo?.status === 'completed' ? 'Complete' : 'Awaiting your review'}</span>
                </a>
                <a className="concierge-quick-tile" href="#quick-approvals">
                  <strong>Approvals</strong>
                  <span>{approvalsComplete ? 'Complete' : 'Awaiting your review'}</span>
                </a>
                <a className="concierge-quick-tile" href="#quick-payments">
                  <strong>Payments</strong>
                  <span>{depositMilestone?.status === 'completed' ? 'On track' : 'Needs confirmation'}</span>
                </a>
              </div>
            </section>

            {session.eventId ? <ClientContactsPanel eventId={session.eventId} /> : null}
          </div>

          <section className="client-panel concierge-activity" aria-label="Activity feed">
            <div className="client-panel__header">
              <div>
                <h2 className="client-panel__title">Activity Feed</h2>
                <p className="client-panel__sub">Recent notes from your planner and creative partners.</p>
              </div>
            </div>
            <ul className="concierge-feed-list">
              {activityFeed.length > 0
                ? activityFeed.map((item) => (
                    <li key={item.id} className="concierge-feed-item">
                      <div className="item-title-row">
                        <strong className="item-title">{item.owner.replace('REVEL Ops', 'Operations Desk')}</strong>
                        <span className="item-meta">{getRelativeTimeLabel(item.timestamp)}</span>
                      </div>
                      <p className="item-note">{item.update}</p>
                    </li>
                  ))
                : timelinePreview.map((item) => (
                    <li key={item.id} className="concierge-feed-item">
                      <div className="item-title-row">
                        <strong className="item-title">{item.ownerLabel}</strong>
                        <span className="item-meta">{item.status.replace('_', ' ')}</span>
                      </div>
                      <p className="item-note">{item.title}</p>
                    </li>
                  ))}
            </ul>
          </section>

          <div className="couple-dashboard-grid concierge-detail-stack">
            <div id="quick-music">{musicProjection?.music ? <MusicExperienceWorkflowPanel initialMusic={musicProjection.music} /> : null}</div>
            <div id="quick-timeline"><EventTimelineCard /></div>
            <div id="quick-approvals">{approvalsProjection ? <ApprovalsStatusPanel initialData={approvalsProjection} /> : null}</div>
            <div id="quick-payments">{checklist ? <ClientPaymentPanel totalContractValue={plan.totalContractValue} initialData={checklist} /> : null}</div>
          </div>

          <InviteManagementPanel />
        </>
      )}
    </section>
  );
}
