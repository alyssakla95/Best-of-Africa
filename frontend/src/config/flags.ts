// frontend/src/config/flags.ts

export const APP_MODE = 'beta';

export const isBeta = true;
export const isHybrid = false;
export const isFull = false;

export const APP_FLAGS = {
  mode: APP_MODE,
  isBeta,
  isHybrid,
  isFull,
};

// Temporary stakeholder review mode. This exposes every read-only member view
// without weakening account administration or paid, cost-incurring actions.
// Set to false to restore normal subscription gating.
export const MEMBER_PREVIEW_MODE = true;

export const FEATURES = {
  // Beta features (The authentic platform)
  BETA_LANDING: true,
  BETA_MEMBERSHIP: true,
  BETA_ARTICLES: true,
  
  // Always true
  ADMIN: true,
  
  // Corporate platform features - Disabled permanently to align with brief
  COUNTRY_HUBS: false,
  INTELLIGENCE: false,
  MARKET_INTEL: false,
  EVENTS: false,
  TRAVEL: false,
  LIBRARY: false,
  REPORTS: false,
};
