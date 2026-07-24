/**
 * Shared constants for the beta section of the platform.
 * Single source of truth, import from here rather than duplicating inline.
 */

import type { ArticleListItem } from '../types';

// ─── External links ───────────────────────────────────────────────────────────

export const KO_FI_URL = 'https://ko-fi.com/maillescortes';

// ─── Country flag emoji map (all 54 African nations) ─────────────────────────

export const FLAG_MAP: Record<string, string> = {
  // North Africa
  DZ: '🇩🇿', EG: '🇪🇬', LY: '🇱🇾', MA: '🇲🇦', MR: '🇲🇷', SD: '🇸🇩', TN: '🇹🇳',
  // West Africa
  BJ: '🇧🇯', BF: '🇧🇫', CV: '🇨🇻', CI: '🇨🇮', GM: '🇬🇲', GH: '🇬🇭',
  GN: '🇬🇳', GW: '🇬🇼', LR: '🇱🇷', ML: '🇲🇱', NE: '🇳🇪', NG: '🇳🇬',
  SN: '🇸🇳', SL: '🇸🇱', TG: '🇹🇬',
  // East Africa
  BI: '🇧🇮', KM: '🇰🇲', DJ: '🇩🇯', ER: '🇪🇷', ET: '🇪🇹', KE: '🇰🇪',
  MG: '🇲🇬', MU: '🇲🇺', MW: '🇲🇼', MZ: '🇲🇿', RW: '🇷🇼', SC: '🇸🇨',
  SO: '🇸🇴', SS: '🇸🇸', TZ: '🇹🇿', UG: '🇺🇬',
  // Central Africa
  AO: '🇦🇴', CM: '🇨🇲', CF: '🇨🇫', TD: '🇹🇩', CD: '🇨🇩', CG: '🇨🇬',
  GQ: '🇬🇶', GA: '🇬🇦', ST: '🇸🇹',
  // Southern Africa
  BW: '🇧🇼', SZ: '🇸🇿', LS: '🇱🇸', NA: '🇳🇦', ZA: '🇿🇦', ZM: '🇿🇲', ZW: '🇿🇼',
};

// ─── Membership tiers (canonical source, used in BetaLanding + BetaMembership) ──

export interface MembershipTier {
  id: string;
  name: string;
  price: string;
  features: string[];
  ctaLabel: string;
  recommended?: boolean;
}

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: 'supporter',
    name: 'Supporter',
    price: '$5',
    features: [
      'Access to all published stories',
      'Behind-the-scenes creator updates',
      'Early supporter badge on your profile',
    ],
    ctaLabel: 'Become a Supporter',
  },
  {
    id: 'founding',
    name: 'Founding Member',
    price: '$15',
    features: [
      'Everything in Supporter',
      'Vote on the next story topic via monthly poll',
      'Early access to new drafts',
    ],
    ctaLabel: 'Become a Founding Member',
    recommended: true,
  },
  {
    id: 'partner',
    name: 'Founding Patron',
    price: '$50',
    features: [
      'Everything in Founding Member',
      'Monthly 1-on-1 chat about the project',
      'Credited as a core sponsor in every published report',
    ],
    ctaLabel: 'Become a Patron',
  },
];

export const TIER_LABELS: Record<string, { title: string; desc: string; perks: string[] }> = {
  basic: {
    title: 'Supporter',
    desc: 'Access to stories and creator updates.',
    perks: [
      'Access to all published stories',
      'Behind-the-scenes creator updates',
      'Early supporter badge on your profile',
    ],
  },
  premium: {
    title: 'Founding Member',
    desc: 'Direct input on future story coverage.',
    perks: [
      'Everything in Supporter',
      'Vote on the next story topic via monthly poll',
      'Early access to new drafts',
    ],
  },
  enterprise: {
    title: 'Founding Patron',
    desc: 'Name credited on the platform as a core sponsor.',
    perks: [
      'Everything in Founding Member',
      'Monthly 1-on-1 chat about the project',
      'Credited as a core sponsor in every published report',
    ],
  },
  supporter: {
    title: 'Supporter',
    desc: 'Access to stories and creator updates.',
    perks: [
      'Access to all published stories',
      'Behind-the-scenes creator updates',
      'Early supporter badge on your profile',
    ],
  },
  founding: {
    title: 'Founding Member',
    desc: 'Direct input on future story coverage.',
    perks: [
      'Everything in Supporter',
      'Vote on the next story topic via monthly poll',
      'Early access to new drafts',
    ],
  },
  partner: {
    title: 'Founding Patron',
    desc: 'Name credited on the platform as a core sponsor.',
    perks: [
      'Everything in Founding Member',
      'Monthly 1-on-1 chat about the project',
      'Credited as a core sponsor in every published report',
    ],
  },
};

// ─── Empty fallback (used when API is unavailable) ───────────────────────────

export const FALLBACK_ARTICLES: ArticleListItem[] = [];
