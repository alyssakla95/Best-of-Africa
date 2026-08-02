/**
 * Shared constants for the beta section of the platform.
 * Single source of truth, import from here rather than duplicating inline.
 */

import type { ArticleListItem } from '../types';

// ─── External links ───────────────────────────────────────────────────────────

export const KO_FI_URL = 'https://ko-fi.com/maillescortes';
export const KO_FI_MEMBERSHIP_URL = `${KO_FI_URL}/tiers`;

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
  summary: string;
  features: string[];
  ctaLabel: string;
  recommended?: boolean;
}

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: 'supporter',
    name: 'Reader Member',
    price: 'US$4',
    summary: 'The complete reader product at an accessible launch price.',
    features: [
      'Every published story and evidence brief in full',
      'Country, sector and continental intelligence pages',
      'Article audio, available translations and personal library',
    ],
    ctaLabel: 'Choose Reader Member',
  },
  {
    id: 'founding',
    name: 'Sustaining Member',
    price: 'US$9',
    summary: 'The same complete access, with more support for evidence production.',
    features: [
      'Everything in Reader Member',
      'Supports deeper country and sector evidence updates',
      'Early-member recognition while the product is being proven',
    ],
    ctaLabel: 'Choose Sustaining Member',
    recommended: true,
  },
  {
    id: 'partner',
    name: 'Founding Backer',
    price: 'US$19',
    summary: 'For readers who want to underwrite affordable access for others.',
    features: [
      'Everything in Sustaining Member',
      'Optional founding-backer recognition on your profile',
      'Helps fund broader country coverage and source acquisition',
    ],
    ctaLabel: 'Become a Founding Backer',
  },
];

export const TIER_LABELS: Record<string, { title: string; desc: string; perks: string[] }> = {
  basic: {
    title: 'Reader Member',
    desc: 'Complete reader access at the introductory price.',
    perks: [
      'Every published story and evidence brief in full',
      'Country, sector and continental intelligence pages',
      'Article audio, available translations and personal library',
    ],
  },
  premium: {
    title: 'Sustaining Member',
    desc: 'Complete access with more support for evidence production.',
    perks: [
      'Everything in Reader Member',
      'Supports deeper country and sector evidence updates',
      'Early-member recognition while the product is being proven',
    ],
  },
  enterprise: {
    title: 'Founding Backer',
    desc: 'Complete access while underwriting affordable reader membership.',
    perks: [
      'Everything in Sustaining Member',
      'Optional founding-backer recognition on your profile',
      'Helps fund broader country coverage and source acquisition',
    ],
  },
  supporter: {
    title: 'Reader Member',
    desc: 'Complete reader access at the introductory price.',
    perks: [
      'Every published story and evidence brief in full',
      'Country, sector and continental intelligence pages',
      'Article audio, available translations and personal library',
    ],
  },
  founding: {
    title: 'Sustaining Member',
    desc: 'Complete access with more support for evidence production.',
    perks: [
      'Everything in Reader Member',
      'Supports deeper country and sector evidence updates',
      'Early-member recognition while the product is being proven',
    ],
  },
  partner: {
    title: 'Founding Backer',
    desc: 'Complete access while underwriting affordable reader membership.',
    perks: [
      'Everything in Sustaining Member',
      'Optional founding-backer recognition on your profile',
      'Helps fund broader country coverage and source acquisition',
    ],
  },
};

// ─── Empty fallback (used when API is unavailable) ───────────────────────────

export const FALLBACK_ARTICLES: ArticleListItem[] = [];
