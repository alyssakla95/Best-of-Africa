import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, Variables } from '../types';
import { requireAdmin, requireClientAuth, requireSpecialist } from '../lib/auth';
import { throttle } from '../lib/ratelimit';
import {
    canRoleSubmitContribution,
    contributionNeedsSources,
    KNOWLEDGE_CONTRIBUTION_TYPES,
    publicAuthorName,
    publicContribution,
    type KnowledgeAuthorRole,
} from '../lib/knowledge-network';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();
const boundedText = (minimum: number, maximum: number) => z.string().trim().min(minimum).max(maximum);
const stringList = z.array(boundedText(1, 100)).max(20).default([]);

const ContributionSchema = z.object({
    group_slug: boundedText(2, 100),
    parent_id: z.string().uuid().optional(),
    contribution_type: z.enum(KNOWLEDGE_CONTRIBUTION_TYPES),
    title: boundedText(8, 180),
    body: boundedText(30, 4000),
    countries: stringList,
    sectors: stringList,
    source_urls: z.array(z.string().url().max(500)).max(10).default([]),
    fact_basis: z.enum(['sourced_analysis', 'professional_experience', 'question', 'consented_learning']),
    conflict_disclosure: z.string().trim().max(1000).optional(),
    no_sensitive_data_confirmed: z.literal(true),
    public_identity_confirmed: z.boolean().default(false),
});

const ModerationSchema = z.object({
    status: z.enum(['approved', 'rejected']),
    notes: z.string().trim().min(3).max(2000),
});
const MembershipSchema = z.object({ evidence_summary: boundedText(20, 1200) });
const MembershipReviewSchema = z.object({
    status: z.enum(['approved', 'rejected']),
    member_role: z.enum(['participant', 'contributor', 'moderator']).default('contributor'),
    notes: boundedText(3, 1200),
});

const surfaceTypes: Record<string, string[]> = {
    enterprise: ['enterprise_audience', 'decision'],
    specialists: ['region', 'sector', 'profession', 'language', 'decision'],
    readers: ['region', 'sector', 'decision'],
};

function jsonArray(items: string[]): string {
    return JSON.stringify([...new Set(items.map(item => item.trim()).filter(Boolean))]);
}

function parseArray(value: unknown): string[] {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value !== 'string') return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
        return [];
    }
}

function projectedContribution(row: Record<string, unknown>) {
    return publicContribution({
        ...row,
        countries: parseArray(row.countries),
        sectors: parseArray(row.sectors),
        source_urls: parseArray(row.source_urls),
        useful_count: Number(row.useful_count || 0),
        reply_count: Number(row.reply_count || 0),
    });
}

router.get('/groups', async (c) => {
    const surface = c.req.query('surface') || '';
    const allowedTypes = surfaceTypes[surface];
    const bindings: unknown[] = [];
    let where = 'g.is_active = 1';
    if (allowedTypes) {
        where += ` AND g.group_type IN (${allowedTypes.map(() => '?').join(', ')})`;
        bindings.push(...allowedTypes);
    }
    const result = await c.env.DB.prepare(`
        SELECT g.*,
               COUNT(DISTINCT CASE WHEN kc.moderation_status = 'approved' THEN kc.id END) AS contribution_count,
               COUNT(DISTINCT CASE WHEN gm.status = 'approved' AND gm.specialist_profile_id IS NOT NULL THEN gm.specialist_profile_id END) AS specialist_count,
               COUNT(DISTINCT f.client_id) AS follower_count
        FROM knowledge_groups g
        LEFT JOIN knowledge_contributions kc ON kc.group_id = g.id
        LEFT JOIN knowledge_group_memberships gm ON gm.group_id = g.id
        LEFT JOIN knowledge_group_follows f ON f.group_id = g.id
        WHERE ${where}
        GROUP BY g.id
        ORDER BY g.sort_order, g.name
    `).bind(...bindings).all<Record<string, unknown>>();
    return c.json({ data: result.results.map(group => ({
        ...group,
        is_active: Boolean(group.is_active),
        contribution_count: Number(group.contribution_count || 0),
        specialist_count: Number(group.specialist_count || 0),
        follower_count: Number(group.follower_count || 0),
    })) });
});

