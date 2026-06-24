import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getEventRecord } from '@/lib/event-context';
import { getCoordinationFeedByEvent } from '@/lib/mock-ops';
import { getClientPlanForEvent, formatDate, getDaysUntil } from '@/lib/mock-client-milestones';
import { type ChecklistProjection, getApprovalProjectionForActor, getChecklistState, getMusicProjectionForActor } from '@/lib/couple-domains';
import ClientPaymentPanel from '@/app/portal/couple/components/ClientPaymentPanel';
import ClientContactsPanel from '@/app/portal/couple/components/ClientContactsPanel';
import ApprovalsStatusPanel from '@/app/portal/couple/components/ApprovalsStatusPanel';
import MusicExperienceWorkflowPanel from '@/app/portal/couple/components/MusicExperienceWorkflowPanel';
import CollapsibleSection from '@/app/portal/couple/components/CollapsibleSection';
import CoupleTimelinePanel from '@/app/portal/couple/components/CoupleTimelinePanel';
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
      title: 'Complete Your Music Questionnaire',
      detail: 'Tell us what moves you — your planner and DJ will shape a dance floor that feels unmistakably yours.',
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
      title: 'Review Your Open Decisions',
      detail: 'A few final choices are waiting on you so your team can keep moving with confidence.',
      buttonLabel: 'Review Decisions',
      target: '#quick-approvals'
    };
  }

  const timelineTodo = findTodoByHint(checklist.checklist, ['timeline', 'day-of-brief']);
  if (timelineTodo && timelineTodo.status !== 'completed') {
    return {
      title: 'Review Your Timeline Draft',
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
  const checklist = session.eventId ? await getChecklistState(session.eventId) : null;
  const musicProjection = session.eventId ? await getMusicProjectionForActor({ eventId: session.eventId, actorRole: session.role }) : null;
  const approvalsProjection = session.eventId ? await getApprovalProjectionForActor({ eventId: session.eventId, actorRole: session.role }) : null;

  const primaryDate = plan?.primaryDates[0];
  const dayCount = primaryDate ? getDaysUntil(primaryDate) : null;
  const approvalsComplete = Boolean(approvalsProjection && approvalsProjection.summary.completeCount === approvalsProjection.summary.totalCount);
  const heroAction = getNextHeroAction({ checklist, approvalsComplete });

  const activityFeed = session.eventId ? getCoordinationFeedByEvent(session.eventId).slice(0, 3) : [];
  const signedTodo = checklist ? findTodoByHint(checklist.checklist, ['todo-contract']) : undefined;
  const depositMilestone = checklist ? checklist.payments.find((item) => item.percent === 30 || item.id.includes('deposit')) : undefined;
  const musicTodo = checklist ? findTodoByHint(checklist.checklist, ['music-questionnaire']) : undefined;
  const timelineTodo = checklist ? findTodoByHint(checklist.checklist, ['timeline', 'day-of-brief']) : undefined;
  const openDecisions = approvalsProjection ? approvalsProjection.summary.totalCount - approvalsProjection.summary.completeCount : 0;

  const progressMilestones = [
    { label: 'Contract', done: signedTodo?.status === 'completed', action: false },
    { label: 'Deposit', done: depositMilestone?.status === 'completed', action: depositMilestone?.status === 'pending' },
    { label: 'Music', done: musicTodo?.status === 'completed', action: Boolean(musicTodo && musicTodo.status !== 'completed' && !musicTodo.locked) },
    { label: 'Timeline', done: timelineTodo?.status === 'completed', action: false },
    { label: 'Final Touches', done: approvalsComplete, action: false }
  ];

  const musicIsNextAction = heroAction?.target === '#quick-music';
  const paymentsNeedAction = Boolean(checklist?.payments.some((item) => item.status === 'pending' && item.clientCompletable));

  return (
    <section className="page-wrap concierge-page">
      <header className="portal-page-header concierge-header">
        <span className="eyebrow">Your Wedding Concierge</span>
        <h1 className="page-title concierge-title">{event?.title ?? 'Your Wedding'}</h1>
        <div className="couple-event-meta">
          {dayCount !== null && dayCount > 0 ? <span className="couple-meta-chip couple-meta-chip--countdown">{dayCount} days to go</span> : null}
          {event?.venueName ? <span className="couple-meta-chip">{event.venueName}</span> : null}
          {plan ? <span className="couple-meta-chip">{plan.primaryDates.map((d) => formatDate(d)).join(' & ')}</span> : null}
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
                <p className="concierge-hero__kicker">One Thing for You</p>
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
                  Everything important is in motion. Take a breath, enjoy the season, and visit anytime for updates from your team.
                </p>
              </>
            )}
          </section>

          <section className="concierge-stepper" aria-label="Planning progress">
            {progressMilestones.map((item) => (
              <div key={item.label} className={`concierge-step${item.done ? ' concierge-step--done' : item.action ? ' concierge-step--action' : ''}`}>
                <span className="concierge-step__dot" aria-hidden>
                  {item.done ? '✓' : ''}
                </span>
                <span className="concierge-step__label">{item.label}</span>
              </div>
            ))}
          </section>

          <section className="concierge-quick-actions" aria-label="Quick actions">
            <div className="concierge-quick-grid">
              <a className="concierge-quick-tile" href="#quick-music">
                <strong>Music</strong>
                <span>{musicTodo?.status === 'completed' ? 'Complete' : musicTodo?.locked ? 'Opens after deposit' : 'Ready for you'}</span>
              </a>
              <a className="concierge-quick-tile" href="#quick-timeline">
                <strong>Timeline</strong>
                <span>{timelineTodo?.status === 'completed' ? 'Complete' : 'With your planner'}</span>
              </a>
              <a className="concierge-quick-tile" href="#quick-approvals">
                <strong>Decisions</strong>
                <span>{approvalsComplete ? 'All done' : `${openDecisions} waiting for you`}</span>
              </a>
              <a className="concierge-quick-tile" href="#quick-payments">
                <strong>Payments</strong>
                <span>{paymentsNeedAction ? 'Needs confirmation' : 'On track'}</span>
              </a>
            </div>
          </section>

          <CollapsibleSection id="quick-music" title="Music Questionnaire" hint="Shape your dance floor" badge={musicTodo?.status === 'completed' ? 'Complete' : 'Ready for you'} defaultOpen={musicIsNextAction}>
            {musicProjection?.music ? <MusicExperienceWorkflowPanel initialMusic={musicProjection.music} /> : null}
          </CollapsibleSection>

          <CollapsibleSection id="quick-timeline" title="Weekend Timeline" hint="The flow of your celebration" badge={timelineTodo?.status === 'completed' ? 'Complete' : 'In progress'}>
            <CoupleTimelinePanel eventDates={plan.primaryDates} />
          </CollapsibleSection>

          <CollapsibleSection id="quick-approvals" title="Your Decisions" hint="Choices awaiting your green light" badge={approvalsComplete ? 'All done' : `${openDecisions} open`}>
            {approvalsProjection ? <ApprovalsStatusPanel initialData={approvalsProjection} /> : null}
          </CollapsibleSection>

          <CollapsibleSection id="quick-payments" title="Payments" hint="Milestones and receipts" badge={paymentsNeedAction ? 'Action needed' : 'On track'}>
            {checklist ? <ClientPaymentPanel totalContractValue={plan.totalContractValue} initialData={checklist} /> : null}
          </CollapsibleSection>

          <CollapsibleSection id="your-team" title="Your Team" hint="The people bringing it to life">
            {session.eventId ? <ClientContactsPanel eventId={session.eventId} /> : null}
          </CollapsibleSection>

          <CollapsibleSection id="recent-updates" title="Recent Updates" hint="Notes from your planning team" badge={activityFeed.length ? `${activityFeed.length} new` : undefined}>
            <ul className="concierge-feed-list">
              {activityFeed.map((item) => (
                <li key={item.id} className="concierge-feed-item">
                  <div className="item-title-row">
                    <strong className="item-title">{item.owner.replace('REVEL Ops', 'Operations Desk')}</strong>
                    <span className="item-meta">{getRelativeTimeLabel(item.timestamp)}</span>
                  </div>
                  <p className="item-note">{item.update}</p>
                </li>
              ))}
              {activityFeed.length === 0 ? <li className="concierge-feed-item"><p className="item-note">Updates from your team will appear here.</p></li> : null}
            </ul>
          </CollapsibleSection>

          {event?.moodBoardUrl ? (
            <section className="client-panel concierge-moodboard" aria-label="Vision Board">
              <div className="client-panel__header">
                <div>
                  <h2 className="client-panel__title">Your Vision Board</h2>
                  <p className="client-panel__sub">The look and feel of your weekend, curated by your decorator.</p>
                </div>
              </div>
              <div className="concierge-moodboard__frame">
                <iframe
                  src={event.moodBoardUrl}
                  title="Wedding Vision Board"
                  className="concierge-moodboard__embed"
                  allowFullScreen
                />
              </div>
              <a className="concierge-moodboard__link" href={event.moodBoardUrl} target="_blank" rel="noopener noreferrer">
                Open full screen
              </a>
            </section>
          ) : (
            <section className="client-panel concierge-moodboard concierge-moodboard--empty" aria-label="Vision Board">
              <div className="client-panel__header">
                <div>
                  <h2 className="client-panel__title">Your Vision Board</h2>
                  <p className="client-panel__sub">The look and feel of your weekend, curated by your decorator.</p>
                </div>
              </div>
              <p className="item-note">Your vision board will appear here once your decorator shares it.</p>
            </section>
          )}

          <CollapsibleSection id="invite-family" title="Invite Family & Friends" hint="Share your wedding hub">
            <InviteManagementPanel audience="couple" />
          </CollapsibleSection>
        </>
      )}
    </section>
  );
}
