import { Calendar, ExternalLink } from 'lucide-react';

const NewsCard = ({ article }) => {
    return (
        <div className="glass-card p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start">
                <span className="text-xs font-semibold px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {article.source}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={12} />
                    {article.date}
                </span>
            </div>

            <a href={article.url} target="_blank" rel="noopener noreferrer" className="group">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                    {article.title}
                </h3>
            </a>

            <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                {article.summary}
            </p>

            <div className="mt-auto pt-4 flex justify-end">
                <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                    Read original <ExternalLink size={12} />
                </a>
            </div>
        </div>
    );
};

export default NewsCard;
