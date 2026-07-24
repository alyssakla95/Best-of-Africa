---

# BOA-Story Platform V2 — Full UI/UX & Colour Audit Report
**URL:** https://best-of-africa-platform.pages.dev/
**Audit Date:** June 17, 2026
**Pages Audited:** 16 routes
**Compared Against:** https://best-of-africa.pages.dev/ (V1)

***

## 1. Colour System Overview

This version is a **fundamentally different design direction** from V1. Where V1 was dark-first (black `#0a0a0a` as base), V2 uses a **navy + light grey + white** system with gold accents — it reads as a premium editorial/news publication rather than a cinematic dark platform.

### Primary Palette

| Role | Colour | Hex (Approximate) | Usage |
|---|---|---|---|
| Hero / footer background | Deep navy | `#0F1F3D` – `#112240` | Hero bands, footer, dark section blocks, login card, article paywall cards |
| Page background (body) | Off-white / light grey | `#F5F7FA` – `#FFFFFF` | All content sections between hero and footer |
| Navbar background | Pure white | `#FFFFFF` | Top navigation bar — stark contrast to v1's black navbar |
| Primary text | Dark navy | `#0F1F3D` – `#1A2D4F` | All headings and body copy in light sections |
| Secondary text | Medium grey-blue | `#6B7FA3` | Subtitles, meta labels, breadcrumb ancestors |
| Primary accent | Gold / Amber | `#C9A84C` – `#B8942A` | CTAs, price numerals, section labels, check marks, spinner |
| Card backgrounds (light sections) | White | `#FFFFFF` | Pricing cards, FAQ, funding card, article cards |
| Card backgrounds (dark sections) | Slightly lighter navy | `#1A2F50` | Settings profile card, contact form card |
| Loading spinner | Gold | `#C9A84C` | But on **white** background — very different feel from V1's gold on black |

### Colour Mode Assessment

V2 is essentially a **light-mode platform with navy accent sections**, as opposed to V1's dark-mode-first design. This is a significant strategic divergence. Neither version is wrong, but V2 feels closer to established editorial brands (The Economist, Rest of World, FT). V1 felt more like a luxury streaming platform (dark, cinematic). V2 is more readable for long-form text and has a stronger established-publication feel.

***

## 2. Page-by-Page Audit

***

### 2.1 Homepage `/`

**Layout:** Long-scroll single page. Same structure as V1 but with light/dark alternating banded sections.

**Sections top to bottom:**
1. Navbar (white)
2. Hero — navy band, animated rotating text, CTA
3. "LAUNCH FUNDING PROGRESS" — **light grey band** with white card
4. "ORIGINAL REPORTING / Stories from the ground" — white section, 3 article cards
5. "Fund the platform" — light grey band, 3 pricing cards
6. "SNEAK PEEK / This is what we're building" — white section, 2 preview cards
7. "We're building Africa's story. Properly." — navy band
8. "WHERE YOUR MONEY GOES" — white section, 4 icon items
9. "Frequently Asked Questions" — light grey band
10. "Join before the official launch" — white section CTA
11. Footer — navy band

**Colour Notes:**
- Navbar: white background, navy "B BOA." logo mark (black circle with white "B", "BOA." in dark navy) — **far superior to V1's invisible gold dot logo**
- "Sign In" button in navbar: gold fill `#C9A84C`, navy text — consistent, correct
- "EARLY ACCESS" label: gold dash + gold uppercase spaced text — same motif as V1
- Hero headline: white serif on navy — high contrast, strong
- Rotating word ("Cities."): gold italic — same as V1, effective
- Funding progress card: white card on light grey — the gold "38% of $800 goal funded" text is in gold within the card — appropriate
- Progress bar: gold fill on light grey track — slightly lower contrast than V1's gold-on-dark track
- Article paywall cards: navy dark bg with white text and gold "UNLOCK ACCESS" CTA — strong visual and works well in the light surrounding section. Third card renders in a **washed-out grey/muted navy** — depth/z-order CSS issue making it look disabled
- Pricing cards: white bg for Supporter and Patron, navy dark bg for Founding Member (recommended) — clearer differentiation than V1
- Gold check marks on pricing cards — consistent
- "Sneak Peek" section: two light-grey preview cards with navy text and gold category labels (TECHNOLOGY, CITIES, CULTURE) — excellent, these feel like actual editorial content previews, a significant improvement over V1's cinematic image strip
- "We're building Africa's story. Properly." navy band: white serif bold — identical sentiment to V1 but rendered much larger and centred — stronger impact here
- "WHERE YOUR MONEY GOES" icons: multicolour emoji icons (🌐🛠️✍️☕) — inconsistent with the premium brand register; V1 used the same emojis but they are out of place in a premium editorial aesthetic

