'use client';

import { useEffect, useState } from 'react';
import { Flame, Trophy, TrendingUp, Clock } from 'lucide-react';

interface TopArticle {
    article_id: number;
    reads: number;
    title?: string;
    authors?: string;
    rank: number;
}

interface Props {
    scope?: 'week' | 'month' | 'year';
    limit?: number;
    refreshInterval?: number; // milliseconds
}

export function TopThisWeek({ scope = 'week', limit = 5, refreshInterval = 5000 }: Props) {
    const [articles, setArticles] = useState<TopArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    useEffect(() => {
        async function fetchTopArticles() {
            try {
                const response = await fetch(`http://localhost:4000/api/metrics/top-this-${scope}?limit=${limit}`);
                const data = await response.json();
                setArticles(data);
                setLastUpdate(new Date());
            } catch (error) {
                console.error('Failed to fetch top articles:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchTopArticles();

        // Auto-refresh
        const interval = setInterval(fetchTopArticles, refreshInterval);
        return () => clearInterval(interval);
    }, [scope, limit, refreshInterval]);

    const scopeLabels = {
        week: 'This Week',
        month: 'This Month',
        year: 'This Year'
    };

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'text-yellow-500';
        if (rank === 2) return 'text-gray-400';
        if (rank === 3) return 'text-orange-600';
        return 'text-gray-300';
    };

    const getRankEmoji = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-orange-50 to-red-100 p-6 rounded-xl border border-orange-200 animate-pulse">
                <div className="h-8 bg-orange-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-16 bg-white/50 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (articles.length === 0) {
        return (
            <div className="bg-gradient-to-br from-orange-50 to-red-100 p-6 rounded-xl border border-orange-200">
                <div className="flex items-center gap-2 mb-4">
                    <Flame className="text-orange-500" size={24} />
                    <h3 className="text-xl font-bold">🔥 Top {scopeLabels[scope]}</h3>
                </div>
                <p className="text-gray-500">No data available yet</p>
            </div>
        );
    }

    const timeDiff = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000);

    return (
        <div className="bg-gradient-to-br from-orange-50 to-red-100 p-6 rounded-xl border border-orange-200 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Flame className="text-orange-500" size={28} />
                    <h3 className="text-2xl font-bold text-slate-900">
                        🔥 Top {scopeLabels[scope]}
                    </h3>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <Clock size={12} className="text-green-700" />
                    <span className="text-xs font-medium text-green-700">
                        {timeDiff}s ago
                    </span>
                </div>
            </div>

            {/* Articles List */}
            <div className="space-y-3">
                {articles.map((article, idx) => (
                    <div
                        key={article.article_id}
                        className={`
              flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm
              transition-all duration-300 hover:shadow-md hover:scale-[1.02]
              ${idx === 0 ? 'ring-2 ring-yellow-400' : ''}
            `}
                    >
                        {/* Rank Badge */}
                        <div className={`
              flex items-center justify-center w-12 h-12 rounded-full
              ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                                idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                                    idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                                        'bg-gray-100 text-gray-600'}
              font-bold text-lg
            `}>
                            {idx < 3 ? getRankEmoji(idx + 1) : `#${idx + 1}`}
                        </div>

                        {/* Article Info */}
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-slate-900 line-clamp-1">
                                {article.title || `Article #${article.article_id}`}
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-1">
                                {article.authors || 'Unknown authors'}
                            </p>
                        </div>

                        {/* Read Count */}
                        <div className="text-right">
                            <div className="flex items-center gap-1">
                                <TrendingUp size={16} className="text-blue-500" />
                                <span className="text-2xl font-bold text-blue-600">
                                    {Math.floor(article.reads)}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">reads</p>
                        </div>

                        {/* Trophy for #1 */}
                        {idx === 0 && (
                            <Trophy className="text-yellow-500" size={24} />
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-orange-200">
                <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>🔄 Updates every {refreshInterval / 1000}s</span>
                    <span className="font-semibold">Real-time rankings</span>
                </div>
            </div>
        </div>
    );
}
