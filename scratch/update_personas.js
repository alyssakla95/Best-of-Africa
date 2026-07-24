import fs from 'fs';
import path from 'path';

const SRC_DIR = path.join(process.cwd(), 'src', 'routes');
const PERSONA_STRING = 'System: You are an independent student writer for BOA-Story. Keep your tone authentic, grounded, and human. Avoid corporate, intelligence, or institutional jargon.';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(SRC_DIR);

let updatedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Regex to match `System: You are a ...` or `System: ... Officer` etc
    // Since some are multiline or have different wording, we will specifically target the `System: ` prefix inside backticks.
    
    // Replace: `System: You are a Data Journalist...`
    // We will do a generic regex that captures `System: [^`]*\\nUser:` and replaces the System part.
    // Actually, some are `System: You are a ... \n`
    
    // Let's replace the common roles directly:
    const roles = [
        /System: You are a Data Journalist\..*?(?=\\nUser:)/gs,
        /System: You are a Content Strategist\..*?(?=\\nUser:)/gs,
        /System: You are a Global Editor\..*?(?=\\nUser:)/gs,
        /System: You are a Sector Specialist\..*?(?=\\nUser:)/gs,
        /System: You are a Senior Market Analyst\..*?(?=\\nUser:)/gs,
        /System: SitRep Officer.*?(?=\\nUser:)/gs,
        /System: You are an Event Promoter\..*?(?=\\nUser:)/gs,
        /System: You are a Senior Africa Intelligence Analyst\..*?(?=\\nUser:)/gs,
        /System: You are a Strategic Advisor\..*?(?=\\nUser:)/gs,
        /System: You are a Risk Analyst\..*?(?=\\nUser:)/gs,
        /System: Analyze supply chain health.*?(?=\\nUser:)/gs,
        /System: You are a Strategic Investment Analyst.*?(?=\\nUser:)/gs,
        /System: You are a Senior Investment Analyst\..*?(?=\\nUser:)/gs,
        /System: Provide a 3-sentence executive trend analysis.*?(?=\\nUser:)/gs,
        /System: You are a Strategic Communications Director\..*?(?=\\nUser:)/gs,
        /System: You are a Personal Intelligence Officer\..*?(?=\\nUser:)/gs,
        /System: You are an Intelligent Search Assistant\..*?(?=\\nUser:)/gs,
        /System: You are an independent researcher\..*?(?=\\nUser:)/gs,
        /System: You are a concise African researcher for BOA-Story\..*?(?=\\nUser:)/gs,
        /System: You are a Concierge Director\..*?(?=\\nUser:)/gs,
        /System: Explain why this event matters.*?(?=\\nUser:)/gs,
        /System: Summarize the current business climate.*?(?=\\nUser:)/gs,
        /System: Extract diplomatic\/trade partners.*?(?=\\nUser:)/gs
    ];

    roles.forEach(regex => {
        if (regex.test(content)) {
            content = content.replace(regex, PERSONA_STRING);
            changed = true;
        }
    });

    // Also catch any generic `System: You are an independent researcher.` that didn't match
    const catchAll = /System: You are [^`]*?(?=\\nUser:)/gs;
    if (catchAll.test(content)) {
        content = content.replace(catchAll, PERSONA_STRING);
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${path.basename(file)}`);
        updatedFiles++;
    }
});

console.log(`Finished updating ${updatedFiles} files.`);