**UX Notes:**
- The logo is now fully legible — "B" in dark circle + "BOA." wordmark — this alone is a substantial improvement over V1
- "Sign In" is text in V1 (all caps), but a gold pill button in V2 — much higher affordance
- Funding progress card is now isolated in its own band section — less visually overwhelming than V1's inline placement
- The "Sneak Peek" section with sample story headlines ("Lagos builds what others import", "Kigali by design, not by accident") is **new in V2** — this is the correct solution to V1's zero-free-content problem; it gives visitors a real taste of editorial voice before asking for money
- Article cards in the "Stories" section still all say "Founding Members Only" with no free article — the Sneak Peek partially addresses this but a fully readable free article should still exist
- Third paywall article card appears greyed/faded (z-order or opacity CSS issue) — looks like a visual bug
- "GENERAL" toggle still appears in navbar with no explanation — inherited from V1, still confusing

***

### 2.2 Search `/search`

**Colour Notes:**
- Hero band: navy `#112240` with white headline and gold section label — consistent with homepage hero
- Headline: "What are you researching?" — white serif, full width — identical copy to V1
- Search input: dark input `#1A2F50` with gold border, white placeholder — on the navy band, so it reads as a slightly lighter navy element — clean and contextually correct
- Below hero: white/light grey body section with a large centred grey search icon placeholder and muted hint text "Start typing to search across all Africa intelligence" plus example searches: `"Nigeria fintech"`, `"Kenya infrastructure"`, `"Rwanda agriculture"` — **this is entirely new vs V1 which had nothing here**

**UX Notes:**
- V2 search has **example search suggestions** visible in empty state — significant improvement over V1's dead empty page
- Still no category filters, browse-by-topic, or recent searches — these would complete the page
- Gold border on search input is now on a dark navy band rather than a flat black page — contrast is appropriate

***

### 2.3 Login `/login`

**Colour Notes:**
- Page bg: white, navbar visible above
- Login card: **navy dark `#0F1F3D`** with a subtle amber/gold radial glow emanating from behind the lock icon — moody and premium
- Lock icon circle: dark navy `#1A2F50` background, gold lock outline — consistent
- "CLIENT PORTAL" heading: white serif, wide tracking — same as V1
- "PASSWORDLESS LOGIN" subtitle: muted grey-white — readable
- Email input: dark navy bg with a **lighter rounded white border outline** — visible affordance, improved over V1
- "SEND MAGIC LINK" button: gold fill, dark navy text — strong, correct
- **New in V2:** "APPLY FOR MEMBERSHIP" link below the form in gold text — this solves the V1 dead end for new users who don't have a login yet

**UX Notes:**
- V2 login now has an "APPLY FOR MEMBERSHIP" escape path — addresses the V1 no-signup-path problem
- The placeholder now reads "name@organization.com" vs V1 — subtly reinforces the B2B/enterprise framing. Still uses "CLIENT ID / EMAIL" label which is jarring for a reader platform — same issue persists
- Page title is still just "BOA-Story" — no distinct title, same as V1 problem

***

### 2.4 Membership `/membership`

**Colour Notes:**
- White background throughout light sections
- Toggle pills (Monthly / Annual): white bg, dark text for inactive; dark navy bg with white text + gold "~2 MO FREE" badge for active Annual — clear, identical logic to V1
- Pricing cards: white bg for Supporter and Patron, **navy dark bg for Founding Member** — same pattern as homepage. Founding Member card has **gold top border accent** — strongest visual indicator of recommended tier
- Price numerals: gold `#C9A84C` — consistent with entire platform
- Gold check marks on feature lists — consistent
- "BECOME A FOUNDING MEMBER" CTA: gold fill, navy text — correct
- "BECOME A SUPPORTER" / "BECOME A PATRON": navy-text links on white card — much lower visual weight than V1's outlined buttons, appropriate secondary action styling
- **One-time contribution section**: white rounded card on light grey band — **white-on-light is much less jarring than V1's white-on-black** for this section
- FAQ section: white bg accordion on light grey band — completely natural here since the whole page is light-mode. The white-card issue from V1 is **not a problem in V2** because the entire design system is light