router.get('/contributions', async (c) => {
    const group = c.req.query('group')?.trim();
    const type = c.req.query('type')?.trim();
    const country = c.req.query('country')?.trim();
    const sector = c.req.query('sector')?.trim();
    const limit = Math.min(Math.max(Number(c.req.query('limit') || 20), 1), 40);
    const clauses = ["kc.moderation_status = 'approved'", 'g.is_active = 1'];
    const bindings: unknown[] = [];
    if (group) { clauses.push('g.slug = ?'); bindings.push(group); }
    if (type && KNOWLEDGE_CONTRIBUTION_TYPES.includes(type as never)) {
        clauses.push('kc.contribution_type = ?'); bindings.push(type);
    }
    if (country) { clauses.push('kc.countries LIKE ?'); bindings.push(`%${country.replace(/[%_]/g, '')}%`); }
    if (sector) { clauses.push('kc.sectors LIKE ?'); bindings.push(`%${sector.replace(/[%_]/g, '')}%`); }
    const result = await c.env.DB.prepare(`
        SELECT kc.*, g.slug AS group_slug, g.name AS group_name, g.group_type,
               p.slug AS author_profile_slug, p.verification_level AS author_verification_level,
               (SELECT COUNT(*) FROM knowledge_reactions r WHERE r.contribution_id = kc.id) AS useful_count,
               (SELECT COUNT(*) FROM knowledge_contributions replies
                WHERE replies.parent_id = kc.id AND replies.moderation_status = 'approved') AS reply_count
        FROM knowledge_contributions kc
        JOIN knowledge_groups g ON g.id = kc.group_id
        LEFT JOIN specialist_profiles p ON p.id = kc.author_profile_id
        WHERE ${clauses.join(' AND ')}
        ORDER BY COALESCE(kc.published_at, kc.created_at) DESC, kc.id
        LIMIT ?
    `).bind(...bindings, limit).all<Record<string, unknown>>();
    return c.json({ data: result.results.map(projectedContribution) });
});

