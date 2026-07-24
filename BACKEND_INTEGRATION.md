# Backend Integration Plan: "The Rational Ecosystem"

**Version:** 3.0 (The Complete Platform)
**Target:** Transform the frontend into a fully persistent, data-driven intelligence platform.

---

## 1. Executive Summary

We have successfully established the frontend aesthetic ("Industrial Luxury") and basic connectivity. The next phase is **Deep Integration**, ensuring every interactive element—from "Book Concierge" to "Narrative Analysis"—is backed by a robust, scalable schema.

**Current State:**

* Auth: Basic JWT (Implemented)
* Market Data: Seeded (0003)
* Bookmarks: Session-based (0004)

**Missing Links (The Gaps):**

1. **Narrative Engine:** Structured storage for "Narrative Themes" (not just articles).
2. **Corporate Booking:** A dedicated referral/concierge request system.
3. **Diplomatic Summits:** Event management and registration.
4. **Advanced Vector Search:** Integrating `Cloudflare Vectorize` for semantic RAG.

---

## 2. Database Schema Expansion (SQL)

We need a new migration (`0005_ecosystem.sql`) to handle the specialized features.

### A. Narrative Architecture (The "Strategy" Layer)

**Objective:** Store high-level narrative themes (e.g., "Kenya Tech Hub") separately from news articles, allowing them to be tracked, scored, and managed as strategic assets.

```sql
CREATE TABLE narratives (
    id TEXT PRIMARY KEY,
    country_code TEXT REFERENCES countries(code),
    sector_id TEXT REFERENCES sectors(id),
    title TEXT NOT NULL,         -- e.g. "Silicon Savannah"
    description TEXT,
    tone TEXT DEFAULT 'Neutral', -- e.g. 'Optimistic', 'Critical'
    status TEXT DEFAULT 'Active',
    priority_score INTEGER,      -- 1-100
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Link Articles to Narratives (Many-to-Many)
CREATE TABLE narrative_articles (
    narrative_id TEXT REFERENCES narratives(id),
    article_id TEXT REFERENCES articles(id),
    relevance_score REAL,        -- 0.0 to 1.0 (Vector Distance)
    PRIMARY KEY (narrative_id, article_id)
);
```

### B. Corporate Services (The "Utility" Layer)

**Objective:** Handle high-value user intents like travel bookings and summit registrations.

```sql
-- Booking Requests (Concierge)
CREATE TABLE booking_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES clients(id), -- Optional (can be guest)
    service_type TEXT, -- 'Hotel', 'Flight', 'Concierge', 'Visa'
    destination_country TEXT REFERENCES countries(code),
    dates_json TEXT,   -- { start, end }
    requirements TEXT, -- e.g. "Executive Suite, Security Detail"
    status TEXT DEFAULT 'New', -- New, Processing, Confirmed, Closed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Events & Summits
CREATE TABLE events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date DATETIME NOT NULL,
    location TEXT,
    capacity INTEGER,
    is_exclusive BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Event Registrations
CREATE TABLE event_registrations (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id),
    user_email TEXT NOT NULL,
    ticket_type TEXT DEFAULT 'Standard',
    status TEXT DEFAULT 'Pending'
);
```

---

## 3. API Specification Updates

### A. Narrative Intelligence

**Endpoint:** `GET /api/v1/narratives/:country_code`
**Logic:**

1. Fetch active `narratives` for the country.
2. Join with `narrative_articles` to get article counts and average sentiment.
3. Return a structured "Strategic Brief" object.

### B. Booking & Concierge

**Endpoint:** `POST /api/v1/services/booking`
**Request:**

```json
{
  "service": "Concierge",
  "destination": "KE",
  "requirements": "Need armored transport from NBO to CBD."
}
```

**Logic:**

1. Store in `booking_requests`.
2. Trigger **Email Notification** (via Cloudflare Email Routing or Resend) to `concierge@bestofafrica.com`.
3. Return `request_id` to frontend for tracking.

### C. Vector Search (RAG)

**Endpoint:** `GET /api/v1/search/semantic`
**Logic:**

1. Generate Embedding for User Query (using `bge-base-en-v1.5` on Workers AI).
2. Query `Vectorize` index for nearest article chunks.
3. Retrieve full article metadata from D1.
4. (Optional) Pass chunks to LLM for summary generation.

---

## 4. Implementation Constraints & Standards

1. **Strict Typing:** All Cloudflare Worker routes must leverage the `Hono` Zod validator to ensure type safety matching the frontend `types/index.ts`.
2. **Edge Caching:** Public GET endpoints (Sectors, Countries) must cache for 60 seconds (`Cache-Control: public, max-age=60`).
3. **Error Handling:** structured JSON errors `{ success: false, error: "..." }`, never raw HTML traces.
4. **Icons vs Emojis:** The backend must **NEVER** return emoji strings for status or icons. It should return status enums (`critical`, `stable`) which the frontend maps to Radix Icons. `flag_emoji` is the ONLY exception.

---

## 5. Implementation Status

### ✓ Completed

1. [x] Migration `migrations/0006_ecosystem.sql` exists with all required schemas
2. [x] Router `src/routes/narratives.ts` fully implemented with CRUD endpoints
3. [x] Router `src/routes/services.ts` fully implemented with booking and events endpoints
4. [x] `servicesRouter` registered in `src/index.ts` at `/api/v1/services`
5. [x] Type definitions for `BookingRequest`, `Event`, and `EventRegistration` added to `src/types/index.ts`
6. [x] Vector Search (RAG) endpoint `GET /api/v1/search/semantic` implemented in `src/routes/search.ts`
   * Uses `bge-base-en-v1.5` for embeddings via Workers AI
   * Queries Cloudflare Vectorize for semantic search
   * Generates AI summary via `llama-3.1-8b-instruct` (cached 10 min)

### 🔄 Deployment Required

1. [ ] Apply migration `0006_ecosystem.sql` to production D1 database

   ```bash
   npx wrangler d1 migrations apply <database-name> --remote
   ```

### 📋 Future Enhancements

1. [ ] Implement email notifications for booking requests (see TODO in `services.ts:68`)
2. [ ] Build frontend components to consume new endpoints
3. [ ] Implement vector search integration for narrative-article linking
4. [ ] Add edge caching to public GET endpoints for performance

### 📚 API Documentation

See [walkthrough.md](file:///C:/Users/hp/.gemini/antigravity/brain/fad965b6-77ac-4442-aa9a-af52f46a4eee/walkthrough.md) for complete endpoint documentation and integration guide.
