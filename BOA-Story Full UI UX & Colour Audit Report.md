# BOA-Story — Full UI/UX & Colour Audit Report
**URL:** https://best-of-africa.pages.dev/
**Audit Date:** June 17, 2026
**Pages Audited:** 16 routes
**Auditor:** Comet (live browser crawl)

***

## 1. Colour System Overview

### Primary Palette (Used Globally)

| Role | Colour | Hex (Approximate) | Usage |
|---|---|---|---|
| Background | Near-black | `#0a0a0a` / `#111111` | All page backgrounds |
| Primary Accent | Gold / Amber | `#C9A84C` – `#D4A017` | CTAs, icons, labels, borders, stats, accented text |
| Primary Text | White | `#FFFFFF` | Headlines, body copy |
| Secondary Text | Light grey | `#AAAAAA` – `#CCCCCC` | Subtitles, meta text, breadcrumbs |
| Card Background | Dark charcoal | `#1A1A1A` – `#222222` | Funding card, contact form, admin card, settings card |
| Loading Spinner | Gold | Matches accent `#C9A84C` | Full-screen loading state |

### Secondary / Inconsistent Colours (Problems)

| Location | Colour | Hex | Issue |
|---|---|---|---|
| Countries grid cards | White / off-white | `#FFFFFF` / `#F5F5F5` | **Breaks dark theme** — stark white cards with dark text sit jarringly against the black background |
| Membership page one-time contribution card | White | `#FFFFFF` | Same break — white card in an otherwise dark page |
| Membership FAQ accordion | White background | `#FFFFFF` | Same issue |
| /posts search bar | White input on dark bg | `#FFFFFF` | Inconsistent with /search page which uses a dark transparent input with gold border |
| "FINANCE & INVESTMENT" tag badges | Gold filled | `#C9A84C` | Consistent — works well |
| "RECOMMENDED" badge on pricing | Gold pill on gold border | `#C9A84C` | Good — reinforces hierarchy |
| Region badges on country cards (NORTH/WEST) | Pale gold outlined pill | `#C9A84C` text, transparent bg | Works on white cards but floats oddly |

***

## 2. Page-by-Page Audit

***

### 2.1 Homepage `/`

**Layout:** Single long-scroll page, no sidebar. Full-width sections stacked vertically.

**Sections found (top to bottom):**
1. Navbar
2. Hero — animated rotating text ("Cities. / Creators. / Everyday. / Culture.")
3. "BECOME A FOUNDING MEMBER" CTA
4. Live Funding Progress bar
5. "Stories from the Ground" — article cards
6. "Fund the Platform" — 3-tier pricing cards
7. "A Premium Interface" — scrolling image strip (Lagos, safari, nightlife)
8. "We're building Africa's story. Properly." — mission statement
9. "Where Your Money Goes" — 4 icon cards
10. FAQ accordion
11. "Join before the official launch" — final CTA
12. Footer — 4-column link grid

**Colour Notes:**
- Background: `#0a0a0a` solid black throughout 
- Hero headline: `#FFFFFF` white, serif display font (editorial quality)
- Rotating animated word ("Cities."): `#C9A84C` gold — strong focal point
- "EARLY ACCESS" label: gold uppercase tracking — effective brand label
- Gold horizontal rule (`——`) left of section labels: consistent motif
- CTA button "BECOME A FOUNDING MEMBER": gold pill `#C9A84C` bg, dark text — high contrast, correct
- Funding progress bar: gold fill on dark track — visually clear
- Article cards: rounded `#1A1A1A` charcoal, white headline text, gold "FINANCE & INVESTMENT" tag badge
- "ORIGINAL REPORTING" section label: gold uppercase with leading dash
- Pricing cards: charcoal dark bg, gold price numerals, white feature text. Founding Member card has a gold border highlight to indicate recommended tier — works well
- "Platform Experience" image strip: real photography (Lagos at night, safari resort, rooftop events) — cinematic and on-brand
- "Where Your Money Goes" cards: darker charcoal on black, white text — subtle but readable
- FAQ: collapsed accordion on dark bg — minimal and clean
- Footer: black bg, white nav text, gold dot in logo, gold accent in copyright line

