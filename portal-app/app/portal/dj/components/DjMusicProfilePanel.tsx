import { getMusicProjectionForActor } from '@/lib/couple-domains';
import { getSession } from '@/lib/session';

export default async function DjMusicProfilePanel() {
  const session = await getSession();

  if (!session?.eventId) {
    return null;
  }

  const projection = getMusicProjectionForActor({ eventId: session.eventId, actorRole: session.role });
  const music = projection.music;

  return (
    <article className="card">
      <div className="card-header">
        <h3>Music Profile</h3>
        <span className="chip">Auto-delivered</span>
      </div>
      {music?.status !== 'completed' || !music.profile ? (
        <p>Music profile will appear here as soon as the couple completes the music questionnaire.</p>
      ) : (
        <>
          <p>{music.profile.summary}</p>
          <ul className="feed-list">
            <li className="feed-item">
              <div className="item-title-row">
                <span className="item-title">Genre split</span>
                <span className="status-chip safe">{music.profile.plannerStatus}</span>
              </div>
              <p className="item-note">{music.profile.genreSplit}</p>
            </li>
            <li className="feed-item">
              <div className="item-title-row">
                <span className="item-title">Dance-off notes</span>
              </div>
              <p className="item-note">{music.profile.danceOffPlan}</p>
            </li>
            <li className="feed-item">
              <div className="item-title-row">
                <span className="item-title">Other genres</span>
              </div>
              <p className="item-note">{music.profile.otherNotes}</p>
            </li>
            <li className="feed-item">
              <div className="item-title-row">
                <span className="item-title">Additional notes</span>
              </div>
              <p className="item-note">{music.profile.additionalNotes}</p>
            </li>
          </ul>
        </>
      )}
    </article>
  );
}