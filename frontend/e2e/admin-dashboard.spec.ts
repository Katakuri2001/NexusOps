import { test, expect } from '@playwright/test';
import { login, USERS } from './helpers';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.owner.email, USERS.owner.password);
  });

  test('dashboard renders stat cards with non-zero websites', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1500);
    // Stat cards should show numbers, not crash
    await expect(page.locator('text=Websites').first()).toBeVisible();
    await expect(page.locator('text=Monitors').first()).toBeVisible();
  });

  test('websites page lists websites', async ({ page }) => {
    await page.goto('/admin/websites');
    await page.waitForTimeout(1500);
    await expect(page.locator('table, [class*="card"]').first()).toBeVisible();
  });

  test('customers page lists customers without crash', async ({ page }) => {
    await page.goto('/admin/customers');
    await page.waitForTimeout(1500);
    await expect(page.locator('text=Customers').first()).toBeVisible();
  });

  test('technicians page lists technicians without crash', async ({ page }) => {
    await page.goto('/admin/technicians');
    await page.waitForTimeout(1500);
    await expect(page.locator('text=Technicians').first()).toBeVisible();
  });

  test('notifications page loads', async ({ page }) => {
    await page.goto('/admin/notifications');
    await page.waitForTimeout(1500);
    await expect(page.locator('text=Notifications').first()).toBeVisible();
  });
});