**UX Issues:**
- Logo in navbar is just a tiny gold dot with no visible wordmark at top of page — brand identity nearly invisible at first glance
- Top navbar shows Settings and Admin icons to unauthenticated visitors — exposes internal tools publicly
- "GENERAL" toggle label in top bar has no explanation — confusing to new users
- The hero rotating word animates too fast — user may miss multiple words and only see one
- Three separate "UNLOCK ACCESS" / "BECOME A FOUNDING MEMBER" CTAs appear before any free content is shown — heavy monetisation pressure before trust is established
- Funding progress shows 38% of $800 — honest but also signals the project is underfunded, which may undermine confidence
- Image cards in "Platform Experience" strip all say "Cinematic Intelligence" label but are locked behind membership — no preview value

***

### 2.2 Search `/search`

**Layout:** Minimal, single view. Breadcrumb + headline + one search input. 

**Colour Notes:**
- Background: `#0a0a0a` black
- Headline: "What are you" white, "researching?" gold italic — effective two-tone typographic contrast
- Section label "INTELLIGENCE SEARCH": gold uppercase
- Search input: dark transparent background, gold rounded border `#C9A84C`, white placeholder text

**UX Issues:**
- No categories, filters, or suggested searches shown — empty state gives user no direction
- Search appears to be non-functional in current state (no results listed, no indication of what content is indexed)
- Page feels abandoned — only one interactive element with no supporting context

***

### 2.3 Login `/login`

**Layout:** Centred card on dark background. 

**Colour Notes:**
- Background: gradient dark `#0a0a0a` with subtle amber glow behind the card
- Card background: dark `#1a1a1a` charcoal with rounded corners
- Lock icon: gold outline on dark circle
- "CLIENT PORTAL" heading: white serif, spaced tracking
- "PASSWORDLESS LOGIN" subtitle: muted grey
- Email input: dark charcoal bg, white text, no visible border
- "SEND MAGIC LINK" button: gold filled, dark text — correct

**UX Issues:**
- The page title is "BOA-Story" — no distinct `<title>` for the login page making browser tab management harder
- Passwordless flow is a good UX choice but zero explanation is given about what happens after entering an email
- No "Sign up" or "Create account" path shown — dead end for new users
- The label says "CLIENT ID / EMAIL" — "CLIENT ID" implies a B2B enterprise portal, which is jarring for what is a reader/subscriber platform
- Input field has no visible border — low affordance for a form field

***

### 2.4 Membership `/membership`

**Layout:** Multi-section scroll with pricing toggle (Monthly/Annual), 3 plan cards, a one-time contribution card, and an FAQ. 

**Colour Notes:**
- "Annual" toggle pill: black bg with gold "~2 MO FREE" badge — correct highlighting
- Founding Member card: gold border on dark card — clear recommended state
- Price numerals: gold `#C9A84C` — consistent
- CTA buttons: "BECOME A FOUNDING MEMBER" gold fill; "BECOME A SUPPORTER" and "BECOME A PATRON" — dark outlined buttons — good tier differentiation
- Check marks: gold on dark — readable
- **One-time contribution card: WHITE background `#FFFFFF`, gold outlined button, dark text** — this card breaks the dark theme completely and looks like it belongs to a different website
- FAQ section: also renders on a white card — same problem

**UX Issues:**
- White cards inside the dark-themed page create a jarring colour context switch with no design justification
- Monthly pricing shown as e.g. "$5/mo" but Annual shows "$50/yr" with "$5/mo billed monthly" as strikethrough — the annual pricing appears more expensive at first glance before reading fine print
- Three tiers is correct, but the feature differentiation is thin — Supporter gets "My sincere gratitude" as a perk which undersells the tier
- No visual indication of what "Direct input on future story coverage" actually means
- FAQ accordion text is black on white — fine for readability but disconnected from brand

***

### 2.5 Posts `/posts`

**Layout:** Hero section with headline + audio CTA, search bar, filter pills, and article card grid. 

**Colour Notes:**
- "ORIGINAL REPORTING" badge: dark charcoal pill with gold star icon and white text — works well
- Hero headline: white serif, full-width and bold
- "LISTEN TO DAILY PULSE" button: dark pill with gold play icon and white text — subtle, good secondary CTA
- **Search bar: WHITE input on dark background** — inconsistent with /search page's gold-bordered dark input
- "All" filter pill: gold fill, dark text — active state is clear
- Remaining filter pills: dark unfilled — correct inactive state
- Article cards: dark charcoal `#1A1A1A`, images broken (alt text showing as strings), gold "FINANCE & INVESTMENT" / "HEALTHCARE & PHARMA" badges, white headline text, "UG" / "SD" country codes in white
- Country code labels are white on dark card — low visual weight, easily missed

