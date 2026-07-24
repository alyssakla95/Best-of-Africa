# LINEAR UI PATTERNS — BOA DESIGN REFERENCE
> Extracted from Cloudflare Browser Rendering crawl of linear.app (March 17, 2026)
> Purpose: UI/UX building reference for Best of Africa platform coding agents
> Format: Structured design pattern library — ready for agent ingestion

---

## AGENT INSTRUCTIONS
When using this file:
1. Every pattern below is a REAL implementation from Linear's live production UI
2. Adapt each pattern to BOA's color system: Deep Navy (#0A0F1E) / White (#FFFFFF) / Gold (#C9A84C)
3. BOA context: Guardian-style pan-African media + intelligence platform
4. Priority: emotional impact, user retention, premium feel, country-hub readability

---

## 1. HERO SECTION PATTERNS

### 1.1 Animated Headline Stack (Linear Homepage)
```
Pattern: Single headline broken into 3 animated lines that cycle/fade
Structure:
  Line 1 (static):     "The product"
  Line 2 (animated):   "development" → cycles between variants
  Line 3 (static):     "system for teams and agents"

BOA Adaptation:
  Line 1: "The intelligence"
  Line 2: [animated] "platform" / "voice" / "gateway"
  Line 3: "for Africa, country by country"

CSS Behavior: opacity + translateY transition, ~0.3s ease, cycles every 2.5s
Emotional effect: Creates sense of living, breathing brand — not static
```

### 1.2 Hero CTA Pair
```
Pattern: Two CTAs side by side — primary (filled) + secondary (ghost/text)
Linear: "Get started" (filled) + "Contact sales" (ghost)

BOA Adaptation:
  Primary:   "Explore Africa"  → filled gold button
  Secondary: "For Partners"    → ghost/outline navy border

Sizing: Primary slightly larger, secondary same height, gap: 12px
Position: Centered below headline, above fold always
```

### 1.3 Full-Bleed Dark Hero
```
Background: Near-black (#0A0A0A on Linear, use #0A0F1E for BOA navy)
Text: Pure white headlines, ~60-72px desktop, 36px mobile
Subtext: Muted white (~70% opacity), 18-20px, max-width 560px centered
Image: OG/hero image used as background with dark overlay (0.6 opacity)

Linear OG pattern: static/og/homepage.jpg
BOA Pattern: Each country hub hero = country landmark photo + dark overlay + country name
```

---

## 2. NAVIGATION PATTERNS

### 2.1 Top Nav Structure
```
Linear pattern:
  LEFT:  Logo
  CENTER: Product | Resources | Customers | Pricing | Now | Contact | Docs
  RIGHT:  "Open app" (ghost) | "Log in" | "Sign up" (filled)

BOA Adaptation:
  LEFT:  BOA Logo (gold wordmark on navy)
  CENTER: Countries | Intelligence | Reports | Events | Market Intel | Library
  RIGHT:  "Explore" (ghost) | "Sign in" | "Subscribe" (gold filled)

Key behavior: Nav dims slightly on scroll (sidebar-dimming pattern from Linear refresh)
```

### 2.2 Sidebar Navigation (App/Dashboard pages)
```
Linear March 2026 UI Refresh notes:
  "Navigation sidebars are slightly dimmer, allowing main content area to stand out more"
  "Headers, navigation, and view controls now consistent across all views"
  "Icons redrawn and resized for consistency"

BOA Implementation:
  - Sidebar: #0D1526 (slightly lighter than main navy bg)
  - Main content: #FFFFFF or #F8F9FA
  - Active item: gold left border (3px) + white text
  - Inactive items: 60% white opacity
  - Sidebar width: 240px desktop, collapses to icon-only on tablet
```

### 2.3 Keyboard-First Navigation
```
Linear pattern: Cmd/Ctrl + K → command menu, numeric shortcuts, global undo
BOA: Implement slash-command "/" for article search, "G+C" for go to countries
Agents note: Every major navigation action should have a keyboard shortcut
```

---

## 3. CARD & CONTENT GRID PATTERNS

### 3.1 Issue/Article Card (List View)
```
Linear list item structure:
  [Status dot] [Title — prominent] [Labels] [Assignee avatar] [Priority icon]
  Hover: subtle background highlight (#F5F5F5 light / #1A2035 dark)
  Click: slide-in detail panel OR full page

BOA Country Article Card:
  [Country flag dot] [Article headline — prominent] [Sector tag] [Read time] [Date]
  Hover: gold left border appears (3px) + slight bg shift
  Click: full article page

Typography: Title 15px semi-bold, meta 12px muted, line-height 1.4
Card height: 48-56px list items for density
```