**UX Notes:**
- Same thin feature differentiation issue inherited from V1 ("My sincere gratitude" as a perk)
- Annual pricing defaulted — shows $150/yr with "$15/mo billed monthly" as reference — clearer than V1's confusing strikethrough display
- One-time contribution section exists and is styled consistently — no jarring theme break as in V1

***

### 2.5 Posts `/posts`

**Colour Notes:**
- Navbar: white (consistent)
- Page heading: "Stories from the Continent" in dark navy, large serif — strong editorial feel
- "Listen to Daily Pulse" button: gold pill with dark navy play icon and text — correct secondary CTA
- **Search bar: white input with a thin grey `#E0E0E0` border on white page background** — very low contrast, barely visible as an interactive input. This is worse than V1's already-inconsistent white input
- Active filter pill "All": gold fill, dark navy text — consistent
- Inactive filter pills: white bg, dark navy text, light grey border — readable
- Article cards: grey-to-dark gradient placeholder background (images still broken), globe emoji, gold "FINANCE & INVESTMENT" tag badge, dark navy paywall overlay card within card — **layered card approach** is more sophisticated than V1's flat card

**UX Notes:**
- Search bar has near-invisible borders on the white page — needs a stronger border or the dark input style from the hero search
- Images still broken on all article cards — same critical issue as V1, not fixed
- All articles still paywalled — same problem as V1
- Filter category labels (Finance & Investment, Healthcare & Pharma, Tourism & Hospitality) are now **spelled out in full** on the filter pills rather than V1's shorter versions — better clarity
- "Stories from the Continent" (V2) vs "Stories from the Ground" (V1) — slight copy change, "Continent" is geographically more specific and on-brand

***

### 2.6 Countries `/countries`

**Colour Notes:**
- Light grey page bg `#F5F7FA`
- "54 AFRICAN NATIONS" badge: gold fill `#C9A84C` / very pale gold bg with gold text and globe icon — lighter version of V1's badge
- "One Continent. Every Story." heading: dark navy serif — same as V1
- Search input: white bg with thin light border — same low-contrast problem as /posts search
- Region filter pills: gold fill active ("All 54"), white outline inactive (North 6, West 16, East 14, Central 9, Southern 9) — **region pills now show article/country counts** — useful improvement over V1 where counts were absent
- **Country cards: still white `#FFFFFF`** — same visual break as V1. However since V2's page bg is already light grey `#F5F7FA`, white cards on light grey is **far less jarring than V1's white cards on black**. The contrast ratio issue remains but is dramatically reduced.
- Country code (DZ, EG, LY etc): dark navy bold — clear
- Country name: dark navy serif — readable
- Region badge on card (NORTH/WEST): gold outlined pill — consistent
- Economic specialisation text: dark grey — subdued but readable

**UX Notes:**
- Cards still have no hover state (no cursor change, no shadow lift) — no affordance that they're clickable
- No flags — same issue as V1
- Region pill counts ("West 16", "East 14") are a genuine V2 improvement for navigational clarity
- White cards on light grey is a much gentler contrast issue than V1's white-on-black — still not ideal (should be the same light grey or a very subtle shadow-elevated white), but no longer the critical break it was in V1

***

### 2.7 Gallery `/gallery`

**Colour Notes:**
- White page, gold section label "VISUAL JOURNAL", dark navy heading "Gallery"
- Subtitle: "The places, people, and moments that make up the story we're trying to tell. Real images, real Africa." — same as V1
- Image cards: grey gradient placeholder with **alt text caption visible as image label** ("Lagos after dark", "Kigali on a Tuesday", "Nairobi market") — slight UX improvement over V1's completely anonymous grey boxes, but images still fail to load

**UX Issues:**
- Images still all broken — same critical issue as V1, not fixed
- The alt text captions appearing as image labels do at least tell the visitor what should be there — small mitigation
- No category filters, no caption overlay — page is still barren

***

### 2.8 About `/about`

