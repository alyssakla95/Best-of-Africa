import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, Variables } from '../types';
import { requireAdmin, requireClientAuth, requireMarketplaceEnterprise, requireSpecialist } from '../lib/auth';
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

const ROOM_ITEM_TYPES = [
    'official_evidence', 'boa_intelligence', 'specialist_response', 'field_perspective',
    'evidence_challenge', 'contradiction', 'unresolved_question', 'verification_priority',
    'decision_update', 'documented_outcome',
] as const;
const RoomSchema = z.object({
    title: boundedText(8, 180),
    decision_question: boundedText(20, 1200),
    decision_context: boundedText(30, 3000),
    countries: stringList,
    sectors: stringList,
    intended_users: stringList,
    visibility: z.enum(['private', 'consented_public']),
    originating_request_id: z.string().uuid().optional(),
    knowledge_group_slug: boundedText(2, 100).optional(),
    decision_deadline: z.string().date().optional(),
    no_sensitive_data_confirmed: z.literal(true),
    public_consent_confirmed: z.boolean(),
});
const RoomItemSchema = z.object({
    parent_id: z.string().uuid().optional(),
    item_type: z.enum(ROOM_ITEM_TYPES),
    title: boundedText(8, 180),
    body: boundedText(30, 5000),
    source_urls: z.array(z.string().url().max(500)).max(12).default([]),
    countries: stringList,
    sectors: stringList,
    confidence: z.enum(['documented', 'supported_interpretation', 'professional_experience', 'unresolved']),
    conflict_disclosure: z.string().trim().max(1000).default(''),
    no_sensitive_data_confirmed: z.literal(true),
});
const RoomReviewSchema = z.object({
    moderation_status: z.enum(['approved', 'rejected']),
    status: z.enum(['open', 'evidence_review', 'resolved', 'archived']),
    editorial_summary: z.string().trim().max(3000).default(''),
    verification_priorities: z.array(boundedText(3, 300)).max(20).default([]),
    next_review_at: z.string().datetime().optional(),
    notes: boundedText(3, 2000),
});
const RoomItemReviewSchema = z.object({ status: z.enum(['approved', 'rejected']), notes: boundedText(3, 2000) });
const RoomInviteSchema = z.object({ specialist_profile_id: z.string().uuid() });
const TRANSITION_PLATFORMS = ['reddit', 'linkedin', 'facebook', 'whatsapp', 'discord', 'telegram', 'slack', 'forum', 'association', 'other'] as const;
const TransitionApplicationSchema = z.object({
    contact_name: boundedText(2, 120),
    work_email: z.string().trim().email().max(254),
    organization: z.string().trim().max(180).default(''),
    community_name: boundedText(3, 180),
    source_platform: z.enum(TRANSITION_PLATFORMS),
    community_url: z.string().url().max(500),
    steward_role: boundedText(3, 180),
    stewardship_evidence: boundedText(30, 2000),
    member_range: z.enum(['under_100', '100_499', '500_1999', '2000_9999', '10000_plus', 'not_public']),
    countries: stringList,
    sectors: stringList,
    languages: stringList,
    transition_goals: boundedText(40, 3000),
    proposed_boundary: boundedText(30, 2000),
    authority_confirmed: z.literal(true),
    no_member_data_confirmed: z.literal(true),
    consent_confirmed: z.literal(true),
});
const TransitionReviewSchema = z.object({
    status: z.enum(['reviewing', 'approved', 'rejected']),
    notes: boundedText(3, 2000),
    knowledge_group_id: z.string().min(3).max(100).optional(),
    public_summary: z.string().trim().max(2000).default(''),
    steward_display_name: z.string().trim().max(120).default(''),
    target_review_at: z.string().datetime().optional(),
});
const TransitionInvitationSchema = z.object({
    label: boundedText(3, 120),
    channel: z.enum(['community_post', 'moderator_message', 'newsletter', 'event', 'direct', 'other']),
    expires_at: z.string().datetime().optional(),
});

const roomItemPermissions: Record<KnowledgeAuthorRole, readonly string[]> = {
    reader: ['unresolved_question'],
    enterprise: ['unresolved_question', 'verification_priority', 'decision_update', 'documented_outcome'],
    specialist: ['official_evidence', 'specialist_response', 'field_perspective', 'evidence_challenge', 'contradiction', 'unresolved_question'],
    editorial: ROOM_ITEM_TYPES,
};

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

