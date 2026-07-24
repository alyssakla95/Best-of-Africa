## Issue: Implement sidebar open/close animation
**Type:** Feature  
**Owner:** Mailles  
**Description:**  
Add a smooth open/close animation to the left sidebar navigation so users can toggle it on smaller screens and focus on content when needed.[page:1]

**Acceptance criteria:**
- Sidebar can be opened/closed via a visible control (icon/button).[page:1]
- Animation feels smooth on desktop and mobile.[page:1]
- State persists when navigating between main views (countries/sectors) if technically reasonable.[page:1]

---

## Issue: Improve news carousel layout and images
**Type:** UX / Feature  
**Owner:** Mailles  
**Description:**  
Redesign the news carousel on country pages to better highlight the top story and ensure all images are either copyright‑free or properly licensed.[page:1]

**Acceptance criteria:**
- Top story per country visually distinguished (larger card or hero treatment).[page:1]
- Carousel scrolls smoothly (mouse + touch).[page:1]
- All images sourced from copyright‑free/licensed libraries and tracked in a simple manifest or folder structure.[page:1]

---

## Issue: Enhance sector and volatility visualizations
**Type:** Feature / Data viz  
**Owner:** Mailles  
**Description:**  
Improve visual representation of dominant sectors and volatility so investors can quickly see where growth and risk are concentrated.[page:1]

**Acceptance criteria:**
- Clear visualization (e.g., bar chart or heatmap) of dominant sectors per country.[page:1]
- Volatility signal is visible at a glance (color, icon, or index).[page:1]
- Works well on mobile and desktop.[page:1]

---

## Issue: Set up shared GitHub repo and access
**Type:** Infra  
**Owner:** Mailles  
**Description:**  
Create or finalize the main GitHub repository for Best of Africa and grant full access to Denise and Samito.[page:1]

**Acceptance criteria:**
- Repo created with main branches (e.g., main/dev) and basic README.[page:1]
- Denise and Samito added with appropriate permissions.[page:1]
- Basic contribution workflow documented in README (branching, PRs).[page:1]

---

## Issue: Define and test multi-region backup strategy
**Type:** Infra / Security  
**Owner:** Mailles + Samito  
**Description:**  
Document and implement a backup approach spanning American, Russian, Chinese, and European infrastructure, plus GitHub/Cloudflare.[page:1]

**Acceptance criteria:**
- List of target infrastructures/providers documented.[page:1]
- Automated or semi‑automated backup process defined and tested.[page:1]
- Simple disaster‑recovery checklist created (where code/content lives and how to restore).[page:1]

---

## Issue: Security hardening before public exposure
**Type:** Security  
**Owner:** Mailles  
**Description:**  
Perform a first pass of security hardening and basic penetration testing before any public launch.[page:1]

**Acceptance criteria:**
- Framework and key dependencies updated to stable versions.[page:1]
- Basic auth/roles enforced where needed (no open admin endpoints).[page:1]
- Run at least one basic vulnerability scan / manual checklist and log issues + fixes.[page:1]

---

## Issue: Implement language selector in UI
**Type:** Feature / UX  
**Owner:** Mailles  
**Description:**  
Add a language selector and wire it to existing or planned multilingual content (English, Portuguese, French, German, Mandarin to start).[page:1]

**Acceptance criteria:**
- Language selector visible in a consistent location (e.g., header).[page:1]
- Language choice updates UI strings and, where available, article metadata.[page:1]
- Language preference persists across sessions if possible.[page:1]

---

## Issue: Ensure multilingual coverage for key flows
**Type:** Content / Feature  
**Owner:** Mailles + Samito  
**Description:**  
Prioritize translating or localizing the main user flows (home, country dashboard, key articles) into core languages.[page:1]

**Acceptance criteria:**
- Home and at least N priority country dashboards available in core languages.[page:1]
- No “mixed language” UI for core flows (avoid half‑translated screens).[page:1]
- Simple internal list of which pages are translated to what.[page:1]

---

## Issue: Prototype ad pages and sector-based placements
**Type:** Feature / Monetization  
**Owner:** Mailles  
**Description:**  
Create the first version of dedicated ad spaces and sector‑segmented placements for partners/companies.[page:1]

**Acceptance criteria:**
- Dedicated ad area (page or column) visible but non‑intrusive.[page:1]
- Ability to tie an ad to a specific sector or country.[page:1]
- Demo content for at least one example partner (e.g., River Bridge) for internal review.[page:1]

---

## Issue: Test auto-generated news videos (end-to-end)
**Type:** Experiment / Feature  
**Owner:** Mailles  
**Description:**  
Use a tool like Seedance/CDance to turn at least one article into a telejournal‑style video in more than one language.[page:1]

**Acceptance criteria:**
- At least one article converted to a video in English and one additional language.[page:1]
- Video can be embedded or linked from the corresponding article page.[page:1]
- Short note on workflow and tool limitations captured for future iterations.[page:1]

---

## Issue: Prepare Edge Planner 2 demo build
**Type:** Milestone / Release  
**Owner:** Mailles  
**Description:**  
Assemble a stable demo build (Edge Planner 2) for the next Wednesday session covering key flows and visuals.[page:1]

**Acceptance criteria:**
- Demo includes country dashboard, news carousel, sector visualization, and language selector.[page:1]
- Runs reliably on a standard laptop/browser and at least one mobile device.[page:1]
- Internal walkthrough done before the meeting with a checklist of what to show.[page:1]
