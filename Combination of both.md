Looking at both full reports in the attached files, I'll now produce the definitive combined design specification — taking the best of both versions with V2's colour system as the base.

***

# BOA-Story — Combined Best Platform Design Specification
**Based on:** V1 (`best-of-africa.pages.dev`) + V2 (`best-of-africa-platform.pages.dev`)
**Colour Base:** V2 (navy + white + gold)
**Date:** June 17, 2026

***

## 1. Unified Colour System

The combined platform uses V2's light-mode-first navy system as the foundation, with V1's dark cinematic sections reserved for hero bands, footer, login, and admin — giving the platform editorial credibility in content areas while retaining luxury depth in key moments.

### Master Palette

| Token Name | Hex | Usage |
|---|---|---|
| `--color-navy-deep` | `#0F1F3D` | Hero bands, footer, login card, admin card, article paywall overlays |
| `--color-navy-mid` | `#112240` | Secondary dark sections ("We're building Africa's story") |
| `--color-navy-card` | `#1A2F50` | Dark form cards (contact, settings, admin) |
| `--color-page-bg` | `#F5F7FA` | All main content section backgrounds between bands |
| `--color-white` | `#FFFFFF` | Cards, input fields, navbar |
| `--color-gold-primary` | `#C9A84C` | All primary CTAs, price numerals, section labels, icons, accents |
| `--color-gold-italic` | `#B8942A` | Gold italic type (restored "Properly." treatment) |
| `--color-text-primary` | `#0F1F3D` | All body and heading text in light sections |
| `--color-text-secondary` | `#6B7FA3` | Subtitles, meta labels, breadcrumb ancestors |
| `--color-text-white` | `#FFFFFF` | All text inside dark navy bands and dark cards |
| `--color-text-muted` | `#9CA3AF` | Placeholder text, disabled labels |
| `--color-border` | `#D1D5DB` | Input field borders in light sections — strong enough to be visible on white |
| `--color-border-gold` | `#C9A84C` | Input borders in dark navy hero/band contexts |
| `--color-card-shadow` | `rgba(0,0,0,0.08)` | Box shadow on white cards sitting on light grey bg |
| `--color-surface-light` | `#EFF2F6` | Alternate light section bg (FAQ band, funding band) |

### What This Fixes From Both Versions

| V1 Problem | V2 Problem | Combined Solution |
|---|---|---|
| White cards on black — jarring | White cards on white — invisible | White cards with `box-shadow` on `#F5F7FA` bg — depth without clash |
| Dark-on-dark inputs (contact, admin) | Same dark button issue | All dark cards use white inputs; all primary buttons use gold fill |
| Logo invisible (gold dot only) | — | V2 "B BOA." logo retained, gold dot removed entirely |
| White search inputs on dark pages | Low-contrast border on white-page inputs | Dark context = gold border; light context = `#D1D5DB` border |
| "Properly." gold italic removed in V2 | — | Restored from V1 on About and anywhere the two-tone headline is used |
| No free content shown | Sneak Peek added but still no full read | One free full article surfaced publicly |

***

## 2. Component Design Decisions

### 2.1 Navbar

**Take from V2 entirely.**

