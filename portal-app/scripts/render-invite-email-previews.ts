import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

import { buildInviteEmailContent, type InviteDeliveryParams } from '../lib/invite-delivery';

interface PreviewScenario {
  key: 'couple' | 'planner' | 'vendor' | 'venue';
  params: InviteDeliveryParams;
}

const OUTPUT_DIR = path.resolve(process.cwd(), 'test-results', 'email-previews');

const scenarios: PreviewScenario[] = [
  {
    key: 'couple',
    params: {
      email: 'akshay.rani1128@gmail.com',
      displayName: 'Akshay & Rani',
      role: 'couple',
      eventLabel: 'Akshay & Rani Patel Wedding Weekend',
      inviterDisplayName: 'Revel Entertainment',
      inviteToken: 'preview-couple-token-001',
      inviteLink: 'https://atlas.revel-ent.com/login?email=akshay.rani1128%40gmail.com&token=preview-couple-token-001&next=%2Fportal',
      expiresAtIso: '2026-06-13T21:57:00.000Z'
    }
  },
  {
    key: 'planner',
    params: {
      email: 'planner@example.com',
      displayName: 'Anokhi Patel',
      role: 'planner',
      eventLabel: 'Akshay & Rani Patel Wedding Weekend',
      inviterDisplayName: 'Revel Entertainment',
      inviteToken: 'preview-planner-token-001',
      inviteLink: 'https://atlas.revel-ent.com/login?email=planner%40example.com&token=preview-planner-token-001&next=%2Fportal',
      expiresAtIso: '2026-06-13T21:57:00.000Z'
    }
  },
  {
    key: 'vendor',
    params: {
      email: 'photo-team@example.com',
      displayName: 'Dreamcatchers Photo Team',
      role: 'vendor',
      eventLabel: 'Akshay & Rani Patel Wedding Weekend',
      inviterDisplayName: 'Revel Entertainment',
      inviteToken: 'preview-vendor-token-001',
      inviteLink: 'https://atlas.revel-ent.com/login?email=photo-team%40example.com&token=preview-vendor-token-001&next=%2Fportal',
      expiresAtIso: '2026-06-13T21:57:00.000Z'
    }
  },
  {
    key: 'venue',
    params: {
      email: 'venue.coordinator@example.com',
      displayName: 'InterContinental Venue Team',
      role: 'venue_coordinator',
      eventLabel: 'Akshay & Rani Patel Wedding Weekend',
      inviterDisplayName: 'Revel Entertainment',
      inviteToken: 'preview-venue-token-001',
      inviteLink: 'https://atlas.revel-ent.com/login?email=venue.coordinator%40example.com&token=preview-venue-token-001&next=%2Fportal',
      expiresAtIso: '2026-06-13T21:57:00.000Z'
    }
  }
];

function wrapDocument(htmlBody: string): string {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    '<title>Atlas Invite Preview</title>',
    '<style>body { margin: 0; background: #f9f5ef; }</style>',
    '</head>',
    '<body>',
    htmlBody,
    '</body>',
    '</html>'
  ].join('');
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const manifest: Array<{ key: string; html: string; mobilePng: string; desktopPng: string }> = [];

  for (const scenario of scenarios) {
    const content = buildInviteEmailContent(scenario.params);
    const htmlPath = path.join(OUTPUT_DIR, `invite-${scenario.key}.html`);
    const mobilePngPath = path.join(OUTPUT_DIR, `invite-${scenario.key}-mobile.png`);
    const desktopPngPath = path.join(OUTPUT_DIR, `invite-${scenario.key}-desktop.png`);

    await writeFile(htmlPath, wrapDocument(content.html), 'utf8');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(pathToFileURL(htmlPath).toString(), { waitUntil: 'networkidle' });
    await page.screenshot({ path: mobilePngPath, fullPage: true });

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(pathToFileURL(htmlPath).toString(), { waitUntil: 'networkidle' });
    await page.screenshot({ path: desktopPngPath, fullPage: true });

    manifest.push({
      key: scenario.key,
      html: htmlPath,
      mobilePng: mobilePngPath,
      desktopPng: desktopPngPath
    });
  }

  await browser.close();

  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  process.stdout.write(`${manifestPath}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
