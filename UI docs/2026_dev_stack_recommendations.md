# The 2026 "Student Stack" (Practical Toolkit)

*The exact tools you need to build "A-Grade" projects efficiently.*

## 1. The Core Framework
*   **Next.js (App Router):** The standard. Don't fight it.
    *   *Why:* It handles the "Server vs. Client" mess for you.
    *   *Tip:* Use **React Server Components (RSC)** for all database calls. It keeps your API keys safe without writing a separate backend.

## 2. State Management (Keep it Simple)
*   **Zustand:** For global settings (Theme, Auth User). It's tiny and has no boilerplate.
*   **Signals:** Use these *only* for high-performance UI (like a drag-and-drop betting slip).
*   *Verdict:* Redux is for corporate legacy jobs. Avoid it for personal projects.

## 3. The "Betting App" Special (Real-Time)
*   **TanStack Query + WebSockets:**
    *   *The Pattern:* Use Query for the initial fetch ("Get Odds"). Use a WebSocket to *push* updates directly into the Query Cache.
    *   *Why:* Keeps data fresh without spamming the server with refreshes (essential for live sports).

## 4. Styling
*   **Tailwind v4:** It's faster and configured entirely in CSS.
    *   *Note:* No more `tailwind.config.js`. You just write `@theme { --color-primary: #ff0000; }` in your CSS file.

## 5. Deployment
*   **Vercel / Cloudflare Pages:**
    *   *Why:* Zero config.
    *   *Thunder Bay Note:* Use **Edge Functions**. They run your API code on servers in Toronto/Montreal (closest to you) rather than one central server in Virginia, cutting latency for local users.

---
*Compiled January 6, 2026 based on current React ecosystem standards.*
