import { expect, test } from '@playwright/test';

test('planner can view live mode cards and submit delayed update', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill('maulin@revel-ent.com');
  await page.getByLabel('Event Access Code').fill('REVEL-NOV-2026');
  await page.getByRole('button', { name: 'Continue to Portal' }).click();

  await page.waitForURL('**/portal**', { timeout: 30000 });
  await expect(page.getByRole('heading', { name: 'Portal Dashboard' })).toBeVisible();

  await page.goto('/portal/planner');

  await expect(page.getByRole('heading', { name: 'Planner Workspace' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Event Timeline' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Live Mode' })).toBeVisible();

  await expect(page.getByText('Now:', { exact: false })).toBeVisible();
  await expect(page.getByText('Urgent Alerts:', { exact: false })).toBeVisible();

  await page.getByLabel('Delay note (optional)').fill('Test delay from Playwright');
  await page.getByRole('button', { name: 'Mark Current Step Delayed' }).click();

  await expect(page.getByText(/Update sent in (simulation|supabase) mode/i)).toBeVisible();
});