### 3.2 Project/Feature Card (Board View)
```
Linear board card:
  Top: colored label strip
  Body: title (bold), description snippet (2 lines max, muted)
  Bottom: avatar + priority + date in a flex row

BOA Country Hub Card (grid):
  Top: country flag strip (thin, 4px)
  Body: country name (bold 20px) + 1-line descriptor
  Bottom: top sector + investment score + "Explore →"
  Size: ~280px wide, ~180px tall in 3-col grid
```

### 3.3 Featured/Hero Card (Pulse/Monitor section)
```
Linear Pulse card structure:
  - Full-width banner with status color
  - Bold status text + timestamp
  - Author avatar + name + time ago
  - 2-3 line update text
  - Risk indicator (color coded)

BOA Featured Story Card:
  - Full-width image (16:9, country photo)
  - Gold category tag overlaid bottom-left
  - White headline (24px bold) over dark overlay
  - Author + read time bottom-right
  - Hover: slight scale(1.02) transform
```

---

## 4. TYPOGRAPHY SYSTEM

### 4.1 Scale (extracted from Linear's visual hierarchy)
```
Display / Hero:     60-72px, weight 700, line-height 1.1, letter-spacing -0.02em
H1 Page title:      36-48px, weight 700, line-height 1.2
H2 Section:         24-30px, weight 600, line-height 1.3
H3 Card title:      18-20px, weight 600, line-height 1.4
Body large:         16-18px, weight 400, line-height 1.6
Body default:       14-15px, weight 400, line-height 1.5
Caption/Meta:       12px,    weight 400, line-height 1.4, opacity 0.6
Label/Tag:          11-12px, weight 500, letter-spacing 0.04em, UPPERCASE

BOA Font recommendation:
  Headlines: "Playfair Display" or "Fraunces" (editorial, Guardian-feel)
  Body:      "Inter" or "DM Sans" (clean, legible, modern)
  Mono/Data: "JetBrains Mono" (for intelligence/dashboard numbers)
```

### 4.2 Color-as-Typography (Linear's approach)
```
Primary text:    #FFFFFF on dark / #111827 on light
Secondary text:  rgba(255,255,255,0.6) on dark / #6B7280 on light
Accent text:     Gold #C9A84C (BOA) — use for numbers, stats, highlights
Danger/Alert:    #EF4444 (red) for critical intelligence items
Success:         #22C55E for positive economic indicators
Muted:           rgba(255,255,255,0.35) for timestamps, labels
```

---

## 5. DATA & INTELLIGENCE DISPLAY PATTERNS

### 5.1 Progress/Analytics Bar (Linear Insights)
```
Linear pattern: Horizontal bar charts with:
  - Thin bars (8-12px height)
  - Animated fill on load (0 → value, 0.6s ease-out)
  - Label left, value right, bar fills middle
  - Color: single accent color (Linear uses purple, BOA uses gold)

BOA Use: Country GDP growth bars, sector investment bars, volatility indicators
```

### 5.2 Status/Health Indicators
```
Linear status dots:
  ● Completed:   #22C55E (green)
  ● In Progress: #F59E0B (amber)  ← closest to BOA gold
  ● Todo:        #6B7280 (gray)
  ● Cancelled:   #EF4444 (red)

BOA Country Status (dashboard):
  ● Strong growth:    #22C55E
  ● Moderate:         #C9A84C (BOA gold)
  ● Watch:            #F59E0B
  ● High risk:        #EF4444
  Size: 8px dot, inline with country name
```

### 5.3 Number/Stat Display (Changelog counters)
```
Linear pattern: Large number + small label below, animated count-up
Example: "25,000" product teams — displayed as hero stat

BOA Dashboard stats:
  $4.2T    |    54         |    2.1B
  GDP 2025 | Countries     | People

Styling: 48px bold gold number, 13px white muted label below
Layout: 3-col flex, center-aligned, dividers between
Animation: count-up on scroll-into-view (IntersectionObserver)
```

### 5.4 Timeline/Activity Feed (Linear changelog + issue activity)
```
Pattern: Vertical timeline with:
  - Left: thin vertical line (#E5E7EB light / rgba(255,255,255,0.1) dark)
  - Nodes: small circles on the line (8px, filled with status color)
  - Content: right of line, timestamp above, text below
  - Actor: small avatar (24px) inline with timestamp

BOA Use: Country news feed, investment activity timeline, event calendar
Time format: "2 min ago" / "3 hours ago" / "Mar 11, 2026" — human-readable
```

---

## 6. INTERACTION & MOTION PATTERNS

