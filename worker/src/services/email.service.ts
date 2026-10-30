// worker/src/services/email.service.ts
// Resend-based email delivery for NexusOps.
// All functions are safe to call even when RESEND_API_KEY is not configured:
// they log a warning and return { success: false } instead of throwing.

export interface EmailResult {
  success: boolean;
  error?: string;
  id?: string;
}

function getFrom(env: any): string {
  return env.RESEND_FROM || 'NexusOps <onboarding@resend.dev>';
}

function getApiKey(env: any): string | null {
  return env.RESEND_API_KEY || null;
}

function getAppUrl(env: any): string {
  const from = env.APP_URL || env.FRONTEND_URL || 'http://localhost:3000';
  return String(from).split(',')[0].trim();
}

export async function sendEmail(env: any, to: string, subject: string, html: string): Promise<EmailResult> {
  const apiKey = getApiKey(env);
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not configured; skipping send to', to);
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }
  if (!to) {
    return { success: false, error: 'No recipient' };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getFrom(env),
        to: [to],
        subject,
        html,
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[email] Resend error:', res.status, data);
      return { success: false, error: data?.message || `HTTP ${res.status}` };
    }
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('[email] send failed:', err?.message || err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

export async function sendLoginInvitation(
  env: any,
  to: string,
  name: string,
  role: string,
  loginUrl: string,
  password?: string
): Promise<EmailResult> {
  const roleLabel = role === 'CUSTOMER' ? 'Customer' : role === 'TECHNICIAN' ? 'Technician' : 'User';
  const subject = `Welcome to NexusOps — your ${roleLabel.toLowerCase()} account is ready`;
  const credentialsBlock = password
    ? `<p><strong>Email:</strong> ${escapeHtml(to)}</p><p><strong>Password:</strong> ${escapeHtml(password)}</p>`
    : `<p>Use your existing credentials to sign in.</p>`;
  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <h2 style="margin: 0 0 12px;">Welcome to NexusOps, ${escapeHtml(name)}!</h2>
      <p>Your ${roleLabel.toLowerCase()} account has been created. You can log in using the details below.</p>
      <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
        ${credentialsBlock}
        <p style="margin-top: 12px;"><a href="${escapeAttr(loginUrl)}" style="display:inline-block;background:#6366f1;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;">Log in to NexusOps</a></p>
      </div>
      <p style="font-size: 13px; color: #6b7280;">For security, please change your password after your first login. If you did not expect this email, you can ignore it.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">NexusOps — Website Operations &amp; Client Portal</p>
    </div>
  `;
  return sendEmail(env, to, subject, html);
}

export async function sendNotificationAlert(
  env: any,
  to: string,
  name: string,
  notification: { title: string; message: string; type?: string; priority?: string },
  websiteName?: string | null
): Promise<EmailResult> {
  const subject = `[NexusOps] ${notification.title}`;
  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <h2 style="margin: 0 0 12px;">${escapeHtml(notification.title)}</h2>
      ${websiteName ? `<p style="color:#6b7280;font-size:13px;margin:0 0 12px;">Website: ${escapeHtml(websiteName)}</p>` : ''}
      <p style="white-space: pre-wrap;">${escapeHtml(notification.message)}</p>
      <p style="margin-top: 16px;"><a href="${escapeAttr(getAppUrl(env))}" style="display:inline-block;background:#6366f1;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;">Open NexusOps</a></p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">NexusOps — Website Operations &amp; Client Portal</p>
    </div>
  `;
  return sendEmail(env, to, subject, html);
}

function escapeHtml(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(s: string): string {
  return String(s ?? '').replace(/"/g, '%22');
}