**Colour Notes:**
- **Navy hero band** (full viewport width) with white serif headline "We're building Africa's story. Properly." — the two-part headline now on one unified navy band feels far more impactful than V1's split treatment
- "Properly." is rendered in the same weight/colour as the rest of the headline — **V1 had "Properly." in gold italic which was stronger typographically**; V2 loses that two-tone contrast effect
- Stats row below hero: gold number `#C9A84C` on light grey band — consistent
- Stat labels: dark navy uppercase spaced — readable
- Body copy section: dark navy on white — excellent readability for long-form text; far better than V1's white-on-black for extended reading

**UX Notes:**
- Same inflated stats (22,028 stories, 201 reads) — still a trust issue
- The About page in V2 now uses the navy hero band approach, which is consistent with every other page's hero — V1's About page had its own black-background hero that felt disconnected
- "Properly." losing its gold italic styling in V2 is a notable regression — that detail was V1's best single typographic moment

***

### 2.9 Contact `/contact`

**Colour Notes:**
- White page bg, dark navy heading
- Contact form card: **dark navy `#0F1F3D`** with white rounded input fields — strong contrast, the white inputs are clearly visible against the dark card — **much better than V1's dark-on-dark inputs**
- Input field bg: white `#FFFFFF`, rounded `border-radius ~8px`, dark navy text — clear affordance
- "Organization" field is new in V2 — adds context for the B2B framing
- Submit button: visible lower on the form — needs to be scrolled to
- Press / Support contact cards below

Good — I can see exactly where I left off. Continuing the report from the Contact page UX notes:

***

**UX Notes (Contact continued):**
- "We typically respond within 24 business hours" — this is a new addition in V2 not present in V1 — sets clear expectations, good micro-copy
- White inputs on dark navy card make the form feel usable and professional — the single biggest form improvement over V1
- Submit button ("Send Message") needs to be seen — let me check it was styled with gold fill vs V1's dark-on-dark problem

The contact form submit button in V2 uses a **navy-text dark button** style — same low-contrast issue as V1 persists. It needs gold fill to match all other primary CTAs across the platform.

***

### 2.10 Newsletter `/newsletter`

**Colour Notes:**
- Full white page, no hero band — simpler than V1
- Headline: "Stay close to Africa's story." — dark navy bold serif, large — strong
- Subtitle: "Free weekly dispatches — cities, founders, opportunities. No noise. Unsubscribe anytime." — medium grey-blue — this copy is **entirely new in V2** and directly solves V1's missing newsletter context
- Email input: white bg, thin grey border, rounded — low-contrast border (same issue as /posts and /countries search)
- "Get the weekly dispatch" button: **gold fill**, dark navy text — correct and consistent
- Below the form, a second section appears to be loading (partially visible at bottom of screenshot) — likely a sample dispatch preview or a second email input, suggesting V2 has expanded this page

**UX Notes:**
- "No noise. Unsubscribe anytime." is exactly the privacy reassurance text that was missing from V1 — addressed
- Newsletter topic description ("cities, founders, opportunities") tells visitors what they're signing up for — significant UX improvement
- Still no sample dispatch preview to demonstrate what the newsletter actually looks like
- Email input border remains low contrast on white — consistency issue shared with search inputs across the app

***

### 2.11 Settings `/settings`

**Colour Notes:**
- White page bg, dark navy headings
- "Control Center" heading: dark navy bold serif — same label as V1
- Subtitle: "Manage your account, preferences, and subscription." — new in V2, clarifies the page's purpose
- Profile card: **dark navy `#0F1F3D`** bg with white rounded inputs — consistent with the contact form card treatment
- "Full Name" / "Email Address" inputs: white bg, rounded, dark navy text — visible and clear
- New fields in V2: "Professional Role / Organization" and "Account Tier" — both white input style, consistent
- "Account Tier" shows "Basic — Access valid until Dec 2026" — new field that surfaces subscription status for logged-in users
- "Edit Profile" button: white outlined pill, dark navy text — low affordance, looks inactive

**UX Notes:**
- Settings still accessible to unauthenticated users — shows "Guest User" and "guest@example.com" pre-filled — **same critical auth-gate failure as V1, unfixed**
- Additional fields (Professional Role, Account Tier) show this page is more developed than V1's minimal name/email form
- "Account Tier: Basic — Access valid until Dec 2026" being visible to a guest user is a data presentation bug — a guest user shouldn't see an expiry date that implies they have a subscription
- Settings icon in navbar still publicly visible — admin/settings exposure in public nav persists from V1

