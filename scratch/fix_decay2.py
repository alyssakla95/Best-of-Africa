import os
import glob
import re

directory1 = r"c:\Users\corte\Documents\GitHub\Best-of-Africa-Platform-\src\lib"
directory2 = r"c:\Users\corte\Documents\GitHub\Best-of-Africa-Platform-\src\workers"
files = glob.glob(os.path.join(directory1, "**", "*.ts"), recursive=True) + glob.glob(os.path.join(directory2, "**", "*.ts"), recursive=True)

for file in files:
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()
    
    def replacer(match):
        prefix = match.group(1) or ""
        return f"ORDER BY ({prefix}engagement_score * 1.0 / ((julianday('now') - julianday({prefix}published_at)) + 1)) DESC"
        
    new_content = re.sub(r"ORDER BY ([a-zA-Z0-9_]+\.)?engagement_score DESC", replacer, content)
    
    if new_content != content:
        with open(file, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {file}")
