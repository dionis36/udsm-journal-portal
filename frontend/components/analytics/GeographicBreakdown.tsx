import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

interface GeoData {
    country: string;
    country_code: string;
    reads: number;
}

interface GeographicBreakdownProps {
    data: GeoData[];
    isDark?: boolean;
}

const COLORS = [
    '#16669E', // Primary UDSM blue
    '#1e7bb8', // Lighter blue
    '#2690d2', // Even lighter
    '#3aa4e6', // Light blue
    '#4eb9fa', // Very light blue
    '#62cdff', // Cyan
    '#76d7ff', // Light cyan
    '#8ae1ff', // Lighter cyan
    '#9eebff', // Very light cyan
    '#b2f5ff', // Pale cyan
];

export function GeographicBreakdown({ data, isDark = false }: GeographicBreakdownProps) {
    // Safety check: ensure data is an array
    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className={`rounded-xl border p-6 transition-colors ${isDark
                ? 'bg-slate-900/80 border-white/10'
                : 'bg-white border-slate-200'
                }`}>
                <div className="mb-6">
                    <h3 className={`text-sm font-black uppercase tracking-widest mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                        Top 10 Countries
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        By total readership
                    </p>
                </div>
                <div className="text-center py-12">
                    <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Loading geographic data...
                    </p>
                </div>
            </div>
        );
    }

    // Sort by reads and take top 10
    const topCountries = data
        .sort((a, b) => b.reads - a.reads)
        .slice(0, 10);

    return (
        <div className={`rounded-xl border p-6 transition-colors ${isDark
            ? 'bg-slate-900/80 border-white/10'
            : 'bg-white border-slate-200'
            }`}>
            <div className="mb-6">
                <h3 className={`text-sm font-black uppercase tracking-widest mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                    Top 10 Countries
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    By total readership
                </p>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart
                    data={topCountries}
                    margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                    layout="horizontal"
                >
                    <XAxis
                        type="category"
                        dataKey="country_code"
                        stroke={isDark ? '#94a3b8' : '#64748b'}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                    />
                    <YAxis
                        type="number"
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
                        formatter={(value: any, name: any, props: any) => {
                            const safeValue = value ?? 0;
                            return [`${safeValue.toLocaleString()} reads`, props.payload.country];
                        }}
                    />
                    <Bar
                        dataKey="reads"
                        radius={[8, 8, 0, 0]}
                    >
                        {topCountries.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Legend with country names */}
            <div className="mt-4 grid grid-cols-2 gap-2">
                {topCountries.slice(0, 6).map((country, idx) => (
                    <div key={country.country_code} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        ></div>
                        <span className={`text-xs truncate ${isDark ? 'text-slate-300' : 'text-slate-600'
                            }`}>
                            {country.country} ({country.reads.toLocaleString()})
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