- White `#FFFFFF` background
- "B BOA." logo lockup — black circle with white "B", "BOA." in `#0F1F3D` — retained exactly as V2
- Nav items: `#0F1F3D` text, no underlines, hover state `#C9A84C`
- **"Sign In" button**: gold fill `#C9A84C`, navy `#0F1F3D` text — V2 treatment (V1's all-caps plain text had no affordance)
- **Settings and Admin icons**: hidden from navbar for unauthenticated users entirely — neither V1 nor V2 handled this correctly; fix applied in combined version
- **"GENERAL" toggle**: removed from public-facing navbar; if it is a feed-mode control, it belongs only in an authenticated user's settings panel with a proper tooltip
- **Notification bell**: visible only when signed in
- **Language selector (EN)**: retained — small, appropriate

***

### 2.2 Hero Section

**Take V2's navy band, restore V1's animated word + two-tone headline.**

- Full-viewport navy band `#0F1F3D` — V2's approach
- "EARLY ACCESS" label: gold dash `#C9A84C` + gold uppercase spaced text — identical in both, keep
- Main headline: **"Africa without the filter."** — white serif, large, full-width — V2 layout (centred, commanding)
- Animated rotating word below the headline: **"Cities. / Creators. / Culture. / Stories."** in `#C9A84C` gold italic — V1's best micro-interaction, keep. **Slow rotation to 2.5s per word**
- Sub-copy: "A digital home for real, thoughtful stories about African lives, cities, and ideas — beyond charity ads and disaster headlines." — white, medium weight, max-width `600px` centred
- CTA: **"BECOME A FOUNDING MEMBER"** — gold fill `#C9A84C`, navy text, large pill — high contrast, correct in both versions

***

### 2.3 Funding Progress Card

**Take V2's isolated banded section approach.**

- Light grey band `#EFF2F6` separating hero from content
- White card `#FFFFFF` with `box-shadow: 0 2px 8px rgba(0,0,0,0.08)` — elevated, not floating
- "LAUNCH FUNDING PROGRESS" label: `#C9A84C` gold uppercase spaced
- "38% of $800 goal funded" text: `#C9A84C` gold bold — same as V2
- Progress bar: gold fill `#C9A84C` on `#E5E7EB` grey track
- Sub-copy: navy `#0F1F3D` on white — legible

***

### 2.4 Article / Story Cards

**Take V2's layered card approach, fix images.**

- Card bg: `#FFFFFF` white with `box-shadow: 0 1px 6px rgba(0,0,0,0.08)` on `#F5F7FA` page bg
- Country + region label: gold `#C9A84C` uppercase spaced (e.g. "EGYPT · FINANCE & INVESTMENT")
- Headline: `#0F1F3D` navy serif bold
- Paywall overlay inside card: navy `#0F1F3D` dark overlay with white text + gold "UNLOCK ACCESS" pill — V2's layered card approach
- **Image error fallback**: `#1A2F50` dark navy card with centred "B BOA." logo mark in `#C9A84C` — not a grey box, not a broken image icon. Branded placeholder
- **One article must be fully readable without a paywall** — the first card in the Stories feed should be unlocked

***

### 2.5 "Sneak Peek / This Is What We're Building" Section

**Take V2 entirely — this section did not exist in V1 and is critical.**

- White section bg `#FFFFFF`
- "SNEAK PEEK" section label: gold dash + gold uppercase — consistent motif
- Left preview card: story list with flag emoji + headline + gold category label (TECHNOLOGY / CITIES / CULTURE) — V2's list card
- Right editorial card: "Kenya · Technology / The quiet infrastructure bet paying off in Nairobi / 5 min read / Read story →" — the "Read story →" link should point to the one free full article
- "The Story Feed" and "Guardian-style Editorial" labels below each card: navy bold serif
- This section signals editorial quality to undecided visitors before any paywall ask

***

### 2.6 Pricing / Membership Cards

**Take V2's layout with V1's CTA button styling.**

- Page bg `#F5F7FA` light grey band
- Supporter card: white bg, `box-shadow`, navy text, gold price numeral, gold check marks — V2 style
- Founding Member card (recommended): navy `#0F1F3D` bg, gold top border, white text, gold price numeral, gold check marks, **gold fill "BECOME A FOUNDING MEMBER" CTA** — V2 layout + V1's prominent button
- Founding Patron card: white bg, navy text — V2 style
- "RECOMMENDED" badge above Founding Member: gold fill pill `#C9A84C`, navy text — both versions had this, keep
- Supporter and Patron CTAs: navy `#0F1F3D` outlined pill with gold hover state — lower weight is appropriate for secondary tiers
- **Feature copy improvement needed for all tiers** — "My sincere gratitude" should be replaced with something concrete

***

### 2.7 "We're Building Africa's Story. Properly." Section

**Take V2's full-viewport navy band. Restore V1's gold italic "Properly."**

- Full-width navy `#0F1F3D` band
- "We're building Africa's story." — white serif bold, large, centred
- "Properly." — **`#C9A84C` gold italic** — this is V1's single best typographic decision, removed from V2, must be restored
- Sub-copy: white italic — "The continent deserves better than headlines about crisis and chaos..." — V2's larger centred format
- Globe emoji 🌍 above headline — retained, adds warmth without breaking the tone

***

### 2.8 "Where Your Money Goes" Section

**Take V2's layout. Replace emoji with SVG icons.**

- White section bg
- "WHERE YOUR MONEY GOES" label: `#C9A84C` gold uppercase spaced
- 4 items: Domain & Hosting / Platform Tools / Research Time / Founder Fuel
- **Replace 🌐🛠️✍️☕ with a unified SVG icon set** — gold `#C9A84C` fill icons on small navy `#0F1F3D` circle backgrounds — consistent with the lock icon and globe icon treatments used on login and dashboard pages
- Label text: `#0F1F3D` navy bold
- Sub-label: `#6B7FA3` grey-blue

***

### 2.9 Footer

**Take V2's navy footer layout exactly.**

- Full-width navy `#0F1F3D` bg
- "BEST OF AFRICA." wordmark: white bold serif, gold dot after "AFRICA"
- "BOA-STORY · INTELLIGENCE PLATFORM" subtitle: gold `#C9A84C` uppercase spaced
- Mission quote: white italic — V2's version
- "Support BOA, Launch Your Story" CTA: gold fill pill — V2's footer CTA is better than V1's plain "SUPPORT ON KO-FI"
- 4-column footer nav: BOA-STORY / INTELLIGENCE / DIPLOMACY / CLIENT ACCESS
- Column headers: `#C9A84C` gold uppercase
- Footer links: white, hover `#C9A84C` gold
- Copyright bar: light white line separator, then "© 2026 Best of Africa. All rights reserved." in `#6B7FA3` grey-blue
- PRIVACY POLICY / TERMS OF SERVICE / EDITORIAL GUIDELINES: white small caps, hover gold

***

## 3. Page-by-Page Combined Spec

***

### 3.1 `/search`

- Navy hero band: "INTELLIGENCE SEARCH" label + "What are you" white / "researching?" **gold italic** — restore V1's two-tone headline treatment here
- Search input: on the navy band, use dark `#1A2F50` bg with `1px solid #C9A84C` gold border + white placeholder — V2's correct treatment for this context
- Below hero: white/light-grey section with:
  - V2's grey search icon placeholder centred
  - V2's hint text "Start typing to search across all Africa intelligence"
  - V2's example searches in `#6B7FA3` — "Nigeria fintech" / "Kenya infrastructure" / "Rwanda agriculture"
  - **Add**: 3–4 clickable category filter pills (All / Countries / Sectors / Reports) in gold fill active / navy outline inactive — neither version had this

***

### 3.2 `/login`

- Page bg: white navbar + then full dark navy `#0F1F3D` card — V2's treatment
- Amber/gold radial glow behind lock icon — V2's moody detail, keep
- "CLIENT PORTAL" → rename to **"MEMBER PORTAL"** — "Client" implies B2B enterprise and is jarring for a reader platform
- "CLIENT ID / EMAIL" label → rename to **"EMAIL ADDRESS"** — simpler, correct
- Input: dark navy bg, white border outline — V2's improved visibility
- "SEND MAGIC LINK" button: gold fill — both versions correct
- "APPLY FOR MEMBERSHIP" link below: gold text — **V2 only, keep** — critical escape path for new users
- Add 1–2 line explanation: "We'll email you a one-click login link. No password needed." — neither version had this; zero friction explanation

***

### 3.3 `/membership`

- V2's full layout: white page bg, monthly/annual toggle, 3 pricing cards
- Founding Member card: navy bg, gold border — V2
- One-time contribution card: white on `#F5F7FA` — natural in light-mode system, no jarring break
- FAQ accordion: same, no break
- **Improve feature copy**:
  - Supporter: replace "My sincere gratitude" → "Early supporter badge on your profile"
  - Founding Member: add explicit "Vote on the next story topic via monthly poll"
  - Founding Patron: "Credited as a core sponsor in every published report"

***

### 3.4 `/posts`

- White page bg
- "Stories from the Continent" — navy serif bold — V2's copy (more precise than V1's "Ground")
- "Listen to Daily Pulse" button: gold pill + navy play icon — both versions had this, keep
- **Search input: `#D1D5DB` border, `#F9FAFB` tint on input bg** — visible on white page without being overpowering. Not white-on-white (V2 fail). Not white-on-black (V1 inconsistency)
- Filter pills: gold fill active / navy outline inactive — V2 style with full label names (Finance & Investment, etc.)
- Article cards: white with box-shadow on `#F5F7FA` bg — combined card spec above
- **First article card: unlocked**, displayed with a "FREE READ" gold badge top-right of the card
- Country labels: full country name + ISO code — "Egypt · EG" — not just code alone (V1 issue)

