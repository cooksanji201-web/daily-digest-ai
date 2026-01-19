import { AlertCircle } from 'lucide-react';
import { NewsCard } from './NewsCard';

export default function NewsFeed({ articles }) {
    if (!articles || articles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 border border-white/5 rounded-2xl bg-white/5 backdrop-blur-sm">
                <AlertCircle size={48} className="mb-4 opacity-50" />
                <p className="text-lg">No news articles found today.</p>
                <p className="text-sm">Check back later for updates.</p>
            </div>
        );
    }

    // Bento Grid Layout: First item spans 2 cols on large screens
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(0,1fr)]">
            {articles.map((article, index) => (
                <div
                    key={article.id}
                    className={`${index === 0 ? 'md:col-span-2 lg:row-span-2' : ''} h-full`}
                >
                    <NewsCard article={article} />
                </div>
            ))}
        </div>
    );
}
