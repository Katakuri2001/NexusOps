import { test, expect } from '@playwright/test';
import { login, USERS } from './helpers';

test.describe('Customer portal', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.customer.email, USERS.customer.password);
  });

  test('customer dashboard loads', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('customer websites page loads', async ({ page }) => {
    await page.goto('/dashboard/websites');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('customer notifications page loads', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    await page.waitForTimeout(1500);
    await expect(page.locator('text=Notifications').first()).toBeVisible();
  });
});

test.describe('Technician portal', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.technician.email, USERS.technician.password);
  });

  test('technician dashboard loads', async ({ page }) => {
    await page.goto('/technician');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('technician websites page loads', async ({ page }) => {
    await page.goto('/technician/websites');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('technician maintenance page loads', async ({ page }) => {
    await page.goto('/technician/maintenance');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });
});