***

### 3.5 `/countries`

- "54 AFRICAN NATIONS" badge: gold pill — V2 style
- "One Continent. Every Story." — navy serif, large
- **Search input**: `#D1D5DB` border treatment — consistent with /posts fix
- Region filter pills: gold fill active with count ("All 54"), navy outline inactive with count ("West 16") — V2's count display, keep
- Country cards: white `#FFFFFF` with `box-shadow: 0 1px 6px rgba(0,0,0,0.06)` on `#F5F7FA` bg — same combined card spec. The shadow gives depth that makes white-on-light-grey readable and intentional
- **Add country flag emoji** before ISO code on every card: 🇩🇿 DZ / Algeria
- Add `cursor: pointer` + `box-shadow` lift on hover: `0 4px 16px rgba(0,0,0,0.12

Continuing from exactly where it cut off — `/countries` card hover state:

***

- Add `cursor: pointer` + `box-shadow` lift on hover: `0 4px 16px rgba(0,0,0,0.12)` + `transform: translateY(-2px)` transition `200ms ease` — neither version had any hover affordance on these cards; this is critical for discoverability
- Region badge on card (NORTH / WEST / EAST / CENTRAL / SOUTHERN): gold outlined pill `border: 1px solid #C9A84C`, gold text `#C9A84C`, transparent bg — consistent across both versions, keep
- Economic specialisation text: `#6B7FA3` grey-blue — V2 treatment, readable

