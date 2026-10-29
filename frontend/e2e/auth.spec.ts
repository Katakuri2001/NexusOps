import { test, expect } from '@playwright/test';
import { login, USERS } from './helpers';

test.describe('Authentication', () => {
  test('owner can log in and reach admin dashboard', async ({ page }) => {
    await login(page, USERS.owner.email, USERS.owner.password);
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('text=Websites').first()).toBeVisible();
  });

  test('customer can log in and reach customer dashboard', async ({ page }) => {
    await login(page, USERS.customer.email, USERS.customer.password);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('technician can log in and reach technician area', async ({ page }) => {
    await login(page, USERS.technician.email, USERS.technician.password);
    await expect(page).toHaveURL(/\/technician/);
  });

  test('invalid credentials show an error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'nope@example.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    // should stay on login
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });
});
