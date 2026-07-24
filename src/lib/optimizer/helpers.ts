// ═══════════════════════════════════════════════════════════════════════════════
// OPTIMIZER WORKER
// Self-optimization engine for content, headlines, format, and language
// Autonomous backend that continuously refines the editorial product
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env, OptimizationMessage } from '../../types';
import { generateHeadlineVariants, fillNarrativeGap } from '../../lib/ai';
import { findNarrativeGaps, indexArticle } from '../../lib/vectorize';
import { updateArticleEngagement } from '../../lib/analytics';


// ───────────────────────────────────────────────────────────────────────────────
// Helper
// ───────────────────────────────────────────────────────────────────────────────
export function generateSlug(title: string): string {
    const base = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);

    const suffix = Date.now().toString(36).slice(-4);
    return `${base}-${suffix}`;
}
