import sqlite3
from typing import List, Dict

def scan_for_pending_audits(db_path: str, limit: int = 5) -> List[Dict]:
    """
    Scans the local content database for articles that need auditing.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Ensure table exists (real setup)
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
    
    # Check for items
    cursor.execute("SELECT article_id, country, topic, raw_content FROM pending_queue WHERE status='pending' LIMIT ?", (limit,))
    rows = cursor.fetchall()
    
    results = []
    for r in rows:
        results.append({
            "article_id": r[0],
            "country": r[1],
            "topic": r[2],
            "raw_content": r[3]
        })
        
        # Mark as 'processing' so we don't pick it up again immediately
        # (In a real system, we'd use a transaction or status update)
        cursor.execute("UPDATE pending_queue SET status='processing' WHERE article_id=?", (r[0],))
        
    conn.commit()
    conn.close()
    
    return results
