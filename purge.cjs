const { execSync } = require('child_process');
const fs = require('fs');

function runSql(filename, sql) {
    fs.writeFileSync(filename, sql);
    try {
        console.log(`Running ${filename}...`);
        execSync(`npx wrangler d1 execute best-of-africa-db --remote --file=${filename}`, { stdio: 'inherit' });
    } catch (e) {
        console.log(`Warning: ${filename} failed`);
    }
}

// 1. Drop FTS
runSql('step1_drop_fts.sql', `
DROP TRIGGER IF EXISTS articles_ai;
DROP TRIGGER IF EXISTS articles_ad;
DROP TRIGGER IF EXISTS articles_au;
DROP TABLE IF EXISTS articles_fts;
`);

// 2. Empty dependent tables
const tables = [
  "ingested_items", "headline_tests", "content_refinements", "bookmarks", 
  "narrative_articles", "article_translations", "user_notifications", 
  "social_posts", "alert_notifications", "search_notifications", 
  "moderation_results", "article_feedback", "article_audits"
];
runSql('step2_deps.sql', tables.map(t => `DELETE FROM ${t};`).join('\n'));

// 3. Batch delete articles (10 passes of 50 = 500 articles at a time)
fs.writeFileSync('step3_del.sql', 'DELETE FROM articles WHERE id IN (SELECT id FROM articles LIMIT 200);\n'.repeat(5));

console.log("Batch deleting articles...");
for (let i = 0; i < 4; i++) {
    console.log(`Batch ${i+1}...`);
    try {
        execSync(`npx wrangler d1 execute best-of-africa-db --remote --file=step3_del.sql`, { stdio: 'inherit' });
    } catch (e) {
        console.log("Error or empty", e.message);
    }
}

// 4. Recreate FTS and reset tasks
runSql('step4_recreate.sql', `
CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(id UNINDEXED, title, summary, content, content='articles', content_rowid='rowid');
CREATE TRIGGER articles_ai AFTER INSERT ON articles BEGIN INSERT INTO articles_fts(rowid, id, title, summary, content) VALUES (new.rowid, new.id, new.title, new.summary, new.content); END;
CREATE TRIGGER articles_ad AFTER DELETE ON articles BEGIN INSERT INTO articles_fts(articles_fts, rowid, id, title, summary, content) VALUES ('delete', old.rowid, old.id, old.title, old.summary, old.content); END;
CREATE TRIGGER articles_au AFTER UPDATE ON articles BEGIN INSERT INTO articles_fts(articles_fts, rowid, id, title, summary, content) VALUES ('delete', old.rowid, old.id, old.title, old.summary, old.content); INSERT INTO articles_fts(rowid, id, title, summary, content) VALUES (new.rowid, new.id, new.title, new.summary, new.content); END;
UPDATE agent_tasks SET status = 'pending', result = NULL, error_message = NULL, completed_at = NULL WHERE type = 'generate_article';
`);

console.log("Done!");