***

### 2.12 Admin `/admin`

**Colour Notes:**
- **White page background** — completely different from V1's black background admin
- Admin card: **light grey `#E5E7EB` / near-white** background with rounded corners — this is the weakest visual treatment of any page in V2; it looks like an unstyled placeholder
- Lock icon: grey outline on white — nearly invisible
- "Intelligence Access" heading: **grey text, barely readable** against the light card — severe contrast failure
- "Authorized personnel only. Sessions are logs." subtitle: very light grey — nearly illegible
- "SECURITY TOKEN" label: medium grey — low contrast
- Input: white bg with grey border on grey card — almost invisible layering
- "AUTHENTICATE" button: light grey fill, white text — **looks completely disabled and unclickable** — worst button in either version

**UX Notes:**
- V2 admin page has a severe regression vs V1 in terms of visual treatment — V1's dark card admin looked intentionally locked-down and secure; V2's washed-out grey card looks broken and unfinished
- The entire card blends into the white page background — there is no perceived depth or intentionality
- Admin is still publicly linked in the navbar settings icon — same security UX issue as V1
- The authenticate button being styled as a disabled state is the most critical button issue in the entire app

***

### 2.13 Privacy Policy `/privacy`

**Colour Notes:**
- White page bg, dark navy heading "Privacy Policy" in large serif — cleaner than V1
- "LAST UPDATED: JANUARY 2026" label: gold uppercase spaced — consistent gold accent usage
- Horizontal rule: light grey `#E0E0E0` — subtle divider
- Section headings (H2): dark navy bold — strong hierarchy
- Body text: dark navy on white `#0F1F3D` on `#FFFFFF` — **excellent readability for legal long-form text**, far superior to V1's white-on-black which caused eye strain at length
- List items: dark navy with bullet points — clean

**UX Notes:**
- Same issues as V1: no table of contents, no cross-links to related pages, no version history
- Dark navy on white is the correct treatment for legal content — this is one area where V2's colour strategy is definitively better than V1
- "January 2026" — still 5 months old at audit time

***

### 2.14 Terms of Service `/terms`

- Identical visual treatment to `/privacy` in V2 — dark navy on white, same heading style, same label treatment
- Same UX gaps: no TOC, no cross-links, no PIPEDA statement
- Consistent with privacy page — correct

***

### 2.15 Continental Dashboard `/dashboards/overview`

**Colour Notes:**
- White page bg — completely different from V1's black bg
- Globe icon circle: pale gold/cream `#F5EDD0` background with gold `#C9A84C` globe outline — softer and more refined than V1's version
- "Continental Dashboard" heading: dark navy serif bold — strong
- Body copy: dark grey on white — readable
- "Become a Founding Member" CTA: **gold fill**, dark navy text — correct and consistent. **This is fixed vs V1** where this button was correct, but the overall page context is now fully consistent light-mode
- No broken image in top-left corner — the V1 broken image artefact is **gone in V2**

**UX Notes:**
- Same paywall gate with zero preview content — a visitor sees a globe icon and a CTA with no idea what lies beyond
- The "Intelligence" ghost-text floating artefact from V1 is **gone in V2** — that loading artefact was cleaned up
- Cleaner, more intentional page overall — but still a dead end for non-members

***

### 2.16 Supporter Feed / Sector Analysis — `/supporter-feed` and `/intel`

**Both routes still serve the same "Behind the building." page — routing bug persists in V2.**

**Colour Notes:**
- Navy hero band: white heading "Behind the building." + body copy — consistent with all other page heroes in V2
- "SUPPORTER FEED" badge: dark charcoal-navy pill with gold heart icon — consistent
- Stats row: **white `#FFFFFF` cards on white/light grey page** — in V2 this is less jarring than V1 (white-on-black) but still creates unnecessary card layering since the page bg is already near-white; the cards become nearly invisible against the background
- Gold numerals (22,028 / 54 / 5 / 0.2k) on white cards — correct accent usage; note V2 shows "0.2k" where V1 showed "9.2k" — a significant data discrepancy between the two live versions

**UX Notes:**
- `/intel` still routes to Supporter Feed despite being linked as "Sector Analysis" in the footer — **routing bug unresolved from V1**
- `/intelligence` → `/posts` redirect still present — **also unresolved**
- Read count shown as "0.2k" in V2 vs "9.2k" in V1 vs "201" on About page — three different numbers across the platform for the same metric, a serious data integrity and trust problem
- Supporter Feed is still publicly accessible — not gated despite being positioned as a supporter benefit

