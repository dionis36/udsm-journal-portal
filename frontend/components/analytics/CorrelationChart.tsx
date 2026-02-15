'use client';

import { useEffect, useState } from 'react';
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine, Label
} from 'recharts';
import { Info, ZoomIn } from 'lucide-react';

interface ArticlePoint {
    item_id: number;
    title: string;
    authors: string;
    citations: number;
    downloads: number;
    age_days: number;
}

interface CorrelationData {
    data: ArticlePoint[];
    correlation: number;
    medianDownloads: number;
    medianCitations: number;
    quadrants: {
        stars: number;
        hidden_gems: number;
        popular: number;
        emerging: number;
    };
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-4 border border-slate-200 shadow-lg rounded-lg max-w-xs">
                <p className="font-bold text-sm text-slate-800 mb-1 line-clamp-2">{data.title}</p>
                <p className="text-xs text-slate-500 mb-2 truncate">{data.authors}</p>
                <div className="flex gap-4">
                    <div>
                        <span className="block text-xs text-slate-400 uppercase">Downloads</span>
                        <span className="font-mono font-bold text-blue-600">{data.downloads}</span>
                    </div>
                    <div>
                        <span className="block text-xs text-slate-400 uppercase">Citations</span>
                        <span className="font-mono font-bold text-emerald-600">{data.citations}</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export function CorrelationChart() {
    const [data, setData] = useState<CorrelationData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:4000/api/metrics/downloads-citations-correlation')
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="h-96 w-full bg-slate-50 animate-pulse rounded-xl" />;
    if (!data) return null;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        Downloads vs. Citations Correlation
                        <div className="group relative">
                            <Info size={16} className="text-slate-400 cursor-help" />
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                Analyzes the relationship between readership and academic impact. Can identify 'Hidden Gems' (high impact, low reads) and 'Popular' papers.
                            </div>
                        </div>
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Correlation Coefficient: <span className={`font-bold ${data.correlation > 0.5 ? 'text-green-600' : 'text-slate-700'}`}>
                            {typeof data.correlation === 'number' ? data.correlation.toFixed(3) : 'N/A'}
                        </span>
                        {data.correlation > 0.5 ? ' (Strong)' : data.correlation > 0.3 ? ' (Moderate)' : ' (Weak)'}
                    </p>
                </div>

                {/* Legend */}
                <div className="flex gap-3 text-xs">
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-blue-500 opacity-60"></span>
                        <span className="text-slate-600">Article</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 border-t border-dashed border-slate-400"></span>
                        <span className="text-slate-600">Medians</span>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                                type="number"
                                dataKey="downloads"
                                name="Downloads"
                                stroke="#94a3b8"
                                fontSize={12}
                                label={{ value: 'Total Downloads', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 12 }}
                            />
                            <YAxis
                                type="number"
                                dataKey="citations"
                                name="Citations"
                                stroke="#94a3b8"
                                fontSize={12}
                                label={{ value: 'Citation Count', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                            {/* Quadrant References */}
                            <ReferenceLine x={data.medianDownloads} stroke="#cbd5e1" strokeDasharray="3 3">
                                <Label value="Median Downloads" position="insideTopRight" fill="#94a3b8" fontSize={10} angle={-90} offset={10} />
                            </ReferenceLine>
                            <ReferenceLine y={data.medianCitations} stroke="#cbd5e1" strokeDasharray="3 3">
                                <Label value="Median Citations" position="insideTopRight" fill="#94a3b8" fontSize={10} />
                            </ReferenceLine>

                            {/* Quadrant Labels (Background) */}
                            {/* Handled via CSS/HTML overlay usually, but here simplified */}

                            <Scatter
                                name="Articles"
                                data={data.data}
                                fill="#3b82f6"
                                fillOpacity={0.6}
                            />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>

                {/* Quadrant Summary */}
                <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                    <QuadrantStat
                        label="⭐ Stars"
                        count={data.quadrants.stars}
                        desc="High Reads, High Cites"
                        color="text-yellow-600 bg-yellow-50"
                    />
                    <QuadrantStat
                        label="💎 Hidden Gems"
                        count={data.quadrants.hidden_gems}
                        desc="Low Reads, High Cites"
                        color="text-purple-600 bg-purple-50"
                    />
                    <QuadrantStat
                        label="📢 Popular"
                        count={data.quadrants.popular}
                        desc="High Reads, Low Cites"
                        color="text-blue-600 bg-blue-50"
                    />
                    <QuadrantStat
                        label="🌱 Emerging"
                        count={data.quadrants.emerging}
                        desc="Low Reads, Low Cites"
                        color="text-slate-600 bg-slate-50"
                    />
                </div>
            </div>
        </div>
    );
}

function QuadrantStat({ label, count, desc, color }: { label: string, count: number, desc: string, color: string }) {
    return (
        <div className={`p-3 rounded-lg text-center ${color}`}>
            <div className="font-bold text-sm mb-1">{label}</div>
            <div className="text-2xl font-black mb-1">{count}</div>
            <div className="text-[10px] opacity-80 uppercase tracking-wide">{desc}</div>
        </div>
    );
}