***

### 3.6 `/gallery`

- White page bg
- "VISUAL JOURNAL" section label: gold dash + gold uppercase — V1/V2 consistent, keep
- "Gallery" heading: `#0F1F3D` navy serif bold — V2 treatment
- Subtitle: "The places, people, and moments that make up the story we're trying to tell. Real images, real Africa." — keep
- **Fix images** — this is non-negotiable. If images cannot be hosted and served correctly before launch, replace all image cards with the branded fallback:
  - Card bg: `#1A2F50` dark navy
  - Centred "B BOA." logo mark in `#C9A84C` gold
  - Caption text below logo: white, e.g. "Lagos after dark" — V2 had the alt-text captions, use them here intentionally as styled captions on the placeholder
  - Bottom of card: gold italic location tag e.g. "Lagos, Nigeria"
- Image grid: 3 columns desktop, 2 tablet, 1 mobile
- **Add category filter pills** above grid: All / Cities / People / Nature / Architecture — neither version had this; gallery needs browse context
- Caption overlay on hover: semi-transparent navy `rgba(15,31,61,0.85)` sliding up from bottom, white caption text, gold location tag — cinematic, on-brand, taken from V1's cinematic aesthetic applied in the right place

***

### 3.7 `/about`

- Full-viewport navy hero band `#0F1F3D` — V2's approach, keep
- Headline: **"We're building Africa's story."** white serif bold, large, centred
- Second line: **"Properly."** — `#C9A84C` **gold italic** — V1's typographic decision, restored. This is the single most important typographic restoration in the combined spec
- Stats row on `#F5F7FA` light grey band below hero:
  - Gold numerals `#C9A84C` — both versions, keep
  - **Fix stats to real numbers** — 22,028 stories is not credible against 3 visible articles; use real counts or replace with honest alternative metrics like "54 countries tracked" / "3 original reports" / "62 supporters"
  - Stat labels: `#0F1F3D` navy uppercase spaced — V2 treatment
