
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, supabaseKey);

const vnSources = [
    {
        name: "VnExpress AI",
        url: "https://vnexpress.net/rss/so-hoa/tech-awards-2024.rss", // Using Tech RSS as proxy for AI/Tech
        type: "rss",
        is_active: true,
    },
    {
        name: "Tinh Tế",
        url: "https://tinhte.vn/rss",
        type: "rss",
        is_active: true,
    },
    {
        name: "GenK",
        url: "https://genk.vn/cong-nghe.rss",
        type: "rss",
        is_active: true,
    }
];

// 1. Insert Sources
console.log("Adding VN Sources...");
for (const source of vnSources) {
    const { error } = await supabase.from('sources').upsert(source, { onConflict: 'url' });
    if (error) console.error("Error adding " + source.name, error);
    else console.log("Added/Updated: " + source.name);
}

// 2. Trigger Scrape
console.log("\nTriggering Scrape News (Local)...");
// Note: In local Deno script we can't easily call the Edge Function URL if it's not public/deployed with anon access clearly or if we want to test logic. 
// But we can just use the functionality if we were running the server. 
// Instead, let's just use the `scrape-news` function logic or relying on the user to trigger it via curl?
// Actually, since I have the `scrape-news` deployed, I can call it via fetch.

const scrapeUrl = `${supabaseUrl}/functions/v1/scrape-news`;
const scrapeResp = await fetch(scrapeUrl, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ maxItemsPerSource: 3, enableFirecrawl: false }) // Quick scrape, no firecrawl for speed
});

if (scrapeResp.ok) {
    console.log("Scrape triggered successfully:", await scrapeResp.text());
} else {
    console.error("Scrape failed:", await scrapeResp.text());
}
