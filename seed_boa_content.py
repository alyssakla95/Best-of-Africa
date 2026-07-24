import sqlite3
import uuid

# Connect to the BoA Content Database
conn = sqlite3.connect("services/boa-editorial-agent/boa_content.db")
cursor = conn.cursor()

# Ensure table exists (matches scanner.py)
cursor.execute("""
    CREATE TABLE IF NOT EXISTS pending_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id TEXT UNIQUE,
        country TEXT,
        topic TEXT,
        raw_content TEXT,
        status TEXT DEFAULT 'pending'
    )
""")

# Seed Data: Real-world scenarios for diverse African regions
seed_data = [
    ("NG-001", "NG", "Tech Ecosystem", "Lagos startups are attracting record venture capital despite global downturns..."),
    ("EG-002", "EG", "Tourism Revival", "Egypt's tourism sector sees 20% growth as new historical sites open in Giza..."),
    ("KE-003", "KE", "Green Energy", "Kenya's geothermal expansion positions it as a renewable energy leader in East Africa..."),
    ("ZA-004", "ZA", "Mining Reform", "South Africa introduces new policy framework for sustainable mining practices..."),
    ("RW-005", "RW", "Kigali Innovation City", "Rwanda's tech hub continues to draw international partnerships..."),
    ("GH-006", "GH", "AfCFTA Trade Hub", "Accra's role as the secretariat for the African Continental Free Trade Area is boosting local logistics..."),
    ("ET-007", "ET", "Coffee Exports", "Ethiopian coffee producers face new EU regulations but find varied markets in Asia...")
]

print(f"Seeding {len(seed_data)} articles for Pan-African demo...")

for art_id, country, topic, content in seed_data:
    try:
        cursor.execute("INSERT INTO pending_queue (article_id, country, topic, raw_content) VALUES (?, ?, ?, ?)", 
                       (art_id, country, topic, content))
        print(f"Inserted {art_id} ({country})")
    except sqlite3.IntegrityError:
        print(f"Skipping {art_id} (already exists)")
        # Reset status to pending if it was stuck
        cursor.execute("UPDATE pending_queue SET status='pending' WHERE article_id=?", (art_id,))
        print(f"Reset status for {art_id}")

conn.commit()
conn.close()
print("Database seeded successfully.")
