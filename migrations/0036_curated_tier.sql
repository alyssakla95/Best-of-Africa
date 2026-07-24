-- Two-tier content model: curated (human-reviewed, personal byline, featured
-- on the magazine front) vs. automated briefing coverage (desk byline).
-- Default 0 = briefing tier; flipping to 1 is an editorial act via admin.
ALTER TABLE articles ADD COLUMN curated INTEGER DEFAULT 0;
