
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
    console.log("Checking Data Distribution...");

    // 1. Get All Sources
    const { data: sources, error: sErr } = await supabase.from('sources').select('id, name');
    if (sErr) return console.error("Error fetching sources:", sErr);

    console.log(`\nFound ${sources.length} sources.`);

    // 2. Count News per Source
    const { data: news, error: nErr } = await supabase.from('raw_news').select('id, source_id, title');
    if (nErr) return console.error("Error fetching news:", nErr);

    console.log(`Found ${news.length} articles total.`);

    const counts = {};
    sources.forEach(s => counts[s.name] = 0);

    news.forEach(n => {
        const source = sources.find(s => s.id === n.source_id);
        if (source) counts[source.name] = (counts[source.name] || 0) + 1;
        else counts['Unknown'] = (counts['Unknown'] || 0) + 1;
    });

    console.table(counts);
}

main();