function projectRoom(row: Record<string, unknown>) {
    return {
        id: String(row.id), slug: String(row.slug), title: String(row.title),
        decision_question: String(row.decision_question), decision_context: String(row.decision_context),
        countries: parseArray(row.countries), sectors: parseArray(row.sectors), intended_users: parseArray(row.intended_users),
        status: String(row.status), visibility: String(row.visibility),
        editorial_summary: String(row.editorial_summary || ''),
        verification_priorities: parseArray(row.verification_priorities),
        next_review_at: row.next_review_at ? String(row.next_review_at) : '',
        decision_deadline: row.decision_deadline ? String(row.decision_deadline) : '',
        group_slug: row.group_slug ? String(row.group_slug) : '',
        group_name: row.group_name ? String(row.group_name) : '',
        evidence_count: Number(row.evidence_count || 0),
        specialist_count: Number(row.specialist_count || 0),
        unresolved_count: Number(row.unresolved_count || 0),
        outcome_count: Number(row.outcome_count || 0),
        follower_count: Number(row.follower_count || 0),
        published_at: row.published_at ? String(row.published_at) : '',
        updated_at: String(row.updated_at || row.created_at || ''),
    };
}

function projectRoomItem(row: Record<string, unknown>) {
    return {
        id: String(row.id), room_id: String(row.room_id), parent_id: row.parent_id ? String(row.parent_id) : '',
        author_display_name: String(row.author_display_name), author_role: String(row.author_role),
        item_type: String(row.item_type), title: String(row.title), body: String(row.body),
        source_urls: parseArray(row.source_urls), countries: parseArray(row.countries), sectors: parseArray(row.sectors),
        confidence: String(row.confidence), conflict_disclosure: String(row.conflict_disclosure || ''),
        published_at: row.published_at ? String(row.published_at) : '',
        created_at: String(row.created_at || ''),
    };
}

const roomSelect = `
    SELECT r.*, g.slug AS group_slug, g.name AS group_name,
      (SELECT COUNT(*) FROM decision_room_items i WHERE i.room_id = r.id AND i.moderation_status = 'approved') AS evidence_count,
      (SELECT COUNT(*) FROM decision_room_participants p WHERE p.room_id = r.id AND p.status = 'accepted' AND p.participant_role = 'specialist') AS specialist_count,
      (SELECT COUNT(*) FROM decision_room_items i WHERE i.room_id = r.id AND i.moderation_status = 'approved' AND i.item_type = 'unresolved_question') AS unresolved_count,
      (SELECT COUNT(*) FROM decision_room_items i WHERE i.room_id = r.id AND i.moderation_status = 'approved' AND i.item_type = 'documented_outcome') AS outcome_count,
      (SELECT COUNT(*) FROM decision_room_follows f WHERE f.room_id = r.id) AS follower_count
    FROM decision_rooms r LEFT JOIN knowledge_groups g ON g.id = r.knowledge_group_id
`;

function roomSlug(title: string, id: string) {
    const base = title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '')
        .trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 70) || 'decision-room';
    return `${base}-${id.slice(0, 8)}`;
}

function transitionSlug(name: string, id: string) {
    const base = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '')
        .trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 70) || 'community';
    return `${base}-${id.slice(0, 8)}`;
}

function projectTransition(row: Record<string, unknown>) {
    return {
        id: String(row.id), slug: String(row.slug), community_name: String(row.community_name),
        source_platform: String(row.source_platform), external_url: String(row.external_url),
        public_summary: String(row.public_summary), steward_display_name: String(row.steward_display_name),
        member_range: String(row.member_range), countries: parseArray(row.countries), sectors: parseArray(row.sectors),
        languages: parseArray(row.languages), status: String(row.status), group_slug: String(row.group_slug || ''),
        group_name: String(row.group_name || ''), transition_started_at: String(row.transition_started_at || ''),
        target_review_at: String(row.target_review_at || ''), invitation_visits: Number(row.invitation_visits || 0),
        activated_members: Number(row.activated_members || 0), active_contributors: Number(row.active_contributors || 0),
        published_at: String(row.published_at || ''), updated_at: String(row.updated_at || row.created_at || ''),
    };
}

const transitionSelect = `SELECT p.*, g.slug AS group_slug, g.name AS group_name,
    (SELECT COALESCE(SUM(i.click_count), 0) FROM community_transition_invitations i WHERE i.program_id = p.id) AS invitation_visits,
    (SELECT COUNT(*) FROM community_transition_activations a WHERE a.program_id = p.id) AS activated_members,
    (SELECT COUNT(DISTINCT kc.author_client_id) FROM knowledge_contributions kc
      WHERE kc.group_id = p.knowledge_group_id AND kc.moderation_status = 'approved'
        AND kc.author_client_id IN (SELECT client_id FROM community_transition_activations WHERE program_id = p.id)) AS active_contributors
    FROM community_transition_programs p JOIN knowledge_groups g ON g.id = p.knowledge_group_id`;

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

