import { Page } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(admin|dashboard|technician)/, { timeout: 15000 });
}

export const USERS = {
  owner: { email: 'admin@nexusops.com', password: 'admin123' },
  customer: { email: 'john@example.com', password: 'customer123' },
  technician: { email: 'mike@nexusops.com', password: 'tech123' },
};
