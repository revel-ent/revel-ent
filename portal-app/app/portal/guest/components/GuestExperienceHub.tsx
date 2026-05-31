import { getSession } from '@/lib/session';
import { getGuestEventLabel, getGuestExperienceData } from '@/lib/mock-guest-experience';

import GuestRequestForm from '@/app/portal/guest/components/GuestRequestForm';

export default async function GuestExperienceHub() {
  const session = await getSession();

  if (!session?.eventId) {
    return null;
  }

  const data = getGuestExperienceData(session.eventId);
  const eventLabel = getGuestEventLabel(session.eventId);

  return (
    <article className="card">
      <div className="card-header">
        <h3>Guest Experience Hub</h3>
        <span className="chip">Personalized by Event</span>
      </div>
      <p>
        {eventLabel}: guest-facing guidance, local recommendations, and quick request forms.
      </p>

      <div className="guest-hub-grid">
        <section className="data-row">
          <strong className="item-title">What to Wear</strong>
          <p className="item-meta">{data.attireNotes}</p>
        </section>

        <section className="data-row">
          <strong className="item-title">Arrival and Parking</strong>
          <p className="item-meta">{data.parkingNotes}</p>
        </section>

        <section className="data-row">
          <strong className="item-title">Dietary Guidance</strong>
          <p className="item-meta">{data.dietaryPrompt}</p>
        </section>

        <section className="data-row">
          <strong className="item-title">Local Recommendations</strong>
          {data.localRecommendations.length === 0 ? (
            <p className="item-meta">Recommendations will be posted soon.</p>
          ) : (
            <ul className="clean-list" style={{ marginTop: '0.45rem' }}>
              {data.localRecommendations.map((item) => (
                <li key={item.id} className="item-meta">
                  <strong>{item.title}</strong> - {item.notes}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <GuestRequestForm songRequestLimit={data.songRequestLimit} />
    </article>
  );
}
