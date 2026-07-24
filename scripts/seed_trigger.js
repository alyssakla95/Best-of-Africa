const url = 'https://best-of-africa-backend.cortesmailles01.workers.dev/api/v1/dev/seed-and-trigger';

console.log(`Turning key... Triggering ingestion at: ${url}`);

fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
})
    .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        return res.json();
    })
    .then(data => {
        console.log('✅ SUCCESS! System Kickstarted.');
        console.log(JSON.stringify(data, null, 2));
    })
    .catch(err => {
        console.error('❌ FAILURE:', err.message);
    });
