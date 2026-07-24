# Best of Africa – Mobile Visual Upgrade Spec (2026+ Standard, Audience-Tuned, Layout-Preserving, Strategic 3D)

This spec assumes the **existing information architecture and typography scale are fixed**. We only refine **colors, surfaces, accents, imagery, spacing, motion, states, and strategic 3D usage** to match 2026+ top-tier UI/UX expectations for ministers, fund PMs, and corporate operators.[file:1]

---

## 1. Global Visual System (Audience-Tuned, 2026-Ready)

- **Color & surfaces**
  - Deep navy remains the **primary frame**.
  - Almost all reading and decision surfaces are white cards on navy, so dense intel is easy to scan in varied lighting conditions.
  - Gold is used **surgically**: primary CTAs, key metrics, active filters, thin separators, and a few focus states. Never use gold as a full background or large fill block.

- **Imagery**
  - Imagery is **strictly contextual** in existing slots: flags, tiny abstract maps, logos, small editorial thumbnails.[file:1]
  - Avoid decorative or full-bleed imagery; visuals must clarify *what* and *where* (country, sector, event).

- **Typography**
  - Keep the current editorial typography scale and hierarchy from the app.[file:1]
  - Adjust only:
    - Contrast (navy/dark gray text on white, gold only for accents).
    - Line heights (slightly more generous on narrative sections, slightly tighter on dashboards).
    - Letter spacing for headings to reinforce a calm, institutional feel.

- **Cards & buttons**
  - All existing cards and buttons become **floating tiles**:
    - Same layout and content.
    - Rounded corners (rounded-2xl/3xl), pill-shaped buttons and chips.
    - Soft, consistent shadows (1–2 elevation levels max).
  - Use an 8pt/4pt spacing rhythm so spacing feels methodical and predictable.

---

## 2. Design Tokens & Theming

Define a token set and apply it across all screens (no structural changes):

- **Color tokens (semantic)**
  - `surface.base`: deep navy.
  - `surface.card`: white.
  - `surface.card-elevated`: white with slightly stronger shadow.
  - `text.primary`: navy/dark gray.
  - `text.muted`: soft gray.
  - `accent.gold.primary`: gold for CTAs and key metrics.
  - `accent.gold.subtle`: lighter gold for borders and separators.
  - `border.subtle`: light navy/gray lines.

- **Radius tokens**
  - `radius.card`: large (e.g., 16–24px).
  - `radius.button`: full pill.
  - `radius.chip`: full pill.

- **Shadow tokens**
  - `shadow.low`: light, wide shadows for base cards.
  - `shadow.medium`: slightly stronger for modals/primary cards.

- **Spacing tokens**
  - 4, 8, 12, 16, 24, 32 as core units.
  - Cards respect internal padding in 12–20 range depending on density mode.

- **Theming**
  - Base design for dark-navy / white-card mode.
  - Keep tokens flexible to allow future light-theme or higher-contrast variants without redesigning screens.

---

## 3. Strategic 3D Usage Principles

3D is used **sparingly and strategically** via react-three-fiber to enhance clarity and premium feel, not to replace core UI.[file:1]

- **General principles**
  - Every 3D element must have a **flat, readable counterpart** (numbers, labels, legends, summaries).
  - 3D always sits **behind** type and data in the visual hierarchy.
  - 3D must not meaningfully harm performance or battery life on mid-range mobile devices; provide fallbacks where needed.

- **Hero & branding 3D**
  - **Liquid Metal Hero (Home)**:
    - Keep a restrained 3D liquid/metal sphere as a background accent within the hero card.[file:1]
    - It should be low-contrast, blurred or softened behind text, never obstructing headlines or KPIs.
  - **Golden Pulse (Auth)**:
    - Keep particle flow as a moment of delight.[file:1]
    - Respect “Reduce Motion” settings with a static or gently animated fallback.

- **Data-driven 3D**
  - **Strategic Map (Countries)**:
    - Retain the isometric 3D hex-pillar map, but treat it as a **diagrammatic chart** inside a white card.[file:1]
    - Navy pillars, gold tops for top 3 regions, minimal lighting and simple camera.
    - Always pair with a small legend and short textual summary below.

- **Decorative 3D accents**
  - **Membership Gems**:
    - Keep 3D gems small and secondary, near tier titles.[file:1]
    - Plan details and CTAs sit on flat white cards; copy is primary.
  - **Liquid Chrome Buttons**:
    - Use subtle liquid/3D effects around pill-shaped CTAs.[file:1]
    - Maintain strong contrast for text and accessible hit areas.

