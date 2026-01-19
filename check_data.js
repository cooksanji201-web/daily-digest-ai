
import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function main() {
    console.log("Checking Data Integrity...");

    // 1. Check if 'image_url' exists by selecting it from one row
    const { data: checkImg, error: imgErr } = await supabase.from('raw_news').select('image_url').limit(1);

    if (imgErr) {
        console.error("❌ 'image_url' column missing or error:", imgErr.message);
    } else {
        console.log("✅ 'image_url' column exists.");
    }

    // 2. Count Articles by Source
    const { data: news, error: nErr } = await supabase.from('raw_news').select('id, source_id, title, image_url');
    if (nErr) return console.error("Error fetching news:", nErr);

    const { data: sources } = await supabase.from('sources').select('id, name');

    const counts = {};
    let withImage = 0;

    news.forEach(n => {
        const sName = sources.find(s => s.id === n.source_id)?.name || 'Unknown';
        counts[sName] = (counts[sName] || 0) + 1;
        if (n.image_url) withImage++;
    });

    console.table(counts);
    console.log(`\nTotal Articles: ${news.length}`);
    console.log(`Articles with Image: ${withImage}`);
}

main();
