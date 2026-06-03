import { createHash } from 'crypto';

function formatUuidFromHex(hex: string): string {
  const normalized = hex.slice(0, 32).padEnd(32, '0').split('');

  normalized[12] = '5';
  normalized[16] = ((parseInt(normalized[16], 16) & 0x3) | 0x8).toString(16);

  return `${normalized.slice(0, 8).join('')}-${normalized.slice(8, 12).join('')}-${normalized
    .slice(12, 16)
    .join('')}-${normalized.slice(16, 20).join('')}-${normalized.slice(20, 32).join('')}`;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function resolveSessionUserUuid(params: { userId: string; email: string }): string {
  if (isUuid(params.userId)) {
    return params.userId;
  }

  const hash = createHash('sha256').update(`${params.userId}:${params.email.toLowerCase()}`).digest('hex');
  return formatUuidFromHex(hash);
}
