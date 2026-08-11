-- Moderated public knowledge network for Enterprise audiences, specialists and readers.
-- Private marketplace requests and screening records remain in their existing tables.

CREATE TABLE IF NOT EXISTS knowledge_groups (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    group_type TEXT NOT NULL CHECK (group_type IN (
        'enterprise_audience', 'region', 'sector', 'profession', 'language', 'decision'
    )),
    description TEXT NOT NULL,
    audience_summary TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_knowledge_groups_public
    ON knowledge_groups(is_active, group_type, sort_order, name);

CREATE TABLE IF NOT EXISTS knowledge_group_memberships (
    group_id TEXT NOT NULL REFERENCES knowledge_groups(id),
    client_id TEXT NOT NULL REFERENCES clients(id),
    specialist_profile_id TEXT REFERENCES specialist_profiles(id),
    member_role TEXT NOT NULL DEFAULT 'contributor'
        CHECK (member_role IN ('participant', 'contributor', 'moderator')),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    evidence_summary TEXT NOT NULL,
    review_notes TEXT,
    reviewed_by TEXT,
    reviewed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (group_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_group_memberships_public
    ON knowledge_group_memberships(group_id, status, member_role);

CREATE TABLE IF NOT EXISTS knowledge_contributions (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES knowledge_groups(id),
    parent_id TEXT REFERENCES knowledge_contributions(id),
    author_client_id TEXT REFERENCES clients(id),
    author_profile_id TEXT REFERENCES specialist_profiles(id),
    author_display_name TEXT NOT NULL,
    author_role TEXT NOT NULL CHECK (author_role IN ('reader', 'specialist', 'enterprise', 'editorial')),
    contribution_type TEXT NOT NULL CHECK (contribution_type IN (
        'field_signal', 'expert_explanation', 'evidence_challenge', 'enterprise_question',
        'reader_question', 'country_perspective', 'sector_perspective', 'decision_reflection'
    )),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    countries TEXT NOT NULL DEFAULT '[]',
    sectors TEXT NOT NULL DEFAULT '[]',
    source_urls TEXT NOT NULL DEFAULT '[]',
    fact_basis TEXT NOT NULL CHECK (fact_basis IN (
        'sourced_analysis', 'professional_experience', 'question', 'consented_learning'
    )),
    conflict_disclosure TEXT,
    no_sensitive_data_confirmed INTEGER NOT NULL DEFAULT 1
        CHECK (no_sensitive_data_confirmed IN (0, 1)),
    public_identity_confirmed INTEGER NOT NULL DEFAULT 0
        CHECK (public_identity_confirmed IN (0, 1)),
    moderation_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    moderation_notes TEXT,
    moderated_by TEXT,
    moderated_at TEXT,
    published_at TEXT,
    corrected_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_knowledge_contributions_public
    ON knowledge_contributions(moderation_status, published_at DESC, group_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_contributions_author
    ON knowledge_contributions(author_client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_contributions_parent
    ON knowledge_contributions(parent_id, moderation_status, published_at);

CREATE TABLE IF NOT EXISTS knowledge_reactions (
    contribution_id TEXT NOT NULL REFERENCES knowledge_contributions(id),
    client_id TEXT NOT NULL REFERENCES clients(id),
    reaction_type TEXT NOT NULL DEFAULT 'useful' CHECK (reaction_type = 'useful'),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (contribution_id, client_id, reaction_type)
);

CREATE TABLE IF NOT EXISTS knowledge_group_follows (
    group_id TEXT NOT NULL REFERENCES knowledge_groups(id),
    client_id TEXT NOT NULL REFERENCES clients(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (group_id, client_id)
);

INSERT OR IGNORE INTO knowledge_groups (id, slug, name, group_type, description, audience_summary, sort_order) VALUES
('kg-enterprise-companies', 'companies-market-entry', 'Companies and market-entry teams', 'enterprise_audience', 'Expansion, operating-model, partnership and market-selection questions for corporate decision teams.', 'For strategy, growth, investment and operating teams comparing African markets.', 10),
('kg-enterprise-investors', 'investors-financial-institutions', 'Investors and financial institutions', 'enterprise_audience', 'Investment screening, commercial diligence, capital allocation and portfolio operating questions.', 'For investors, banks, asset managers, development finance and transaction teams.', 20),
('kg-enterprise-public', 'governments-development-institutions', 'Governments and development institutions', 'enterprise_audience', 'Implementation, trade, investment-promotion, infrastructure and evidence-policy questions.', 'For public institutions, multilaterals and development organizations.', 30),
('kg-enterprise-advisers', 'professional-advisers-research', 'Professional advisers and research organizations', 'enterprise_audience', 'Cross-border legal, regulatory, economic, research and implementation perspectives.', 'For advisers and researchers supporting consequential decisions.', 40),
('kg-enterprise-networks', 'african-diaspora-business-networks', 'African and diaspora business networks', 'enterprise_audience', 'Cross-market operating knowledge, partnerships and diaspora-connected commercial experience.', 'For business networks connecting continental and international experience.', 50),
('kg-region-north', 'north-africa', 'North Africa', 'region', 'Country and cross-border perspectives from North African markets.', 'Follow evidence, questions and specialist explanations across North Africa.', 100),
('kg-region-west', 'west-africa', 'West Africa', 'region', 'Country and cross-border perspectives from West African markets.', 'Follow evidence, questions and specialist explanations across West Africa.', 110),
('kg-region-central', 'central-africa', 'Central Africa', 'region', 'Country and cross-border perspectives from Central African markets.', 'Follow evidence, questions and specialist explanations across Central Africa.', 120),
('kg-region-east', 'east-africa', 'East Africa', 'region', 'Country and cross-border perspectives from East African markets.', 'Follow evidence, questions and specialist explanations across East Africa.', 130),
('kg-region-southern', 'southern-africa', 'Southern Africa', 'region', 'Country and cross-border perspectives from Southern African markets.', 'Follow evidence, questions and specialist explanations across Southern Africa.', 140),
('kg-decision-entry', 'market-entry', 'Market entry and expansion', 'decision', 'Evidence and practical questions for choosing, sequencing and entering markets.', 'For readers and teams evaluating where and how to enter.', 200),
('kg-decision-investment', 'investment-diligence', 'Investment diligence', 'decision', 'Evidence challenges, operating context and verification priorities for investment decisions.', 'For teams testing an investment thesis before commitment.', 210),
('kg-decision-regulation', 'regulation-policy', 'Regulation and policy', 'decision', 'Plain-language explanations of regulatory change, implementation and uncertainty.', 'For readers and decision teams tracking rules and institutional execution.', 220),
('kg-decision-supply', 'supply-chains-trade', 'Supply chains and trade', 'decision', 'Trade corridors, logistics, sourcing, customs and cross-border operating perspectives.', 'For operators assessing movement, resilience and market access.', 230),
('kg-sector-finance', 'finance-investment', 'Finance and investment', 'sector', 'Financial-market, banking, capital and investment perspectives.', 'For readers and practitioners following finance and investment.', 300),
('kg-sector-energy', 'energy-infrastructure', 'Energy and infrastructure', 'sector', 'Energy systems, transport, construction and infrastructure delivery perspectives.', 'For readers and practitioners following physical and energy systems.', 310),
('kg-sector-agriculture', 'agriculture-food', 'Agriculture and food systems', 'sector', 'Production, processing, trade, food security and value-chain perspectives.', 'For readers and practitioners following agriculture and food markets.', 320),
('kg-sector-technology', 'technology-digital-economy', 'Technology and the digital economy', 'sector', 'Technology markets, digital infrastructure, platforms and innovation perspectives.', 'For readers and practitioners following digital markets.', 330),
('kg-profession-operators', 'operators-founders', 'Operators and founders', 'profession', 'Practical operating and company-building experience across African markets.', 'For grounded lessons from people who have operated businesses and institutions.', 400),
('kg-profession-policy', 'regulators-policy-specialists', 'Regulators and policy specialists', 'profession', 'Institutional, legal and implementation perspectives from policy practitioners.', 'For evidence-led explanations of rules, institutions and execution.', 410),
('kg-profession-research', 'economists-researchers', 'Economists and researchers', 'profession', 'Economic interpretation, methods, limitations and evidence challenges.', 'For readers who want the reasoning and boundaries behind economic claims.', 420),
('kg-language-fr', 'francophone-markets', 'Francophone markets', 'language', 'French-language and Francophone-market perspectives.', 'For knowledge that requires Francophone market and language context.', 500),
('kg-language-pt', 'lusophone-markets', 'Lusophone markets', 'language', 'Portuguese-language and Lusophone-market perspectives.', 'For knowledge that requires Lusophone market and language context.', 510),
('kg-language-ar', 'arabophone-markets', 'Arabic-speaking markets', 'language', 'Arabic-language and Arabic-speaking-market perspectives.', 'For knowledge that requires Arabic-language and market context.', 520);
