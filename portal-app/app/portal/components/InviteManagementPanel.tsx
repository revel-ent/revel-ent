'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

interface InviteRecord {
  tokenId: string;
  inviteeEmail: string;
  inviteeDisplayName: string | null;
  targetRole: string;
  roleProfile: string | null;
  status: 'generated' | 'delivered' | 'accepted' | 'expired' | 'revoked';
  expiresAt: string | null;
  acceptedAt: string | null;
  createdAt: string | null;
}

interface CreatedInvite {
  inviteeEmail: string;
  inviteLink: string;
  inviteToken: string;
  delivered: boolean;
}

// Roles a planner/couple/admin can assign. (admin is intentionally omitted — couple/planner
// cannot assign it, and admin-to-admin invites are an edge case handled via the API directly.)
const ROLE_OPTIONS = [
  { value: 'planner', label: 'Planner' },
  { value: 'couple', label: 'Couple / Client' },
  { value: 'vendor', label: 'Vendor (photographer, decor, catering, etc.)' },
  { value: 'dj_mc', label: 'DJ / MC / Entertainment' },
  { value: 'production', label: 'Production Team' },
  { value: 'venue_coordinator', label: 'Venue Coordinator' },
  { value: 'delegate_coordinator', label: 'Family Coordinator' },
  { value: 'guest', label: 'Guest' }
] as const;

const PROFILE_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'decorator', label: 'Decorator / Floral' },
  { value: 'dj_mc', label: 'DJ / MC' },
  { value: 'production', label: 'Production' }
] as const;

const EXPIRY_OPTIONS = [
  { value: 168, label: '7 days' },
  { value: 336, label: '14 days' },
  { value: 720, label: '30 days' }
] as const;

