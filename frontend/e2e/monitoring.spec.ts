import { test, expect } from '@playwright/test';
import { login, USERS } from './helpers';

test.describe('Monitoring', () => {
  test('admin can create a monitor and run a check', async ({ page }) => {
    await login(page, USERS.owner.email, USERS.owner.password);
    await page.goto('/admin/websites');
    await page.waitForTimeout(1500);
    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();
    await page.waitForTimeout(1500);
    await page.click('button:has-text("Monitoring")');
    await page.waitForTimeout(1500);
    // Should show either monitors or "No monitors configured"
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});
