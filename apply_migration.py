import asyncio
import os
import asyncpg

async def check_metrics():
    # Connect to 'boa_platform'
    db_url = "postgresql://postgres:postgres@localhost:5432/boa_platform"
    print(f"Connecting to {db_url}...")
    try:
        conn = await asyncpg.connect(db_url)
        
        # Check table existence
        tables = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
        print("Tables in boa_platform:")
        for t in tables:
            print(f"- {t['table_name']}")

        # Check data
        count = await conn.fetchval("SELECT COUNT(*) FROM market_metrics")
        print(f"Market Metrics Rows: {count}")
        
        if count > 0:
            row = await conn.fetchrow("SELECT * FROM market_metrics LIMIT 1")
            print(f"Sample: {row}")

        await conn.close()
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(check_metrics())
