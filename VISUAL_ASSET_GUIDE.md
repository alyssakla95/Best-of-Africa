# BOA‑Story — Visual Asset Guide (per page, per section)

A practical, section‑by‑section map of every page in the app, what imagery each
slot needs, and a ready‑to‑use **image brief** (subject, mood, composition,
prompt keywords) plus the exact **spec** (path, aspect ratio, size, treatment)
so you can fetch or generate the right decoration for each component.

> How to use this: find the page → find the section → read the **Brief** for
> what to depict and the **Spec** for how big / where / what treatment. Replace
> the file at the listed path (or add the new path) and the component picks it up.

---

## 0. Brand & visual language (read first — applies everywhere)

**The story we tell:** real, grounded, contemporary Africa — cities, creators,
business, everyday life. **Never** the clichés: no crisis/poverty/charity imagery,
no "starving child / dusty savanna / generic safari" stock, no flags‑and‑maps
clip art. Think premium editorial photography (FT Weekend / Monocle / Rest of
World), dignified people, modern skylines, markets, makers, light.

**Palette (match every image's grade to this):**

| Token | Hex | Use |
|---|---|---|
| Navy | `#0F1F3D` | Hero/footer bands, overlays, primary text |
| Champagne Gold | `#C9A84C` | Accents, CTAs, highlights |
| Pure White | `#FFFFFF` | Page background, cards |
| Ink‑blue | `#586C8D` | Secondary text/meta |

**Type:** Playfair Display (serif headlines), Inter (sans body). Images sit
*behind* serif headlines, so leave calm negative space for text.

**Universal hero treatment (important for consistency):** every full‑bleed hero
now uses two shared utility classes defined in `index.css` — change them once to
re‑grade all heroes at once:

- the `<img>` gets **`hero-photo`** = `opacity: 0.9` (photo is clearly visible)
- the overlay `<div>` gets **`hero-scrim`** = `bg-gradient-to-t from-navy/85
  via-navy/40 to-navy/55` (darkest at the bottom where headlines sit, lightest in
  the middle so the photo reads)
- image is `object-cover`, scaled `1.05` with slow parallax; a gold eyebrow +
  white serif headline (with `drop-shadow`) sits on top.

So: **the photo is meant to show through** — pick a clear focal subject with warm/
golden light and a calmer band where the headline goes. Provide the raw
full‑colour image; the app applies the scrim. (The text‑heavy mission band on the
Landing page intentionally uses a slightly darker scrim + ~0.6 image opacity.)

**Formats & delivery:**
- Photos: `.webp` preferred (fallback `.png`), sRGB, quality ~80.
- Heroes/banners: **2400 × 1350 (16:9)**, < 400 KB after compression.
- Cards/thumbnails: **1200 × 900 (4:3)** or **1200 × 675 (16:9)**.
- Icons/marks: `.svg`.
- Store under `frontend/public/images/` and reference as `/images/<name>`.

**File‑naming convention used today:** `v2_<slot>_<id>.png` (e.g.
`v2_hero_kigali.png`). Keep the same base name to hot‑swap an image with no code
change, or add a new name and update the one component noted below.

---

## 1. Global / shared components (appear on many pages)

### NavBar (`components/NavBar.tsx`)
- **Imagery:** none (text + the "B BOA." mark). Background is white/90 blur.
- **Asset need:** an optional **favicon / logo mark** — a square gold‑on‑navy "B"
  monogram. Spec: `.svg` + `512×512` PNG. Brief: serif "B", champagne gold on
  navy, premium masthead feel.

### Footer (`components/Footer.tsx`)
- Navy band, gold ambient glow (pure CSS). Giant faded "AFRICA." watermark is
  type, not an image. **No photo needed** — keep it clean.

### SafeImage fallback (`components/SafeImage.tsx`)
- When an article/card image 404s, it shows a branded **"B BOA."** card.
- **Asset need (optional):** a tasteful branded placeholder texture. Spec:
  `1200×675`, navy with subtle gold grain. Brief: minimalist brand card, navy
  field, faint champagne particle/topographic texture, centered monogram space.

### Paywall / members‑only cards (`BetaArticle`, `BetaStories`, `BetaCountryHub`)
- Navy cards with gold lock SVG; **no photo**. Leave as‑is (animated on scroll).

### Article hero fallbacks (`/images/fallback_*.png`)
- Used when a story has no hero. Three category placeholders:
  `fallback_business.png`, `fallback_tech.png`, `fallback_culture.png`.
- **High‑value upgrade:** ~34% of articles have no hero, so these are seen a lot.
  Make a richer set (see §3 Article). Spec each: **2400×1350**, navy‑gradable.

---

## 2. Landing / Home — `/` (`pages/beta/BetaLanding.tsx`)

The flagship page. Sections in order:

### 2.1 Hero band (full‑navy, LCP)
- **Slot:** `/images/v2_hero_kigali.png` (parallax bg, opacity 40%, navy wash).
- **Headline over it:** "Africa without the filter." + rotating word
  (Cities / Creators / Culture / Stories).
- **Brief:** a striking modern African **city at golden hour** — Kigali/Nairobi/
  Lagos/Accra skyline or an elevated street scene, contemporary architecture,
  warm low sun, depth. Confident and aspirational, not touristy.
- **Spec:** 2400×1350, dark/warm so white headline pops at 40% opacity. Keep the
  upper‑centre relatively clean for the headline.
- **Prompt keywords:** `modern African metropolis skyline, golden hour, aerial
  editorial photograph, warm cinematic light, glass towers and street life,
  high contrast, premium magazine cover`.

### 2.2 World Cup feature band (TEMPORARY, `components/beta/WorldCupFeature.tsx`)
- Navy band, gold glow, bold **flag‑emoji cards** for African nations still in
  the tournament. Emojis are text — **no image needed**. (Disable via
  `config/worldCup.ts` when the tournament ends.)

### 2.3 Live funding band
- Glass card on white, gold progress bar. **No photo** (data + gold accents).

### 2.4 "Stories from the ground" — content preview
- 3 story cards on **navy** rounded cards; each uses the article's
  `hero_image_url` (or `/images/v2_editorial_{1,2}.png` fallback). First card =
  "Free Read", others blur to a paywall.
- **Brief (editorial fallbacks):** real reportage moments — a market trader, a
  founder in a workshop, a city commute, a creative at work. Documentary, human,
  dignified.
- **Spec:** `v2_editorial_1.png`, `v2_editorial_2.png` at 1600×1200, navy‑gradable
  (they sit under a `from-navy` gradient).

### 2.5 Tiers band ("Fund the platform")
- `MembershipTiersGrid` — cards, gold accents. **No photo.**

### 2.6 Immersive marquee ("A Premium Interface")
- Auto‑scrolling strip of 5 images with a small gold lock + "Cinematic
  Intelligence" caption. Current images:
  `v2_concierge_concrete_*`, `v2_events_concrete_*`, `v2_travel_concrete_*`,
  `v2_hero_kigali.png`, `v2_intel_bg_*`.
- **Brief:** a cohesive set of **moody, premium African scenes** — boardroom/
  summit, business travel (airport lounge, sleek interior), trading‑floor/data,
  cityscape — all dark, concrete/glass, gold rim‑light. They must look like a
  matched set.
- **Spec:** each **1200×900**, portrait‑safe crop, consistent dark grade.

### 2.7 Mission band (full‑navy)
- **Slot:** `/images/v2_real_background.png` (opacity 25%, navy wash). Headline:
  "We're building Africa's story. Properly."
- **Brief:** an **African street at night / dusk**, real and warm — neon, market
  lights, people, motion. Atmospheric, not bleak.
- **Spec:** 2400×1350, very dark (sits at 25% under navy).

### 2.8 Transparency cards ("Where your money goes")
- 4 white cards, **gold line icons on navy circles** (Globe / Wrench / Pen /
  Coffee). Icons are SVG (lucide) — **no photo.**

### 2.9 FAQ + Footer CTA
- Type only. **No photo.**

---

## 3. Article reader — `/posts/:slug` (`pages/beta/BetaArticle.tsx`)

### 3.1 Hero
- **Slot:** `article.hero_image_url` (generated per article). Height 300–400px,
  navy gradient `from-navy via-navy/30`, country **flag emoji** bottom‑left.
- If missing → category fallback (`fallback_business/tech/culture.png`).
- **Brief (the fallbacks — high impact, seen on ~1 in 3 articles):** make a
  broader, on‑brand set keyed to sectors, e.g.
  `fallback_energy.png`, `fallback_finance.png`, `fallback_agri.png`,
  `fallback_health.png`, `fallback_culture.png`, `fallback_tech.png`,
  `fallback_business.png`, `fallback_politics.png`.
  Each: a clean, symbolic, navy‑gradable scene for that sector (solar array;
  trading floor; farmland at dawn; clinic/lab; studio/【culture】; devices/code;
  skyline; civic architecture).
- **Spec:** 2400×1350, must survive the navy gradient + hold a flag overlay
  bottom‑left.

### 3.2 Body, paywall card, post‑read nudge, "More Stories"
- Body is text. Paywall + nudge are **navy/gold cards (no photo)**. "More
  Stories" cards reuse article hero/fallbacks. No new assets.

---

## 4. Stories index — `/posts` (`pages/beta/BetaStories.tsx`)

### 4.1 Hero band
- **Slot:** `/images/v2_editorial_2.png` (opacity 40%, navy wash). Headline
  "Stories from the Continent." + gold "Original Reporting" eyebrow.
- **Brief:** a **newsroom/photojournalism** feel — a reporter's‑eye street scene,
  contact‑sheet energy, multiple African cities implied.
- **Spec:** 2400×1350, dark‑gradable.

### 4.2 Story grid
- Bento grid of cards using each article's `hero_image_url`; no‑hero cards use
  `/images/v2_editorial_{1,2}.png`. Locked cards = navy/gold overlay (no photo).
- **Asset need:** the same editorial fallback set as §3.1 improves this grid most.

---

## 5. Countries index — `/countries` (`pages/beta/BetaCountryTeaser.tsx`)
- Light page, **flag‑emoji cards** in a grid, gold region tabs. **No photos** —
  flags are emoji. Optional: a slim top banner image (continent at night from
  space, gold city lights) — Spec 2400×800 if you add one.

## 6. Country hub — `/countries/:code` (`pages/beta/BetaCountryHub.tsx`)

### 6.1 Hero
- **Slot:** `/images/v2_country_hero.png` (one shared image, opacity 40%, navy
  wash) + giant country flag emoji + country name.
- **Upgrade idea:** per‑region hero images keyed off `country.region`
  (`country_hero_west.png`, `_east`, `_north`, `_central`, `_southern`) so a hub
  feels location‑specific without 54 bespoke shots.
- **Brief:** evocative regional landscape/city — North (Saharan/Mediterranean
  city), West (Lagos/Accra energy), East (Nairobi/Kigali highlands), Southern
  (Cape Town/Jo'burg), Central (Kinshasa/forest‑city). Navy‑gradable.
- **Spec:** 2400×1350 each.

### 6.2 Sentiment scores / sector / narratives / portals
- Data cards, gold bars, lock overlay for non‑members. **No photos.**

---

## 7. Membership — `/membership` (`pages/beta/BetaMembership.tsx`)
- Tiers grid + billing toggle + one‑off tip + FAQ. **No photos** (gold/navy
  cards). Optional: a single warm "founding member" portrait band — Spec
  2000×1100, navy‑gradable, a real person/creator, eye contact, dignified.

## 8. About — `/about` (`pages/beta/BetaAbout.tsx`)

### 8.1 Hero (full‑navy)
- **Slot:** `/images/v2_about_hero.png` (opacity 30%, navy wash). Headline
  "We're building Africa's story. Properly."
- **Brief:** a single **portrait of a young African creator/writer/founder** (the
  "independent voice") OR a quiet desk/notebook‑and‑city‑window scene. Personal,
  hopeful, human.
- **Spec:** 2400×1350, dark‑gradable, subject off to one side.

### 8.2 Live stats strip / "What this is" cards / Why Ko‑fi / CTA
- Type + emoji (✍️ 🚫 🌍 ☕) + gold. **No photos** needed.

---

## 9. Intelligence — `/intelligence` (`pages/beta/BetaIntelligence.tsx`)
- **Hero slot:** `/images/v2_intel_concrete_*.png` (opacity 40%, navy wash),
  "Market Intelligence", "Live Data" gold pill.
- **Brief:** a **data/trading‑floor / control‑room** scene rendered African and
  premium — screens, charts, a modern office at night, gold data glow. Abstract
  is fine. (Members‑only gate below is navy/gold, no photo.)
- **Spec:** 2400×1350, dark. Also reuse `v2_intel_bg.png` / `v2_data_concrete`
  for inner section textures (1600×900).

## 10. Services pages (premium, navy/concrete look)

### 10.1 Events — `/events` (`BetaEvents`)
- **Brief:** an **African business summit / conference** — stage, audience,
  modern venue, gold light. Spec hero 2400×1350. Slot in the events hero
  (`v2_events_concrete_*` is the existing matched texture).

### 10.2 Concierge / Request consultation — `/request-consultation` (`BetaConcierge`)
- **Brief:** discreet luxury‑service feel — a sleek lobby, a handshake, a private
  office. `v2_concierge_concrete_*`. Spec 2400×1350, dark, gold accents.

### 10.3 Business Travel — `/travel` (`BetaTravel`)
- **Brief:** premium **business travel in Africa** — airport lounge, business‑
  class cabin, a sleek car arriving at a city hotel, golden hour. Existing
  `v2_travel_concrete_*`. Spec 2400×1350. (Has an affiliate‑disclosure note —
  imagery should look editorial, not ad‑like.)

## 11. Feed / Daily Briefing — `/feed` (`BetaFeed`)
- Article‑driven; reuses hero/fallback imagery. A slim navy header banner
  optional (2400×700): "Daily Briefing" over a faint cityscape line‑art.

## 12. Supporter Feed — `/supporter-feed` (`BetaMarketIntel`)
- "Where we're reporting" coverage map + cards (members‑only). Map is data, not a
  photo. Optional header texture (`v2_data_concrete`, 1600×900).

## 13. Gallery — `/gallery` (`BetaGallery`)
- **The most image‑hungry page.** A curated grid of the platform's best
  photography. Feed it 12–24 of your strongest **2.x** editorial images
  (1600×1200 each), consistent grade. Brief: the "greatest hits" of authentic
  African life/cities/creators — this is your visual showcase.

## 14. Newsletter — `/newsletter` (`BetaNewsletter`)
- Signup card. Optional warm band image (2000×900, navy‑gradable) of readers /
  a phone with the briefing. Mostly type + gold.

## 15. Utility / legal — `/settings`, `/login`, `/member-access`, `/privacy`, `/terms`, `/contact`, `/search`, `/library`, `/dashboards/overview`, `/admin`
- **Login** (`LoginPage`): has a navy hero with an amber/gold radial **glow
  (CSS, no photo)** — keep clean. Optional faint city‑skyline line‑art behind the
  form (2000×1200, very low contrast).
- The rest are functional (forms, tables, data, gold/navy). **No decorative
  photos** recommended — keep them fast and uncluttered.

---

## 16. Asset checklist (priority order)

| Priority | Asset | Path | Spec | Why |
|---|---|---|---|---|
| ★★★ | Sector article fallbacks (8) | `/images/fallback_<sector>.png` | 2400×1350 | Shown on ~1/3 of all articles + grids |
| ★★★ | Landing hero | `/images/v2_hero_kigali.png` | 2400×1350 | First impression / LCP |
| ★★ | Editorial card images | `/images/v2_editorial_1.png`, `_2.png` | 1600×1200 | Landing + Stories grids |
| ★★ | Marquee set (5, matched) | `v2_*_concrete_*`, `v2_intel_bg` | 1200×900 | Landing "Premium Interface" |
| ★★ | Stories hero | `/images/v2_editorial_2.png` | 2400×1350 | Stories index banner |
| ★★ | Mission band | `/images/v2_real_background.png` | 2400×1350 | Landing mission |
| ★★ | Country hub heroes (per region, 5) | `/images/v2_country_hero*.png` | 2400×1350 | All 54 country hubs |
| ★ | About hero | `/images/v2_about_hero.png` | 2400×1350 | About page |
| ★ | Intelligence hero | `/images/v2_intel_concrete_*.png` | 2400×1350 | Intelligence page |
| ★ | Gallery set (12–24) | `/images/gallery_*.png` | 1600×1200 | Gallery showcase |
| ★ | Brand mark / favicon | `/images/boa_mark.svg` | 512×512 | Navbar / SafeImage fallback |

---

## 17. Reusable generation prompt template

> "Editorial documentary photograph, contemporary **[African city / subject]**,
> **golden‑hour** warm cinematic light, high contrast, premium magazine quality,
> dignified and aspirational, real people / modern architecture, shallow depth of
> field, **dark enough to sit under a deep‑navy gradient at 35% opacity**, leave
> calm negative space top‑centre for a headline. No text, no logos, no flags, no
> poverty/charity clichés, no generic safari."

Swap the bracketed subject per slot using the briefs above, keep the grade
consistent (warm + dark + navy/gold friendly), and every section will feel like
one premium, on‑brand set.
