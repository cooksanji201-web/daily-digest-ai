import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Service role for Storage write
        )

        const today = new Date().toISOString().split('T')[0]

        // Check if digest already exists for today
        const { data: existingDigest } = await supabaseClient
            .from('daily_digests')
            .select('*')
            .eq('digest_date', today)
            .single()

        if (existingDigest) {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Digest already exists',
                    transcript: existingDigest.transcript,
                    highlights: existingDigest.summary_json?.highlights || [],
                    audio_url: existingDigest.audio_url
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Get news from last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

        const { data: newsItems, error: fetchError } = await supabaseClient
            .from('raw_news')
            .select('title, content, source_id')
            .gte('created_at', twentyFourHoursAgo)
            .order('created_at', { ascending: false })
            .limit(15)

        if (fetchError) throw fetchError

        if (!newsItems || newsItems.length === 0) {
            return new Response(
                JSON.stringify({ message: 'No new articles in the last 24 hours' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // === STEP 1: GEMINI - Generate Script ===
        const newsContext = newsItems.map((n, i) =>
            `[${i + 1}] ${n.title}\n${n.content ? n.content.substring(0, 300) : 'No details'}...`
        ).join('\n\n')

        const prompt = `You are a professional tech podcast editor-in-chief.

Based on these news items:
${newsContext}

Your tasks:
1. Remove duplicate or low-quality items.
2. Select the TOP 3-5 most newsworthy stories.
3. Write a podcast script (~3 minutes spoken).
4. Structure: Greeting -> Main Stories -> Sign-off.
5. Tone: Energetic, professional, easy to understand.

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "transcript": "Full podcast script text here...",
  "highlights": ["Headline 1", "Headline 2", "Headline 3"]
}

Do NOT include markdown code blocks. Return raw JSON only.`

        const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`

        console.log('Step 1: Calling Gemini 2.5 Flash...')
        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.95,
                    maxOutputTokens: 2048
                }
            })
        })

        const geminiData = await geminiResponse.json()

        if (!geminiData.candidates || geminiData.candidates.length === 0) {
            console.error('Gemini Error:', geminiData)
            throw new Error('Failed to generate content with Gemini')
        }

        const rawOutput = geminiData.candidates[0].content.parts[0].text

        let transcript = ''
        let highlights: string[] = []

        try {
            const cleanJson = rawOutput.replace(/```json\n?|\n?```/g, '').trim()
            const parsed = JSON.parse(cleanJson)
            transcript = parsed.transcript || ''
            highlights = parsed.highlights || []
        } catch (parseError) {
            console.warn('Failed to parse structured output, using raw text')
            transcript = rawOutput
            highlights = newsItems.slice(0, 3).map(n => n.title)
        }

        // === STEP 2: DEEPGRAM AURA - Text to Speech ===
        console.log('Step 2: Calling Deepgram Aura TTS...')
        const deepgramApiKey = Deno.env.get('DEEPGRAM_API_KEY')

        let audioUrl = null

        if (deepgramApiKey) {
            try {
                const ttsResponse = await fetch('https://api.deepgram.com/v1/speak?model=aura-asteria-en', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Token ${deepgramApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ text: transcript })
                })

                if (!ttsResponse.ok) {
                    console.error('Deepgram Error:', await ttsResponse.text())
                } else {
                    const audioBlob = await ttsResponse.blob()
                    const fileName = `digest_${today}_${Date.now()}.mp3`

                    // === STEP 3: UPLOAD TO SUPABASE STORAGE ===
                    console.log('Step 3: Uploading to Supabase Storage...')
                    const { data: uploadData, error: uploadError } = await supabaseClient.storage
                        .from('podcasts')
                        .upload(fileName, audioBlob, {
                            contentType: 'audio/mpeg',
                            upsert: true
                        })

                    if (uploadError) {
                        console.error('Storage Upload Error:', uploadError)
                    } else {
                        // Get public URL
                        const { data: urlData } = supabaseClient.storage
                            .from('podcasts')
                            .getPublicUrl(fileName)

                        audioUrl = urlData.publicUrl
                        console.log('Audio uploaded:', audioUrl)
                    }
                }
            } catch (ttsError) {
                console.error('TTS Error:', ttsError)
            }
        } else {
            console.warn('DEEPGRAM_API_KEY not set, skipping audio generation')
        }

        // === STEP 4: SAVE TO DATABASE ===
        const { error: insertError } = await supabaseClient.from('daily_digests').insert({
            transcript,
            digest_date: today,
            audio_url: audioUrl,
            summary_json: {
                highlights,
                article_count: newsItems.length,
                generated_at: new Date().toISOString()
            }
        })

        if (insertError) throw insertError

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Digest generated',
                transcript,
                highlights,
                audio_url: audioUrl
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    }
})