router.get('/transitions', async (c) => {
    const result = await c.env.DB.prepare(`${transitionSelect}
        WHERE p.status IN ('open', 'completed') AND p.published_at IS NOT NULL
        ORDER BY CASE p.status WHEN 'open' THEN 1 ELSE 2 END, p.published_at DESC LIMIT 100
    `).all<Record<string, unknown>>();
    return c.json({ data: (result.results || []).map(projectTransition) });
});

router.get('/transitions/:slug', async (c) => {
    const transition = await c.env.DB.prepare(`${transitionSelect}
        WHERE p.slug = ? AND p.status IN ('open', 'completed') AND p.published_at IS NOT NULL
    `).bind(c.req.param('slug')).first<Record<string, unknown>>();
    if (!transition) return c.json({ error: 'not_found' }, 404);
    return c.json({ transition: projectTransition(transition) });
});

router.post('/transitions/apply', async (c) => {
    const limited = await throttle(c, 'community-transition-apply');
    if (limited) return limited;
    const parsed = TransitionApplicationSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'validation_error', issues: parsed.error.issues }, 400);
    const body = parsed.data;
    const recent = await c.env.DB.prepare(`SELECT id FROM community_transition_applications
        WHERE lower(work_email) = lower(?) AND lower(community_url) = lower(?)
          AND status IN ('pending', 'reviewing', 'approved') LIMIT 1`)
        .bind(body.work_email, body.community_url).first();
    if (recent) return c.json({ error: 'conflict', message: 'This community already has an active transition application' }, 409);
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`INSERT INTO community_transition_applications (
        id, contact_name, work_email, organization, community_name, source_platform, community_url,
        steward_role, stewardship_evidence, member_range, countries, sectors, languages,
        transition_goals, proposed_boundary, authority_confirmed, no_member_data_confirmed, consent_confirmed
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1)`)
        .bind(id, body.contact_name, body.work_email.toLowerCase(), body.organization, body.community_name,
            body.source_platform, body.community_url, body.steward_role, body.stewardship_evidence,
            body.member_range, jsonArray(body.countries), jsonArray(body.sectors), jsonArray(body.languages),
            body.transition_goals, body.proposed_boundary).run();
    return c.json({ id, status: 'pending', message: 'Community transition application received for stewardship and consent review' }, 201);
});

router.post('/transitions/invitations/:token/click', async (c) => {
    const limited = await throttle(c, 'community-transition-click');
    if (limited) return limited;
    const result = await c.env.DB.prepare(`UPDATE community_transition_invitations SET
        click_count = click_count + 1, last_clicked_at = datetime('now')
        WHERE token = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > datetime('now'))
          AND program_id IN (SELECT id FROM community_transition_programs WHERE status = 'open')`)
        .bind(c.req.param('token')).run();
    if (!result.meta.changes) return c.json({ error: 'not_found' }, 404);
    const destination = await c.env.DB.prepare(`SELECT p.slug FROM community_transition_invitations i
        JOIN community_transition_programs p ON p.id = i.program_id WHERE i.token = ?`)
        .bind(c.req.param('token')).first<{ slug: string }>();
    return c.json({ recorded: true, transition_slug: destination?.slug || '' });
});

router.post('/transitions/invitations/:token/activate', requireClientAuth, async (c) => {
    const limited = await throttle(c, 'community-transition-activate');
    if (limited) return limited;
    const parsed = z.object({ consent_confirmed: z.literal(true) }).safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'validation_error' }, 400);
    const invitation = await c.env.DB.prepare(`SELECT i.id, i.program_id, p.knowledge_group_id, p.slug
        FROM community_transition_invitations i JOIN community_transition_programs p ON p.id = i.program_id
        WHERE i.token = ? AND i.is_active = 1 AND p.status = 'open'
          AND (i.expires_at IS NULL OR i.expires_at > datetime('now'))`)
        .bind(c.req.param('token')).first<{ id: string; program_id: string; knowledge_group_id: string; slug: string }>();
    if (!invitation) return c.json({ error: 'not_found' }, 404);
    const clientId = c.get('clientId') as string;
    await c.env.DB.batch([
        c.env.DB.prepare(`INSERT INTO community_transition_activations
            (program_id, client_id, invitation_id, consent_confirmed) VALUES (?, ?, ?, 1)
            ON CONFLICT(program_id, client_id) DO NOTHING`).bind(invitation.program_id, clientId, invitation.id),
        c.env.DB.prepare(`INSERT INTO knowledge_group_follows (group_id, client_id) VALUES (?, ?)
            ON CONFLICT(group_id, client_id) DO NOTHING`).bind(invitation.knowledge_group_id, clientId),
    ]);
    return c.json({ activated: true, transition_slug: invitation.slug });
});

