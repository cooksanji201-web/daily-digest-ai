import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import AudioPlayer from './components/AudioPlayer';
import NewsFeed from './components/NewsFeed';
import { Sparkles, Radio } from 'lucide-react';

function App() {
  const [digest, setDigest] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

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

        if (digestData) {
          setDigest(digestData);
        }

        // 2. Fetch Latest News (raw_news + sources)
        const { data: newsData } = await supabase
          .from('raw_news')
          .select('*, sources(name)')
          .order('created_at', { ascending: false })
          .limit(20);

        if (newsData) {
          setNews(newsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 font-sans selection:bg-purple-500/30 selection:text-purple-200 pb-20">

      {/* Navbar / Header */}
      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Radio size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Daily<span className="text-blue-400">Digest</span>.ai
            </span>
          </div>
          <div className="text-xs font-mono text-gray-500 hidden sm:block border border-white/10 rounded-full px-3 py-1">
            v1.0.0 • Beta
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-12">

        {/* Hero Section (Audio Player) */}
        {loading ? (
          <div className="h-64 glass-panel rounded-3xl animate-pulse flex items-center justify-center">
            <p className="text-gray-500">Loading your digest...</p>
          </div>
        ) : digest ? (
          <AudioPlayer
            audioUrl={digest.audio_url}
            title="Your Daily Tech Briefing"
            date={new Date(digest.digest_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          />
        ) : (
          <div className="h-48 glass-panel rounded-3xl flex flex-col items-center justify-center text-gray-400 mb-12 border-dashed border-2 border-white/10">
            <Sparkles size={48} className="mb-4 text-gray-600" />
            <p>No digest generated for today yet.</p>
            <p className="text-xs mt-2 text-gray-600">Waiting for scheduled generation...</p>
          </div>
        )}

        {/* Latest News Feed */}
        <div className="flex items-center gap-3 mb-8 mt-16">
          <div className="h-8 w-1 bg-blue-500 rounded-full" />
          <h2 className="text-2xl font-bold">Latest Incoming News</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 glass-card rounded-2xl animate-pulse bg-white/5" />
            ))}
          </div>
        ) : (
          <NewsFeed articles={news} />
        )}

      </main>
    </div>
  );
}

export default App;