- Body copy section: `#0F1F3D` navy on `#FFFFFF` white — V2's far superior long-form readability
- Inline gold italic emphasis text ("someone should build this", "we're actually building it") — V1's emotional detail, keep in body copy
- **Add**: Founder section with a name, brief bio, and optional photo — neither version had this; for a journalism platform it is a trust anchor
- **Add**: Editorial charter link — a short statement of editorial principles (what BOA-Story covers, what it refuses to cover) — neither version had this

***

### 3.8 `/contact`

- White page bg, "Contact Best of Africa" navy serif heading — V2
- Subtitle: "For media inquiries, partnership opportunities, or support." — V2
- Contact form card: **dark navy `#0F1F3D`** bg — V2's correct treatment
- Input fields: **white `#FFFFFF` bg**, `border-radius: 8px`, `#0F1F3D` dark navy text, `1px solid #3A5070` subtle border — V2's white-on-dark treatment, highest contrast of any form in either version
- "We typically respond within 24 business hours." — V2 micro-copy, keep
- Inquiry type dropdown: white bg, navy text — consistent
- **"Send Message" button: gold fill `#C9A84C`, navy `#0F1F3D` text** — neither version had this correctly; V1 was dark-on-dark, V2 was the same issue. Combined spec fixes it to match every other primary CTA
- Press and Support info cards below: white bg, `box-shadow`, with **navy SVG icons** (not near-invisible dark grey as in V1) — monitor icon for Press, envelope icon for Support
- **Add actual working email domain** — both versions showed `press@bestofafrica.com` on a `best-of-africa.pages.dev` deployment; the domain must resolve before launch

***

### 3.9 `/newsletter`

- White page bg
- Headline: **"Stay close to Africa's story."** — V2's copy, better than V1's blank headline
- "story." in **`#C9A84C` gold italic** — apply the two-tone headline treatment here too, consistent with About and Search
- Subtitle: "Free weekly dispatches — cities, founders, opportunities. No noise. Unsubscribe anytime." — V2's copy entirely, keep. This was the single best new copy addition in V2
- Email input: white bg, **`1px solid #D1D5DB` border** — visible but not overpowering on white page; consistent with the unified light-section input standard
- "Get the weekly dispatch" button: **gold fill `#C9A84C`**, navy text — V2's correct treatment, keep
- **Add below the form**: a sample dispatch preview card — white card, `box-shadow`, with a mock newsletter excerpt showing 3 story headlines, a country, and a sector tag. Neither version had this. It is the single most effective newsletter conversion tool
- **Privacy note** directly below the email input: "No spam. Unsubscribe anytime." — `#6B7FA3` grey-blue, small — V2 had it in the subtitle; duplicate it closer to the input as a reassurance at point of action

***

### 3.10 `/settings`

