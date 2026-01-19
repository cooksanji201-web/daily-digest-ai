
import { createClient } from "@supabase/supabase-js";
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Load Environment Variables
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

// Generate SQL Script instead of DB Insert
async function generateSQL() {
    console.log("📝 Generating SQL Seed for VN Sources...");

    // Hardcoded IDs from typical setup (User can verify in Dashboard or we use subquery)
    // Actually, let's use subqueries to be safe: (SELECT id FROM sources WHERE url = '...')

    let sqlOutput = `-- Seed Data for VN Sources (Generated)
`;

    const sources = [
        { name: 'Tuổi Trẻ Công Nghệ', url: 'https://tuoitre.vn/rss/cong-nghe.rss', id: null },
        { name: 'Tinh Tế', url: 'https://tinhte.vn/rss', id: null },
        { name: 'GenK', url: 'https://genk.vn/cong-nghe.rss', id: null }
    ];

    for (const source of sources) {
        console.log(`Processing ${source.name}...`);
        try {
            const res = await fetch(source.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                }
            });
            const xml = await res.text();

            const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
            console.log(`  Found ${items.length} raw items.`);

            let count = 0;
            for (const itemXml of items.slice(0, 5)) { // Top 5 per source
                const title = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim().replace(/'/g, "''"); // Escape single quotes
                const link = itemXml.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim();
                const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i)?.[1]?.trim();

                // Image Extraction
                let image = itemXml.match(/<enclosure[^>]*url="([^"]*)"[^>]*>/i)?.[1] ||
                    itemXml.match(/<media:content[^>]*url="([^"]*)"[^>]*>/i)?.[1] ||
                    itemXml.match(/<img[^>]+src="([^">]+)"/i)?.[1];

                // Fallback: Check inside description (decoding entities if needed)
                if (!image) {
                    let desc = itemXml.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/si)?.[1] || '';
                    // Simple entity decode
                    desc = desc.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

                    image = desc.match(/src="([^"]+)"/i)?.[1];
                }

                // Fallback 2: Search for ANY jpg/png url in the whole item string
                if (!image) {
                    image = itemXml.match(/https?:\/\/[^\s"']+\.(?:jpg|png|jpeg|webp)/i)?.[0];
                }

                // Fallback 2: Tinh Te specific (sometimes they link large images in content)
                // If still null, we might use a default placeholder or try parsing content:encoded if available


                if (title && link) {
                    const dateVal = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();
                    const imgVal = image ? `'${image}'` : 'NULL';

                    sqlOutput += `
INSERT INTO raw_news (source_id, title, url, content, published_date, image_url, content_hash)
SELECT id, '${title}', '${link}', '${title}', '${dateVal}', ${imgVal}, md5('${title}' || '${link}')
FROM sources WHERE url = '${source.url}'
ON CONFLICT (url) DO UPDATE SET image_url = EXCLUDED.image_url;
`;
                    count++;
                }
            }
            console.log(`  Generated SQL for ${count} articles.`);

        } catch (e) {
            console.error(`  ❌ Failed: ${e.message}`);
        }
    }

    fs.writeFileSync('seed_data.sql', sqlOutput);
    console.log("\n✨ SQL Generated at seed_data.sql");
}

generateSQL();
