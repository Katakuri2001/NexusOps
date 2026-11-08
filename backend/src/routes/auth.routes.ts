import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { authenticate } from '../middleware/auth';
import { ActivityService } from '../services/activity.service';
import { env } from '../config/env';

const router = Router();

const REFRESH_COOKIE = 'refreshToken';

// httpOnly cookie so client-side JS cannot read the long-lived refresh token.
// Sent automatically by the browser on /api/auth/refresh (same-site fetch with credentials).
const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // matches default 7d refresh expiry
  path: '/api/auth',
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const result = await AuthService.login(email, password);

    await ActivityService.log({
      userId: result.user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: result.user.id,
      ipAddress: req.ip || undefined,
    });

    // httpOnly refresh cookie (primary); refreshToken also returned in the body
    // for backward compatibility with the worker/D1 API variant.
    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // Prefer the httpOnly cookie; fall back to body token (worker/D1 variant).
    const cookieToken = (req as any).cookies?.[REFRESH_COOKIE] as string | undefined;
    const refreshToken = req.body?.refreshToken || cookieToken;
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const tokens = await AuthService.refreshTokens(refreshToken);
    // Rotate the cookie with the fresh refresh token.
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions());
    res.json(tokens);
  } catch (error: any) {
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    res.status(401).json({ error: error.message });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  // Clear the httpOnly refresh cookie (frontend clears its access token locally).
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  await ActivityService.log({
    userId: (req as any).user?.userId || null,
    action: 'LOGOUT',
    entity: 'User',
    entityId: (req as any).user?.userId || null,
    ipAddress: req.ip || undefined,
  });
  res.json({ message: 'Logged out' });
});

router.get('/me', authenticate, async (req: any, res: Response) => {
  try {
    const user = await require('../config/database').prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/change-password', authenticate, async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new password required' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters' });
      return;
    }

    const { prisma } = require('../config/database');
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const valid = await AuthService.comparePassword(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const passwordHash = await AuthService.hashPassword(newPassword);
    await prisma.user.update({ where: { id: req.user.userId }, data: { passwordHash } });

    await ActivityService.log({
      userId: req.user.userId,
      action: 'CHANGE_PASSWORD',
      entity: 'User',
      entityId: req.user.userId,
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