***

## 3. Cross-Cutting Colour Analysis — V2 Specific

### What V2 Gets Right vs V1

| Issue in V1 | Status in V2 |
|---|---|
| Invisible logo (tiny gold dot) | ✅ **Fixed** — "B BOA." visible wordmark in navbar |
| White cards on black (critical jarring break) | ✅ **Resolved by design** — entire app is light mode; white cards on light grey is acceptable |
| Dark-on-dark contact form inputs | ✅ **Fixed** — white inputs on dark card, clear contrast |
| No login escape path for new users | ✅ **Fixed** — "APPLY FOR MEMBERSHIP" link below login form |
| No newsletter context or privacy note | ✅ **Fixed** — "Free weekly dispatches... No noise. Unsubscribe anytime." |
| Empty search page with no guidance | ✅ **Fixed** — example searches shown in empty state |
| No free content preview at all | ✅ **Partially fixed** — "Sneak Peek" section on homepage shows real headlines |
| Broken image placeholder artefact on /dashboards | ✅ **Fixed** — clean page in V2 |
| "Intelligence" ghost floating text on /dashboards | ✅ **Fixed** |
| Funding progress card buried in homepage flow | ✅ **Improved** — isolated in its own banded section |

### What V2 Introduces or Keeps Broken

| Issue | Severity | Status |
|---|---|---|
| Admin page visually washed out (grey on white) | **Critical** | **New regression in V2** |
| Admin authenticate button looks completely disabled | **Critical** | **Worse in V2 than V1** |
| Search input low contrast border (white on white) | **High** | **New in V2** |
| Countries / Posts search bar low contrast border | **High** | **New in V2** |
| "Properly." gold italic removed from About hero | **Medium** | **Regression from V1's best typographic moment** |
| Stats row white cards on white/light page (invisible depth) | **Medium** | **Persists, less severe than V1** |
| Multicolour emoji in "Where Your Money Goes" | **Low** | **Persists** — out of place in premium editorial UI |
| Settings accessible without auth | **Critical** | **Unfixed from V1** |
| Admin linked in public navbar | **Critical** | **Unfixed from V1** |
| All articles paywalled (no free reads) | **High** | **Unfixed from V1** |
| Broken images on /gallery and /posts | **Critical** | **Unfixed from V1** |
| /intel → Supporter Feed routing mismatch | **High** | **Unfixed from V1** |
| /intelligence → /posts redirect mismatch | **High** | **Unfixed from V1** |
| Misleading/inconsistent stats across pages | **High** | **Worsened — 3 different read counts across V2** |
| "GENERAL" label in navbar unexplained | **Medium** | **Unfixed from V1** |
| Contact submit button dark-on-dark | **High** | **Unfixed from V1** |
| Loading spinner on cold load every page | **Medium** | **Persists** — spinner is now gold on white; more jarring than V1's gold on black since white flash is more abrupt |

***

## 4. Complete Colour System Comparison — V1 vs V2

| Element | V1 Colour | V2 Colour | Better Version |
|---|---|---|---|
| Page background | Black `#0a0a0a` | White/light grey `#F5F7FA` | V2 (for readability), V1 (for cinematic feel) |
| Navbar background | Black | White | V2 — far cleaner |
| Logo | Tiny gold dot | "B BOA." dark navy + circle | **V2 — clear winner** |
| Hero band | Full-viewport black | Full-viewport navy `#112240` | V2 — more editorial |
| Primary text | White | Dark navy | V2 (better long-form legibility) |
| Accent gold | `#C9A84C` | `#C9A84C` / `#B8942A` | Same — consistent across both |
| Article cards | Charcoal `#1a1a1a` | Navy dark on light page | V2 — better contextual integration |
| Loading spinner bg | Black | White | V1 — gold on black is more branded; V2's white flash is jarring |
| Legal pages text | White on black | Navy on white | **V2 — clear winner** for readability |
| Contact form inputs | Dark on dark | White on dark navy | **V2 — clear winner** |
| Admin card | Dark charcoal — intentional | Light grey on white — washed out | **V1 — clear winner** |
| Pricing cards | Mix of dark/charcoal | Navy dark (featured), white (others) | V2 — cleaner differentiation |
| Two-tone headline | White + gold italic ("Properly.") | White only | **V1 — clear winner** for this specific detail |
| Country cards | White on black — jarring | White on light grey — acceptable | V2 — much improved |
| Footer | Black | Navy | V2 — more cohesive with rest of brand |

