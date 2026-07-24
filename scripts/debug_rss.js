async function parseRSS(url) {
    try {
        console.log(`Fetching ${url}...`);
        const response = await fetch(url, {
            headers: { 'User-Agent': 'BestOfAfrica/1.0' },
        });

        if (!response.ok) {
            console.error(`HTTP Error: ${response.status}`);
            return [];
        }

        const xml = await response.text();
        console.log(`Received ${xml.length} bytes.`);

        const items = [];

        // Simple regex-based parsing (production would use proper XML parser)
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;

        while ((match = itemRegex.exec(xml)) !== null) {
            const itemXml = match[1];

            const title = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || '';
            const link = itemXml.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/)?.[1] || '';

            if (title && link) {
                items.push({ title: title.trim(), link: link.trim() });
            }
        }

        console.log(`Found ${items.length} items.`);
        if (items.length > 0) {
            console.log('Sample:', items[0]);
        }
        return items;
    } catch (error) {
        console.error(`Failed to parse RSS ${url}:`, error);
        return [];
    }
}

// Test Google News
parseRSS('https://news.google.com/rss/search?q=Africa+Business&hl=en-US&gl=US&ceid=US:en');
