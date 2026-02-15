'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Activity, Calendar, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface LiveImpactFactorData {
    current_lif: number;
    citation_count: number;
    article_count: number;
    period: string;
    citation_year: number;
    last_updated: string;
}

interface TrendData {
    year: number;
    lif: number;
    citations: number;
    articles: number;
}

interface MonthlyProgress {
    month: string;
    citations: number;
    cumulative_citations: number;
    cumulative_lif: string;
}

export function LiveImpactFactor() {
    const [data, setData] = useState<LiveImpactFactorData | null>(null);
    const [trend, setTrend] = useState<TrendData[]>([]);
    const [monthlyProgress, setMonthlyProgress] = useState<MonthlyProgress[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [current, historical, monthly] = await Promise.all([
                    fetch('/api/metrics/live-impact-factor').then(r => r.json()),
                    fetch('/api/metrics/live-impact-factor/trend?years=5').then(r => r.json()),
                    fetch('/api/metrics/live-impact-factor/monthly-progress').then(r => r.json())
                ]);

                setData(current);
                setTrend(historical);
                setMonthlyProgress(monthly);
            } catch (error) {
                console.error('Failed to fetch LIF data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();

        // Refresh every 5 minutes
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg border animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="bg-white p-6 rounded-lg border">
                <p className="text-gray-500">No Live Impact Factor data available</p>
            </div>
        );
    }

    const currentYear = new Date().getFullYear();

    return (
        <div className="space-y-6">
            {/* Main LIF Display */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Activity className="text-blue-600" size={32} />
                        <h3 className="text-2xl font-bold text-gray-900">Live Impact Factor</h3>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-green-700">Real-time</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Current LIF */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="flex items-baseline gap-3 mb-2">
                            <span className="text-5xl font-bold text-blue-600">
                                {data.current_lif.toFixed(3)}
                            </span>
                            <TrendingUp className="text-green-500" size={24} />
                        </div>
                        <p className="text-sm text-gray-600">Current Impact Factor</p>
                        <p className="text-xs text-gray-500 mt-1">
                            Based on {currentYear} citations
                        </p>
                    </div>

                    {/* Citations */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="text-4xl font-bold text-indigo-600 mb-2">
                            {data.citation_count}
                        </div>
                        <p className="text-sm text-gray-600">Citations This Year</p>
                        <p className="text-xs text-gray-500 mt-1">
                            To articles from {data.period}
                        </p>
                    </div>

                    {/* Articles */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="text-4xl font-bold text-purple-600 mb-2">
                            {data.article_count}
                        </div>
                        <p className="text-sm text-gray-600">Articles in Window</p>
                        <p className="text-xs text-gray-500 mt-1">
                            Published {data.period}
                        </p>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-200">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Calendar size={14} />
                        <span>Last updated: {new Date(data.last_updated).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Historical Trend */}
            {trend.length > 0 && (
                <div className="bg-white p-6 rounded-lg border">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Award className="text-amber-500" size={20} />
                        5-Year Historical Trend
                    </h4>

                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={trend}>
                            <defs>
                                <linearGradient id="lifGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="year"
                                tick={{ fontSize: 12 }}
                                stroke="#6b7280"
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                stroke="#6b7280"
                                label={{ value: 'Live Impact Factor', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                                formatter={(value: number | undefined) => value !== undefined ? value.toFixed(3) : 'N/A'}
                            />
                            <Area
                                type="monotone"
                                dataKey="lif"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fill="url(#lifGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>

                    <p className="text-xs text-gray-500 mt-4">
                        * Rolling 2-year calculation updated in real-time based on current citations
                    </p>
                </div>
            )}

            {/* Monthly Progress (Current Year) */}
            {monthlyProgress.length > 0 && (
                <div className="bg-white p-6 rounded-lg border">
                    <h4 className="text-lg font-semibold mb-4">{currentYear} Monthly Progress</h4>

                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={monthlyProgress}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="month"
                                tick={{ fontSize: 11 }}
                                stroke="#6b7280"
                            />
                            <YAxis
                                tick={{ fontSize: 11 }}
                                stroke="#6b7280"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="cumulative_lif"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                dot={{ fill: '#8b5cf6', r: 4 }}
                                name="Cumulative LIF"
                            />
                        </LineChart>
                    </ResponsiveContainer>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {monthlyProgress.slice(-4).map((month, idx) => (
                            <div key={idx} className="text-center p-3 bg-gray-50 rounded">
                                <div className="text-sm font-semibold text-gray-700">{month.month}</div>
                                <div className="text-lg font-bold text-purple-600">{month.citations}</div>
                                <div className="text-xs text-gray-500">citations</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Explanation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-semibold text-blue-900 mb-2">What is Live Impact Factor?</h5>
                <p className="text-sm text-blue-800 leading-relaxed">
                    Unlike traditional Impact Factor (calculated once per year by Clarivate), the <strong>Live Impact Factor</strong> updates
                    continuously throughout the year. It shows citations received <strong>this year</strong> to articles published in the
                    <strong> previous 2 years</strong>, giving you real-time insight into your journal's growing impact.
                </p>
            </div>
        </div>
    );
}
