
import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL; // Client side key is fine for inserting sources if RLS allows or we use service role
// Note: VITE_SUPABASE_ANON_KEY might not have permissions to INSERT into 'sources' if RLS is strict. 
// We usually need SERVICE_ROLE_KEY for admin tasks.
// The user has the service role key in github secrets, but locally in .env we only saved VITE_SUPABASE_ANON_KEY.
// HOWEVER, I recall the user providing the SERVICE_ROLE_KEY in a previous step (step 377, hidden in my memory).
// I can try to use the ANON key first. If it fails, I'll ask user for the Service Role Key or checking if I can use the Edge Function to add sources? 
// No, Edge Function only READS sources.
// Wait, I can't see the Service Role Key in the chat history artifacts directly, but I might have used it in a previous tool call?
// Actually, I can just ask the user or try to use the ANON key. RLS usually allows Authenticated users, but maybe not Anon.
// Let's try Anon key first. If it fails, I will prompt the user to provide the Service Role Key for this admin action.

// WAIT! The user provided the Service Role Key when setting up Github Secrets.
// I don't have it locally in `.env`.
// I will try to use the Annon key. If RLS is public or allows anon insert (unlikely), it works.
// If not, I'll need to ask the user to add SUPABASE_SERVICE_ROLE_KEY to .env or provide it.
// Actually, for a quick fix, I will instruct the user to add it OR just run a SQL command if I could... but I can't.

// Let's assume I need the Service Role Key.
// I will try to run this with the VITE key. If it fails, I'll notify the user.

const supabase = createClient(supabaseUrl, env.VITE_SUPABASE_ANON_KEY);

const vnSources = [
    {
        name: "VnExpress RSS",
        url: "https://vnexpress.net/rss/tin-moi-nhat.rss",
        type: "rss",
        is_active: true,
    },
    {
        name: "Tuoi Tre Cong Nghe",
        url: "https://tuoitre.vn/rss/cong-nghe.rss",
        type: "rss",
        is_active: true,
    },
    {
        name: "Tinh Te",
        url: "https://tinhte.vn/rss",
        type: "rss",
        is_active: true,
    }
];

async function main() {
    console.log("Attempting to add sources with Anon Key...");

    // 1. Insert Sources
    for (const source of vnSources) {
        const { error } = await supabase.from('sources').upsert(source, { onConflict: 'url' });
        if (error) {
            console.error(`Error adding ${source.name}:`, error.message);
            if (error.code === '42501') {
                console.error("PERMISSION DENIED: You need the SERVICE_ROLE_KEY to add sources.");
                process.exit(1);
            }
        }
        else console.log("Added/Updated: " + source.name);
    }

    // 2. Trigger Scrape
    // We can trigger the scrape via a simple fetch to the function URL if we have the key?
    // We can use the same key.

    console.log("\nTriggering Scrape News...");
    const scrapeUrl = `${supabaseUrl}/functions/v1/scrape-news`;
    // For the edge function, we definitely need the Service Role Key or a valid JWT. Anon key might work if function is public.

    const scrapeResp = await fetch(scrapeUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ maxItemsPerSource: 3, enableFirecrawl: false })
    });

    if (scrapeResp.ok) {
        console.log("Scrape triggered successfully:", await scrapeResp.text());
    } else {
        console.error("Scrape failed:", await scrapeResp.text());
    }
}

main();
