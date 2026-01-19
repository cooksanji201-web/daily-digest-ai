
import fetch from 'node-fetch';

const feeds = [
    'https://vnexpress.net/rss/tin-moi-nhat.rss',
    'https://tuoitre.vn/rss/cong-nghe.rss',
    'https://tinhte.vn/rss',
    'https://genk.vn/cong-nghe.rss'
];

function parseRSSFeed(xmlText) {
    const items = [];

    // Check for CDATA and handle it? Regex usually handles it if written correctly.
    // The scraper regex:
    // title: /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/

    const rssItems = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    console.log(`  Found ${rssItems.length} items via regex`);

    for (const item of rssItems) {
        const title = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1]?.trim() || '';
        const link = item.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/)?.[1]?.trim() || '';
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim();

        if (pubDate) {
            const parsed = Date.parse(pubDate);
            if (isNaN(parsed)) {
                console.error(`  ❌ Invalid Date found: "${pubDate}" in item "${title}"`);
            } else {
                // console.log(`  ✅ Valid Date: "${pubDate}" -> ${new Date(parsed).toISOString()}`);
            }
        } else {
            console.warn(`  ⚠️ No pubDate for "${title}"`);
        }
    }
    return items;
}

async function testFeeds() {
    for (const url of feeds) {
        console.log(`\nTesting ${url}...`);
        try {
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const text = await res.text();
            parseRSSFeed(text);
        } catch (e) {
            console.error(`Error fetching ${url}:`, e.message);
        }
    }
}

testFeeds();