**UX Issues:**
- Article images are all broken (rendering as grey boxes with alt text string visible) — critical content failure
- The search input is white-background which contradicts the /search page input style — no design system consistency
- All articles end with "Founding Members Only" — no free content visible, making the posts page a wall of paywalled teasers
- Country code abbreviations (UG, SD) are used without flag icons or full names — unclear to international audiences unfamiliar with ISO codes

***

### 2.6 Countries `/countries`

**Layout:** Hero + search bar + region filter pills + full 54-country card grid. 

**Colour Notes:**
- "54 AFRICAN NATIONS" badge: dark pill with gold globe icon — consistent with brand
- Headline "One Continent. Every Story.": white serif — strong
- Search bar: white input with rounded corners — same inconsistency as /posts
- "All 54" active filter: gold fill, dark text — consistent
- Other region filter pills: dark charcoal, unloaded/invisible in current state (show as grey rounded rectangles)
- **Country cards: WHITE `#FFFFFF` / off-white background with dark text and gold region badge** — most severe colour system break in the app. 54 white cards against black background looks like a completely different design system
- Region badge on card (NORTH/WEST/EAST/SOUTH/CENTRAL): gold outlined pill — readable but the gold-on-white is lower contrast than gold-on-dark

**UX Issues:**
- White country cards are the most jarring inconsistency in the entire app — they look like Material Design cards inserted into a luxury editorial site
- No country flags shown — purely text-based cards feel sparse
- Cards show a one-line economic specialisation (e.g. "Suez Canal Logistics") with no story count or coverage indicator
- Clicking a country card would presumably navigate deeper — no affordance shown (no arrow, no hover state visible)
- Filter pills for regions appear to be loading but were invisible/grey in the audit — broken or missing state

***

### 2.7 Gallery `/gallery`

**Layout:** Minimal page — "VISUAL JOURNAL" label + "Gallery" headline + image card grid. 

**Colour Notes:**
- Section label: gold dash + "VISUAL JOURNAL" gold uppercase — consistent
- Headline: white serif bold
- Image cards: all rendered as **light grey `#E0E0E0` placeholder boxes** — images completely broken

**UX Issues:**
- Every single image in the gallery failed to load — the page serves zero visual content, making it the most broken page in the app
- There is no fallback state, skeleton loader, or error message — just grey boxes
- No caption text, no photographer credits, no categories
- The page exists to show African photography but delivers nothing — serious credibility damage for a platform positioning around "cinematic" visual storytelling

***

### 2.8 About `/about`

**Layout:** Hero headline → stats row → founder bio copy. 

**Colour Notes:**
- Hero "We're building Africa's story." white serif, "Properly." in gold italic — excellent two-tone usage, best typographic moment in the app
- Stats row (22,028 / 54 / 5 / 201): all in gold `#C9A84C` — strong visual anchoring
- Stat labels below: white uppercase tracking — clean
- Background between hero and stats: slight gradient dark to very dark — subtle depth
- Body copy: white on black — readable, correct line width (~60ch)
- Inline italic gold text ("someone should build this", "we're actually building it"): effective use of accent colour for emotional emphasis

**UX Issues:**
- The stat "22,028 Stories Published" conflicts with only 3 stories visible on the /posts page — likely a placeholder or aspirational number, but it actively misleads visitors
- "201 Total Reads" is an unusually low read count for 22,000 stories — suggests the stats are fabricated or populated from dummy data
- No team page, no author bios beyond the founder paragraph — for a journalism platform this is a trust gap
- No publication date, no editorial charter linked

***

### 2.9 Contact `/contact`

**Layout:** Centred hero + contact form card + two info cards (Press / Support). 

**Colour Notes:**
- Background: `#0a0a0a` black
- Form card: dark charcoal `#1a1a1a`, rounded corners
- Input fields: slightly lighter charcoal `#222` with rounded corners, white placeholder text — low visibility borders
- "Strategic Partnership" dropdown: charcoal bg, white text — consistent
- Textarea: same dark charcoal
- "Send Message" button: near-black `#111` with white text and arrow icon — **very low contrast**, looks disabled rather than active
- Press/Support cards below: slightly lighter charcoal, monitor and envelope icons in dark grey (nearly invisible)

