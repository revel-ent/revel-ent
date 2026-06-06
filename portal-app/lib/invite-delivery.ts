import { sanitizeNextPath } from '@/lib/invite-lifecycle';

interface BuildInviteLinkParams {
  origin: string;
  email: string;
  inviteToken: string;
  nextPath?: string;
}

export interface InviteDeliveryParams {
  email: string;
  displayName: string;
  role: string;
  eventLabel?: string;
  inviterDisplayName?: string;
  inviteToken: string;
  inviteLink: string;
  expiresAtIso: string;
}

export interface InviteDeliveryResult {
  delivered: boolean;
  provider: 'resend' | 'manual_fallback';
  reference?: string;
  error?: string;
}

interface InviteEmailProvider {
  sendInvite(params: InviteDeliveryParams): Promise<InviteDeliveryResult>;
}

function getConfiguredInviteProvider(): 'resend' {
  const provider = (process.env.INVITE_EMAIL_PROVIDER || 'resend').trim().toLowerCase();
  return provider === 'resend' ? 'resend' : 'resend';
}

function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && (process.env.INVITE_FROM_EMAIL || process.env.RESEND_FROM_EMAIL));
}

export function buildInviteLink(params: BuildInviteLinkParams): string {
  const url = new URL('/login', params.origin);
  url.searchParams.set('email', params.email);
  url.searchParams.set('token', params.inviteToken);
  url.searchParams.set('next', sanitizeNextPath(params.nextPath));
  return url.toString();
}

class ResendInviteProvider implements InviteEmailProvider {
  async sendInvite(params: InviteDeliveryParams): Promise<InviteDeliveryResult> {
    if (!isResendConfigured()) {
      return {
        delivered: false,
        provider: 'manual_fallback',
        error: 'resend_not_configured'
      };
    }

    const apiKey = process.env.RESEND_API_KEY as string;
    const fromAddress = (process.env.INVITE_FROM_EMAIL || process.env.RESEND_FROM_EMAIL) as string;
    const eventName = params.eventLabel || 'Atlas';
    const inviter = params.inviterDisplayName || 'Atlas team';
    const expiresAtDisplay = new Date(params.expiresAtIso).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

    const subject = `You're invited to ${eventName}`;
    const text = [
      `Hi ${params.displayName},`,
      '',
      `Event: ${eventName}`,
      `Role: ${params.role}`,
      `Invited by: ${inviter}`,
      '',
      `Open your invite: ${params.inviteLink}`,
      '',
      `This invite expires: ${expiresAtDisplay}`,
      '',
      `If the link doesn't open, use this token in Atlas login: ${params.inviteToken}`
    ].join('\n');

    const html = [
      `<p>Hi ${params.displayName},</p>`,
      `<p>You've been invited to <strong>${eventName}</strong>.</p>`,
      `<ul>`,
      `<li><strong>Role:</strong> ${params.role}</li>`,
      `<li><strong>Invited by:</strong> ${inviter}</li>`,
      `<li><strong>Expires:</strong> ${expiresAtDisplay}</li>`,
      `</ul>`,
      `<p><a href="${params.inviteLink}" style="display:inline-block;padding:10px 14px;background:#2f1f2a;color:#fff;text-decoration:none;border-radius:6px;">Open Atlas Invite</a></p>`,
      `<p>If needed, use this token at login: <code>${params.inviteToken}</code></p>`
    ].join('');

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [params.email],
          subject,
          text,
          html
        })
      });

      const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string; error?: string };

      if (!response.ok) {
        return {
          delivered: false,
          provider: 'resend',
          error: body.message || body.error || `resend_http_${response.status}`
        };
      }

      return {
        delivered: true,
        provider: 'resend',
        reference: body.id
      };
    } catch (error) {
      return {
        delivered: false,
        provider: 'resend',
        error: error instanceof Error ? error.message : 'resend_request_failed'
      };
    }
  }
}

function createInviteProvider(): InviteEmailProvider {
  switch (getConfiguredInviteProvider()) {
    case 'resend':
    default:
      return new ResendInviteProvider();
  }
}

export async function deliverInviteEmail(params: InviteDeliveryParams): Promise<InviteDeliveryResult> {
  return createInviteProvider().sendInvite(params);
}