- **Fallbacks**
  - Provide non-3D fallbacks (static SVG/PNG or flat illustration) for:
    - Low-power mode.
    - Reduced motion.
    - Devices that cannot render WebGL reliably.

---

## 4. Motion & Micro-Interactions

All motion must be **subtle, purposeful, and respectful of system preferences**.

- **General rules**
  - Use soft easing (e.g., ease-out) and short durations (150–220ms).
  - Respect OS “Reduce Motion” settings by disabling non-essential animations and toning down 3D motion.

- **Suggested interactions**
  - Card hover/tap (where available): slight elevation + shadow increase, tiny scale up (1.01).
  - Filter chips: smooth pill sliding animations on selection, with a quick gold outline fade-in.
  - KPI refresh: numbers softly fade or tick between states on data updates.
  - Loading states: shimmer skeletons on cards and charts instead of spinners.

- **3D-specific motion**
  - Hero sphere: slow, almost imperceptible rotation or surface ripple.
  - Strategic map: minimal camera movement, subtle pulsing of gold tops to indicate activity.
  - Golden pulse: controlled, low-intensity particle motion.

---

## 5. Density Modes (Comfortable vs Compact)

Without changing layout, offer two visual densities on key intel views (e.g., Countries, Country Detail, Dashboards):

- **Comfortable mode (default)**
  - Slightly larger padding and line height.
  - Ideal for ministers, senior execs, and occasional users.

- **Compact mode (optional)**
  - Reduced vertical padding and slightly tighter line height inside cards.
  - Chart labels lean to smaller side of the scale.
  - Ideal for PMs, analysts, and heavy users who want “Bloomberg-lite” density.

Toggle can be:
- A per-user setting in profile, or
- A simple “Display density: Comfortable / Compact” control on dashboards.

---

## 6. Input & State Affordances

Modern, high-UX patterns for all existing form fields and interactive controls.

- **Chips & filters**
  - Default: white pill, navy text.
  - Hover/pressed (where applicable): slight shadow, darker navy text.
  - Active: thin gold outline, small gold dot or icon to indicate selection.

- **Form fields**
  - White fields on navy or within white cards.
  - Clear label, input, and helper text hierarchy.
  - Focus state: subtle gold border or bottom line.
  - Error state: muted red border with short, clear error text.
  - Success state (where relevant): subtle green icon or border accent.

- **Buttons**
  - Primary: gold pill with navy text.
  - Secondary: white pill with navy text and navy border.
  - Tertiary: text button, navy text with no background, used for “Learn more” or inline actions.

---

## 7. Empty, Loading, and Degraded States

Every key module gets explicit states to feel robust and 2026-ready:

- **Loading states**
  - Skeleton loaders for cards, lists, and charts.
  - Shimmer animation in a neutral gray, not gold.

- **Empty states**
  - Short explanatory sentence.
  - One primary suggested action (e.g., “Adjust filters”, “Add preferences”, “Try another timeframe”).
  - Minimal, abstract icon (line-art, navy/gray).

- **Degraded/partial data states**
  - Clear text indicating data is partial, delayed, or estimated.
  - Visual indicator (small subtle badge) on affected charts or cards.
  - Avoid hiding cards entirely; show what you can with a disclaimer.

---

## 8. AI Affordances

Where AI is present (insights, summaries, generated content), keep it **trustworthy and understated**.

- **Visual affordances**
  - Tiny, consistent AI icon (e.g., spark or small 3-node symbol).
  - Short label like “AI-generated briefing” or “AI summary”.
  - Timestamp or recency indicator where relevant (e.g., “Updated 5 min ago”).

- **Interactivity (optional later phase)**
  - Lightweight “Refine” or “Ask a follow-up” micro-CTA, leading to a focused interaction, not a full chat UI.
  - Keep these interactions inline and contextual, not as a separate mode.

---

## 9. Screen-by-Screen Visual Enhancement

### 9.1 Home – “Strategic Narrative Hub” (Ministers & Senior Execs)

- **Hero card**
  - Keep current hero layout and content.[file:1]
  - White card on navy, soft shadow.
  - Faint abstract Africa map watermark.
  - Subtle 3D liquid sphere behind text (low contrast, non-intrusive).
  - Typography and KPIs remain primary.

- **Strategic themes / bento**
  - Keep current bento layout (Infrastructure, Energy, Tech, Governance).[file:1]
  - Each tile: white card, one bold metric, tiny gold trend indicator (up/down/neutral).
  - No extra decorative imagery.

- **Editorial article list**
  - Retain current list structure.
  - White list cards with:
    - Small left thumbnail.
    - Right stack: tag, headline, one-line summary.
  - Emphasize spacing for easy vertical scanning.

---

