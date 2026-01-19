import { ExternalLink, Globe } from 'lucide-react';

export const NewsCard = ({ article }) => {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-xl transition-all hover:border-blue-500/50 hover:bg-slate-900/80 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] flex flex-col h-full">
            {/* Header: Source & Time */}
            <div className="mb-3 flex items-center justify-between text-xs font-medium text-slate-400">
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 border border-white/5 shadow-inner">
                        <Globe size={12} className="text-blue-400" />
                    </div>
                    <span className="truncate max-w-[120px] font-mono tracking-wide text-slate-300">
                        {article.sources?.name || 'Tech Source'}
                    </span>
                </div>
                <span className="opacity-60">
                    {new Date(article.published_date || article.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            {/* Body: Title & Summary */}
            <h3 className="mb-2 line-clamp-2 text-lg font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight">
                {article.title}
            </h3>
            <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-slate-400 flex-grow">
                {article.content?.substring(0, 160)}...
            </p>

            {/* Action: Link to Original Source */}
            <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                <div className="flex gap-2">
                    {/* Tag */}
                    <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-400 uppercase tracking-wider border border-blue-500/10">
                        AI News
                    </span>
                </div>
                <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-full hover:bg-blue-600/20 group/link"
                >
                    View Source
                    <ExternalLink size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
                </a>
            </div>
        </div>
    );
};
