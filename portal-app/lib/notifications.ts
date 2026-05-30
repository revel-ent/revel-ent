type NotificationChannel = 'email' | 'whatsapp';

export interface DispatchAttempt {
  recipient: string;
  status: 'sent' | 'simulated' | 'failed';
  detail: string;
}

function hasResendConfig(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

function hasTwilioConfig(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_FROM
  );
}

function normalizeWhatsAppAddress(input: string): string {
  const trimmed = input.trim();
  return trimmed.startsWith('whatsapp:') ? trimmed : `whatsapp:${trimmed}`;
}

async function sendEmail(recipient: string, subject: string, message: string): Promise<DispatchAttempt> {
  if (!hasResendConfig()) {
    return {
      recipient,
      status: 'simulated',
      detail: 'RESEND_API_KEY or RESEND_FROM_EMAIL is missing; generated preview only.'
    };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [recipient],
      subject,
      text: message
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return {
      recipient,
      status: 'failed',
      detail: `Resend rejected request: ${errorBody || response.statusText}`
    };
  }

  return {
    recipient,
    status: 'sent',
    detail: 'Email sent via Resend.'
  };
}

async function sendWhatsApp(recipient: string, message: string): Promise<DispatchAttempt> {
  if (!hasTwilioConfig()) {
    return {
      recipient,
      status: 'simulated',
      detail: 'Twilio WhatsApp credentials are missing; generated preview only.'
    };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID as string;
  const authToken = process.env.TWILIO_AUTH_TOKEN as string;
  const from = normalizeWhatsAppAddress(process.env.TWILIO_WHATSAPP_FROM as string);
  const to = normalizeWhatsAppAddress(recipient);
  const body = new URLSearchParams({
    From: from,
    To: to,
    Body: message
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return {
      recipient,
      status: 'failed',
      detail: `Twilio rejected request: ${errorBody || response.statusText}`
    };
  }

  return {
    recipient,
    status: 'sent',
    detail: 'WhatsApp message sent via Twilio.'
  };
}

export async function dispatchMessageToRecipients(params: {
  channel: NotificationChannel;
  recipients: string[];
  subject: string;
  message: string;
}): Promise<DispatchAttempt[]> {
  const attempts: DispatchAttempt[] = [];

  for (const recipient of params.recipients) {
    if (params.channel === 'email') {
      attempts.push(await sendEmail(recipient, params.subject, params.message));
    } else {
      attempts.push(await sendWhatsApp(recipient, params.message));
    }
  }

  return attempts;
}