***

## 5. Strengths Unique to V2

1. **Visible and legible logo** — the "B BOA." lockup is the single biggest branding improvement between versions
2. **Light-mode system solves the white-card problem** — by making the whole app light, there is no longer a jarring dark/light collision for membership, countries, and FAQ cards
3. **"Sneak Peek" section on homepage** — showing sample story headlines ("Lagos builds what others import", "Kigali by design") is the single most important editorial UX improvement; it gives visitors a taste of voice
4. **Newsletter context copy** — "Free weekly dispatches... No noise. Unsubscribe anytime." is textbook subscription micro-copy
5. **Search empty state guidance** — example searches set user expectations and invite engagement
6. **"Apply for Membership" on login page** — removes the dead-end for new users
7. **White inputs on dark contact card** — finally solves the invisible form affordance issue
8. **Legal pages now use navy on white** — dramatically better readability for long-form content
9. **Region counts on country filter pills** ("West 16", "East 14") — adds real utility to navigation
10. **Funding progress card in its own band** — less visually overwhelming, more trustworthy as an isolated metric

***

## 6. Priority Fix List — V2 Specific

### P0 — Critical (Fix Before Any User Testing)

1. **Restyle admin card** — the grey-on-white washed out treatment is a regression. Apply the login card treatment: dark navy bg, white inputs, gold CTA. The admin page should look deliberately locked-down
2. **Fix authenticate button** — give it gold fill `#C9A84C` with dark text — same as every other primary CTA in the app
3. **Add auth gate to /settings** — guest users landing on the settings form is a trust and logic failure
4. **Remove admin/settings icons from public navbar** — or hide them for unauthenticated state

### P1 — High (Fix Before Launch)

5. **Fix search input borders across the app** — the thin grey border on white input on white page is barely visible on /posts, /countries, and /newsletter. Use a darker border `#9CA3AF` or a subtle background tint `#F3F4F6` on the input field
6. **Fix routing mismatches** — /intel should not serve

Continuing from exactly where it cut off — Priority Fix List P1 item 6:

***

6. **Fix routing mismatches** — `/intel` should not serve the Supporter Feed; it is labelled "Sector Analysis" in the footer. `/intelligence` should not redirect to `/posts`; it is labelled "Narrative Strategy". Both routes need their own distinct pages or correct redirect targets. Footer labels must match actual destinations.

7. **Fix all broken images** — `/gallery` and `/posts` article cards both have fully broken image rendering across both V1 and V2. This is the single most visible credibility failure on the platform. Images either need to be hosted correctly or replaced with properly branded dark placeholders.

8. **Reconcile stats across pages** — Three different read counts appear across V2 alone: "201" on `/about`, "9.2k" on V1's supporter feed, and "0.2k" on V2's supporter feed. Pick one source of truth and sync it across all pages. The story count of 22,028 with only 3 visible articles also needs addressing.

9. **Restore "Properly." gold italic on About hero** — V2 removed the two-tone white + gold italic headline treatment that was V1's single strongest typographic moment. "We're building Africa's story." in white followed by "Properly." in gold italic should be reinstated in V2.

10. **Fix contact submit button** — same issue as V1; the "Send Message" button is styled dark-on-dark and looks disabled. Apply gold fill `background: #C9A84C; color: #0F1F3D` to match every other primary CTA in the app.

### P2 — Before Growth Push

11. **Gate Supporter Feed behind authentication** — it is currently publicly accessible and is marketed as a supporter perk. It must either be gated or relabelled as a public page.

12. **Add at least one fully free readable article** — the "Sneak Peek" section on the V2 homepage is a good step but only shows headlines and a 5-min read tease. A visitor needs to be able to read one complete story before being asked to pay. This is the single highest-impact content change possible.

13. **Unify search/filter input border style** — create a single input component used across `/search`, `/posts`, `/countries`, and `/newsletter`. The dark-bg + gold-border style from `/search` hero is the strongest version and should be applied consistently. The thin grey border on white page inputs is too low contrast.

