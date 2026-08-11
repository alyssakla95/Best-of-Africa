-- Founding-network standing and evidence-based verification.
-- Listing waivers are an operator decision and are deliberately independent
-- from verification level so payment can never purchase a stronger badge.

ALTER TABLE specialist_profiles ADD COLUMN verification_level TEXT NOT NULL DEFAULT 'boa_specialist'
    CHECK (verification_level IN ('boa_specialist', 'verified', 'senior_featured'));

ALTER TABLE specialist_profiles ADD COLUMN verification_summary TEXT;

ALTER TABLE specialist_profiles ADD COLUMN founding_cohort INTEGER NOT NULL DEFAULT 0
    CHECK (founding_cohort IN (0, 1));

ALTER TABLE specialist_profiles ADD COLUMN listing_fee_waived INTEGER NOT NULL DEFAULT 0
    CHECK (listing_fee_waived IN (0, 1));

ALTER TABLE specialist_profiles ADD COLUMN listing_fee_waived_until TEXT;

CREATE INDEX IF NOT EXISTS idx_specialist_profiles_cohort_level
    ON specialist_profiles(founding_cohort, verification_level, is_listed);
