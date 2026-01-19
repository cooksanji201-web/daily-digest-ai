
import fetch from 'node-fetch';

const sources = [
    'https://vnexpress.net/rss/tin-moi-nhat.rss',
    'https://tinhte.vn/rss'
];

async function checkImages() {
    for (const url of sources) {
        console.log(`\n-------------------\nChecking ${url}...`);
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                }
            });
            const xml = await res.text();

            // Log first item thoroughly
            const firstItemMatch = xml.match(/<item>([\s\S]*?)<\/item>/i);
            if (firstItemMatch) {
                const itemContent = firstItemMatch[1];
                console.log("MATCHED ITEM CONTENT (Partial):");
                console.log(itemContent.substring(0, 1000)); // Log first 1000 chars of item

                // Test current RegEx
                let image = itemContent.match(/<enclosure[^>]*url="([^"]*)"[^>]*>/i)?.[1] ||
                    itemContent.match(/<media:content[^>]*url="([^"]*)"[^>]*>/i)?.[1] ||
                    itemContent.match(/<img[^>]+src="([^">]+)"/i)?.[1];

                if (image) console.log(`✅ Current Regex Found: ${image}`);
                else console.log(`❌ Current Regex Found NOTHING.`);

                // Look for description which often contains <img>
                const descMatch = itemContent.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/si);
                if (descMatch) {
                    // console.log("Description Content:", descMatch[1].substring(0, 500));
                    const imgInDesc = descMatch[1].match(/src="([^"]+)"/i);
                    if (imgInDesc) console.log(`💡 Found img inside Description: ${imgInDesc[1]}`);
                }

            } else {
                console.warn("No <item> found.");
            }

        } catch (e) {
            console.error(e.message);
        }
    }
}

checkImages();
