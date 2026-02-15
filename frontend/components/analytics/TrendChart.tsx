import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendData {
    month: string;
    reads: number;
    downloads?: number;
}

interface TrendChartProps {
    data: TrendData[];
    isDark?: boolean;
}

export function TrendChart({ data, isDark = false }: TrendChartProps) {
    // Safety check: ensure data is an array
    const safeData = Array.isArray(data) ? data : [];

    return (
        <div className={`rounded-xl border p-6 transition-colors ${isDark
            ? 'bg-slate-900/80 border-white/10'
            : 'bg-white border-slate-200'
            }`}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className={`text-sm font-black uppercase tracking-widest mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                        Monthly Readership Trend
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Last 6 months
                    </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#16669E]"></div>
                        <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Total Reads</span>
                    </div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={220}>
                <LineChart data={safeData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDark ? '#334155' : '#e2e8f0'}
                        vertical={false}
                    />
                    <XAxis
                        dataKey="month"
                        stroke={isDark ? '#94a3b8' : '#64748b'}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                    />
                    <YAxis
                        stroke={isDark ? '#94a3b8' : '#64748b'}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: isDark ? '#1e293b' : '#fff',
                            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                            borderRadius: '8px',
                            fontSize: '12px'
                        }}
                        labelStyle={{
                            color: isDark ? '#fff' : '#000',
                            fontWeight: 'bold',
                            marginBottom: '4px'
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="reads"
                        stroke="#16669E"
                        strokeWidth={3}
                        dot={{ fill: '#16669E', r: 5, strokeWidth: 2, stroke: isDark ? '#0f172a' : '#fff' }}
                        activeDot={{ r: 7 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
