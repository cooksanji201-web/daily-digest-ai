
import fetch from 'node-fetch';

const feeds = [
    'https://vnexpress.net/rss/tin-moi-nhat.rss',
    'https://tuoitre.vn/rss/cong-nghe.rss',
    'https://tinhte.vn/rss',
    'https://genk.vn/cong-nghe.rss',
    'https://znews.vn/cong-nghe.rss'
];

async function testFeeds() {
    for (const url of feeds) {
        console.log(`\n--------------------------------------------------`);
        console.log(`Testing ${url}...`);
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
                }
            });
            const xmlText = await res.text();

            // Updated Regex to match production (Case Insensitive + Image Support)
            const rssItems = xmlText.match(/<item>[\s\S]*?<\/item>/gi) || [];
            console.log(`  Found ${rssItems.length} items via regex`);

            if (rssItems.length === 0) {
                console.log(`  ⚠️ RAW CONTENT START (First 500 chars):`);
                console.log(xmlText.substring(0, 500));
                console.log(`  ⚠️ RAW CONTENT END`);
            }

            let validDates = 0;
            let imagesFound = 0;

            for (const item of rssItems.slice(0, 3)) { // Check first 3 items only
                const title = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || '';
                const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/i)?.[1]?.trim();

                // Image Extraction Logic
                let image = item.match(/<enclosure[^>]*url="([^"]*)"[^>]*>/i)?.[1] ||
                    item.match(/<media:content[^>]*url="([^"]*)"[^>]*>/i)?.[1] ||
                    item.match(/<img[^>]+src="([^">]+)"/i)?.[1];

                if (pubDate) {
                    const parsed = Date.parse(pubDate);
                    if (isNaN(parsed)) console.error(`  ❌ Invalid Date: "${pubDate}"`);
                    else validDates++;
                }

                if (image) {
                    imagesFound++;
                    console.log(`  📷 Image: ${image.substring(0, 40)}...`);
                } else {
                    console.warn(`  ⚠️ No Image for: "${title.substring(0, 30)}..."`);
                }
            }
            console.log(`  Summary: ${validDates}/${rssItems.slice(0, 3).length} Dates Valid, ${imagesFound}/${rssItems.slice(0, 3).length} Images Found`);

        } catch (e) {
            console.error(`Error fetching ${url}:`, e.message);
        }
    }
}

testFeeds();
