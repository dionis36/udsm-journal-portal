interface ImpactMetrics {
    jif?: number;
    citescore?: number;
    sjr?: number;
    h5_index?: number;
    quartile?: string;
}

interface ImpactMetricsProps {
    metrics: ImpactMetrics;
    isDark?: boolean;
}

const metricCards = [
    {
        key: 'jif' as keyof ImpactMetrics,
        label: 'Journal Impact Factor',
        icon: '📈',
        color: 'from-blue-500 to-blue-600',
        description: '2-year average citations'
    },
    {
        key: 'citescore' as keyof ImpactMetrics,
        label: 'CiteScore',
        icon: '📊',
        color: 'from-emerald-500 to-emerald-600',
        description: '4-year impact metric'
    },
    {
        key: 'sjr' as keyof ImpactMetrics,
        label: 'SJR Ranking',
        icon: '🏆',
        color: 'from-amber-500 to-amber-600',
        description: 'Prestige-weighted'
    },
    {
        key: 'h5_index' as keyof ImpactMetrics,
        label: 'h5-index',
        icon: '🎯',
        color: 'from-violet-500 to-violet-600',
        description: 'Google Scholar metric'
    },
];

export function ImpactMetrics({ metrics, isDark = false }: ImpactMetricsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricCards.map((card) => {
                const value = metrics[card.key];

                return (
                    <div
                        key={card.key}
                        className={`rounded-xl border p-5 transition-all hover:scale-105 hover:shadow-lg ${isDark
                                ? 'bg-slate-900/80 border-white/10'
                                : 'bg-white border-slate-200'
                            }`}
                    >
                        {/* Icon and Badge */}
                        <div className="flex items-center justify-between mb-3">
                            <div className={`text-3xl p-2 rounded-lg bg-gradient-to-br ${card.color} shadow-md`}>
                                {card.icon}
                            </div>
                            {card.key === 'h5_index' && metrics.quartile && (
                                <span className={`px-2 py-1 rounded-lg text-xs font-black ${isDark ? 'bg-slate-700 text-amber-400' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {metrics.quartile}
                                </span>
                            )}
                        </div>

                        {/* Value */}
                        <div className={`text-4xl font-black mb-2 bg-gradient-to-br ${card.color} bg-clip-text text-transparent`}>
                            {value !== undefined ? value.toFixed(2) : 'N/A'}
                        </div>

                        {/* Label */}
                        <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                            {card.label}
                        </div>

                        {/* Description */}
                        <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'
                            }`}>
                            {card.description}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
