
import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'path';

// Interface for common DB operations
export interface DB {
    run(sql: string, params?: any[]): Promise<any>;
    get(sql: string, params?: any[]): Promise<any>;
    all(sql: string, params?: any[]): Promise<any[]>;
}

class SQLiteDB implements DB {
    private db: Database.Database;

    constructor() {
        console.log("Initializing SQLite DB...");
        this.db = new Database(path.join(process.cwd(), 'video_agent.db'));
        this.db.pragma('journal_mode = WAL');
        this.initSchema();
    }

    private initSchema() {
        const schema = `
        CREATE TABLE IF NOT EXISTS article_videos (
            article_id TEXT PRIMARY KEY,
            status TEXT NOT NULL CHECK (status IN ('pending', 'generating', 'ready', 'failed')),
            seedance_video_id TEXT,
            video_url TEXT,
            variant TEXT DEFAULT 'tourist',
            priority TEXT DEFAULT 'normal',
            prompt_used TEXT,
            attempts INTEGER DEFAULT 0,
            last_attempt_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_video_queue ON article_videos(status, priority, created_at);
        `;
        this.db.exec(schema);
    }

    async run(sql: string, params: any[] = []): Promise<any> {
        const stmt = this.db.prepare(sql);
        return stmt.run(...params);
    }

    async get(sql: string, params: any[] = []): Promise<any> {
        const stmt = this.db.prepare(sql);
        return stmt.get(...params);
    }

    async all(sql: string, params: any[] = []): Promise<any[]> {
        const stmt = this.db.prepare(sql);
        return stmt.all(...params);
    }
}

class PostgresDB implements DB {
    private pool: Pool;

    constructor(connectionString: string) {
        console.log("Initializing Postgres DB...");
        this.pool = new Pool({ connectionString });
    }

    async run(sql: string, params: any[] = []): Promise<any> {
        // PG needs $1, $2, etc. SQLite uses ?. 
        // Simple regex replace for compatibility (naive but works for simple queries)
        let paramIndex = 1;
        const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
        const res = await this.pool.query(pgSql, params);
        return res;
    }

    async get(sql: string, params: any[] = []): Promise<any> {
        let paramIndex = 1;
        const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
        const res = await this.pool.query(pgSql, params);
        return res.rows[0];
    }

    async all(sql: string, params: any[] = []): Promise<any[]> {
        let paramIndex = 1;
        const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
        const res = await this.pool.query(pgSql, params);
        return res.rows;
    }
}

// Factory to export the right instance
// Factory to export the right instance
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    throw new Error("DATABASE_URL is required. Video Agent must connect to the production Postgres database.");
}

export const db: DB = new PostgresDB(dbUrl);