### 6.1 Micro-animations (Linear's "calmer, more consistent" March 2026 refresh)
```
Principles from Linear's UI refresh:
  - "Easier to scan information"
  - "Sidebars slightly dimmer" — content area is the star
  - "Icons redrawn for consistency" — visual harmony over variety
  - "Consistent headers across all views"

BOA Motion Rules:
  - Page transitions: fade + slight translateY(8px) → 0, 200ms ease
  - Card hover: translateY(-2px) + box-shadow increase, 150ms ease
  - Button hover: background lightens 10%, 100ms
  - Data loads: skeleton shimmer → content fade-in, 300ms
  - NO jarring animations — everything calm and purposeful
```

### 6.2 Loading States
```
Linear skeleton pattern: Gray shimmer blocks matching content shape
  - Text lines: 100% wide, 12px tall, rounded, shimmer animation
  - Cards: full card shape, same dimensions as real card
  - Avatars: circle shimmer

BOA: Navy-tinted skeletons (#1A2540) on dark backgrounds
Shimmer: left-to-right gradient sweep, 1.5s infinite
```

### 6.3 Command Menu / Search (Linear Cmd+K)
```
Structure:
  - Full-screen overlay (backdrop-blur + dark overlay)
  - Centered modal: 600px wide, rounded-xl, dark bg
  - Search input: top, full width, 18px, no border just placeholder
  - Results: categorized list below, keyboard navigable
  - Each result: icon + title + category tag right-aligned

BOA: "/" triggers article/country search overlay
Categories: Countries | Articles | Sectors | Reports | Events
```

---

## 7. SOCIAL PROOF & TRUST PATTERNS

### 7.1 Quote/Testimonial Display (Linear customers)
```
Linear pattern (rotating testimonials):
  "you will just feel it." — Gabriel Peal, OpenAI
  Format: Large quote mark, italic quote text, name + company below

BOA Adaptation (government/partner quotes):
  "Rwanda's story needed a global voice." — [Minister Name], Rwanda Tourism Board
  Format: same — gold quote mark, white italic text, gold name + institution
  Rotation: 3 quotes, auto-rotate every 4s, manual dots below
```

### 7.2 Logo/Partner Strip
```
Linear: "powers over 25,000 product teams" + logo strip
BOA: "Trusted by governments and investors across 54 countries"
     + partner/government logos in grayscale (colorize on hover)
     Strip: horizontal scroll on mobile, static grid on desktop
```

---

## 8. PAGE-LEVEL TEMPLATES

### 8.1 Country Hub Page Structure
```
Inspired by: Linear's feature pages (Agents, Plan, Build sections)
Each section follows: Number → Bold Title → Subtitle → Visual/Demo → CTA

BOA Country Hub:
  [0.0] Hero: Full-bleed country photo + overlay + country name + 1-line descriptor
  [1.0] Stats bar: GDP | Population | Top Sector | Investment Score
  [2.0] Latest Intelligence: 3-col article card grid (most recent first)
  [3.0] Sector Breakdown: horizontal tabs (Tourism | Mining | Finance | Agri)
  [4.0] Featured Story: full-width editorial piece (long-form trigger)
  [5.0] Investment Pulse: mini timeline of recent deals/announcements
  [6.0] Related Countries: 3 cards linking to neighboring/similar countries
```

### 8.2 Article/Story Page Structure
```
Inspired by: Linear changelog entries + Linear Method pages

BOA Article Layout:
  - Sticky nav (disappears on scroll down, reappears on scroll up)
  - Hero image: full-width, max-height 500px, object-fit cover
  - Article header: Category tag (gold) | H1 (48px Playfair) | Byline + date
  - Body: max-width 720px centered, 18px body text, 1.8 line-height
  - Pull quotes: large gold quote, centered, breaks body flow emotionally
  - Data blocks: inline stat cards (navy bg, gold number, white label)
  - Related articles: 3-col grid at bottom
  - CTA: "Subscribe to [Country] Intelligence" — gold button, bottom
```

### 8.3 Dashboard/Intelligence Page
```
Inspired by: Linear Insights, Pulse, Monitor sections

BOA Intelligence Dashboard:
  - Left sidebar: country/sector filter tree (collapsible)
  - Main area: 2-col grid of metric cards
  - Top: date range selector + "Last updated" timestamp
  - Metric card: icon + title + big number + sparkline + trend arrow
  - Bottom: full data table (sortable, filterable)
  - Export: "Download report" button (PDF/CSV)
```

---

## 9. MOBILE PATTERNS

### 9.1 Mobile Navigation
```
Linear mobile: hamburger → full-screen slide-in menu
BOA Mobile:
  - Bottom tab bar (5 items): Home | Countries | Intelligence | Search | Profile
  - Icons: outlined default, filled active, gold tint active
  - Tab bar bg: deep navy, top border: 1px rgba(gold, 0.2)
```

### 9.2 Mobile Article Reading
```
Linear mobile changelog reading pattern:
  - No sidebars — pure single column
  - 16px body, 1.7 line-height (slightly tighter than desktop)
  - Sticky "Back"