**UX Issues:**
- "Send Message" CTA is dark-on-dark — it does not look like a clickable button; should use gold fill to match all other primary CTAs in the app
- The icon inside the Press and Support cards is so dark it's barely visible
- Email addresses shown (press@bestofafrica.com, support@bestofafrica.com) use a domain that differs from the deployed domain (best-of-africa.pages.dev) — no domain resolution currently
- No phone number, no physical address, no social links
- "For media inquiries, partnership opportunities, or support" — three very different audiences funnelled into one form with no routing differentiation beyond the inquiry type dropdown

***

### 2.10 Newsletter `/newsletter`

**Layout:** Minimal — headline + email input + CTA button. 

**Colour Notes:**
- Background: `#0a0a0a` black
- Headline: white bold serif — strong
- Email input: dark bg, gold rounded border `#C9A84C` — consistent with /search input style (correct)
- CTA button "Get the weekly dispatch": **gold filled `#C9A84C`, dark text** — high contrast, correct
- No other page elements

**UX Issues:**
- Page is essentially a single form — no context about what the newsletter contains (frequency, topics, sample)
- No privacy assurance text below the form (e.g. "We never spam, unsubscribe anytime")
- No preview of a past issue
- Breadcrumb shows "Newsletter" but the nav doesn't surface this as a primary link — difficult to discover organically

***

### 2.11 Settings `/settings`

**Layout:** "Control Center" heading + horizontal divider + Profile Details form. 

**Colour Notes:**
- Background: `#0a0a0a` black
- Heading "Control Center": white serif bold — appropriate weight
- Divider line: dark grey `#333` — subtle
- "Edit Profile" button: dark outlined pill, white text — low visual weight, looks inactive
- Form card: dark charcoal `#1a1a1a` with rounded corners
- Input fields: charcoal `#222`, white text, rounded — consistent with contact form
- Pre-filled values "Guest User" / "guest@example.com": dim white — readable

**UX Issues:**
- Settings is fully accessible to unauthenticated users with no auth gate whatsoever — a user who has never signed in lands here and sees "Guest User" pre-filled in a profile form. This is a significant UX and trust failure
- "Control Center" as a label implies a powerful admin dashboard — the actual content is just a name and email field, which doesn't live up to the label
- The Settings icon is exposed in the top navbar for all visitors — internal tooling should be hidden or auth-gated in nav
- No visual indicator that you must sign in to save anything — a guest user could attempt to edit fields and submit with no feedback about what happens

***

### 2.12 Admin `/admin`

**Layout:** Single centred card — lock icon + "Intelligence Access" heading + security token input + Authenticate button. 

**Colour Notes:**
- Background: `#0a0a0a` black
- Card: dark charcoal `#1a1a1a`, rounded corners
- Lock icon: white outline on dark — clean
- "Intelligence Access" heading: white serif italic bold
- "SECURITY TOKEN" label: gold uppercase spaced — consistent accent use
- Input: dark `#222`, monospace placeholder "Enter authorization key..." — styled correctly for a secure gate
- "AUTHENTICATE" button: dark near-black fill, white text — same issue as Contact's Send button, looks disabled

**UX Issues:**
- Admin is publicly linked in the top navbar — any visitor can see and attempt to access it. The route should be entirely unlisted and unlinked from public navigation
- "Authorized personnel only. Sessions are logged." — this copy is fine for security intent but the page being linked publicly contradicts it
- The Authenticate button is styled identically to a disabled state — it needs gold fill or a visible active affordance to signal it is clickable
- No "forgot token" or recovery path shown
- Title tag reads "BOA-Story" with no distinct Admin page title

***

### 2.13 Privacy Policy `/privacy`

**Layout:** Standard legal page — title + last updated date + numbered sections. 

**Colour Notes:**
- Background: `#0a0a0a` black
- "Privacy Policy" heading: white serif bold — consistent
- "LAST UPDATED: JANUARY 2026" label: grey uppercase spaced — readable
- Horizontal rule: dark grey — clean divider
- Section headings (H2): white bold — appropriate hierarchy
- Body text: white `#FFFFFF` / light grey on black — readable but long-form white-on-black text at this length can cause eye strain compared to near-white on very dark grey

**UX Issues:**
- No table of contents for quick navigation of a long legal document
- No links to related pages (Terms, Contact) at bottom
- "Last Updated: January 2026" — this is 5 months old at audit time; no indication of pending updates or version history
- Font size appears small for legal copy — accessibility concern

***

### 2.14 Terms of Service `/terms`

**Layout:** Identical structure to Privacy Policy. 