function roleLabel(role: string): string {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

function statusTone(status: InviteRecord['status']): string {
  switch (status) {
    case 'accepted':
      return 'safe';
    case 'delivered':
    case 'generated':
      return 'tight';
    case 'expired':
    case 'revoked':
      return 'unsafe';
    default:
      return 'tight';
  }
}

function formatStamp(value: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function InviteManagementPanel() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyTokenId, setBusyTokenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<CreatedInvite | null>(null);

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<string>('vendor');
  const [roleProfile, setRoleProfile] = useState<string>('general');
  const [expiresInHours, setExpiresInHours] = useState<number>(168);

  async function loadInvites() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/events/invites', { cache: 'no-store' });

      if (response.status === 401 || response.status === 403) {
        setAuthorized(false);
        return;
      }

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? 'invite_list_failed');
      }

      setAuthorized(true);
      setInvites(Array.isArray(payload?.invites) ? (payload.invites as InviteRecord[]) : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'invite_list_failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formDisabled = useMemo(() => submitting || loading, [submitting, loading]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);
    setLastCreated(null);

    try {
      const response = await fetch('/api/events/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          displayName: displayName.trim() || undefined,
          role,
          roleProfile,
          expiresInHours
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? 'invite_create_failed');
      }

      const created = payload?.invite;
      setLastCreated({
        inviteeEmail: created?.inviteeEmail ?? email.trim(),
        inviteLink: created?.inviteLink ?? '',
        inviteToken: created?.inviteToken ?? '',
        delivered: Boolean(payload?.delivery?.delivered)
      });
      setNotice(
        payload?.delivery?.delivered
          ? `Invite emailed to ${created?.inviteeEmail ?? email.trim()}.`
          : `Invite created for ${created?.inviteeEmail ?? email.trim()}. Email delivery didn't confirm — share the link below directly.`
      );
      setEmail('');
      setDisplayName('');
      await loadInvites();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'invite_create_failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function resendInvite(tokenId: string) {
    setBusyTokenId(tokenId);
    setError(null);
    setNotice(null);
    setLastCreated(null);

    try {
      const response = await fetch(`/api/events/invites/${tokenId}/resend`, { method: 'POST' });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? 'invite_resend_failed');
      }

      const created = payload?.invite;
      setLastCreated({
        inviteeEmail: created?.inviteeEmail ?? '',
        inviteLink: created?.inviteLink ?? '',
        inviteToken: created?.inviteToken ?? '',
        delivered: Boolean(payload?.delivery?.delivered)
      });
      setNotice(`A fresh invite was issued${created?.inviteeEmail ? ` for ${created.inviteeEmail}` : ''}.`);
      await loadInvites();
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : 'invite_resend_failed');
    } finally {
      setBusyTokenId(null);
    }
  }

  async function revokeInvite(tokenId: string) {
    setBusyTokenId(tokenId);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/events/invites/${tokenId}/revoke`, { method: 'POST' });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? 'invite_revoke_failed');
      }

      setNotice('Invite revoked.');
      await loadInvites();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : 'invite_revoke_failed');
    } finally {
      setBusyTokenId(null);
    }
  }

  async function copyLink(value: string) {
    if (!value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setNotice('Invite link copied to clipboard.');
    } catch {
      setNotice('Copy failed — select the link text and copy manually.');
    }
  }

  // Hide entirely for roles that cannot manage invites, so this is safe to drop on any page.
  if (authorized === false) {
    return null;
  }

  return (
    <section className="client-panel" aria-label="Invite people to this event">
      <div className="client-panel__header">
        <div>
          <h2 className="client-panel__title">Invite People to Atlas</h2>
          <p className="client-panel__sub">
            Send a role-scoped invite. Each person gets their own secure login and sees only what their role allows.
          </p>
        </div>
      </div>

      {error ? <p className="payment-settings-error">Something went wrong: {error}</p> : null}
      {notice ? <p className="payment-settings-success">{notice}</p> : null}

      {lastCreated?.inviteLink ? (
        <div className="card" style={{ marginBottom: '0.85rem' }}>
          <p className="card-muted" style={{ marginTop: 0 }}>
            One-click invite link for <strong>{lastCreated.inviteeEmail}</strong>
            {lastCreated.delivered ? ' (also emailed)' : ' (email not confirmed — share this directly)'}:
          </p>
          <div className="split">
            <input className="input" type="text" readOnly value={lastCreated.inviteLink} onFocus={(e) => e.target.select()} />
            <button className="btn" type="button" onClick={() => void copyLink(lastCreated.inviteLink)}>
              Copy Link
            </button>
          </div>
        </div>
      ) : null}

      <form className="tool-form" onSubmit={onSubmit}>
        <div className="payment-settings-fields">
          <label>
            Email
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              disabled={formDisabled}
            />
          </label>

          <label>
            Name (optional)
            <input
              className="input"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Full name"
              disabled={formDisabled}
            />
          </label>

          <label>
            Role
            <select className="input" value={role} onChange={(event) => setRole(event.target.value)} disabled={formDisabled}>
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Specialty
            <select
              className="input"
              value={roleProfile}
              onChange={(event) => setRoleProfile(event.target.value)}
              disabled={formDisabled}
            >
              {PROFILE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Invite valid for
            <select
              className="input"
              value={expiresInHours}
              onChange={(event) => setExpiresInHours(Number(event.target.value))}
              disabled={formDisabled}
            >
              {EXPIRY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button className="btn primary" type="submit" disabled={formDisabled || !email.trim()}>
          {submitting ? 'Sending…' : 'Send Invite'}
        </button>
      </form>

      <div className="client-panel__header" style={{ marginTop: '1.1rem' }}>
        <div>
          <h3 className="client-panel__title" style={{ fontSize: '1.05rem' }}>
            Sent Invites
          </h3>
          <p className="client-panel__sub">Resend issues a fresh link (and revokes the old one). Revoke removes access.</p>
        </div>
      </div>

      {loading ? <p className="card-muted">Loading invites…</p> : null}

      {!loading && invites.length === 0 ? (
        <p className="card-muted">No invites yet. Send your first one above.</p>
      ) : null}

      <ul className="concierge-feed-list">
        {invites.map((invite) => {
          const isBusy = busyTokenId === invite.tokenId;
          const canResend = invite.status !== 'accepted';
          const canRevoke = invite.status !== 'revoked';
          return (
            <li key={invite.tokenId} className="concierge-feed-item">
              <div className="item-title-row">
                <strong className="item-title">{invite.inviteeDisplayName || invite.inviteeEmail}</strong>
                <span className={`status-chip ${statusTone(invite.status)}`}>{invite.status}</span>
              </div>
              <p className="item-note">
                {invite.inviteeEmail} · {roleLabel(invite.targetRole)}
                {invite.roleProfile && invite.roleProfile !== 'general' ? ` (${invite.roleProfile})` : ''} · expires{' '}
                {formatStamp(invite.expiresAt)}
              </p>
              <div className="split" style={{ marginTop: '0.4rem' }}>
                {canResend ? (
                  <button className="btn" type="button" onClick={() => void resendInvite(invite.tokenId)} disabled={isBusy}>
                    {isBusy ? 'Working…' : 'Resend'}
                  </button>
                ) : null}
                {canRevoke ? (
                  <button className="btn" type="button" onClick={() => void revokeInvite(invite.tokenId)} disabled={isBusy}>
                    {isBusy ? 'Working…' : 'Revoke'}
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
