import os
import glob
import re

directory = r"c:\Users\corte\Documents\GitHub\Best-of-Africa-Platform-\src\routes"
files = glob.glob(os.path.join(directory, "**", "*.ts"), recursive=True)

for file in files:
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()
    
    # We want to replace matching patterns like:
    # `ORDER BY engagement_score DESC` -> `ORDER BY (engagement_score * 1.0 / ((julianday('now') - julianday(published_at)) + 1)) DESC`
    # `ORDER BY a.engagement_score DESC` -> `ORDER BY (a.engagement_score * 1.0 / ((julianday('now') - julianday(a.published_at)) + 1)) DESC`
    # `ORDER BY a2.engagement_score DESC` -> `ORDER BY (a2.engagement_score * 1.0 / ((julianday('now') - julianday(a2.published_at)) + 1)) DESC`
    
    def replacer(match):
        prefix = match.group(1) or ""
        return f"ORDER BY ({prefix}engagement_score * 1.0 / ((julianday('now') - julianday({prefix}published_at)) + 1)) DESC"
        
    new_content = re.sub(r"ORDER BY ([a-zA-Z0-9_]+\.)?engagement_score DESC", replacer, content)
    
    if new_content != content:
        with open(file, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {file}")
