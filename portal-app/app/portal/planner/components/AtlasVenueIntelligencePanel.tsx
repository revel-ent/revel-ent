import { getAtlasVenueDetail, listAtlasVenues } from '@/lib/atlas-venues';

function formatConstraintValue(value: {
  valueText: string | null;
  valueNumber: number | null;
  valueBoolean: boolean | null;
  unit: string | null;
}) {
  if (value.valueText) {
    return value.valueText;
  }

  if (typeof value.valueNumber === 'number') {
    return `${value.valueNumber}${value.unit ? ` ${value.unit}` : ''}`;
  }

  if (typeof value.valueBoolean === 'boolean') {
    return value.valueBoolean ? 'Allowed' : 'Not allowed';
  }

  return 'Review venue notes';
}

export default async function AtlasVenueIntelligencePanel() {
  const loaded = await listAtlasVenues();
  const highlightedVenue = loaded.venues[0] ?? null;
  const detail = highlightedVenue ? await getAtlasVenueDetail(highlightedVenue.id) : null;
  const riskConstraints = detail?.constraints.filter((constraint) =>
    ['baraat_policy', 'curfew_time', 'max_decibels', 'loading_dock', 'push_distance'].includes(constraint.key)
  ).slice(0, 5);

  return (
    <article className="card atlas-venue-panel atlas-venue-panel--wide">
      <div className="card-header">
        <div>
          <h3>Atlas Venue Intelligence</h3>
          <p className="item-note">
            Planner-facing venue truth, imported from Atlas and ready for feasibility review.
          </p>
        </div>
        <span className="chip">Source: {loaded.source === 'database' ? 'Supabase' : 'Fallback'}</span>
      </div>

      <div className="atlas-venue-panel__summary">
        <div className="data-row">
          <strong className="item-title">Imported venues</strong>
          <p className="item-meta">{loaded.venues.length} venues currently available for planner review.</p>
        </div>
        {highlightedVenue ? (
          <div className="data-row">
            <div className="item-title-row">
              <strong className="item-title">Featured venue</strong>
              <span className={`status-chip ${highlightedVenue.comfortableRangeMax > 0 ? 'safe' : 'pending'}`}>
                {highlightedVenue.sourceConfidence.replace('_', ' ')}
              </span>
            </div>
            <p className="item-meta">{highlightedVenue.name}</p>
            <p className="item-note">{highlightedVenue.city}</p>
          </div>
        ) : null}
      </div>

      {detail ? (
        <div className="atlas-venue-panel__grid">
          <section className="atlas-venue-panel__section">
            <h4>Capacity reality</h4>
            <ul className="clean-list">
              <li className="data-row">
                Marketed capacity: <strong>{detail.marketedCapacity || 'Unknown'}</strong>
              </li>
              <li className="data-row">
                Comfortable range: <strong>{detail.comfortableRangeMin || 'Unknown'} - {detail.comfortableRangeMax || 'Unknown'}</strong>
              </li>
              <li className="data-row">
                Room dimensions: <strong>{detail.lengthFt || '?'} x {detail.widthFt || '?'} x {detail.heightFt || '?'} ft</strong>
              </li>
            </ul>
          </section>

          <section className="atlas-venue-panel__section">
            <h4>Key planner flags</h4>
            <ul className="clean-list">
              {(riskConstraints && riskConstraints.length > 0 ? riskConstraints : detail.constraints.slice(0, 5)).map((constraint) => (
                <li key={`${constraint.category}-${constraint.key}`} className="data-row">
                  <strong className="item-title">{constraint.key.replace(/_/g, ' ')}</strong>
                  <p className="item-meta">{formatConstraintValue(constraint)}</p>
                  {constraint.notes ? <p className="item-note">{constraint.notes}</p> : null}
                </li>
              ))}
            </ul>
          </section>

          <section className="atlas-venue-panel__section">
            <h4>Planner notes</h4>
            <p className="item-note">{detail.constraintsSummary}</p>
            <ul className="clean-list">
              {detail.notes.map((note) => (
                <li key={note} className="data-row">{note}</li>
              ))}
              {detail.notes.length === 0 ? (
                <li className="data-row">Atlas constraints are imported. Next step is to surface venue-safe recommendations in onboarding and planner flows.</li>
              ) : null}
            </ul>
          </section>
        </div>
      ) : (
        <p className="alert">No Atlas venue details are available yet.</p>
      )}
    </article>
  );
}
