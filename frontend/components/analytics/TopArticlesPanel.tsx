interface Article {
    id: string;
    title: string;
    reads: number;
    downloads: number;
    year?: number;
}

interface TopArticlesPanelProps {
    articles: Article[];
    isDark?: boolean;
}

export function TopArticlesPanel({ articles, isDark = false }: TopArticlesPanelProps) {
    // Safety check: ensure articles is an array
    const safeArticles = Array.isArray(articles) ? articles : [];

    return (
        <div className={`rounded-xl border p-6 transition-colors ${isDark
            ? 'bg-slate-900/80 border-white/10'
            : 'bg-white border-slate-200'
            }`}>
            <div className="mb-6">
                <h3 className={`text-sm font-black uppercase tracking-widest mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                    Most Read Articles
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Last 30 days
                </p>
            </div>

            <div className="space-y-3">
                {safeArticles.slice(0, 5).map((article, idx) => (
                    <div
                        key={article.id}
                        className={`flex items-start gap-3 p-3 rounded-lg transition-all hover:scale-[1.02] ${isDark
                            ? 'hover:bg-slate-800/50'
                            : 'hover:bg-slate-50'
                            }`}
                    >
                        {/* Rank Badge */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#16669E] to-[#D4AF37] flex items-center justify-center shadow-lg">
                            <span className="text-sm font-black text-white">#{idx + 1}</span>
                        </div>

                        {/* Article Info */}
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold line-clamp-2 mb-2 ${isDark ? 'text-white' : 'text-slate-900'
                                }`}>
                                {article.title}
                            </p>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-lg">📖</span>
                                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                                        <span className="font-bold">{article.reads.toLocaleString()}</span> reads
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-lg">📥</span>
                                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                                        <span className="font-bold">{article.downloads.toLocaleString()}</span> downloads
                                    </span>
                                </div>
                                {article.year && (
                                    <span className={`px-2 py-0.5 rounded ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {article.year}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {safeArticles.length === 0 && (
                <div className="text-center py-8">
                    <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        No articles found
                    </p>
                </div>
            )}
        </div>
    );
}