**Colour Notes:**
- Identical colour treatment to `/privacy` — consistent, which is correct for legal pages
- Section headings in white bold — proper hierarchy

**UX Issues:**
- Same issues as Privacy: no TOC, no cross-links, small text
- "Usage of premium intelligence requires a valid subscription" — the term "intelligence" is used to describe what is currently a small editorial newsletter, which is a significant positioning mismatch
- No explicit GDPR or PIPEDA (Canadian) compliance statements visible — relevant given the platform collects user data and the founder is based in Canada

***

### 2.15 Continental Dashboard `/dashboards/overview`

**Layout:** Broken image top-left + centred gate card + CTA button. 

**Colour Notes:**
- Background: `#0a0a0a` black
- Gate card: dark charcoal, rounded
- Globe icon circle: olive-gold `#8B7A2E` — slightly darker/desaturated compared to the standard accent gold, minor inconsistency
- "Continental Dashboard" heading: white serif bold
- "BECOME A FOUNDING MEMBER" button: gold fill — correct
- Breadcrumb shows "Home › Dashboards › Overview" — three levels, correct

**UX Issues:**
- The broken image in the top-left corner (renders as a tiny broken image icon) looks unprofessional and should be removed or replaced with a placeholder
- The entire page is a paywall gate with zero preview content — a user has no idea what they would be unlocking
- The globe icon's gold shade is slightly off from the brand accent — likely a different icon set or opacity applied inconsistently
- "Intelligence" label floats in the top-centre of the page as ghosted text — unclear purpose, looks like a loading artefact

***

### 2.16 Supporter Feed / Sector Analysis `/supporter-feed` and `/intel`

**Both routes serve the same page — "Behind the building."** 

**Layout:** "SUPPORTER FEED" badge + "Behind the building." headline + body copy + stats row (gold numbers on white cards).

**Colour Notes:**
- "SUPPORTER FEED" badge: dark charcoal pill with gold heart icon — consistent
- Headline: white serif bold, large — strong
- Body text: white on black — readable
- Stats row: **white `#FFFFFF` / off-white card backgrounds with gold numerals** — same white-card issue as Countries and Membership pages. Not as jarring here because the cards are smaller, but still inconsistent

**UX Issues:**
- `/intel` and `/supporter-feed` serve **identical content** — the Sector Analysis footer link leads to a completely different page description than what actually loads. This is a routing/labelling bug
- `/intelligence` (Narrative Strategy in footer) redirects to `/posts` — another routing mismatch
- The Supporter Feed is accessible to unauthenticated users — the "behind the scenes" content is not actually gated despite being positioned as a supporter perk
- Stats shown (22,028 stories, 54 countries, 5 regions, 9.2k reads) differ from the About page stats (22,028 / 54 / 5 / **201** reads) — data inconsistency between two pages

***

## 3. Cross-Cutting Colour Issues Summary

| Issue | Severity | Pages Affected |
|---|---|---|
| White cards on black background — breaks dark theme | **Critical** | Countries, Membership, Supporter Feed |
| Search inputs inconsistently styled (white vs dark+gold border) | **High** | /posts, /countries vs /search, /newsletter |
| Primary action buttons styled like disabled states (dark-on-dark) | **High** | Contact "Send Message", Admin "Authenticate" |
| Globe icon accent gold slightly desaturated vs brand gold | **Low** | /dashboards/overview |
| Broken image placeholder (tiny broken img icon) | **Medium** | /dashboards/overview |
| Gallery images all broken — grey placeholders | **Critical** | /gallery |
| Article images all broken — alt text strings showing | **Critical** | /posts |
| Stats row white cards on Supporter Feed | **Medium** | /supporter-feed, /intel |

***

## 4. Cross-Cutting UX Issues Summary

| Issue | Severity | Pages Affected |
|---|---|---|
| Logo is invisible (tiny gold dot, no wordmark) | **High** | All pages — navbar |
| Settings + Admin icons in public navbar | **High** | All pages — navbar |
| Admin page linked publicly | **Critical** | /admin |
| Settings accessible to unauthenticated users | **High** | /settings |
| All posts paywalled — no free entry-point content | **High** | /posts, homepage |
| Broken images throughout | **Critical** | /gallery, /posts |
| Routing mismatches (/intelligence→/posts, /intel→supporter-feed) | **High** | Footer nav |
| Misleading stats (22,028 stories but only 3 visible) | **High** | /about, /supporter-feed |
| Data inconsistency in read counts between pages | **Medium** | /about vs /supporter-feed |
| Supporter Feed not actually gated despite being a perk | **Medium** | /supporter-feed |
| No free content before paywall ask | **High** | Homepage, /posts |
| No "back to top" or sticky nav on long pages | **Low** | Homepage, /about |
| Loading spinner shown on every page transition (cold load) | **Medium** | All pages |
| No 404 page tested — unknown behaviour on invalid routes | **Medium** | Unknown |