### 9.2 Countries – “Map & Ranking” (Analysts & Policy Teams)

- **Strategic map card**
  - Keep placement and concept: 3D hex-pillar map driven by live data.[file:1]
  - Visually simplify into a diagrammatic style inside a white card:
    - Navy pillars, gold tops on top 3 regions.
    - Minimal lighting and camera movement.
  - Small clean legend + short textual summary below.

- **Region filters**
  - Keep behavior and position.
  - White pill chips on navy:
    - Active: thin gold outline + small gold marker/icon.
    - Inactive: navy text, no gold.

- **Country ranking list**
  - Preserve layout.
  - Emphasize ranking visually:
    - Left: flag + name.
    - Right: stacked metrics + tiny gold sparkline.
  - Ensure quick vertical scanning for comparisons.

---

### 9.3 Country Detail – “Decision Briefing” (Briefings & Decks)

- **Header**
  - Keep flag, country name, tags.[file:1]
  - White bar style:
    - Status tags as slim pills outlined in gold.
    - Clear spacing so it screenshots well for decks.

- **Bento intel cards**
  - Keep same cards and positions (Macro Snapshot, Key Sectors, Narrative Trends, Recent Events, Opportunities).[file:1]
  - Single-focus visual style:
    - One headline stat.
    - One tiny chart.
    - One concise explanatory line.
  - White backgrounds, gold only for accents.

- **AI insight section**
  - Same position and role.
  - Reading-optimized white card:
    - Comfortable line length and line spacing.
    - Tiny gold AI icon + subtle “AI-generated briefing” label.

---

### 9.4 Dashboards – “At-a-glance Control Room” (Fund PMs & Power Users)

- **Top filters**
  - Keep Regions/Sectors/Themes in place.[file:1]
  - Style as white segmented pills on navy:
    - Active: gold outline, slightly elevated.
    - Inactive: navy text only.

- **Analytics card grid**
  - Preserve grid and chart types.
  - White card surfaces, fine gridlines, minimal labels.
  - Use gold sparingly on peak bars, key metrics, or threshold lines.

- **Global Pulse card**
  - Same location and role.[file:1]
  - Dual line chart: navy base + gold overlay.
  - 2–3 succinct bullets underneath summarizing change and impact.

- **Density modes**
  - This screen especially supports Comfortable / Compact visual density toggles.

---

### 9.5 Membership & Services – “Trust and Clarity” (Institutional Buyers)

- **Hero section**
  - Keep current structure and copy.[file:1]
  - White card presentation:
    - Title + one supporting line.
    - Very subtle navy gem motif in the background.

- **Tier cards**
  - Observer / Strategist / Diplomat order and content preserved.[file:1]
  - White tiles on navy:
    - Small 3D or pseudo-3D gem accent near title (non-dominant).[file:1]
    - One-line positioning statement.
    - Three sharp bullet benefits.
    - Full-width gold pill CTA.

- **Secondary services footer**
  - Keep existing links (Travel, Custom Intel, API).[file:1]
  - Slim white strip with navy icons + labels.
  - Clear indication that these are additional services, not primary CTAs.

---

### 9.6 Travel & Corporate Support – “Operational UX” (Ops Teams & PAs)

- **Progress/steps**
  - Keep step logic.
  - White header with thin navy progress line:
    - Single filled gold dot for current step.
  - Designed for quick at-a-glance parsing.

- **Service cards**
  - Preserve existing card content and order.[file:1]
  - Compact white tiles:
    - Clear title.
    - One-line explanation.
    - Tertiary navy “Learn more” text button.

- **Booking widget**
  - Preserve field structure (dates, country, passengers/purpose).[file:1]
  - White card:
    - Two date pickers.
    - Row of country chips.
    - Purpose selector.
    - Wide, centered gold pill button: “Request Itinerary”.

---

## 10. Implementation & Validation

- Do **not** change:
  - Layout structure.
  - Page routing and flow.
  - Core content hierarchy or typographic scale.[file:1]

- Focus on:
  - Applying tokens (color, spacing, shadows, radii).
  - Consistent interactive states, motion, 3D behavior, and states (loading/empty/degraded).
  - Comfortable & compact visual density variants on high-intel screens.

- Validate with:
  - Ministers / senior policy: readability, clarity of narrative and key signals.
  - Fund PMs / analysts: density, comparative scanning, dashboard usefulness.
  - Corporate operators / PAs: speed of completion for travel/ops tasks.
  - Cross-device and low-end device testing for 3D performance and fallbacks.

This spec is a **high-quality, shippable 2026 baseline** that leverages **minimal, strategic 3D** to enhance clarity and perceived premium value without compromising institutional usability.[file:1]
