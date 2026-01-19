import { useState } from 'react';
import { Play, Plus, RefreshCw, Settings, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import NewsCard from '../components/NewsCard';
import AudioPlayer from '../components/AudioPlayer';

const MOCK_ARTICLES = [
    {
        id: 1,
        source: 'TechCrunch',
        title: 'OpenAI releases new "O1" model with reasoning capabilities',
        summary: 'OpenAI has announced a new series of AI models designed to spend more time thinking before they respond.',
        url: 'https://techcrunch.com',
        date: 'Today, 9:00 AM'
    },
    {
        id: 2,
        source: 'The Verge',
        title: 'NVIDIA announces new Blackwell chips shipping to customers',
        summary: 'NVIDIA CEO Jensen Huang announced that the company has begun shipping its new Blackwell AI chips.',
        url: 'https://theverge.com',
        date: 'Today, 8:30 AM'
    },
    {
        id: 3,
        source: 'Y Combinator',
        title: 'Show HN: Daily Digest AI - Listen to your news',
        summary: 'A new tool that scrapes your favorite news sites and converts them into a personalized podcast.',
        url: 'https://news.ycombinator.com',
        date: 'Yesterday'
    }
];

const Index = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [showPlayer, setShowPlayer] = useState(false);
    const [digestScript, setDigestScript] = useState(null);
    const [highlights, setHighlights] = useState([]);
    const [audioUrl, setAudioUrl] = useState(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const { data, error } = await supabase.functions.invoke('generate-digest');

            if (error) throw error;

            if (data?.transcript) {
                setDigestScript(data.transcript);
                setHighlights(data.highlights || []);
                setAudioUrl(data.audio_url || null); // Use server audio if available
                setShowPlayer(true);
            } else {
                console.warn('No transcript returned', data);
            }
        } catch (err) {
            console.error('Failed to generate digest:', err);
            // Fallback for demo
            setDigestScript("Welcome to your Daily Digest. Today's top stories include OpenAI's new model and NVIDIA's Blackwell chips.");
            setHighlights(["OpenAI O1 Model", "NVIDIA Blackwell", "AI Trends"]);
            setAudioUrl(null);
            setShowPlayer(true);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen pb-32">
            <header>
                <div className="container flex justify-between items-center h-full">
                    <div className="logo">
                        <span className="bg-white text-black text-xs font-bold px-1.5 py-0.5 rounded">AI</span>
                        DailyDigest
                    </div>

                    <div className="flex gap-4">
                        <button className="btn btn-ghost">
                            <Settings size={20} />
                        </button>
                        <button className="btn btn-primary" onClick={handleGenerate} disabled={isGenerating}>
                            {isGenerating ? (
                                <>
                                    <RefreshCw size={18} className="animate-spin" /> Generating...
                                </>
                            ) : (
                                <>
                                    <Play size={18} fill="currentColor" /> Play Digest
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mt-12">
                <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/20 rounded-2xl p-8 mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
                        Good Morning, Creator.
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl">
                        Here is your daily briefing on <strong>AI & Tech</strong>.
                        We found 12 new articles from your trusted sources.
                    </p>
                </div>

                {/* Highlights Section */}
                {highlights.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles size={20} className="text-yellow-400" />
                            <h3 className="text-lg font-semibold text-white">Today's Top Stories</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {highlights.map((h, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1.5 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                >
                                    {h}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-semibold">All Articles</h2>
                    <button className="text-sm text-purple-400 hover:text-white flex items-center gap-1 transition-colors">
                        <Plus size={16} /> Add Source
                    </button>
                </div>

                <div className="news-grid">
                    {MOCK_ARTICLES.map(article => (
                        <NewsCard key={article.id} article={article} />
                    ))}
                </div>
            </main>

            {showPlayer && (
                <AudioPlayer
                    title={highlights[0] || "Daily Briefing: Tech & AI Trends"}
                    audioUrl={audioUrl}
                    text={digestScript}
                />
            )}
        </div>
    );
};

export default Index;