***

## 5. Strengths

- **Brand colour discipline is strong in the core:** black + gold + white is applied consistently in the hero, pricing, labels, and CTAs across most primary surfaces
- **Typography is excellent:** the serif display font (appears to be a Canela or Freight Display variant) is editorial-grade and carries the premium positioning well
- **CTA hierarchy is clear on the homepage:** gold fill = primary action, dark outline = secondary — the system works where it is applied
- **Section label motif (gold dash + uppercase label) is distinctive and consistent** — used on homepage, /posts, /about, /gallery
- **Two-tone headlines (white + gold italic) are the best design decision in the app** — used on /about ("Properly.") and /search ("researching?") — this should be used more consistently
- **Admin is actually gated behind a token** — correct security behaviour even if the link should be hidden
- **Breadcrumb navigation is present on every page** — helpful for orientation
- **The passwordless login approach is a strong UX choice** for a subscription platform

***

## 6. Priority Fix List

### P0 — Fix Immediately
1. **Remove Admin from public navbar** — it should not be a visible link for unauthenticated users
2. **Fix all broken images** — /gallery and /posts both have completely broken image rendering; this is the single biggest credibility issue
3. **Gate /settings behind authentication** — currently shows a profile form to any visitor

### P1 — Fix Before Launch
4. **Replace white cards with dark charcoal cards** — Countries grid, Membership one-time card, FAQ accordion, Supporter Feed stats — unify with `#1a1a1a` background and white/gold text
5. **Unify search input styling** — pick one: dark bg with gold border (as on /search and /newsletter) and apply everywhere including /posts and /countries
6. **Fix routing mismatches** — /intelligence should not redirect to /posts; /intel should not serve the Supporter Feed; footer labels should match destinations
7. **Style primary action buttons consistently** — Contact's "Send Message" and Admin's "Authenticate" need gold fill to match every other primary CTA in the app
8. **Add visible logo wordmark** to navbar — the single gold dot is not sufficient brand identification

### P2 — Before Growth Push
9. **Provide at least one fully free article** — a platform with 100% paywalled content before any free sample cannot convert new visitors
10. **Fix or remove misleading stats** — 22,028 stories and only 3 visible is an immediate trust-breaker; use real numbers or remove until accurate
11. **Add empty/loading states to Search** — the search page currently gives zero guidance on use
12. **Add image error fallback states** — at minimum a branded dark placeholder with the BOA logo, not a broken image icon or grey box
13. **Ungate Supporter Feed or actually gate it** — it is currently positioned as a member perk but is publicly accessible
14. **Add newsletter context** — frequency, sample issue link, topic description before the subscribe input

### P3 — Polish
15. **Slow down hero rotating text** — give each word at least 2.5s of visibility
16. **Add hover states to country cards** — no affordance currently signals they are clickable
17. **Add flag icons to country cards** — ISO country codes (UG, SD) alone are not internationally legible
18. **Add TOC to Privacy and Terms pages**
19. **Verify PIPEDA compliance copy** — Canadian platform collecting user data needs explicit Canadian privacy law acknowledgement
20. **Remove "GENERAL" toggle from top bar or explain it** — currently uninterpretable for new visitors

***

## 7. Colour Recommendations

| Current Problem | Recommended Fix |
|---|---|
| White country/membership/FAQ cards | Change to `#1a1a1a` charcoal with `#FFFFFF` text and `#C9A84C` accent details |
| White search inputs on /posts and /countries | Change to transparent/dark bg with `1px solid #C9A84C` border, matching /search |
| Dark-on-dark primary buttons (Contact, Admin) | Change to `background: #C9A84C; color: #111111` — same as homepage CTAs |
| Desaturated globe icon gold on /dashboards/overview | Replace with standard brand gold `#C9A84C` at full opacity |
| Grey broken image placeholders | Replace with `#1a1a1a` card + centred BOA logo mark in `#C9A84C` as fallback |

***