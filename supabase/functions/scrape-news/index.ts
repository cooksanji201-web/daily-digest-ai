import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================
// HYBRID INGESTION ENGINE v2.0
// Architecture: RSS-First → Hash Check → Firecrawl → Semantic Dedup
// ============================================================

interface FeedItem {
    title: string
    link: string
    description: string
    pubDate?: string
    image?: string
}

interface ScrapeResult {
    source: string
    status: 'success' | 'skipped_hash' | 'skipped_semantic' | 'scrape_error' | 'db_error'
    title?: string
    method?: 'rss_only' | 'rss_firecrawl' | 'firecrawl_only'
    error?: string
}

// Generate SHA-256 hash for deduplication
async function generateHash(input: string): Promise<string> {
    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(input))
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Parse RSS/Atom feed and extract items
function parseRSSFeed(xmlText: string): FeedItem[] {
    const items: FeedItem[] = []

    // Try RSS format first
    const rssItems = xmlText.match(/<item>[\s\S]*?<\/item>/gi) || []
    for (const item of rssItems) {
        const title = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || ''
        const link = item.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim() || ''
        const description = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() || ''
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/i)?.[1]?.trim()

        // Extract Image: custom regex for enclosure, media:content, or img tag in description
        let image = item.match(/<enclosure[^>]*url="([^"]*)"[^>]*>/i)?.[1] ||
            item.match(/<media:content[^>]*url="([^"]*)"[^>]*>/i)?.[1] ||
            item.match(/<img[^>]+src="([^">]+)"/i)?.[1];

        // Fallback: Check inside description (decoding entities if needed)
        if (!image) {
            let desc = item.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/si)?.[1] || '';
            // Simple entity decode for common HTML entities
            desc = desc.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
            image = desc.match(/src="([^"]+)"/i)?.[1];
        }

        // Fallback 2: Search for ANY jpg/png url in the whole item string (Aggressive)
        if (!image) {
            image = item.match(/https?:\/\/[^\s"']+\.(?:jpg|png|jpeg|webp)/i)?.[0];
        }

        if (title && link) {
            items.push({
                title: title.replace(/<[^>]*>/g, ''), // Strip any HTML
                link,
                description: description.replace(/<[^>]*>/g, '').substring(0, 500),
                pubDate,
                image
            })
        }
    }

    // Try Atom format if no RSS items found
    if (items.length === 0) {
        const atomEntries = xmlText.match(/<entry>[\s\S]*?<\/entry>/gi) || []
        for (const entry of atomEntries) {
            const title = entry.match(/<title[^>]*>(.*?)<\/title>/)?.[1]?.trim() || ''
            const link = entry.match(/<link[^>]*href="([^"]*)"[^>]*>/)?.[1] ||
                entry.match(/<link>([^<]*)<\/link>/)?.[1] || ''
            const summary = entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1]?.trim() ||
                entry.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1]?.trim() || ''
            const published = entry.match(/<published>(.*?)<\/published>/)?.[1]?.trim() ||
                entry.match(/<updated>(.*?)<\/updated>/)?.[1]?.trim()

            if (title && link) {
                items.push({
                    title: title.replace(/<[^>]*>/g, ''),
                    link,
                    description: summary.replace(/<[^>]*>/g, '').substring(0, 500),
                    pubDate: published
                })
            }
        }
    }

    return items
}

