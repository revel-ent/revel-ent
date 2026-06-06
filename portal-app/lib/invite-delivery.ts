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

export interface InviteEmailContent {
  subject: string;
  text: string;
  html: string;
}

interface InviteEmailProvider {
  sendInvite(params: InviteDeliveryParams): Promise<InviteDeliveryResult>;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toRoleDisplayLabel(role: string): string {
  const normalized = role.trim().toLowerCase();

  switch (normalized) {
    case 'couple':
      return 'Couple';
    case 'planner':
      return 'Planner';
    case 'vendor':
      return 'Vendor Partner';
    case 'venue_coordinator':
      return 'Venue Manager';
    case 'dj_mc':
      return 'DJ / Entertainment Team';
    case 'production':
      return 'Production Team';
    case 'delegate_coordinator':
      return 'Family Coordinator';
    case 'guest':
      return 'Guest';
    case 'admin':
      return 'Administrator';
    default:
      return normalized
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
  }
}

function toGreeting(displayName: string, role: string): string {
  const safeName = displayName.trim() || 'there';
  if (role.trim().toLowerCase() === 'couple') {
    return `Greetings ${safeName}!`;
  }

  return `Greetings ${safeName},`;
}

export function buildInviteEmailContent(params: InviteDeliveryParams): InviteEmailContent {
  const eventName = params.eventLabel || 'Your Wedding Event';
  const inviter = params.inviterDisplayName || 'Revel Entertainment';
  const expiresAtDisplay = new Date(params.expiresAtIso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
  const roleLabel = toRoleDisplayLabel(params.role);
  const greeting = toGreeting(params.displayName, params.role);

  const subject = `Your Atlas access for ${eventName}`;

  const text = [
    greeting,
    '',
    "You've been invited to join your Digital Wedding Atlas.",
    '',
    'Atlas is your shared wedding workspace where timelines, contacts, updates, and event details stay aligned for everyone involved.',
    '',
    `Wedding: ${eventName}`,
    `Your Role: ${roleLabel}`,
    `Invited by: ${inviter}`,
    `Access expires: ${expiresAtDisplay}`,
    '',
    'Open Your Atlas:',
    params.inviteLink,
    '',
    "What you'll find inside:",
    '- Latest wedding timeline',
    '- Key contacts and vendors',
    '- Event updates and next steps',
    '- Shared planning information',
    '',
    'Troubleshooting only:',
    `Invite token: ${params.inviteToken}`,
    `Direct link: ${params.inviteLink}`
  ].join('\n');

  const html = [
    `<div style="font-family:Georgia, 'Times New Roman', serif;background:#f9f5ef;padding:28px;color:#1f1a17;">`,
    `<div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #eadfce;border-radius:14px;overflow:hidden;">`,
    `<div style="padding:26px 28px 18px;background:linear-gradient(135deg,#f3ebe0 0%,#fff 100%);">`,
    `<p style="margin:0;font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:#7a6448;">Atlas Access</p>`,
    `<h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;color:#2a221c;">${escapeHtml(greeting)}</h1>`,
    `</div>`,
    `<div style="padding:24px 28px 10px;">`,
    `<p style="margin:0 0 14px;font-size:17px;line-height:1.5;">You've been invited to join your <strong>Digital Wedding Atlas</strong>.</p>`,
    `<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#4d4033;">Atlas is your shared wedding workspace where timelines, contacts, updates, and event details stay aligned for everyone involved.</p>`,
    `<div style="border:1px solid #efe3d3;border-radius:10px;padding:14px 16px;background:#fffcf8;">`,
    `<p style="margin:0 0 8px;font-size:15px;"><strong>Wedding:</strong> ${escapeHtml(eventName)}</p>`,
    `<p style="margin:0 0 8px;font-size:15px;"><strong>Your Role:</strong> ${escapeHtml(roleLabel)}</p>`,
    `<p style="margin:0 0 8px;font-size:15px;"><strong>Invited by:</strong> ${escapeHtml(inviter)}</p>`,
    `<p style="margin:0;font-size:15px;"><strong>Access expires:</strong> ${escapeHtml(expiresAtDisplay)}</p>`,
    `</div>`,
    `<p style="margin:22px 0 0;">`,
    `<a href="${escapeHtml(params.inviteLink)}" style="display:inline-block;padding:12px 18px;background:#7b4f2f;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">Open Your Atlas</a>`,
    `</p>`,
    `<div style="margin:24px 0 0;padding:14px 16px;border-radius:10px;background:#f7f2ea;border:1px solid #ece0cf;">`,
    `<p style="margin:0 0 8px;font-weight:700;font-size:14px;color:#2f261e;">What you'll find inside:</p>`,
    `<ul style="margin:0 0 0 18px;padding:0;color:#4b3d31;font-size:14px;line-height:1.6;">`,
    `<li>Latest wedding timeline</li>`,
    `<li>Key contacts and vendors</li>`,
    `<li>Event updates and next steps</li>`,
    `<li>Shared planning information</li>`,
    `</ul>`,
    `</div>`,
    `<details style="margin:20px 0 8px;border-top:1px solid #e8dccb;padding-top:14px;">`,
    `<summary style="cursor:pointer;color:#6a5a49;font-size:13px;font-weight:700;">Troubleshooting only</summary>`,
    `<p style="margin:10px 0 0;font-size:13px;color:#5f5042;">Use this token at login if needed: <code style="background:#f2eadf;padding:2px 6px;border-radius:4px;">${escapeHtml(params.inviteToken)}</code></p>`,
    `<p style="margin:8px 0 0;font-size:13px;color:#5f5042;">Direct link: <a href="${escapeHtml(params.inviteLink)}">${escapeHtml(params.inviteLink)}</a></p>`,
    `</details>`,
    `</div>`,
    `</div>`,
    `</div>`
  ].join('');

  return { subject, text, html };
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
    const { subject, text, html } = buildInviteEmailContent(params);

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