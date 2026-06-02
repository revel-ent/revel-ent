import Stripe from 'stripe';

import type { AtlasWorkspacePlan } from '@/lib/atlas-types';

const WORKSPACE_PRICE_CENTS: Record<AtlasWorkspacePlan, number> = {
  essential: 14900,
  pro: 34900,
  premium: 74900
};

let stripeClient: Stripe | null | undefined;

export function getStripeServerClient(): Stripe | null {
  if (stripeClient !== undefined) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    stripeClient = null;
    return stripeClient;
  }

  stripeClient = new Stripe(secretKey);
  return stripeClient;
}

export function getStripeWebhookSecret(): string | null {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  return secret || null;
}

export function getWorkspacePriceCents(plan: AtlasWorkspacePlan): number {
  return WORKSPACE_PRICE_CENTS[plan];
}

export function getWorkspaceProductLabel(plan: AtlasWorkspacePlan): string {
  if (plan === 'essential') {
    return 'Atlas Essential Workspace';
  }

  if (plan === 'pro') {
    return 'Atlas Pro Workspace';
  }

  return 'Atlas Premium Workspace';
}

function normalizeOptionalUrl(value: unknown, baseUrl: string): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return null;
  }
}

export function resolveStripeRedirectUrls(
  request: Request,
  overrides?: { successUrl?: unknown; cancelUrl?: unknown }
): { successUrl: string; cancelUrl: string } {
  const originFromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();

  let baseUrl = originFromEnv;

  if (!baseUrl) {
    try {
      baseUrl = new URL(request.url).origin;
    } catch {
      baseUrl = 'http://localhost:3000';
    }
  }

  const fallbackSuccess = `${baseUrl}/portal/couple?stripe_checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const fallbackCancel = `${baseUrl}/portal/couple?stripe_checkout=cancel`;

  const successUrl = normalizeOptionalUrl(overrides?.successUrl, baseUrl) ?? fallbackSuccess;
  const cancelUrl = normalizeOptionalUrl(overrides?.cancelUrl, baseUrl) ?? fallbackCancel;

  return { successUrl, cancelUrl };
}