router.get('/rooms', async (c) => {
    const country = c.req.query('country')?.trim().replace(/[%_]/g, '');
    const sector = c.req.query('sector')?.trim().replace(/[%_]/g, '');
    const status = c.req.query('status')?.trim();
    const limit = Math.min(Math.max(Number(c.req.query('limit') || 20), 1), 40);
    const clauses = ["r.visibility = 'consented_public'", "r.moderation_status = 'approved'"];
    const bindings: unknown[] = [];
    if (country) { clauses.push('r.countries LIKE ?'); bindings.push(`%${country}%`); }
    if (sector) { clauses.push('r.sectors LIKE ?'); bindings.push(`%${sector}%`); }
    if (status && ['open', 'evidence_review', 'resolved', 'archived'].includes(status)) {
        clauses.push('r.status = ?'); bindings.push(status);
    }
    const result = await c.env.DB.prepare(`${roomSelect}
        WHERE ${clauses.join(' AND ')} ORDER BY COALESCE(r.published_at, r.updated_at) DESC LIMIT ?
    `).bind(...bindings, limit).all<Record<string, unknown>>();
    return c.json({ data: (result.results || []).map(projectRoom) });
});

router.get('/rooms/mine', requireMarketplaceEnterprise, async (c) => {
    const result = await c.env.DB.prepare(`${roomSelect}
        WHERE r.owner_client_id = ? ORDER BY r.updated_at DESC LIMIT 100
    `).bind(c.get('clientId')).all<Record<string, unknown>>();
    return c.json({ data: (result.results || []).map(row => ({
        ...projectRoom(row), moderation_status: String(row.moderation_status),
        moderation_notes: String(row.moderation_notes || ''),
    })) });
});

router.get('/rooms/invitations/me', requireSpecialist, async (c) => {
    const result = await c.env.DB.prepare(`SELECT r.*, g.slug AS group_slug, g.name AS group_name,
        mine.status AS invitation_status,
        (SELECT COUNT(*) FROM decision_room_items i WHERE i.room_id = r.id AND i.moderation_status = 'approved') AS evidence_count,
        (SELECT COUNT(*) FROM decision_room_participants p WHERE p.room_id = r.id AND p.status = 'accepted' AND p.participant_role = 'specialist') AS specialist_count,
        (SELECT COUNT(*) FROM decision_room_items i WHERE i.room_id = r.id AND i.moderation_status = 'approved' AND i.item_type = 'unresolved_question') AS unresolved_count,
        (SELECT COUNT(*) FROM decision_room_items i WHERE i.room_id = r.id AND i.moderation_status = 'approved' AND i.item_type = 'documented_outcome') AS outcome_count,
        (SELECT COUNT(*) FROM decision_room_follows f WHERE f.room_id = r.id) AS follower_count
        FROM decision_rooms r LEFT JOIN knowledge_groups g ON g.id = r.knowledge_group_id
        JOIN decision_room_participants mine ON mine.room_id = r.id
        WHERE mine.client_id = ? AND mine.participant_role = 'specialist'
          AND mine.status IN ('invited', 'accepted')
        ORDER BY mine.updated_at DESC
    `).bind(c.get('clientId')).all<Record<string, unknown>>();
    return c.json({ data: (result.results || []).map(row => ({
        ...projectRoom(row), invitation_status: String(row.invitation_status),
    })) });
});

router.patch('/rooms/invitations/:roomId', requireSpecialist, async (c) => {
    const parsed = z.object({ status: z.enum(['accepted', 'declined']) }).safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'validation_error' }, 400);
    const result = await c.env.DB.prepare(`
        UPDATE decision_room_participants SET status = ?, responded_at = datetime('now'), updated_at = datetime('now')
        WHERE room_id = ? AND client_id = ? AND status = 'invited' AND participant_role = 'specialist'
    `).bind(parsed.data.status, c.req.param('roomId'), c.get('clientId')).run();
    if (!result.meta.changes) return c.json({ error: 'conflict' }, 409);
    return c.json({ status: parsed.data.status });
});

