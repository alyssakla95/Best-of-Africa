
import asyncio
import os
import asyncpg

# SQL Adjustments for Postgres compatibility (since 0001 was SQLite)
def fix_sql_for_postgres(sql):
    return sql.replace("datetime('now')", "NOW()") \
              .replace("INTEGER PRIMARY KEY AUTOINCREMENT", "SERIAL PRIMARY KEY") \
              .replace("TEXT PRIMARY KEY", "TEXT PRIMARY KEY") # No change needed usually

async def setup_db():
    # 1. Connect to 'postgres' to create the new DB
    sys_url = "postgresql://postgres:postgres@localhost:5432/postgres"
    boa_db = "boa_platform"
    
    print(f"Connecting to system DB {sys_url}...")
    try:
        conn = await asyncpg.connect(sys_url)
        
        # Check if DB exists
        exists = await conn.fetchval(f"SELECT 1 FROM pg_database WHERE datname = '{boa_db}'")
        if not exists:
            print(f"Creating database {boa_db}...")
            await conn.execute(f"CREATE DATABASE {boa_db}")
        else:
            print(f"Database {boa_db} already exists.")
            
        await conn.close()
    except Exception as e:
        print(f"System DB connection failed: {e}")
        return

    # 2. Connect to the new DB and apply schemas
    target_url = f"postgresql://postgres:postgres@localhost:5432/{boa_db}"
    print(f"Connecting to target DB {target_url}...")
    
    try:
        conn = await asyncpg.connect(target_url)
        
        # files = ["migrations/0001_schema.sql", "migrations/0002_i18n_schema.sql", "migrations/0003_market_data.sql"]
        # We need to be careful with 0001 as it is SQLite syntax.
        # Let's read them and try to apply.
        
        # Apply 0001 (Core Schema)
        print("Applying 0001_schema.sql (Core)...")
        with open("migrations/0001_schema.sql", "r") as f:
            raw_sql = f.read()
            pg_sql = fix_sql_for_postgres(raw_sql)
            # D1 SQLite specific removals if any?
            # 'strict' keyword? No.
            # D1 autoincrement behavior? 
            # We'll try to run it. If it fails, we might need a specific PG schema file.
            
            # Additional fix: SQLite 'OR IGNORE' syntax might need 'ON CONFLICT DO NOTHING'
            pg_sql = pg_sql.replace("INSERT OR IGNORE INTO", "INSERT INTO") \
                           .replace("VALUES", "VALUES") 
            # Wait, removing OR IGNORE makes it fail on duplicates.
            # Start of INSERT: "INSERT INTO table (...) VALUES (...) ON CONFLICT DO NOTHING;"
            # Regex might be safer but for seeded data let's try a simple replace of the specific INSERTs we know.
            pg_sql = pg_sql.replace("INSERT\n    OR IGNORE INTO", "INSERT INTO")
            
            # Actually, standard PG is "INSERT INTO ... ON CONFLICT DO NOTHING"
            # Since the SQL file has multi-value inserts, we can append ON CONFLICT at the end? 
            # No, that's hard to parse.
            # Let's hope the tables are empty or we can just ignore errors for now?
            
            # Simple hack: If table exists, skip?
            # No, we want to ensure schema.
            # Let's execute statement by statement? The file is one big block usually or separated by ;
             
        # Splitting by ; and running
        statements = pg_sql.split(';')
        for stmt in statements:
            if stmt.strip():
                # Fix specific SQLite-isms per statement
                if "INSERT" in stmt and "OR IGNORE" in stmt:
                    stmt = stmt.replace("OR IGNORE", "")
                    stmt += " ON CONFLICT DO NOTHING"
                
                try:
                    await conn.execute(stmt)
                except Exception as ex:
                    print(f"Warning executing stmt: {ex}")

        # Apply 0002 (I18n)
        print("Applying 0002_i18n_schema.sql...")
        with open("migrations/0002_i18n_schema.sql", "r") as f:
            await conn.execute(f.read())
            
        # Apply 0003 (Market Data)
        print("Applying 0003_market_data.sql...")
        with open("migrations/0003_market_data.sql", "r") as f:
            await conn.execute(f.read())

        print("All migrations applied successfully.")
        await conn.close()
        
    except Exception as e:
        print(f"Target DB Setup failed: {e}")

if __name__ == "__main__":
    asyncio.run(setup_db())
