import os
import re

files_to_migrate = [
    'src/lib/alerts.ts',
    'src/lib/intelligence.ts',
    'src/lib/moderation.ts',
    'src/lib/optimizer/analytics.ts',
    'src/lib/optimizer/content-gaps.ts',
    'src/lib/optimizer/market-data.ts',
    'src/lib/reports.ts',
    'src/workers/digest.ts'
]

def migrate_file(filepath):
    if not os.path.exists(filepath):
        print(f"Not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Calculate relative path to lib/ai.ts
    depth = filepath.count('/') - 1
    prefix = '../' * depth
    if prefix == '': prefix = './'
    ai_import = f"import {{ callConfiguredAI }} from '{prefix}lib/ai';"

    # Ensure import exists
    if 'callConfiguredAI' not in content:
        if "import { getCached" in content:
            content = content.replace("import { getCached", f"{ai_import}\nimport {{ getCached")
        elif "import type { Env" in content:
            content = content.replace("import type { Env", f"{ai_import}\nimport type {{ Env")
        else:
            content = ai_import + "\n" + content

    # Regex for standard LLaMA calls: 
    # const XYZ = await (env.AI as ...).run('@cf/meta/llama-3.1...', { messages: [ {role: 'system', content: 'SYS'}, {role: 'user', content: `USR`} ] ... })
    
    # We will find the occurrences of '.run('@cf/meta/llama-3.1' and manually replace the block
    while True:
        idx = content.find(".run('@cf/meta/llama-3.1")
        if idx == -1:
            break
            
        # find the start of the 'await'
        await_idx = content.rfind("await", 0, idx)
        
        # find the end of the AI call '});' or '})'
        end_idx = content.find("});", idx)
        if end_idx == -1:
            end_idx = content.find("})", idx)
            end_idx += 2
        else:
            end_idx += 3
            
        block = content[await_idx:end_idx]
        
        # Extract system and user contents
        sys_match = re.search(r"role:\s*'system',\s*content:\s*([`'\"].*?[`'\"])", block, re.DOTALL)
        usr_match = re.search(r"role:\s*'user',\s*content:\s*([`'\"].*?[`'\"])", block, re.DOTALL)
        
        if sys_match and usr_match:
            sys_content = sys_match.group(1)
            usr_content = usr_match.group(1)
            
            # check if it expects JSON
            is_json = "response_format" in block
            
            # create the prompt string
            # we need to cleanly format it
            replacement = f"const prompt = `System: ${{ {sys_content} }}\\nUser: ${{ {usr_content} }}`;\n"
            replacement += "                const aiResponseRaw = await callConfiguredAI(env, { prompt, max_tokens: 300, temperature: 0.5 });\n"
            
            if is_json:
                replacement += "                const aiResponse = { response: aiResponseRaw || '{}' };"
            else:
                replacement += "                const aiResponse = { response: aiResponseRaw || '' };"
                
            content = content.replace(block, replacement)
        else:
            print(f"Could not parse block in {filepath}")
            # just break to avoid infinite loop
            break
            
    if content != original_content:
        # Also handle c.env vs env
        content = content.replace('callConfiguredAI(c.env', 'callConfiguredAI(env') 
        # Actually some files use `c.env`, we should determine based on what await_idx matched
        if 'c.env' in original_content and 'env, {' in content:
             content = content.replace('callConfiguredAI(env', 'callConfiguredAI(c.env')
             
        # Wait, if original had `env.AI` we pass `env`, if `c.env.AI` we pass `c.env`. Let's just fix it manually if it fails typecheck.
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Migrated {filepath}")

for f in files_to_migrate:
    migrate_file(f)