router.post('/rooms', requireMarketplaceEnterprise, async (c) => {
    const limited = await throttle(c, 'decision-room-create');
    if (limited) return limited;
    const parsed = RoomSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'validation_error', issues: parsed.error.issues }, 400);
    const body = parsed.data;
    if (body.visibility === 'consented_public' && !body.public_consent_confirmed) {
        return c.json({ error: 'validation_error', message: 'Public decision rooms require explicit publication consent' }, 400);
    }
    const clientId = c.get('clientId') as string;
    if (body.originating_request_id) {
        const request = await c.env.DB.prepare('SELECT id FROM specialist_requests WHERE id = ? AND requester_client_id = ?')
            .bind(body.originating_request_id, clientId).first();
        if (!request) return c.json({ error: 'validation_error', message: 'The linked Enterprise request was not found' }, 400);
    }
    let groupId: string | null = null;
    if (body.knowledge_group_slug) {
        const group = await c.env.DB.prepare('SELECT id FROM knowledge_groups WHERE slug = ? AND is_active = 1')
            .bind(body.knowledge_group_slug).first<{ id: string }>();
        if (!group) return c.json({ error: 'validation_error', message: 'Knowledge group not found' }, 400);
        groupId = group.id;
    }
    const id = crypto.randomUUID();
    const slug = roomSlug(body.title, id);
    const moderationStatus = body.visibility === 'private' ? 'approved' : 'pending';
    await c.env.DB.batch([
        c.env.DB.prepare(`INSERT INTO decision_rooms (
            id, slug, owner_client_id, originating_request_id, knowledge_group_id,
            title, decision_question, decision_context, countries, sectors, intended_users,
            visibility, moderation_status, decision_deadline, no_sensitive_data_confirmed,
            public_consent_confirmed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`)
            .bind(id, slug, clientId, body.originating_request_id || null, groupId,
                body.title, body.decision_question, body.decision_context, jsonArray(body.countries),
                jsonArray(body.sectors), jsonArray(body.intended_users), body.visibility,
                moderationStatus, body.decision_deadline || null, body.public_consent_confirmed ? 1 : 0),
        c.env.DB.prepare(`INSERT INTO decision_room_participants
            (room_id, client_id, participant_role, status, invited_by, responded_at)
            VALUES (?, ?, 'owner', 'accepted', 'self', datetime('now'))`).bind(id, clientId),
    ]);
    return c.json({ id, slug, status: 'open', moderation_status: moderationStatus }, 201);
});

router.get('/rooms/private/:id', requireClientAuth, async (c) => {
    const clientId = c.get('clientId') as string;
    const room = await c.env.DB.prepare(`${roomSelect}
        LEFT JOIN decision_room_participants viewer ON viewer.room_id = r.id AND viewer.client_id = ?
        WHERE r.id = ? AND (r.owner_client_id = ? OR viewer.status = 'accepted')
    `).bind(clientId, c.req.param('id'), clientId).first<Record<string, unknown>>();
    if (!room) return c.json({ error: 'not_found' }, 404);
    const items = await c.env.DB.prepare(`SELECT * FROM decision_room_items
        WHERE room_id = ? AND moderation_status = 'approved' ORDER BY COALESCE(published_at, created_at)`)
        .bind(room.id).all<Record<string, unknown>>();
    return c.json({ room: { ...projectRoom(room), moderation_status: String(room.moderation_status), moderation_notes: String(room.moderation_notes || '') }, items: (items.results || []).map(projectRoomItem) });
});

router.get('/rooms/:slug', async (c) => {
    const room = await c.env.DB.prepare(`${roomSelect}
        WHERE r.slug = ? AND r.visibility = 'consented_public' AND r.moderation_status = 'approved'
    `).bind(c.req.param('slug')).first<Record<string, unknown>>();
    if (!room) return c.json({ error: 'not_found' }, 404);
    const items = await c.env.DB.prepare(`
        SELECT * FROM decision_room_items WHERE room_id = ? AND moderation_status = 'approved'
        ORDER BY CASE item_type
          WHEN 'official_evidence' THEN 1 WHEN 'boa_intelligence' THEN 2
          WHEN 'specialist_response' THEN 3 WHEN 'field_perspective' THEN 4
          WHEN 'evidence_challenge' THEN 5 WHEN 'contradiction' THEN 6
          WHEN 'unresolved_question' THEN 7 WHEN 'verification_priority' THEN 8
          WHEN 'decision_update' THEN 9 ELSE 10 END, COALESCE(published_at, created_at)
    `).bind(room.id).all<Record<string, unknown>>();
    return c.json({ room: projectRoom(room), items: (items.results || []).map(projectRoomItem) });
});