router.post('/contributions', requireClientAuth, async (c) => {
    const limited = await throttle(c, 'knowledge-contribution');
    if (limited) return limited;
    const parsed = ContributionSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'validation_error', issues: parsed.error.issues }, 400);
    const body = parsed.data;
    const clientId = c.get('clientId') as string;
    const identity = await c.env.DB.prepare(`
        SELECT c.name, c.organization, c.tier,
               p.id AS profile_id, p.display_name AS specialist_name,
               p.screening_status, p.is_listed,
               m.status AS marketplace_status
        FROM clients c
        LEFT JOIN specialist_profiles p ON p.client_id = c.id
        LEFT JOIN marketplace_client_access m ON m.client_id = c.id
        WHERE c.id = ?
    `).bind(clientId).first<Record<string, unknown>>();
    if (!identity) return c.json({ error: 'unauthorized' }, 401);

    let role: KnowledgeAuthorRole = 'reader';
    if (identity.profile_id && identity.screening_status === 'approved') role = 'specialist';
    else if (identity.tier === 'enterprise' && identity.marketplace_status === 'enabled') role = 'enterprise';
    if (!canRoleSubmitContribution(role, body.contribution_type)) {
        return c.json({ error: 'forbidden', message: 'This contribution type is not available for your account role' }, 403);
    }
    if (contributionNeedsSources(body.contribution_type) && body.source_urls.length === 0) {
        return c.json({ error: 'validation_error', message: 'A field signal or evidence challenge requires at least one source URL' }, 400);
    }
    if (body.contribution_type.endsWith('_question') && body.fact_basis !== 'question') {
        return c.json({ error: 'validation_error', message: 'Questions must use the question evidence basis' }, 400);
    }
    if (body.contribution_type === 'decision_reflection' && body.fact_basis !== 'consented_learning') {
        return c.json({ error: 'validation_error', message: 'Decision reflections require confirmed consented learning' }, 400);
    }

    const group = await c.env.DB.prepare('SELECT id FROM knowledge_groups WHERE slug = ? AND is_active = 1')
        .bind(body.group_slug).first<{ id: string }>();
    if (!group) return c.json({ error: 'not_found', message: 'Knowledge circle not found' }, 404);
    if (body.parent_id) {
        const parent = await c.env.DB.prepare(`
            SELECT id FROM knowledge_contributions
            WHERE id = ? AND group_id = ? AND moderation_status = 'approved'
        `).bind(body.parent_id, group.id).first();
        if (!parent) return c.json({ error: 'validation_error', message: 'Responses must belong to a published contribution in the same circle' }, 400);
    }

    const id = crypto.randomUUID();
    const displayName = publicAuthorName({
        role,
        specialistName: identity.specialist_name ? String(identity.specialist_name) : null,
        organization: identity.organization ? String(identity.organization) : null,
        clientName: identity.name ? String(identity.name) : null,
        publicIdentityConfirmed: body.public_identity_confirmed,
    });
    await c.env.DB.prepare(`
        INSERT INTO knowledge_contributions (
            id, group_id, parent_id, author_client_id, author_profile_id,
            author_display_name, author_role, contribution_type, title, body,
            countries, sectors, source_urls, fact_basis, conflict_disclosure,
            no_sensitive_data_confirmed, public_identity_confirmed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).bind(
        id, group.id, body.parent_id || null, clientId, identity.profile_id || null,
        displayName, role, body.contribution_type, body.title, body.body,
        jsonArray(body.countries), jsonArray(body.sectors), jsonArray(body.source_urls),
        body.fact_basis, body.conflict_disclosure || null, body.public_identity_confirmed ? 1 : 0,
    ).run();
    return c.json({ id, status: 'pending', message: 'Contribution received for human review before publication' }, 201);
});

router.post('/contributions/:id/useful', requireClientAuth, async (c) => {
    const limited = await throttle(c, 'knowledge-reaction');
    if (limited) return limited;
    const contributionId = c.req.param('id');
    const clientId = c.get('clientId') as string;
    const published = await c.env.DB.prepare(`
        SELECT id FROM knowledge_contributions WHERE id = ? AND moderation_status = 'approved'
    `).bind(contributionId).first();
    if (!published) return c.json({ error: 'not_found' }, 404);
    const existing = await c.env.DB.prepare(`
        SELECT contribution_id FROM knowledge_reactions
        WHERE contribution_id = ? AND client_id = ? AND reaction_type = 'useful'
    `).bind(contributionId, clientId).first();
    if (existing) {
        await c.env.DB.prepare(`DELETE FROM knowledge_reactions WHERE contribution_id = ? AND client_id = ?`)
            .bind(contributionId, clientId).run();
    } else {
        await c.env.DB.prepare(`INSERT INTO knowledge_reactions (contribution_id, client_id) VALUES (?, ?)`)
            .bind(contributionId, clientId).run();
    }
    const count = await c.env.DB.prepare(`SELECT COUNT(*) AS count FROM knowledge_reactions WHERE contribution_id = ?`)
        .bind(contributionId).first<{ count: number }>();
    return c.json({ useful: !existing, useful_count: Number(count?.count || 0) });
});

router.post('/groups/:slug/follow', requireClientAuth, async (c) => {
    const limited = await throttle(c, 'knowledge-follow');
    if (limited) return limited;
    const clientId = c.get('clientId') as string;
    const group = await c.env.DB.prepare('SELECT id FROM knowledge_groups WHERE slug = ? AND is_active = 1')
        .bind(c.req.param('slug')).first<{ id: string }>();
    if (!group) return c.json({ error: 'not_found' }, 404);
    const existing = await c.env.DB.prepare('SELECT group_id FROM knowledge_group_follows WHERE group_id = ? AND client_id = ?')
        .bind(group.id, clientId).first();
    if (existing) await c.env.DB.prepare('DELETE FROM knowledge_group_follows WHERE group_id = ? AND client_id = ?').bind(group.id, clientId).run();
    else await c.env.DB.prepare('INSERT INTO knowledge_group_follows (group_id, client_id) VALUES (?, ?)').bind(group.id, clientId).run();
    return c.json({ following: !existing });
});

router.post('/groups/:slug/membership', requireSpecialist, async (c) => {
    const limited = await throttle(c, 'knowledge-membership');
    if (limited) return limited;
    const parsed = MembershipSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'validation_error', issues: parsed.error.issues }, 400);
    const clientId = c.get('clientId') as string;
    const group = await c.env.DB.prepare('SELECT id FROM knowledge_groups WHERE slug = ? AND is_active = 1')
        .bind(c.req.param('slug')).first<{ id: string }>();
    const profile = await c.env.DB.prepare(`SELECT id FROM specialist_profiles WHERE client_id = ? AND screening_status = 'approved'`)
        .bind(clientId).first<{ id: string }>();
    if (!group || !profile) return c.json({ error: 'not_found' }, 404);
    await c.env.DB.prepare(`
        INSERT INTO knowledge_group_memberships (
            group_id, client_id, specialist_profile_id, evidence_summary
        ) VALUES (?, ?, ?, ?)
        ON CONFLICT(group_id, client_id) DO UPDATE SET
            evidence_summary = excluded.evidence_summary, status = 'pending',
            reviewed_by = NULL, reviewed_at = NULL, updated_at = datetime('now')
        WHERE knowledge_group_memberships.status IN ('rejected', 'withdrawn')
    `).bind(group.id, clientId, profile.id, parsed.data.evidence_summary).run();
    return c.json({ status: 'pending', message: 'Circle membership requested for human review' }, 201);
});

router.get('/memberships/me', requireSpecialist, async (c) => {
    const result = await c.env.DB.prepare(`
        SELECT g.slug, g.name, g.group_type, m.member_role, m.status, m.evidence_summary, m.reviewed_at
        FROM knowledge_group_memberships m JOIN knowledge_groups g ON g.id = m.group_id
        WHERE m.client_id = ? ORDER BY g.sort_order, g.name
    `).bind(c.get('clientId') as string).all();
    return c.json({ data: result.results });
});

router.get('/admin/contributions', requireAdmin, async (c) => {
    const status = c.req.query('status') || 'pending';
    if (!['pending', 'approved', 'rejected', 'withdrawn'].includes(status)) return c.json({ error: 'validation_error' }, 400);
    const result = await c.env.DB.prepare(`
        SELECT kc.*, g.slug AS group_slug, g.name AS group_name
        FROM knowledge_contributions kc JOIN knowledge_groups g ON g.id = kc.group_id
        WHERE kc.moderation_status = ? ORDER BY kc.created_at
        LIMIT 200
    `).bind(status).all<Record<string, unknown>>();
    return c.json({ data: result.results.map(row => ({
        ...row,
        countries: parseArray(row.countries),
        sectors: parseArray(row.sectors),
        source_urls: parseArray(row.source_urls),
    })) });
});

router.patch('/admin/contributions/:id', requireAdmin, async (c) => {
    const parsed = ModerationSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'validation_error', issues: parsed.error.issues }, 400);
    const result = await c.env.DB.prepare(`
        UPDATE knowledge_contributions SET
            moderation_status = ?, moderation_notes = ?, moderated_by = 'admin',
            moderated_at = datetime('now'),
            published_at = CASE WHEN ? = 'approved' THEN COALESCE(published_at, datetime('now')) ELSE published_at END,
            updated_at = datetime('now')
        WHERE id = ? AND moderation_status = 'pending'
    `).bind(parsed.data.status, parsed.data.notes, parsed.data.status, c.req.param('id')).run();
    if (!result.meta.changes) return c.json({ error: 'conflict', message: 'Only pending contributions can be moderated' }, 409);
    return c.json({ id: c.req.param('id'), status: parsed.data.status });
});

router.get('/admin/memberships', requireAdmin, async (c) => {
    const result = await c.env.DB.prepare(`
        SELECT m.*, g.slug AS group_slug, g.name AS group_name,
               p.display_name, p.slug AS specialist_slug
        FROM knowledge_group_memberships m
        JOIN knowledge_groups g ON g.id = m.group_id
        JOIN specialist_profiles p ON p.id = m.specialist_profile_id
        WHERE m.status = 'pending'
        ORDER BY m.created_at LIMIT 200
    `).all();
    return c.json({ data: result.results });
});

router.patch('/admin/memberships/:groupId/:clientId', requireAdmin, async (c) => {
    const parsed = MembershipReviewSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'validation_error', issues: parsed.error.issues }, 400);
    const result = await c.env.DB.prepare(`
        UPDATE knowledge_group_memberships SET status = ?, member_role = ?, reviewed_by = 'admin',
            reviewed_at = datetime('now'), updated_at = datetime('now'), review_notes = ?
        WHERE group_id = ? AND client_id = ? AND status = 'pending'
    `).bind(parsed.data.status, parsed.data.member_role, parsed.data.notes, c.req.param('groupId'), c.req.param('clientId')).run();
    if (!result.meta.changes) return c.json({ error: 'conflict' }, 409);
    return c.json({ status: parsed.data.status });
});

export { router as knowledgeNetworkRouter };
