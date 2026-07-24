const BASE_URL = 'http://localhost:8787/api/v1';
const ADMIN_KEY = 'my-super-secret-admin-key';

const headers = {
    'Authorization': `Bearer ${ADMIN_KEY}`,
    'Content-Type': 'application/json'
};

async function verifyAll() {
    console.log('🚀 Starting Full System Sweep...\n');

    try {
        // 0. Trigger Debug Ingestion
        console.log('📥 Triggering Debug Ingestion...');
        const ingestRes = await fetch(`${BASE_URL}/debug/insert`, { method: 'GET', headers });
        const ingest = await ingestRes.json() as any;
        console.log('✅ Ingestion result:', JSON.stringify(ingest));

        // 1. Health Check
        console.log('📡 Checking API Health...');
        const healthRes = await fetch(`${BASE_URL}/health`); // api.route('/', systemRouter) -> /api/v1/health
        const health = await healthRes.json() as any;
        console.log('✅ Health:', health.status);

        // 2. Audit Scanner
        console.log('\n🔍 Testing Proactive Audit Scanner...');
        const auditRes = await fetch(`${BASE_URL}/audit/scan`, { headers });
        const audit = await auditRes.json();
        console.log('✅ Audit Scan result:', JSON.stringify(audit));

        // 3. Self-Improvement Trigger
        console.log('\n🧠 Testing Self-Improvement Trigger...');
        const evolveRes = await fetch(`${BASE_URL}/self-improve/evolve`, { headers });
        const evolve = await evolveRes.json();
        console.log('✅ Evolve result:', JSON.stringify(evolve));

        // 4. Pending Tasks
        console.log('\n📋 Checking for Pending Tasks...');
        const pendingRes = await fetch(`${BASE_URL}/agent/tasks/pending`, { headers });
        const pending = await pendingRes.json() as any;
        console.log('✅ Pending task:', pending.data ? `Found task ${pending.data.id}` : 'Queue empty');

        console.log('\n✨ Full Sweep Complete! All systems operational.');
    } catch (error: any) {
        console.error('\n❌ Sweep Failed!');
        console.error('Error:', error.message);
        process.exit(1);
    }
}

verifyAll();
