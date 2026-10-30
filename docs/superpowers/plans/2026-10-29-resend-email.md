# Plan: Resend Email — Invitations + Notification Alerts

## Goal
Add Resend-based email delivery for (1) login invitations to customers/technicians on create/edit, and (2) notification alert emails to technicians and admins when new notifications exist.

## Architecture
- New `worker/src/services/email.service.ts` using Resend REST API (fetch-based, Workers-compatible).
- Env: `RESEND_API_KEY` (secret), `RESEND_FROM` (var), `APP_URL` (var).
- Functions: `sendEmail`, `sendLoginInvitation`, `sendNotificationAlert`.
- Fire-and-forget with error logging; never fail the request if email fails.

## Wiring
- customer/technician POST /: sendLoginInvitation (with password).
- customer/technician PUT /: sendLoginInvitation (login link only).
- notification POST /: email owner + assigned technicians of the website.
- monitoring handleCheckOutcome: on incident open, email owner + assigned technicians.

## Verification
- Worker typecheck, wrangler dry-run, and a live test send (if RESEND_API_KEY configured).
