import asyncio
import os
import sys
import json
from pathlib import Path
from datetime import date
import asyncpg
from loguru import logger

# Add services to path
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

from translation import translator

# Configuration
DB_DSN = os.environ.get("DATABASE_URL", "postgresql://user:password@localhost:5432/boa")
MAX_TRANSLATIONS_DAILY = int(os.environ.get("MAX_TRANSLATIONS_DAILY", "50"))
ENABLED_LANGUAGES = ["fr", "de", "ar", "hi", "zh", "pt"] # En is source

async def get_db_pool():
    return await asyncpg.create_pool(DB_DSN)

async def check_rate_limit(pool, lang: str) -> bool:
    today = date.today()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT count FROM usage_counters WHERE date = $1 AND service = 'translation' AND lang = $2",
            today, lang
        )
        current = row["count"] if row else 0
        
        if current >= MAX_TRANSLATIONS_DAILY:
            logger.warning(f"Rate limit hit for {lang} ({current}/{MAX_TRANSLATIONS_DAILY})")
            return False
        return True

async def increment_usage(pool, lang: str):
    today = date.today()
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO usage_counters (date, service, lang, count)
            VALUES ($1, 'translation', $2, 1)
            ON CONFLICT (date, service, lang)
            DO UPDATE SET count = usage_counters.count + 1
        """, today, lang)

async def process_job(pool, job):
    job_id = job["id"]
    article_id = job["article_id"]
    target_lang = job["target_lang"]
    
    logger.info(f"Processing translation job {job_id} for article {article_id} -> {target_lang}")

    # 1. Check Rate Limit
    if not await check_rate_limit(pool, target_lang):
        # Re-queue or fail? Fail for today, maybe retry tomorrow?
        # For now, mark failed with specific reason
        await pool.execute("UPDATE translation_queue SET status = 'failed', error_message = 'Rate limit exceeded' WHERE id = $1", job_id)
        return

    # 2. Fetch Source Content (English Variants)
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT variants FROM article_audits WHERE article_id = $1", article_id)
        if not row or not row["variants"]:
            logger.error(f"Article {article_id} not found or no variants.")
            await conn.execute("UPDATE translation_queue SET status = 'failed', error_message = 'Source variants missing' WHERE id = $1", job_id)
            return
            
        variants = json.loads(row["variants"])

    # 3. Translate Variants
    # We translate: variant_tourist_en, variant_investor_graham_en, variant_policy_en
    # Into: variant_tourist_{lang}, etc.
    
    new_variants = {}
    success_count = 0
    
    for key, text in variants.items():
        if key.endswith("_en") and text:
            target_key = key.replace("_en", f"_{target_lang}")
            
            # Context Type Guessing
            context = "general"
            if "investor" in key: context = "editorial" # Strict editorial/financial
            if "policy" in key: context = "legal"
            
            translated_text = await translator.translate_text(text, "en", target_lang, context)
            
            if translated_text:
                new_variants[target_key] = translated_text
                success_count += 1
    
    if success_count == 0:
        await pool.execute("UPDATE translation_queue SET status = 'failed', error_message = 'Translation failed' WHERE id = $1", job_id)
        return

    # 4. Save & Update Usage
    async with pool.acquire() as conn:
        # Merge new variants into existing JSONB
        # Postgres jsonb_set is tricky for multiple keys; easier to read-modify-write in app or use || operator
        
        # We fetch current again to avoid race? Or just use || operator
        # Update variants
        # Update translation_status -> { [lang]: "ready" }
        
        await conn.execute("""
            UPDATE article_audits 
            SET variants = variants || $1::jsonb,
                translation_status = translation_status || jsonb_build_object($2::text, 'ready'),
                updated_at = NOW()
            WHERE article_id = $3
        """, json.dumps(new_variants), target_lang, article_id)
        
        # Mark queue completed
        await conn.execute("UPDATE translation_queue SET status = 'completed', updated_at = NOW() WHERE id = $1", job_id)
        
        # Increment Counter
        await increment_usage(pool, target_lang)
        
    logger.info(f"Translation completed for {article_id} -> {target_lang}")


async def worker_loop():
    logger.info("Translation Worker Starting...")
    pool = await get_db_pool()
    
    while True:
        try:
            # Poll for pending jobs
            # Select ONE job
            # SKIP LOCKED to allow multiple workers (optional, good practice)
            async with pool.acquire() as conn:
                job = await conn.fetchrow("""
                    UPDATE translation_queue
                    SET status = 'processing', updated_at = NOW()
                    WHERE id = (
                        SELECT id
                        FROM translation_queue
                        WHERE status = 'pending'
                        ORDER BY created_at ASC
                        FOR UPDATE SKIP LOCKED
                        LIMIT 1
                    )
                    RETURNING id, article_id, target_lang
                """)
            
            if job:
                await process_job(pool, job)
            else:
                await asyncio.sleep(5) # Idle wait
                
        except Exception as e:
            logger.error(f"Worker Loop Error: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(worker_loop())
