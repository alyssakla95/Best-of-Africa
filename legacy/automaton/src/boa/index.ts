
import fs from 'fs';
import path from 'path';
import { CountryStewardAutomaton } from './CountryStewardAutomaton.js';
import { type CountryStewardConfig } from './config/country.steward.schema.js';

// Export ContentGeneratorAutomaton for use in content generation tasks
export { ContentGeneratorAutomaton } from './ContentGeneratorAutomaton.js';

async function main() {
    const args = process.argv.slice(2);
    const configDir = args[0] || path.join(process.cwd(), 'src/boa/config');

    console.log(`Loading steward configs from: ${configDir}`);

    if (!fs.existsSync(configDir)) {
        console.error(`Config directory not found: ${configDir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(configDir).filter(f => f.endsWith('.json') && !f.startsWith('schema'));

    if (files.length === 0) {
        console.error("No config files found.");
        process.exit(1);
    }

    console.log(`Found ${files.length} configs: ${files.join(', ')}`);

    const stewards: CountryStewardAutomaton[] = [];

    for (const file of files) {
        try {
            const raw = fs.readFileSync(path.join(configDir, file), 'utf-8');
            const config = JSON.parse(raw) as CountryStewardConfig;

            // Validate minimal fields (or use schema validator if strict)
            if (!config.countryCode || !config.boaApiBaseUrl) {
                console.warn(`Skipping invalid config: ${file}`);
                continue;
            }

            const steward = new CountryStewardAutomaton(config);
            stewards.push(steward);
        } catch (e) {
            console.error(`Error loading ${file}: ${e}`);
        }
    }

    console.log(`Starting ${stewards.length} stewards...`);

    // Run all in parallel
    await Promise.all(stewards.map(s => s.start()));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