router.post('/rooms/:id/follow', requireClientAuth, async (c) => {
    const room = await c.env.DB.prepare(`SELECT id FROM decision_rooms
        WHERE id = ? AND visibility = 'consented_public' AND moderation_status = 'approved'`)
        .bind(c.req.param('id')).first();
    if (!room) return c.json({ error: 'not_found' }, 404);
    const clientId = c.get('clientId') as string;
    const existing = await c.env.DB.prepare('SELECT room_id FROM decision_room_follows WHERE room_id = ? AND client_id = ?')
        .bind(c.req.param('id'), clientId).first();
    if (existing) await c.env.DB.prepare('DELETE FROM decision_room_follows WHERE room_id = ? AND client_id = ?').bind(c.req.param('id'), clientId).run();
    else await c.env.DB.prepare('INSERT INTO decision_room_follows (room_id, client_id) VALUES (?, ?)').bind(c.req.param('id'), clientId).run();
    return c.json({ following: !existing });
});

router.post('/rooms/:id/items', requireClientAuth, async (c) => {
    const limited = await throttle(c, 'decision-room-item');
    if (limited) return limited;
    const parsed = RoomItemSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'validation_error', issues: parsed.error.issues }, 400);
    const clientId = c.get('clientId') as string;
    const room = await c.env.DB.prepare(`SELECT r.*, p.status AS participant_status, p.participant_role,
          c.name, c.organization, c.tier, sp.display_name AS specialist_name, sp.screening_status
        FROM decision_rooms r JOIN clients c ON c.id = ?
        LEFT JOIN decision_room_participants p ON p.room_id = r.id AND p.client_id = c.id
        LEFT JOIN specialist_profiles sp ON sp.client_id = c.id
        WHERE r.id = ?`).bind(clientId, c.req.param('id')).first<Record<string, unknown>>();
    if (!room) return c.json({ error: 'not_found' }, 404);
    const isOwner = room.owner_client_id === clientId;
    const isAcceptedSpecialist = room.participant_role === 'specialist' && room.participant_status === 'accepted' && room.screening_status === 'approved';
    const isPublic = room.visibility === 'consented_public' && room.moderation_status === 'approved';
    if (!isOwner && !isAcceptedSpecialist && !isPublic) return c.json({ error: 'forbidden' }, 403);
    let role: KnowledgeAuthorRole = 'reader';
    if (isAcceptedSpecialist) role = 'specialist';
    else if (isOwner && room.tier === 'enterprise') role = 'enterprise';
    if (!roomItemPermissions[role].includes(parsed.data.item_type)) return c.json({ error: 'forbidden' }, 403);
    if (['official_evidence', 'evidence_challenge', 'contradiction'].includes(parsed.data.item_type) && parsed.data.source_urls.length === 0) {
        return c.json({ error: 'validation_error', message: 'This item type requires at least one source URL' }, 400);
    }
    if (parsed.data.parent_id) {
        const parent = await c.env.DB.prepare('SELECT id FROM decision_room_items WHERE id = ? AND room_id = ? AND moderation_status = \'approved\'')
            .bind(parsed.data.parent_id, room.id).first();
        if (!parent) return c.json({ error: 'validation_error', message: 'Parent item is not published in this room' }, 400);
    }
    const authorName = publicAuthorName({ role, specialistName: room.specialist_name ? String(room.specialist_name) : null,
        organization: room.organization ? String(room.organization) : null, clientName: room.name ? String(room.name) : null,
        publicIdentityConfirmed: role === 'specialist' });
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`INSERT INTO decision_room_items (
        id, room_id, parent_id, submitted_by_client_id, author_display_name, author_role,
        item_type, title, body, source_urls, countries, sectors, confidence, conflict_disclosure
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, room.id, parsed.data.parent_id || null, clientId, authorName, role, parsed.data.item_type,
            parsed.data.title, parsed.data.body, jsonArray(parsed.data.source_urls), jsonArray(parsed.data.countries),
            jsonArray(parsed.data.sectors), parsed.data.confidence, parsed.data.conflict_disclosure).run();
    return c.json({ id, moderation_status: 'pending', message: 'Room item received for human review' }, 201);
});

router.get('/admin/transition-applications', requireAdmin, async (c) => {
    const status = c.req.query('status') || 'pending';
    if (!['pending', 'reviewing', 'approved', 'rejected', 'withdrawn'].includes(status)) return c.json({ error: 'validation_error' }, 400);
    const result = await c.env.DB.prepare(`SELECT a.*, p.id AS program_id, p.slug AS program_slug
        FROM community_transition_applications a LEFT JOIN community_transition_programs p ON p.application_id = a.id
        WHERE a.status = ? ORDER BY a.created_at LIMIT 200`).bind(status).all<Record<string, unknown>>();
    return c.json({ data: (result.results || []).map(row => ({ ...row,
        countries: parseArray(row.countries), sectors: parseArray(row.sectors), languages: parseArray(row.languages),
        authority_confirmed: Boolean(row.authority_confirmed), no_member_data_confirmed: Boolean(row.no_member_data_confirmed),
        consent_confirmed: Boolean(row.consent_confirmed), review_notes: String(row.review_notes || ''),
    })) });
});

router.patch('/admin/transition-applications/:id', requireAdmin, async (c) => {
    const parsed = TransitionReviewSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'validation_error', issues: parsed.error.issues }, 400);
    const body = parsed.data;
    const application = await c.env.DB.prepare('SELECT * FROM community_transition_applications WHERE id = ?')
        .bind(c.req.param('id')).first<Record<string, unknown>>();
    if (!application) return c.json({ error: 'not_found' }, 404);
    if (body.status !== 'approved') {
        await c.env.DB.prepare(`UPDATE community_transition_applications SET status = ?, review_notes = ?,
            reviewed_by = 'admin', reviewed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`)
            .bind(body.status, body.notes, c.req.param('id')).run();
        return c.json({ id: c.req.param('id'), status: body.status });
    }
    if (!body.knowledge_group_id || body.public_summary.length < 30 || body.steward_display_name.length < 2) {
        return c.json({ error: 'validation_error', message: 'Approval requires a circle, public summary and steward display name' }, 400);
    }
    const group = await c.env.DB.prepare('SELECT id FROM knowledge_groups WHERE id = ? AND is_active = 1')
        .bind(body.knowledge_group_id).first();
    if (!group) return c.json({ error: 'validation_error', message: 'The selected BOA circle is not active' }, 400);
    const existing = await c.env.DB.prepare('SELECT id, slug FROM community_transition_programs WHERE application_id = ?')
        .bind(c.req.param('id')).first<{ id: string; slug: string }>();
    if (existing) return c.json({ id: existing.id, slug: existing.slug, status: 'approved' });
    const programId = crypto.randomUUID();
    const slug = transitionSlug(String(application.community_name), programId);
    const invitationId = crypto.randomUUID();
    const token = crypto.randomUUID().replace(/-/g, '');
    await c.env.DB.batch([
        c.env.DB.prepare(`UPDATE community_transition_applications SET status = 'approved', review_notes = ?,
            reviewed_by = 'admin', reviewed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`)
            .bind(body.notes, c.req.param('id')),
        c.env.DB.prepare(`INSERT INTO community_transition_programs (
            id, slug, application_id, knowledge_group_id, community_name, source_platform, external_url,
            public_summary, steward_display_name, member_range, countries, sectors, languages,
            status, transition_started_at, target_review_at, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', datetime('now'), ?, datetime('now'))`)
            .bind(programId, slug, c.req.param('id'), body.knowledge_group_id, application.community_name,
                application.source_platform, application.community_url, body.public_summary, body.steward_display_name,
                application.member_range, application.countries, application.sectors, application.languages,
                body.target_review_at || null),
        c.env.DB.prepare(`INSERT INTO community_transition_invitations
            (id, program_id, token, label, channel) VALUES (?, ?, ?, 'Founding community invitation', 'community_post')`)
            .bind(invitationId, programId, token),
    ]);
    return c.json({ id: programId, slug, invitation_token: token, status: 'approved' }, 201);
});