- White page bg — V2
- "Control Center" heading: `#0F1F3D` navy serif bold
- Subtitle: "Manage your account, preferences, and subscription." — V2's clarification, keep
- **AUTH GATE**: if user is not signed in, show a centred navy card (same style as login card) with lock icon + "Sign in to access your settings" + gold "Sign In" CTA. No form visible to unauthenticated users. This is the fix neither version implemented
- When authenticated, profile card: **dark navy `#0F1F3D`** bg — V2's treatment
- Input fields inside card: white bg, visible `1px solid #3A5070` border, rounded — V2's white-on-dark contrast, correct
- Fields: Full Name / Email Address / Professional Role or Organisation / Account Tier — V2's expanded field set is more useful
- "Account Tier: Basic — Access valid until Dec 2026" — only show this when actually authenticated with a real subscription; not for guest state
- "Edit Profile" button: **gold fill `#C9A84C`** — both versions had this as a low-affordance outlined pill; it needs to be a clear gold CTA to indicate it is the primary action on the page

***

### 3.11 `/admin`

- **Take V1's visual intent, apply V2's colour competence**
- V1 admin looked deliberately locked-down (dark charcoal card on black bg). V2 admin was a severe regression (grey card on white — invisible and looks broken)
- Combined treatment:
  - Page bg: white — V2 (navbar consistency)
  - Admin card: **dark navy `#0F1F3D`** bg, centred, `border-radius: 12px`, `box-shadow: 0 8px 32px rgba(0,0,0,0.18)` — elevated and intentional on the white bg
  - Lock icon circle: `#1A2F50` navy bg, `#C9A84C` gold lock outline — V1's clean icon, on V2's colour system
  - "Intelligence Access" heading: **white serif italic bold** — V1's treatment, dramatic and correct for a gated admin surface
  - "Authorized personnel only. Sessions are logged." subtitle: `#9CA3AF` muted grey — readable on dark card
  - "SECURITY TOKEN" label: `#C9A84C` gold uppercase spaced — V1's correct accent use
  - Input: `#1A2F50` dark bg, monospace font, `1px solid #3A5070` border, `#FFFFFF` white text
  - **"AUTHENTICATE" button: gold fill `#C9A84C`, dark navy text** — fixes the single worst button in either version. Both had this as a disabled-looking dark-on-dark or light-on-light button
- **Remove admin from public navbar entirely** — the route can exist but must not be linked from any public-facing navigation element

***

### 3.12 `/privacy` and `/terms`

- **V2's treatment entirely** — dark navy `#0F1F3D` on white `#FFFFFF` is definitively the correct approach for legal long-form text. V1's white-on-black was fatiguing
- "Privacy Policy" / "Terms of Service" heading: `#0F1F3D` navy serif bold, large
- "LAST UPDATED: JANUARY 2026" label: `#C9A84C` gold uppercase spaced — consistent accent use
- Horizontal rule: `#E5E7EB` light grey
- Section headings H2: `#0F1F3D` navy bold
- Body text: `#374151` dark grey (slightly softer than pure navy for body copy — easier on the eyes at length)
- **Add table of contents** at top of each page — anchor-linked list of sections in `#C9A84C` gold text — neither version had this
- **Add PIPEDA statement** — "This platform complies with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA). Users located in Canada have the right to access, correct, and request deletion of their personal information." — critical for a Canadian-operated platform
- **Add cross-links** at bottom of each page: "See also: Terms of Service / Privacy Policy / Contact Us"
- **Update date** — January 2026 is 5 months old at time of audit; should be reviewed and updated

***

### 3.13 `/dashboards/overview`

- White page bg — V2
- Globe icon circle: pale gold `#F5EDD0` bg + gold `#C9A84C` outline — V2's softer, more refined version over V1's olive-desaturated shade
- "Continental Dashboard" heading: `#0F1F3D` navy serif bold — V2
- Body copy: `#6B7FA3` grey-blue on white — readable
- **"Become a Founding Member" CTA: gold fill `#C9A84C`** — correct in both versions for this button; keep
- **Add a brief preview of what exists behind the gate** — e.g. 2–3 locked data point cards: "West Africa GDP Growth Rate: 🔒 Members only" / "Nigeria FDI Trends 2025: 🔒 Members only" — a teaser of real data points gives the visitor something to want. Neither version had any preview
- No broken image artefact (V2 fixed this) — keep V2's clean layout
- No floating "Intelligence" ghost text (V2 fixed this) — keep V2's clean layout

