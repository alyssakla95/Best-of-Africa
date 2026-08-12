export type JourneyId = 'read' | 'markets' | 'network' | 'enterprise';

export interface JourneyLink {
  href: string;
  label: string;
  description: string;
}

export interface Journey {
  id: JourneyId;
  label: string;
  mobileLabel: string;
  href: string;
  description: string;
  links: JourneyLink[];
}

export const JOURNEYS: Journey[] = [
  {
    id: 'read',
    label: 'Read',
    mobileLabel: 'Read',
    href: '/feed',
    description: 'Follow current reporting and explainers from across Africa.',
    links: [
      { href: '/feed', label: 'Daily briefing', description: 'The essential developments in one concise view.' },
      { href: '/posts', label: 'Stories', description: 'Reporting, analysis and source-linked context.' },
      { href: '/events', label: 'Events', description: 'Relevant summits, forums and public convenings.' },
      { href: '/newsletter', label: 'Newsletter', description: 'Receive the editorial briefing by email.' },
    ],
  },
  {
    id: 'markets',
    label: 'Markets',
    mobileLabel: 'Markets',
    href: '/intelligence',
    description: 'Compare countries, sectors and continental market evidence.',
    links: [
      { href: '/intelligence', label: 'Market intelligence', description: 'Performance signals, evidence and sector detail.' },
      { href: '/dashboards/overview', label: 'Continental overview', description: 'Comparable indicators across Africa.' },
      { href: '/countries', label: 'Country profiles', description: 'National evidence, reporting and market context.' },
      { href: '/intelligence/reports', label: 'Research reports', description: 'Longer-form decision and evidence briefs.' },
    ],
  },
  {
    id: 'network',
    label: 'Network',
    mobileLabel: 'Network',
    href: '/specialists',
    description: 'Find credible specialists and join evidence-led professional exchange.',
    links: [
      { href: '/specialists', label: 'Specialist network', description: 'Find screened expertise by market and sector.' },
      { href: '/specialists/circles', label: 'Knowledge circles', description: 'Contribute to structured professional groups.' },
      { href: '/decision-rooms', label: 'Decision rooms', description: 'Follow evidence, questions and documented outcomes.' },
      { href: '/community-transition', label: 'Circle Launchpad', description: 'Bring an established community into BOA responsibly.' },
    ],
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    mobileLabel: 'Enterprise',
    href: '/enterprise',
    description: 'Turn a defined market question into a governed decision process.',
    links: [
      { href: '/enterprise', label: 'Enterprise overview', description: 'Understand the service, scope and operating model.' },
      { href: '/enterprise/apply', label: 'Start a pilot', description: 'Define a practical, lower-risk first engagement.' },
      { href: '/specialists/requests/new', label: 'Request expertise', description: 'Submit a structured specialist requirement.' },
      { href: '/enterprise/access', label: 'Client workspace', description: 'Enter the private Enterprise environment.' },
    ],
  },
];

export function journeysForAudience(tier?: string): Journey[] {
  if (tier === 'enterprise') {
    return JOURNEYS.map(journey => journey.id !== 'enterprise' ? journey : {
      ...journey,
      href: '/specialists/requests',
      description: 'Your market questions, specialist work and decision records in one workspace.',
      links: [
        { href: '/specialists/requests', label: 'Enterprise workspace', description: 'Review active requests, proposals and engagements.' },
        { href: '/specialists/requests/new', label: 'Request expertise', description: 'Submit a structured specialist requirement.' },
        { href: '/enterprise/decision-rooms', label: 'Decision rooms', description: 'Manage private and consented-public evidence work.' },
        { href: '/enterprise/access', label: 'Access and account', description: 'Review your provisioned Enterprise access.' },
      ],
    });
  }

  if (tier === 'specialist') {
    return JOURNEYS.map(journey => journey.id !== 'network' ? journey : {
      ...journey,
      href: '/specialists/dashboard',
      description: 'Your professional profile, invitations and evidence-led contribution spaces.',
      links: [
        { href: '/specialists/dashboard', label: 'Specialist workspace', description: 'Manage your profile, standing and opportunities.' },
        { href: '/specialists/circles', label: 'Knowledge circles', description: 'Contribute to structured professional groups.' },
        { href: '/decision-rooms', label: 'Decision rooms', description: 'Respond where your documented experience is relevant.' },
        { href: '/specialists', label: 'Specialist directory', description: 'Review the public network and published profiles.' },
      ],
    });
  }

  if (tier) {
    return JOURNEYS.map(journey => journey.id !== 'read' ? journey : {
      ...journey,
      description: 'Your briefing, saved research and current reporting in one place.',
      links: [
        { href: '/feed', label: 'Your briefing', description: 'The essential developments in one concise view.' },
        { href: '/library', label: 'Saved research', description: 'Return to reports and evidence you have kept.' },
        { href: '/posts', label: 'Stories', description: 'Reporting, analysis and source-linked context.' },
        { href: '/member-access', label: 'Member account', description: 'Review membership access and account status.' },
      ],
    });
  }

  return JOURNEYS;
}

const journeyPrefixes: Array<[JourneyId, string[]]> = [
  ['enterprise', ['/enterprise', '/specialists/requests']],
  ['network', ['/specialists', '/decision-rooms', '/community-transition']],
  ['markets', ['/intelligence', '/dashboards', '/countries', '/sectors', '/library', '/supporter-feed']],
  ['read', ['/feed', '/posts', '/events', '/newsletter', '/gallery', '/travel', '/world-cup']],
];

export function journeyForPath(pathname: string): Journey {
  const match = journeyPrefixes.find(([, prefixes]) => prefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)));
  return JOURNEYS.find(journey => journey.id === match?.[0]) || JOURNEYS[0];
}

export function hasJourneyForPath(pathname: string): boolean {
  return journeyPrefixes.some(([, prefixes]) => prefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)));
}

export function isNavigationPathActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
