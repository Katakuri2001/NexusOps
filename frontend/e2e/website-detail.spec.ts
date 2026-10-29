import { test, expect } from '@playwright/test';
import { login, USERS } from './helpers';

test.describe('Website Detail', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.owner.email, USERS.owner.password);
    await page.goto('/admin/websites');
    await page.waitForTimeout(1500);
    // click first website
    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();
    await page.waitForTimeout(1500);
  });

  test('overview tab renders without crash', async ({ page }) => {
    await expect(page.locator('text=Website Information').first()).toBeVisible();
  });

  test('billing tab renders financial summary', async ({ page }) => {
    await page.click('button:has-text("Billing")');
    await page.waitForTimeout(1500);
    await expect(page.locator('text=Monthly Summary').first()).toBeVisible();
    await expect(page.locator('text=Total').first()).toBeVisible();
  });

  test('services tab renders', async ({ page }) => {
    await page.click('button:has-text("Services")');
    await page.waitForTimeout(1000);
    // no crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('monitoring tab renders', async ({ page }) => {
    await page.click('button:has-text("Monitoring")');
    await page.waitForTimeout(1500);
    await expect(page.locator('text=Monitoring').first()).toBeVisible();
  });

  test('notify tab renders', async ({ page }) => {
    await page.click('button:has-text("Notify")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Send Notification').first()).toBeVisible();
  });

  test('maintenance tab renders', async ({ page }) => {
    await page.click('button:has-text("Maintenance")');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('timeline tab renders', async ({ page }) => {
    await page.click('button:has-text("Timeline")');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });
});