***

### 3.14 `/supporter-feed` and `/intel`

**Routing fix is P0.** `/intel` must not serve the Supporter Feed. The combined spec assigns:

- `/supporter-feed` → "Behind the building." page (Supporter Feed)
- `/intel` → A new **Sector Analysis** page (stub acceptable at launch, but the route must resolve to distinct content)
- `/intelligence` → A new **Narrative Strategy** page (stub acceptable at launch)

**Supporter Feed page combined spec:**
- Navy hero band `#0F1F3D` — "SUPPORTER FEED" gold heart badge — white serif heading "Behind the building." — body copy — V2's hero band treatment, consistent with all other page heroes in combined spec
- Stats row: **white cards with `box-shadow: 0 1px 6px rgba(0,0,0,0.08)` on `#F5F7FA` bg** — gives the white cards depth on the light background; no longer invisible
- Gold numerals on stats cards — both versions correct, keep
- **Reconcile stats to one source of truth**: pick one real number for reads and sync it across `/about`, `/supporter-feed`, and `/intel`. Remove "22,028 stories" until it reflects reality
- **Gate this page behind authentication** or clearly label it "Open to all" — it cannot continue to be positioned as a supporter perk while being publicly accessible

***

## 4. Typography System

Taking the best from both versions:

| Use | Font Treatment | Source |
|---|---|---|
| Hero headline | Serif display, bold, white on navy, large | Both versions — consistent |
| Two-tone headline ("Properly.") | White serif + **gold italic** on same line | V1 — restored in combined |
| Section labels | Gold `#C9A84C` + dash prefix, uppercase, `letter-spacing: 0.12em` | Both versions — consistent |
| Body copy | Serif or clean sans-serif, `#0F1F3D` on white, `line-height: 1.7`, `max-width: 680px` | V2 — better readability |
| Price numerals | Gold `#C9A84C`, large serif bold | Both versions — consistent |
| Stat numerals | Gold `#C9A84C`, large serif bold | Both versions — consistent |
| Form labels | `#0F1F3D` navy, uppercase, `font-size: 0.75rem`, `letter-spacing: 0.08em` | V2 treatment |
| Button text | Uppercase, `letter-spacing: 0.06em`, medium weight | Both versions — consistent |
| Legal body copy | `#374151` dark grey on `#FFFFFF`, `font-size: 1rem`, `line-height: 1.8` | V2 colour + better size |
| Breadcrumbs | `#6B7FA3` ancestors / `#0F1F3D` current | V2 — more legible than V1's white-on-black |

***

## 5. Interaction & State System

Neither version defined consistent interactive states. The combined spec establishes:

### Button States

| Button Type | Default | Hover | Active | Disabled |
|---|---|---|---|---|
| Primary (gold fill) | `bg: #C9A84C`, `color: #0F1F3D` | `bg: #B8942A`, `box-shadow: 0 4px 12px rgba(201,168,76,0.4)` | `bg: #9E7B1F` | `bg: #E5D5A3`, `color: #9CA3AF`, `cursor: not-allowed` |
| Secondary (navy outline) | `border: 1.5px solid #0F1F3D`, `color: #0F1F3D`, transparent bg | `bg: #0F1F3D`, `color: #FFFFFF` | `bg: #112240` | `border-color: #D1D5DB`, `color: #9CA3AF` |
| Ghost (on dark bg) | transparent, `color: #C9A84C`, `border: 1px solid #C9A84C` | `bg: #C9A84C`, `color: #0F1F3D` | `bg: #B8942A` | `opacity: 0.4` |

### Input States

| Context | Default Border | Focus Border | Error Border | Placeholder |
|---|---|---|---|---|
| Light page (white bg) | `#D1D5DB` | `#C9A84C` gold + `box-shadow: 0 0 0 3px rgba(201,168,76,0.15)` | `#