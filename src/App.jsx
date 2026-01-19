import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import AudioPlayer from './components/AudioPlayer';
import NewsFeed from './components/NewsFeed';
import { Sparkles, Radio, LayoutDashboard, Globe, Rss } from 'lucide-react';

function App() {
  const [digest, setDigest] = useState(null);
  const [news, setNews] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'vietnam', 'global'
  const [loading, setLoading] = useState(true);

  // Derive specialized lists
  // NOTE: Simple filtering logic based on source name or detection. 
  // In a real app, this should be a DB column.
  const vnKeywords = ['vnexpress', 'tuoi tre', 'thanh nien', 'tinhte', 'genk', 'znews'];

  const vnNews = news.filter(n => {
    const source = n.sources?.name?.toLowerCase() || '';
    const url = n.url?.toLowerCase() || '';
    return url.includes('.vn') || vnKeywords.some(k => source.includes(k));
  });

  const globalNews = news.filter(n => !vnNews.includes(n));

  const displayNews = activeTab === 'all' ? news : activeTab === 'vietnam' ? vnNews : globalNews;

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // 1. Fetch Latest Digest
        const { data: digestData } = await supabase
          .from('daily_digests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (digestData) setDigest(digestData);

        // 2. Fetch Latest News
        const { data: newsData } = await supabase
          .from('raw_news')
          .select('*, sources(name)')
          .order('created_at', { ascending: false })
          .limit(50); // Increased limit for better filtering

        if (newsData) setNews(newsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 font-sans selection:bg-purple-500/30 selection:text-purple-200 pb-32">

      {/* Navbar - Fixed Glass */}
      <nav className="fixed top-0 w-full border-b border-white/5 bg-black/40 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Radio size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Daily<span className="text-blue-400">Digest</span>.ai
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-gray-400 hover:text-white'}`}
            >
              Mixed
            </button>
            <button
              onClick={() => setActiveTab('vietnam')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'vietnam' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-gray-400 hover:text-white'}`}
            >
              Vietnam
            </button>
            <button
              onClick={() => setActiveTab('global')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'global' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-gray-400 hover:text-white'}`}
            >
              Global
            </button>
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10" />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-24">

        {/* Dashboard Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-400 mb-2">
              Morning Briefing
            </h1>
            <p className="text-slate-400">Here's what happened in the world of AI today.</p>
          </div>
          {/* Mobile Tab View (visible only on small screens) */}
          <div className="md:hidden">
            <select
              className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
            >
              <option value="all">Mixed View</option>
              <option value="vietnam">Vietnam News</option>
              <option value="global">Global News</option>
            </select>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 glass-card rounded-2xl animate-pulse bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {/* News Grid */}
            <NewsFeed articles={displayNews} />
          </div>
        )}

      </main>

      {/* Fixed Player Bar */}
      <div className="fixed bottom-0 left-0 w-full border-t border-white/10 bg-black/60 backdrop-blur-2xl z-40 pb-safe">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {digest ? (
            <div className="flex items-center gap-4">
              {/* Minimized Player UI - reusing AudioPlayer logic but can be simplified */}
              <div className="flex-1">
                <AudioPlayer
                  audioUrl={digest.audio_url}
                  title="Latest Digest"
                  date={new Date(digest.digest_date).toLocaleDateString()}
                />
              </div>
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500 py-2">
              Waiting for next digest generation...
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default App;