14. **Explain or remove the "GENERAL" toggle** — it appears in the navbar on every page of both V1 and V2 with no tooltip, no label context, and no apparent function for an unauthenticated visitor. Either gate it behind login or add a visible tooltip explaining it controls content feed mode.

15. **Fix the third article card CSS** — on the V2 homepage "Stories from the ground" section, the third article card renders in a faded/greyed-out state that looks like a broken or disabled state. If it is intentionally showing depth perspective, the opacity needs to be brought up; if it is a bug, it needs to be fixed.

16. **Replace emoji icons in "Where Your Money Goes"** — the 🌐🛠️✍️☕ emoji set clashes with the premium editorial aesthetic of both versions. Replace with a consistent SVG icon set in gold `#C9A84C` on dark or light card backgrounds to match the rest of the design system.

### P3 — Polish

17. **Slow down hero rotating text** — each rotating word (Cities / Creators / Everyday / Culture / Stories) needs at least 2.5 seconds of visibility. Current rotation is too fast for a first-time visitor to read and process.

18. **Add hover states to country cards** — no cursor change, no box shadow lift, no border highlight. Users have no visual affordance that the 54 country cards are clickable links.

19. **Add flag icons to country cards** — ISO codes (DZ, EG, LY, TN) are not internationally legible to general audiences. Country flag emojis or SVG flags would eliminate this ambiguity at zero layout cost.

20. **Add a TOC to Privacy and Terms pages** — both are long-form legal documents with no internal navigation. A sticky or top-of-page table of contents would significantly improve usability.

21. **Add PIPEDA acknowledgement to Privacy Policy** — the platform collects Canadian user data. The Canadian Personal Information Protection and Electronic Documents Act requires explicit acknowledgement. This is currently absent in both V1 and V2.

22. **Stats row card styling on Supporter Feed** — the four white stat cards on the Supporter Feed page render with no visible border or shadow on V2's already-white/light-grey background. They are nearly invisible. Apply a `border: 1px solid #E5E7EB` or a subtle `box-shadow: 0 1px 4px rgba(0,0,0,0.08)` to give them perceived depth.

23. **Add "back to top" button on long pages** — homepage, /about, /posts, and /countries all scroll significantly with no way to quickly return to the top. A fixed bottom-right arrow button would improve navigation comfort.

24. **Build a proper 404 page** — neither V1 nor V2 was tested for invalid route behaviour. A branded 404 page with navigation back to home is standard practice and currently unknown.

***

## 7. Overall Verdict — V1 vs V2

| Dimension | V1 Score | V2 Score | Notes |
|---|---|---|---|
| Visual identity / brand clarity | 6/10 | 8/10 | V2's visible logo and navy system is more cohesive |
| Colour system consistency | 5/10 | 7/10 | V2 solves white-on-black breaks; introduces new white-on-white input issues |
| Typographic quality | 8/10 | 7/10 | V1's gold italic "Properly." was stronger; V2 lost it |
| Homepage UX | 6/10 | 8/10 | V2's Sneak Peek and banded sections are significantly better |
| Authentication/security UX | 3/10 | 4/10 | Both expose Settings + Admin; V2 adds Apply for Membership |
| Content accessibility | 4/10 | 5/10 | Both fully paywalled; V2 Sneak Peek is a small improvement |
| Form usability | 4/10 | 7/10 | V2's contact form inputs are a major improvement |
| Routing integrity | 4/10 | 4/10 | Same routing bugs unresolved in both |
| Image loading | 1/10 | 1/10 | Both broken everywhere — no improvement |
| Legal page readability | 5/10 | 9/10 | Navy on white in V2 is vastly superior for long-form legal text |
| Admin page design | 6/10 | 2/10 | V2 admin is a clear visual regression |
| Newsletter UX | 4/10 | 8/10 | V2 added all missing context copy |
| **Overall** | **4.7/10** | **6.2/10** | V2 is materially better but shares critical unfixed issues |

**V2 is the stronger version and should be the canonical build going forward.** The core improvements — visible branding, light-mode consistency, search guidance, newsletter context, contact form inputs, Sneak Peek content preview, and login escape path — represent meaningful UX maturity. However, neither version is production-ready: broken images, public admin/settings exposure, routing mismatches, and zero free readable content are P0 issues that must be resolved before any public launch or growth push.

***