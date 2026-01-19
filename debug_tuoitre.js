
import fetch from 'node-fetch';

const url = 'https://tuoitre.vn/rss/cong-nghe.rss';

async function testFeed() {
    console.log(`Testing ${url}...`);
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
            signal: controller.signal
        });
        clearTimeout(timeout);

        const xmlText = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Length: ${xmlText.length}`);

        const rssItems = xmlText.match(/<item>[\s\S]*?<\/item>/gi) || [];
        console.log(`Found ${rssItems.length} items.`);

        if (rssItems.length > 0) {
            const firstItem = rssItems[0];
            const title = firstItem.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim();
            const image = firstItem.match(/<img[^>]+src="([^">]+)"/i)?.[1] ||
                firstItem.match(/<enclosure[^>]*url="([^"]*)"/i)?.[1];

            console.log(`Sample Title: ${title}`);
            console.log(`Sample Image: ${image}`);
        } else {
            console.log("Raw Start:", xmlText.substring(0, 200));
        }

    } catch (e) {
        console.error(`Error:`, e.message);
    }
}

testFeed();
