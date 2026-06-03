'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  MUSIC_GENRE_KEYS,
  type MusicDomainRecord,
  type MusicGenreKey,
  type MusicQuestionnaireInput
} from '@/lib/couple-domains';

const GENRE_LABELS: Record<MusicGenreKey, string> = {
  bhangraNewer: 'Bhangra (newer)',
  bhangraOldSchool: 'Bhangra (old school)',
  bollywoodNewer: 'Bollywood (newer)',
  bollywoodOlder: 'Bollywood (older)',
  oldSchoolHipHop: 'Old school hip-hop',
  currentHipHopTop40: 'Current hip-hop / Top 40',
  house: 'House',
  latin: 'Latin',
  other: 'Other'
};

const EMPTY_FORM: MusicQuestionnaireInput = {
  genreMix: {
    bhangraNewer: 15,
    bhangraOldSchool: 10,
    bollywoodNewer: 25,
    bollywoodOlder: 15,
    oldSchoolHipHop: 10,
    currentHipHopTop40: 10,
    house: 5,
    latin: 5,
    other: 5
  },
  otherGenres: '',
  danceOffNotes: '',
  additionalNotes: ''
}

export default function MusicExperienceWorkflowPanel({ initialMusic }: { initialMusic: MusicDomainRecord }) {
  const [music, setMusic] = useState(initialMusic);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<MusicQuestionnaireInput>(initialMusic.questionnaire ?? EMPTY_FORM);

  useEffect(() => {
    async function refresh() {
      const response = await fetch('/api/events/music', { cache: 'no-store' });
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { music: MusicDomainRecord };
      setMusic(payload.music);
      if (payload.music.questionnaire) {
        setForm(payload.music.questionnaire);
      }
    }

    const handleRefresh = () => {
      void refresh();
    };

    const openWorkflow = () => {
      document.getElementById('music-experience-workflow')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    window.addEventListener('atlas:couple-domains-refresh', handleRefresh);
    window.addEventListener('atlas:open-music-experience', openWorkflow);
    return () => {
      window.removeEventListener('atlas:couple-domains-refresh', handleRefresh);
      window.removeEventListener('atlas:open-music-experience', openWorkflow);
    };
  }, []);

  const total = useMemo(() => MUSIC_GENRE_KEYS.reduce((sum, key) => sum + form.genreMix[key], 0), [form]);

  const reviewSummary = useMemo(() => {
    const topGenres = [...MUSIC_GENRE_KEYS]
      .sort((left, right) => form.genreMix[right] - form.genreMix[left])
      .slice(0, 3)
      .map((key) => `${GENRE_LABELS[key]} ${form.genreMix[key]}%`);

    return {
      topGenres
    };
  }, [form]);

  async function submit() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/events/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const payload = (await response.json()) as { error?: string; music?: MusicDomainRecord };
      if (!response.ok || !payload.music) {
        throw new Error(payload.error ?? 'music_submit_failed');
      }

      setMusic(payload.music);
      window.dispatchEvent(new Event('atlas:couple-domains-refresh'));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'music_submit_failed');
    } finally {
      setSubmitting(false);
    }
  }

  const statusBadgeLabel =
    music.status === 'completed'
      ? 'Complete'
      : music.status === 'ready'
        ? 'Ready for you'
        : 'Available after deposit confirmation';

  const formattedError =
    error === 'music_locked'
      ? 'Available after deposit confirmation.'
      : error === 'genre_mix_total_invalid'
        ? 'Please make sure your genre totals add up to 100%.'
        : error;

  return (
    <article className="client-panel" id="music-experience-workflow">
      <div className="client-panel__header">
        <div>
          <h2 className="client-panel__title">Music Questionnaire</h2>
          <p className="client-panel__sub">Share your music preferences so we can shape a celebration that feels unmistakably yours.</p>
        </div>
        <span className={`todo-badge ${music.status === 'completed' ? 'todo-badge--done' : music.status === 'ready' ? 'todo-badge--action' : 'todo-badge--upcoming'}`}>
          {statusBadgeLabel}
        </span>
      </div>

      {!music.unlockedByDeposit ? (
        <div className="portal-notice">
          <strong>Available after deposit confirmation.</strong> As soon as your booking deposit is confirmed, this questionnaire opens automatically.
        </div>
      ) : null}

      {music.unlockedByDeposit ? (
        <>
          <div className="tool-form">
            <p className="item-note">
              Tell us the mix of sounds you and your guests love on the dance floor, then allocate the percentage you want for each style.
            </p>

            {MUSIC_GENRE_KEYS.map((key) => (
              <label key={key}>
                {GENRE_LABELS[key]}
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="100"
                  value={form.genreMix[key]}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      genreMix: {
                        ...current.genreMix,
                        [key]: Number(event.target.value)
                      }
                    }))
                  }
                />
              </label>
            ))}

            <p className={`item-note${total === 100 ? '' : ' alert error'}`}>Current total: {total}%</p>

            <label>
              Other (please specify)
              <textarea
                rows={3}
                value={form.otherGenres}
                onChange={(event) => setForm((current) => ({ ...current, otherGenres: event.target.value }))}
                placeholder="List any other genres or regional styles here."
              />
            </label>

            <label>
              Would you like a dance-off?
              <textarea
                rows={3}
                value={form.danceOffNotes}
                onChange={(event) => setForm((current) => ({ ...current, danceOffNotes: event.target.value }))}
                placeholder="Bride side vs Groom side, ladies vs gents, or any other format you want us to host."
              />
            </label>

            <label>
              Additional notes
              <textarea
                rows={5}
                value={form.additionalNotes}
                onChange={(event) => setForm((current) => ({ ...current, additionalNotes: event.target.value }))}
                placeholder="Any additional details, artists, genres, transitions, or cultural notes."
              />
            </label>
          </div>

          <div className="tool-result">
            <div className="data-row">
              <div className="item-title-row">
                <strong className="item-title">Questionnaire Summary</strong>
                <span className="status-chip safe">Ready when you are</span>
              </div>
              <p className="item-note">Top genre mix: {reviewSummary.topGenres.join(', ')}</p>
              <p className="item-note">Other genres: {form.otherGenres || 'None specified'}</p>
              <p className="item-note">Dance-off: {form.danceOffNotes || 'None requested'}</p>
              <p className="item-note">Additional notes: {form.additionalNotes || 'No additional notes yet'}</p>
            </div>

            {music.profile ? (
              <div className="data-row">
                <div className="item-title-row">
                  <strong className="item-title">Submitted Music Profile</strong>
                  <span className="status-chip completed">COMPLETE</span>
                </div>
                <p className="item-note">{music.profile.summary}</p>
                <p className="item-note">{music.profile.genreSplit}</p>
                <p className="item-note">{music.profile.danceOffPlan}</p>
              </div>
            ) : null}
          </div>

          {formattedError ? <p className="alert error">{formattedError}</p> : null}

          <div className="split">
            <button className="btn primary" type="button" onClick={() => void submit()} disabled={submitting || total !== 100}>
              {submitting ? 'Saving...' : music.status === 'completed' ? 'Save Questionnaire Updates' : 'Share Music Questionnaire'}
            </button>
          </div>
        </>
      ) : null}
    </article>
  );
}