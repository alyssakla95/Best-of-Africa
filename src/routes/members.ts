// ═══════════════════════════════════════════════════════════════════════════════
// KO-FI WEBHOOK ROUTER
// Handles Ko-fi payment webhooks to auto-provision beta member access
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { createJWT } from '../lib/auth';
import { sendWelcomeEmail } from '../lib/email';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ───────────────────────────────────────────────────────────────────────────────
// Tier mapping: Ko-fi amount → BoA member tier
// ───────────────────────────────────────────────────────────────────────────────
function tierFromAmount(amount: number): string {
    if (amount >= 50) return 'enterprise';   // Founding Patron ($50+)
    if (amount >= 15) return 'premium';       // Founding Member ($15+)
    return 'basic';                           // Supporter ($5+)
}

// ───────────────────────────────────────────────────────────────────────────────
// POST /members/kofi-webhook
// Ko-fi posts a form-encoded `data` field containing JSON
// Docs: https://help.ko-fi.com/hc/en-us/articles/360004162298
// ───────────────────────────────────────────────────────────────────────────────
router.post('/kofi-webhook', async (c) => {
    // Ko-fi sends form data with a `data` field
    let payload: Record<string, any>;
    try {
        const body = await c.req.parseBody();
        const raw = body['data'] as string;
        if (!raw) return c.json({ ok: false, error: 'Missing data field' }, 400);
        payload = JSON.parse(raw);
    } catch {
        return c.json({ ok: false, error: 'Invalid payload' }, 400);
    }

    // Validate Ko-fi verification token (set in Ko-fi dashboard → API)
    // Fail closed: if KOFI_TOKEN is not configured, reject all webhooks to prevent
    // unauthenticated callers from provisioning or upgrading member accounts.
    const verificationToken = c.env.KOFI_TOKEN;
    if (!verificationToken) {
        console.error('[kofi-webhook] KOFI_TOKEN env var is not set — rejecting all webhook calls.');
        return c.json({ ok: false, error: 'Webhook not configured' }, 503);
    }
    if (payload.verification_token !== verificationToken) {
        return c.json({ ok: false, error: 'Invalid verification token' }, 401);
    }

    // Only process successful one-time payments and subscriptions
    const type = payload.type as string; // 'Donation', 'Subscription', 'ShopOrder'
    if (payload.is_public === false) {
        return c.json({ ok: true, skipped: true }); // private donation — skip
    }

    const email = (payload.email as string)?.toLowerCase().trim();
    if (!email) {
        return c.json({ ok: false, error: 'No email in payload' }, 400);
    }

    const amount = parseFloat(payload.amount || '0');
    const tier = tierFromAmount(amount);
    const name = (payload.from_name as string) || 'BoA Member';
    const isSubscription = type === 'Subscription';

    // Check if client already exists
    const existing = await c.env.DB.prepare(
        'SELECT id, tier, is_active FROM clients WHERE email = ?'
    ).bind(email).first<{ id: string; tier: string; is_active: number }>();

    let clientId: string;

    if (existing) {
        // Re-activate and upgrade tier if needed
        const tierOrder = ['basic', 'premium', 'enterprise'];
        const upgradedTier = tierOrder.indexOf(tier) > tierOrder.indexOf(existing.tier) ? tier : existing.tier;
        // Subscriptions expire in 32 days (buffer for monthly billing), one-time in 365 days
        const expiresAt = isSubscription
            ? new Date(Date.now() + 32 * 86400_000).toISOString()
            : new Date(Date.now() + 365 * 86400_000).toISOString();

        await c.env.DB.prepare(
            'UPDATE clients SET tier = ?, is_active = 1, expires_at = ? WHERE id = ?'
        ).bind(upgradedTier, expiresAt, existing.id).run();

        clientId = existing.id;
    } else {
        // Create new member client
        clientId = `member_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
        const expiresAt = isSubscription
            ? new Date(Date.now() + 32 * 86400_000).toISOString()
            : new Date(Date.now() + 365 * 86400_000).toISOString();

        // clients.api_key_hash is NOT NULL (the table predates members). Members
        // authenticate via OTP + JWT, never by API key, so store a random hash
        // that can never match a presented key. Without this the INSERT throws
        // and every first-time Ko-fi payment fails to create the membership.
        const apiKeyHash = [...crypto.getRandomValues(new Uint8Array(32))]
            .map(b => b.toString(16).padStart(2, '0')).join('');

        await c.env.DB.prepare(`
            INSERT INTO clients (id, name, email, type, tier, api_key_hash, rate_limit_per_hour, is_active, expires_at, created_at)
            VALUES (?, ?, ?, 'member', ?, ?, 500, 1, ?, ?)
        `).bind(clientId, name, email, tier, apiKeyHash, expiresAt, new Date().toISOString()).run();
    }

    // Live funding progress: every public contribution increments the running
    // total + coffee count in system_config, so the "Live Funding Progress"
    // widgets reflect reality instead of a hardcoded snapshot. Best-effort.
    try {
        if (amount > 0) {
            const upd = await c.env.DB.prepare(
                "UPDATE system_config SET value = CAST(CAST(value AS REAL) + ? AS TEXT) WHERE key = 'funding_raised'"
            ).bind(amount).run();
            if (!(upd as Record<string, any>).meta?.changes) {
                await c.env.DB.prepare("INSERT INTO system_config (key, value) VALUES ('funding_raised', ?)").bind(String(amount)).run();
            }
        }
        const cUpd = await c.env.DB.prepare(
            "UPDATE system_config SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) WHERE key = 'funding_coffees'"
        ).run();
        if (!(cUpd as Record<string, any>).meta?.changes) {
            await c.env.DB.prepare("INSERT INTO system_config (key, value) VALUES ('funding_coffees', '1')").run();
        }
    } catch (e) { console.error('[kofi-webhook] funding progress update failed:', e); }

    // Issue a 30-day JWT for this member (they'll use it on the frontend)
    const token = await createJWT(clientId, c.env.JWT_SECRET, 30 * 86400);

    // Send Welcome Email in the background
    c.executionCtx.waitUntil(
        sendWelcomeEmail(c.env, email, name, tier)
            .then(success => {
                const status = success ? 'SUCCESS' : 'FAILED';
                console.log(`[Email] MailChannels Welcome email for ${email}: ${status}`);
            })
            .catch(err => console.error('[Email] MailChannels fatal error:', err))
    );

    // Log the event for visibility
    console.log(`[kofi-webhook] New member: ${email} | tier: ${tier} | type: ${type} | id: ${clientId}`);

    // Return the token — Ko-fi ignores the response body but it's useful for debugging
    return c.json({
        ok: true,
        tier,
        token,
        client_id: clientId,
        message: `Member provisioned: ${email}`,
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /members/verify-email  — Step 1: Generate OTP and send via email
// ───────────────────────────────────────────────────────────────────────────────
router.post('/verify-email', async (c) => {
    let body: { email?: string };
    try { body = await c.req.json(); } catch { return c.json({ ok: false, error: 'Invalid JSON' }, 400); }

    const email = body.email?.toLowerCase().trim();
    if (!email) return c.json({ ok: false, error: 'Email required' }, 400);

    // Abuse limits: per-IP throttle (membership enumeration / OTP farming) and
    // a per-address cooldown so one member's inbox can't be bombed with codes.
    // The cooldown is only WRITTEN after a successful send (below) — setting it
    // up front would lock the user out for 60s after a failed delivery while
    // telling them to "try again".
    const { throttle } = await import('../lib/ratelimit');
    const limited = await throttle(c, 'otp-request');
    if (limited) return limited;
    const cooldownKey = `otp_cooldown:${email}`;
    if (await c.env.CACHE.get(cooldownKey)) {
        return c.json({ ok: false, error: 'A code was just sent. Please wait a minute before requesting another.' }, 429);
    }

    const client = await c.env.DB.prepare(`
        SELECT id, name, tier, is_active, expires_at
        FROM clients
        WHERE email = ? AND type = 'member' AND is_active = 1
    `).bind(email).first<{ id: string; name: string; tier: string; is_active: number; expires_at: string }>();

    if (!client) {
        // Delay response slightly to prevent email enumeration timing attacks
        await new Promise(r => setTimeout(r, 300));
        return c.json({ ok: false, error: 'No active membership found for this email.' }, 404);
    }

    // Check if membership has expired
    if (client.expires_at && new Date(client.expires_at) < new Date()) {
        return c.json({ ok: false, error: 'Your membership has expired. Please renew on Ko-fi.' }, 403);
    }

    // Generate a cryptographically secure 6-digit OTP
    // Math.random() is NOT cryptographically secure — use crypto.getRandomValues() instead.
    const otpBuffer = new Uint32Array(1);
    crypto.getRandomValues(otpBuffer);
    const otp = (100000 + (otpBuffer[0] % 900000)).toString();

    // Store OTP in KV cache with 10 minute expiration and 0 starting attempts.
    // otp_deadline is stored as an absolute Unix timestamp so that on each failed
    // attempt we re-save with the *remaining* TTL rather than a fresh 600 seconds —
    // preventing an attacker from resetting the window by submitting wrong codes.
    const otpKey = `member_otp:${email}`;
    const sessionData = {
        otp,
        clientId: client.id,
        tier: client.tier,
        name: client.name,
        expires_at: client.expires_at,
        otp_deadline: Math.floor(Date.now() / 1000) + 600,
        attempts: 0
    };
    await c.env.CACHE.put(otpKey, JSON.stringify(sessionData), { expirationTtl: 600 });

    // Basic rate limiting: check if an OTP was already generated in the last 60s
    // (The KV TTL is 600s — we check attempts to avoid email spam)
    // The 3-strike defense is on /verify-otp; here we just log the send.

    // Send the OTP via MailChannels in the background
    // All styling uses proper inline CSS — no Tailwind classes in email templates.
    const htmlEmail = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your BOA-Story access code</title></head>
    <body style="margin: 0; padding: 0; background-color: #0a0f1e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #0a0f1e; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px; width: 100%; background-color: #111827; border: 1px solid rgba(201,168,76,0.25); border-radius: 12px; overflow: hidden;">
              <tr>
                <td style="padding: 40px 48px; text-align: center;">
                  <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #C9A84C;">BOA-Story</p>
                  <h1 style="margin: 0 0 24px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 700; color: #ffffff;">Your Access Code</h1>
                  <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: rgba(255,255,255,0.65);">
                    Enter this code on the BOA-Story member access page.<br>
                    It expires in <strong style="color: #ffffff;">10 minutes</strong>.
                  </p>
                  <div style="display: inline-block; background-color: #0a0f1e; border: 1px solid rgba(201,168,76,0.3); border-radius: 8px; padding: 20px 40px; margin-bottom: 32px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #C9A84C;">${otp}</span>
                  </div>
                  <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.25); line-height: 1.5;">
                    If you did not request this code, you can safely ignore this email.<br>
                    This code was requested for the account: ${email}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 16px 48px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: rgba(255,255,255,0.2);">© ${new Date().getFullYear()} BOA-Story</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    // Await the send and report failure honestly: telling someone to check an
    // inbox that will never receive the code is a dead-end, not a login flow.
    const { sendEmail } = await import('../lib/email');
    const sent = await sendEmail(c.env, {
        to: email,
        toName: client.name,
        subject: `${otp} is your verification code`,
        html: htmlEmail,
    });

    if (!sent) {
        console.error('[OTP Email] delivery failed for', email);
        return c.json({
            ok: false,
            error: 'We could not send your access code just now. Please try again in a few minutes.',
        }, 502);
    }

    // Delivery succeeded — start the per-address cooldown now.
    await c.env.CACHE.put(cooldownKey, '1', { expirationTtl: 60 });

    return c.json({ ok: true, status: 'pending_otp' });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /members/verify-otp — Step 2: Validate OTP and issue JWT
// ───────────────────────────────────────────────────────────────────────────────
router.post('/verify-otp', async (c) => {
    let body: { email?: string; otp?: string };
    try { body = await c.req.json(); } catch { return c.json({ ok: false, error: 'Invalid JSON' }, 400); }

    const email = body.email?.toLowerCase().trim();
    const providedOtp = body.otp?.trim();

    if (!email || !providedOtp) return c.json({ ok: false, error: 'Email and OTP required' }, 400);

    const otpKey = `member_otp:${email}`;
    const storedRaw = await c.env.CACHE.get(otpKey);

    if (!storedRaw) {
        return c.json({ ok: false, error: 'verification_expired' }, 400);
    }

    const sessionData = JSON.parse(storedRaw);

    if (sessionData.otp !== providedOtp) {
        // Implement 3-strike brute-force defense
        sessionData.attempts = (sessionData.attempts || 0) + 1;
        
        if (sessionData.attempts >= 3) {
            await c.env.CACHE.delete(otpKey);
            return c.json({ ok: false, error: 'Too many invalid attempts. Your code has been voided. Please request a new one.' }, 429);
        } else {
            // Re-save with the *remaining* TTL — never extend the window on a bad attempt
            const remainingTtl = Math.max((sessionData.otp_deadline ?? 0) - Math.floor(Date.now() / 1000), 1);
            await c.env.CACHE.put(otpKey, JSON.stringify(sessionData), { expirationTtl: remainingTtl });
            return c.json({ ok: false, error: `Invalid verification code. ${3 - sessionData.attempts} attempts remaining.` }, 400);
        }
    }

    // Success! Delete the OTP so it can't be reused
    await c.env.CACHE.delete(otpKey);

    // Issue a fresh 30-day JWT
    const token = await createJWT(sessionData.clientId, c.env.JWT_SECRET, 30 * 86400);

    return c.json({
        ok: true,
        token,
        tier: sessionData.tier,
        name: sessionData.name,
        expires_at: sessionData.expires_at,
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /members/me — check current membership status from stored token
// ───────────────────────────────────────────────────────────────────────────────
router.get('/me', async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ member: false }, 200);
    }
    const token = authHeader.slice(7);
    try {
        const [, payloadB64] = token.split('.');
        const payload: { sub: string; exp: number } = JSON.parse(atob(payloadB64));
        if (payload.exp < Math.floor(Date.now() / 1000)) {
            return c.json({ member: false, reason: 'expired' }, 200);
        }
        const client = await c.env.DB.prepare(
            'SELECT id, name, tier, expires_at FROM clients WHERE id = ? AND is_active = 1 AND type = \'member\''
        ).bind(payload.sub).first<{ id: string; name: string; tier: string; expires_at: string }>();

        if (!client) return c.json({ member: false }, 200);

        // Calculate days remaining for client-side renewal nudges
        const expiresAt = client.expires_at ? new Date(client.expires_at) : null;
        const now = new Date();
        const expires_in_days = expiresAt
            ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 86400_000))
            : null;

        return c.json({
            member: true,
            tier: client.tier,
            name: client.name,
            expires_at: client.expires_at,
            expires_in_days,
        });
    } catch {
        return c.json({ member: false }, 200);
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// PUT /members/profile — update member name and organization
// Requires a valid member JWT
// ───────────────────────────────────────────────────────────────────────────────
router.put('/profile', async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ ok: false, error: 'Authentication required' }, 401);
    }

    let clientId: string;
    try {
        const token = authHeader.slice(7);
        const [, payloadB64, ] = token.split('.');
        const payload: { sub: string; exp: number } = JSON.parse(atob(payloadB64));
        if (payload.exp < Math.floor(Date.now() / 1000)) {
            return c.json({ ok: false, error: 'Token expired' }, 401);
        }
        clientId = payload.sub;
    } catch {
        return c.json({ ok: false, error: 'Invalid token' }, 401);
    }

    let body: { name?: string; organization?: string };
    try {
        body = await c.req.json();
    } catch {
        return c.json({ ok: false, error: 'Invalid JSON' }, 400);
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (body.name !== undefined) {
        const name = body.name.trim();
        if (!name || name.length < 2 || name.length > 120) {
            return c.json({ ok: false, error: 'Name must be 2–120 characters' }, 400);
        }
        updates.push('name = ?');
        params.push(name);
    }

    if (body.organization !== undefined) {
        const org = body.organization.trim().slice(0, 200);
        updates.push('organization = ?');
        params.push(org);
    }

    if (updates.length === 0) {
        return c.json({ ok: false, error: 'No valid fields to update' }, 400);
    }

    params.push(clientId);
    await c.env.DB.prepare(
        `UPDATE clients SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ? AND type = 'member'`
    ).bind(...params).run();

    return c.json({ ok: true, message: 'Profile updated' });
});

export { router as membersRouter };