// Generate embedding using Gemini
async function generateEmbedding(text: string, apiKey: string): Promise<number[] | null> {
    try {
        const embUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`
        const embRes = await fetch(embUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'models/text-embedding-004',
                content: { parts: [{ text: text.substring(0, 8000) }] }
            })
        })
        const embData = await embRes.json()
        return embData.embedding?.values || null
    } catch (err) {
        console.error('Embedding generation failed:', err)
        return null
    }
}

// Scrape full content using Firecrawl
async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<{ content: string; title: string } | null> {
    try {
        console.log(`  🔥 Firecrawl: ${url}`)
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                url,
                formats: ['markdown'],
                onlyMainContent: true,
                timeout: 30000
            })
        })

        const data = await response.json()
        if (data.success && data.data) {
            return {
                content: data.data.markdown || data.data.content || '',
                title: data.data.metadata?.title || ''
            }
        }
        console.warn(`  ⚠️ Firecrawl failed:`, data.error)
        return null
    } catch (err) {
        console.error(`  ❌ Firecrawl error:`, err)
        return null
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? ''
        const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY') ?? ''

        // Parse request body for options
        let options = { maxItemsPerSource: 5, enableFirecrawl: true }
        try {
            const body = await req.json()
            options = { ...options, ...body }
        } catch { /* Use defaults */ }

        // 1. Get active sources
        const { data: sources, error: sourcesError } = await supabase
            .from('sources')
            .select('*')
            .eq('active', true)

        if (sourcesError) throw sourcesError
        if (!sources || sources.length === 0) {
            return new Response(
                JSON.stringify({ message: 'No active sources found' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const results: ScrapeResult[] = []
        let totalNew = 0
        let totalSkippedHash = 0
        let totalSkippedSemantic = 0
        let firecrawlCalls = 0

        console.log(`\n🚀 Starting Hybrid Ingestion for ${sources.length} sources...\n`)

        // 2. Process each source
        for (const source of sources) {
            console.log(`\n📰 Processing: ${source.name}`)

            // Determine if source is RSS/Atom feed
            const isRssFeed = source.type === 'rss' || source.type === 'atom' ||
                source.url.includes('.xml') ||
                source.url.includes('/rss') ||
                source.url.includes('/feed') ||
                source.url.includes('feeds.')

            let feedItems: FeedItem[] = []

            // ============================================================
            // LAYER 0: Fetch RSS/Atom Feed (FREE, FAST)
            // ============================================================
            if (isRssFeed) {
                try {
                    console.log(`  📡 Fetching RSS feed...`)
                    const feedResponse = await fetch(source.url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
                        }
                    })
                    const feedText = await feedResponse.text()
                    feedItems = parseRSSFeed(feedText)
                    console.log(`  ✅ Found ${feedItems.length} items in feed`)
                } catch (err) {
                    console.warn(`  ⚠️ RSS fetch failed:`, err)
                }
            }

            // If no RSS items, treat source URL as single item
            if (feedItems.length === 0) {
                feedItems = [{
                    title: source.name,
                    link: source.url,
                    description: ''
                }]
            }

            // Limit items per source
            feedItems = feedItems.slice(0, options.maxItemsPerSource)

            // 3. Process each feed item
            for (const item of feedItems) {
                console.log(`\n  📄 Item: ${item.title.substring(0, 50)}...`)

                // ============================================================
                // LAYER 1: Hash Check (0ms, $0) - Instant duplicate detection
                // ============================================================
                const contentHash = await generateHash(item.title + '|' + item.link)

                const { data: existingHash } = await supabase
                    .from('raw_news')
                    .select('id')
                    .eq('content_hash', contentHash)
                    .single()

                if (existingHash) {
                    console.log(`  ⏭️ Hash duplicate - skipping`)
                    totalSkippedHash++
                    results.push({
                        source: source.name,
                        status: 'skipped_hash',
                        title: item.title
                    })
                    continue
                }

                // ============================================================
                // LAYER 2: Get Full Content (Firecrawl if enabled)
                // ============================================================
                let fullContent = item.description
                let method: 'rss_only' | 'rss_firecrawl' | 'firecrawl_only' = 'rss_only'

                // Use Firecrawl to get full article content if:
                // - Firecrawl is enabled
                // - We have a valid article URL (not just a feed URL)
                // - Description is too short (less than 200 chars)
                const shouldFirecrawl = options.enableFirecrawl &&
                    firecrawlApiKey &&
                    item.link !== source.url &&
                    (!item.description || item.description.length < 200)

                if (shouldFirecrawl) {
                    const scraped = await scrapeWithFirecrawl(item.link, firecrawlApiKey)
                    firecrawlCalls++

                    if (scraped && scraped.content) {
                        fullContent = scraped.content
                        method = isRssFeed ? 'rss_firecrawl' : 'firecrawl_only'
                        console.log(`  ✅ Firecrawl: Got ${fullContent.length} chars`)
                    }
                }

                // Fallback to description if no content
                if (!fullContent || fullContent.length < 50) {
                    fullContent = item.description || item.title
                }

                // ============================================================
                // LAYER 3: Generate Embedding
                // ============================================================
                const textToEmbed = `${item.title}\n${fullContent}`
                const embedding = await generateEmbedding(textToEmbed, geminiApiKey)

                if (!embedding) {
                    console.warn(`  ⚠️ Failed to generate embedding`)
                }

                // ============================================================
                // LAYER 4: Semantic Deduplication (Uses HNSW index)
                // ============================================================
                if (embedding) {
                    const { data: similarNews } = await supabase.rpc('match_news', {
                        query_embedding: embedding,
                        match_threshold: 0.85,
                        match_count: 1
                    })

                    if (similarNews && similarNews.length > 0) {
                        console.log(`  ⏭️ Semantic duplicate (${(similarNews[0].similarity * 100).toFixed(1)}% similar to "${similarNews[0].title.substring(0, 30)}...")`)
                        totalSkippedSemantic++
                        results.push({
                            source: source.name,
                            status: 'skipped_semantic',
                            title: item.title
                        })
                        continue
                    }
                }

                // ============================================================
                // LAYER 5: Save Clean News to DB
                // ============================================================
                const { error: insertError } = await supabase
                    .from('raw_news')
                    .insert({
                        source_id: source.id,
                        title: item.title,
                        url: item.link,
                        content: fullContent.substring(0, 10000), // Limit content size
                        content_hash: contentHash,
                        embedding,
                        published_date: (item.pubDate && !isNaN(Date.parse(item.pubDate))) ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                        image_url: item.image || null
                    })

                if (insertError) {
                    console.error(`  ❌ DB Error:`, insertError)
                    results.push({
                        source: source.name,
                        status: 'db_error',
                        title: item.title,
                        error: insertError.message
                    })
                } else {
                    console.log(`  ✅ Saved! Method: ${method}`)
                    totalNew++
                    results.push({
                        source: source.name,
                        status: 'success',
                        title: item.title,
                        method
                    })
                }
            }

            // Update last_scraped_at for source
            await supabase
                .from('sources')
                .update({ last_scraped_at: new Date().toISOString() })
                .eq('id', source.id)
        }

        const summary = {
            total_processed: results.length,
            new_articles: totalNew,
            skipped_hash_duplicates: totalSkippedHash,
            skipped_semantic_duplicates: totalSkippedSemantic,
            firecrawl_api_calls: firecrawlCalls,
            details: results
        }

        console.log(`\n✨ Ingestion Complete!`)
        console.log(`   New: ${totalNew} | Hash Skip: ${totalSkippedHash} | Semantic Skip: ${totalSkippedSemantic} | Firecrawl Calls: ${firecrawlCalls}`)

        return new Response(
            JSON.stringify(summary),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Fatal error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
