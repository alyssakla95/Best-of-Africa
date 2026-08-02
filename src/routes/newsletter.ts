// ═══════════════════════════════════════════════════════════════════════════════
// NEWSLETTER ROUTER
// Digest subscription management
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { checkRateLimit, rateLimitHeaders } from '../lib/ratelimit';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ───────────────────────────────────────────────────────────────────────────────
// POST /newsletter/subscribe
// ───────────────────────────────────────────────────────────────────────────────
router.post('/subscribe', async (c) => {
    // Rate limit: 20 subscribe attempts per minute per IP (free tier)
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const rl = await checkRateLimit(c.env, `newsletter:${ip}`, 'free');
    Object.entries(rateLimitHeaders(rl)).forEach(([k, v]) => c.header(k, v));
    if (!rl.allowed) {
        return c.json({ success: false, message: `Too many requests. Retry in ${rl.retryAfter}s.` }, 429);
    }
    let body: { email?: string; frequency?: string };
    try {
        body = await c.req.json();
    } catch {
        return c.json({ success: false, message: 'Invalid request body' }, 400);
    }

    const { email, frequency = 'weekly' } = body;

    if (!email || !EMAIL_REGEX.test(email)) {
        return c.json({ success: false, message: 'A valid email address is required' }, 400);
    }

    if (frequency !== 'weekly' && frequency !== 'daily') {
        return c.json({ success: false, message: 'Frequency must be weekly or daily' }, 400);
    }

    // Check for existing subscription
    const existing = await c.env.DB.prepare(
        'SELECT id, is_active FROM digest_subscriptions WHERE email = ?'
    ).bind(email.toLowerCase()).first<{ id: string; is_active: number }>();

    if (existing) {
        if (existing.is_active) {
            return c.json({ success: false, message: 'This email is already subscribed' }, 409);
        }
        // Re-activate a previously unsubscribed email
        await c.env.DB.prepare(
            'UPDATE digest_subscriptions SET is_active = 1, frequency = ?, unsubscribed_at = NULL, created_at = ? WHERE id = ?'
        ).bind(frequency, new Date().toISOString(), existing.id).run();

        return c.json({ success: true, message: "You're back on the list!" });
    }

    // New subscription — id doubles as the unsubscribe token (UUID, unguessable)
    const id = crypto.randomUUID();
    await c.env.DB.prepare(
        `INSERT INTO digest_subscriptions (id, email, frequency, is_active, created_at)
         VALUES (?, ?, ?, 1, ?)`
    ).bind(id, email.toLowerCase(), frequency, new Date().toISOString()).run();

    const apiBase = c.env.PUBLIC_API_URL || new URL(c.req.url).origin;
    const unsubscribeUrl = `${apiBase}/api/v1/newsletter/unsubscribe?token=${id}`;

    // Send Welcome Email
    const htmlEmail = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0F1E; padding: 40px 20px; color: #ffffff;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #111827; border: 1px solid rgba(201,168,76,0.3); padding: 40px; text-align: center; border-radius: 12px;">
            <h1 style="font-family: Georgia, serif; font-size: 24px; margin: 0 0 20px 0; color: #C9A84C;">Welcome to BOA-Story.</h1>
            <p style="font-size: 16px; color: rgba(255,255,255,0.8); margin: 0 0 20px 0; line-height: 1.6;">
                You are officially on the list. You'll now receive our real, grounded stories about African lives, cities, and everyday opportunity directly to your inbox.
            </p>
            <p style="font-size: 14px; color: rgba(255,255,255,0.6); margin: 0 0 30px 0;">
                No charity ads. No disaster headlines. Just the continent without the filter.
            </p>
            <a href="https://boastory.com/stories" style="display: inline-block; background-color: #C9A84C; color: #0A0F1E; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 14px;">
                Explore Latest Stories
            </a>
            <div style="margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
                <p style="font-size: 11px; color: rgba(255,255,255,0.3); margin: 0;">
                    You are receiving this because you opted into the BOA-Story digest.
                    <a href="${unsubscribeUrl}" style="color: #C9A84C; text-decoration: underline;">Unsubscribe</a>
                </p>
            </div>
        </div>
    </div>
    `;

    c.executionCtx.waitUntil(
        import('../lib/email').then(({ sendEmail }) => {
            return sendEmail(c.env, {
                to: email.toLowerCase(),
                toName: 'Subscriber',
                subject: 'Welcome to the BOA-Story Dispatch',
                html: htmlEmail,
            }).catch(err => console.error('[Newsletter Welcome Email Error]', err));
        })
    );

    return c.json({ success: true, message: "You're on the list!" }, 201);
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /newsletter/unsubscribe
// Requires the subscription UUID token (the `id` column), not a plain email.
// The token is included in every welcome/digest email's unsubscribe link.
// This prevents anyone from unsubscribing an arbitrary email address.
// ───────────────────────────────────────────────────────────────────────────────
router.post('/unsubscribe', async (c) => {
    let body: { token?: string };
    try {
        body = await c.req.json();
    } catch {
        return c.json({ success: false, message: 'Invalid request body' }, 400);
    }

    const { token } = body;
    if (!token) {
        return c.json({ success: false, message: 'token is required' }, 400);
    }

    const row = await c.env.DB.prepare(
        'SELECT id FROM digest_subscriptions WHERE id = ? AND is_active = 1'
    ).bind(token).first<{ id: string }>();

    if (!row) {
        // Return 200 to avoid confirming whether an email/token exists
        return c.json({ success: true, message: 'Successfully unsubscribed' });
    }

    await c.env.DB.prepare(
        'UPDATE digest_subscriptions SET is_active = 0, unsubscribed_at = ? WHERE id = ?'
    ).bind(new Date().toISOString(), token).run();

    return c.json({ success: true, message: 'Successfully unsubscribed' });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /newsletter/unsubscribe?token=...
// One-click unsubscribe from email links (RFC 8058).
// ───────────────────────────────────────────────────────────────────────────────
router.get('/unsubscribe', async (c) => {
    const token = c.req.query('token');
    if (!token) return c.text('Missing token', 400);

    await c.env.DB.prepare(
        'UPDATE digest_subscriptions SET is_active = 0, unsubscribed_at = ? WHERE id = ? AND is_active = 1'
    ).bind(new Date().toISOString(), token).run();

    // Redirect to the live site (boastory.com was never ours — an unsubscribe
    // click would have landed on a stranger's domain).
    const site = c.env.PUBLIC_SITE_URL || 'https://best-of-africa.pages.dev';
    return c.redirect(`${site}/newsletter?unsubscribed=1`, 302);
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /newsletter/stats — public subscriber count for social proof
// ───────────────────────────────────────────────────────────────────────────────
router.get('/stats', async (c) => {
    // Rate limit: 1 req/min per IP — prevents subscriber-count scraping
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const rl = await checkRateLimit(c.env, `newsletter-stats:${ip}`, 'free');
    Object.entries(rateLimitHeaders(rl)).forEach(([k, v]) => c.header(k, v));
    if (!rl.allowed) {
        return c.json({ error: 'too_many_requests', message: `Retry in ${rl.retryAfter}s.` }, 429);
    }

    const row = await c.env.DB.prepare(
        'SELECT COUNT(*) as subscribers FROM digest_subscriptions WHERE is_active = 1'
    ).first<{ subscribers: number }>();

    return c.json({ subscribers: row?.subscribers ?? 0 });
});

export { router as newsletterRouter };
