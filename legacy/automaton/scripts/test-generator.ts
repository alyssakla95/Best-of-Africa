import { ContentGeneratorAutomaton } from '../src/boa/ContentGeneratorAutomaton.js';

async function main() {
    const config = {
        boaApiBaseUrl: 'http://localhost:8787',
        boaApiKey: '880e9511-f30c-52d5-b827-557766551111',
        pollingIntervalMs: 5000,
        nanobotWorkspace: 'e:\\Best Of Africa Platform',
        openRouterApiKey: process.env.OPENROUTER_API_KEY || ''
    };

    const generator = new ContentGeneratorAutomaton(config);
    
    // Catch Ctrl+C to stop gracefully
    process.on('SIGINT', () => {
        console.log('Stopping automaton...');
        generator.stop();
        process.exit(0);
    });

    await generator.start();
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