router.get('/admin/transitions', requireAdmin, async (c) => {
    const result = await c.env.DB.prepare(`${transitionSelect} ORDER BY p.created_at DESC LIMIT 200`).all<Record<string, unknown>>();
    const invitations = await c.env.DB.prepare(`SELECT id, program_id, token, label, channel, is_active,
        expires_at, click_count, last_clicked_at, created_at FROM community_transition_invitations ORDER BY created_at DESC`)
        .all<Record<string, unknown>>();
    return c.json({ data: (result.results || []).map(projectTransition), invitations: invitations.results || [] });
});

router.post('/admin/transitions/:id/invitations', requireAdmin, async (c) => {
    const parsed = TransitionInvitationSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'validation_error', issues: parsed.error.issues }, 400);
    const program = await c.env.DB.prepare("SELECT id FROM community_transition_programs WHERE id = ? AND status = 'open'")
        .bind(c.req.param('id')).first();
    if (!program) return c.json({ error: 'not_found' }, 404);
    const id = crypto.randomUUID();
    const token = crypto.randomUUID().replace(/-/g, '');
    await c.env.DB.prepare(`INSERT INTO community_transition_invitations
        (id, program_id, token, label, channel, expires_at) VALUES (?, ?, ?, ?, ?, ?)`)
        .bind(id, c.req.param('id'), token, parsed.data.label, parsed.data.channel, parsed.data.expires_at || null).run();
    return c.json({ id, token, status: 'active' }, 201);
});

