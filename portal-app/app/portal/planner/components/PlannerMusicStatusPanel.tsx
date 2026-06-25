import { getMusicProjectionForActor } from '@/lib/couple-domains';
import { getSession } from '@/lib/session';

export default async function PlannerMusicStatusPanel() {
  const session = await getSession();

  if (!session?.eventId) {
    return null;
  }

  const projection = await getMusicProjectionForActor({ eventId: session.eventId, actorRole: session.role });
  const music = projection.music;

  return (
    <article className="card">
      <div className="card-header">
        <h3>Music Status</h3>
        <span className="chip">Couple Domain</span>
      </div>
      <p>The couple music questionnaire feeds structured data and a generated profile directly into planner and DJ execution lanes.</p>

      <div className="data-row">
        <div className="item-title-row">
          <strong className="item-title">Workflow Status</strong>
          <span className={`status-chip ${music?.status === 'completed' ? 'completed' : music?.status === 'ready' ? 'in_progress' : 'pending'}`}>
            {music?.status ?? 'locked'}
          </span>
        </div>
        <p className="item-note">{music?.profile?.summary ?? 'Waiting for couple submission after deposit confirmation.'}</p>
        <p className="item-note">Planner status: {music?.profile?.plannerStatus ?? 'Pending'}</p>
      </div>
    </article>
  );
}