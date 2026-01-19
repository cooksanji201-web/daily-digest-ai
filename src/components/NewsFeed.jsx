import { ExternalLink, Clock, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NewsFeed({ articles }) {
    if (!articles || articles.length === 0) {
        return (
            <div className="text-center py-20 text-gray-500">
                <p>No news articles found today.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
                <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card rounded-2xl p-6 flex flex-col h-full group"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-mono text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded">
                            {article.sources?.name || 'Unknown Source'}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={12} />
                            {article.created_at ? formatDistanceToNow(new Date(article.created_at), { addSuffix: true }) : 'Recently'}
                        </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-100 mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">
                        {article.title}
                    </h3>

                    {/* Snippet / Summary */}
                    <p className="text-sm text-gray-400 line-clamp-3 mb-6 flex-grow">
                        {article.content
                            ? article.content.substring(0, 150) + '...'
                            : 'Click to read full article...'}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500 border-t border-white/5 pt-4 mt-auto">
                        <div className="flex items-center gap-2">
                            <Tag size={12} />
                            <span>AI News</span>
                        </div>
                        <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-gray-400 group-hover:text-blue-400">
                            Read Article <ExternalLink size={12} />
                        </div>
                    </div>
                </a>
            ))}
        </div>
    );
}