router.get('/admin/rooms', requireAdmin, async (c) => {
    const moderation = c.req.query('moderation') || 'pending';
    if (!['pending', 'approved', 'rejected'].includes(moderation)) return c.json({ error: 'validation_error' }, 400);
    const result = await c.env.DB.prepare(`${roomSelect}
        WHERE r.moderation_status = ? ORDER BY r.created_at LIMIT 200
    `).bind(moderation).all<Record<string, unknown>>();
    return c.json({ data: (result.results || []).map(row => ({
        ...projectRoom(row), moderation_status: String(row.moderation_status),
        moderation_notes: String(row.moderation_notes || ''), owner_client_id: String(row.owner_client_id),
    })) });
});

router.patch('/admin/rooms/:id', requireAdmin, async (c) => {
    const parsed = RoomReviewSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'validation_error', issues: parsed.error.issues }, 400);
    const body = parsed.data;
    const result = await c.env.DB.prepare(`UPDATE decision_rooms SET
        moderation_status = ?, status = ?, editorial_summary = ?, verification_priorities = ?,
        next_review_at = ?, moderation_notes = ?, moderated_by = 'admin', moderated_at = datetime('now'),
        published_at = CASE WHEN ? = 'approved' THEN COALESCE(published_at, datetime('now')) ELSE published_at END,
        resolved_at = CASE WHEN ? = 'resolved' THEN COALESCE(resolved_at, datetime('now')) ELSE resolved_at END,
        updated_at = datetime('now') WHERE id = ?`)
        .bind(body.moderation_status, body.status, body.editorial_summary, jsonArray(body.verification_priorities),
            body.next_review_at || null, body.notes, body.moderation_status, body.status, c.req.param('id')).run();
    if (!result.meta.changes) return c.json({ error: 'not_found' }, 404);
    return c.json({ id: c.req.param('id'), moderation_status: body.moderation_status, status: body.status });
});

router.get('/admin/room-items', requireAdmin, async (c) => {
    const status = c.req.query('status') || 'pending';
    if (!['pending', 'approved', 'rejected', 'withdrawn'].includes(status)) return c.json({ error: 'validation_error' }, 400);
    const result = await c.env.DB.prepare(`SELECT i.*, r.slug AS room_slug, r.title AS room_title
        FROM decision_room_items i JOIN decision_rooms r ON r.id = i.room_id
        WHERE i.moderation_status = ? ORDER BY i.created_at LIMIT 200`)
        .bind(status).all<Record<string, unknown>>();
    return c.json({ data: (result.results || []).map(row => ({ ...projectRoomItem(row),
        room_slug: String(row.room_slug), room_title: String(row.room_title), moderation_status: String(row.moderation_status),
    })) });
});

router.patch('/admin/room-items/:id', requireAdmin, async (c) => {
    const parsed = RoomItemReviewSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'validation_error', issues: parsed.error.issues }, 400);
    const result = await c.env.DB.prepare(`UPDATE decision_room_items SET moderation_status = ?, moderation_notes = ?,
        moderated_by = 'admin', moderated_at = datetime('now'),
        published_at = CASE WHEN ? = 'approved' THEN COALESCE(published_at, datetime('now')) ELSE published_at END,
        updated_at = datetime('now') WHERE id = ? AND moderation_status = 'pending'`)
        .bind(parsed.data.status, parsed.data.notes, parsed.data.status, c.req.param('id')).run();
    if (!result.meta.changes) return c.json({ error: 'conflict' }, 409);
    return c.json({ id: c.req.param('id'), status: parsed.data.status });
});

router.post('/admin/rooms/:id/invitations', requireAdmin, async (c) => {
    const parsed = RoomInviteSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'validation_error' }, 400);
    const specialist = await c.env.DB.prepare(`SELECT id, client_id FROM specialist_profiles
        WHERE id = ? AND screening_status = 'approved'`).bind(parsed.data.specialist_profile_id)
        .first<{ id: string; client_id: string }>();
    const room = await c.env.DB.prepare('SELECT id FROM decision_rooms WHERE id = ?').bind(c.req.param('id')).first();
    if (!specialist || !room) return c.json({ error: 'not_found' }, 404);
    await c.env.DB.prepare(`INSERT INTO decision_room_participants
        (room_id, client_id, specialist_profile_id, participant_role, status)
        VALUES (?, ?, ?, 'specialist', 'invited')
        ON CONFLICT(room_id, client_id) DO UPDATE SET specialist_profile_id = excluded.specialist_profile_id,
          participant_role = 'specialist', status = 'invited', responded_at = NULL, updated_at = datetime('now')`)
        .bind(c.req.param('id'), specialist.client_id, specialist.id).run();
    return c.json({ status: 'invited' }, 201);
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
