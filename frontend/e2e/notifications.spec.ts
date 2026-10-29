import { test, expect } from '@playwright/test';
import { login, USERS } from './helpers';

test.describe('Notifications', () => {
  test('admin notifications page loads and mark-all-read works', async ({ page }) => {
    await login(page, USERS.owner.email, USERS.owner.password);
    await page.goto('/admin/notifications');
    await page.waitForTimeout(1500);
    // If there are unread notifications, the "Mark all read" button should be present
    const markAllBtn = page.locator('button:has-text("Mark all read")');
    if (await markAllBtn.count() > 0) {
      await markAllBtn.click();
      await page.waitForTimeout(1000);
      // After marking all read, button should disappear
      await expect(markAllBtn).toHaveCount(0);
    }
    await expect(page.locator('text=Notifications').first()).toBeVisible();
  });

  test('customer notifications page loads', async ({ page }) => {
    await login(page, USERS.customer.email, USERS.customer.password);
    await page.goto('/dashboard/notifications');
    await page.waitForTimeout(1500);
    await expect(page.locator('text=Notifications').first()).toBeVisible();
  });
});
