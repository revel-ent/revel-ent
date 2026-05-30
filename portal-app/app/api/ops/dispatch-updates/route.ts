import { NextResponse } from 'next/server';

import { dispatchMessageToRecipients } from '@/lib/notifications';
import { getCoordinationFeedByEvent } from '@/lib/mock-ops';
import { buildCoordinationSummary } from '@/lib/ops-summary';
import { getSession } from '@/lib/session';

type DeliveryChannel = 'email' | 'whatsapp' | 'both';

interface DispatchRequestBody {
  recipients: string[];
  channel: DeliveryChannel;
  customIntro?: string;
  dryRun?: boolean;
}

function isDeliveryChannel(value: string): value is DeliveryChannel {
  return value === 'email' || value === 'whatsapp' || value === 'both';
}

function parseRecipients(input: string[]): string[] {
  return input
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function isEmailRecipient(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhoneRecipient(value: string): boolean {
  const normalized = value.replace(/^whatsapp:/i, '').replace(/[\s()-]/g, '');
  return /^\+?[1-9]\d{7,14}$/.test(normalized);
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.eventId) {
    return NextResponse.json({ error: 'Missing event context' }, { status: 400 });
  }

  if (!['admin', 'planner'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as DispatchRequestBody;
  const channel = String(body.channel || '').toLowerCase();

  if (!isDeliveryChannel(channel)) {
    return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });
  }

  const recipients = parseRecipients(Array.isArray(body.recipients) ? body.recipients : []);

  if (recipients.length === 0) {
    return NextResponse.json({ error: 'At least one recipient is required' }, { status: 400 });
  }

  const items = getCoordinationFeedByEvent(session.eventId);
  const summaryText = buildCoordinationSummary({
    eventId: session.eventId,
    actorName: session.displayName,
    customIntro: body.customIntro,
    items
  });

  const emailRecipients = recipients.filter(isEmailRecipient);
  const whatsappRecipients = recipients.filter(isPhoneRecipient);
  const unclassifiedRecipients = recipients.filter(
    (recipient) => !emailRecipients.includes(recipient) && !whatsappRecipients.includes(recipient)
  );

  if (body.dryRun) {
    return NextResponse.json({
      mode: 'dry-run',
      channel,
      recipients,
      recipientGroups: {
        email: emailRecipients,
        whatsapp: whatsappRecipients,
        unclassified: unclassifiedRecipients
      },
      summaryText,
      itemCount: items.length
    });
  }

  const channelsToSend = channel === 'both' ? (['email', 'whatsapp'] as const) : [channel];
  const subject = `REVEL Ops Update | ${session.eventId}`;

  const recipientsByChannel: Record<'email' | 'whatsapp', string[]> = {
    email: channel === 'whatsapp' ? [] : emailRecipients,
    whatsapp: channel === 'email' ? [] : whatsappRecipients
  };

  if (channel === 'email' && recipientsByChannel.email.length === 0) {
    return NextResponse.json(
      {
        error: 'No valid email recipients were provided for email dispatch.'
      },
      { status: 400 }
    );
  }

  if (channel === 'whatsapp' && recipientsByChannel.whatsapp.length === 0) {
    return NextResponse.json(
      {
        error: 'No valid phone recipients were provided for WhatsApp dispatch.'
      },
      { status: 400 }
    );
  }

  if (channel === 'both' && recipientsByChannel.email.length === 0 && recipientsByChannel.whatsapp.length === 0) {
    return NextResponse.json(
      {
        error: 'No valid recipients were provided. Use email addresses and E.164 phone numbers.'
      },
      { status: 400 }
    );
  }

  const sendResults = await Promise.all(
    channelsToSend.map(async (activeChannel) => ({
      channel: activeChannel,
      attempts: await dispatchMessageToRecipients({
        channel: activeChannel,
        recipients: recipientsByChannel[activeChannel],
        subject,
        message: summaryText
      })
    }))
  );

  return NextResponse.json({
    mode: 'dispatch',
    channel,
    recipients,
    recipientGroups: {
      email: emailRecipients,
      whatsapp: whatsappRecipients,
      unclassified: unclassifiedRecipients
    },
    summaryText,
    itemCount: items.length,
    sendResults
  });
}