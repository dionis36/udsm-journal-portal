"use client";

import { Globe, Users, Clock, Download, Map as MapIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface ArticleStatsProps {
    articleId: string | number;
}

interface ImpactData {
    lat: number;
    lng: number;
    event_type: string;
    country_name: string;
    city_name: string;
    timestamp: string;
}

export function ArticleStats({ articleId }: ArticleStatsProps) {
    const [stats, setStats] = useState<ImpactData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchImpact() {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/articles/${articleId}/impact`
                );

                if (!response.ok) {
                    setError(true);
                    setLoading(false);
                    return;
                }

                const data = await response.json();
                setStats(data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch article impact:', err);
                setError(true);
                setLoading(false);
            }
        }

        fetchImpact();
    }, [articleId]);

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
                <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-gray-50 rounded animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || stats.length === 0) {
        return null;
    }

    const uniqueCountries = new Set(stats.map(s => s.country_name)).size;
    const totalViews = stats.filter(s => s.event_type === 'view').length;
    const totalDownloads = stats.filter(s => s.event_type === 'download').length;

    return (
        <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Globe className="text-udsm-gold" size={20} />
                Geographical Impact
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-50 rounded-lg p-4 transition-all hover:bg-gray-100">
                    <div className="flex items-center gap-3 mb-1">
                        <Users className="text-udsm-blue" size={18} />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reach</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{uniqueCountries}</div>
                    <div className="text-[10px] text-gray-400 font-medium">Unique Nations</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 transition-all hover:bg-gray-100">
                    <div className="flex items-center gap-3 mb-1">
                        <MapIcon className="text-udsm-gold" size={18} />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Views</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400 font-medium">Global Reads</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 transition-all hover:bg-gray-100">
                    <div className="flex items-center gap-3 mb-1">
                        <Download className="text-green-600" size={18} />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Downloads</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{totalDownloads.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400 font-medium">PDF Acquisitions</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 transition-all hover:bg-gray-100">
                    <div className="flex items-center gap-3 mb-1">
                        <Clock className="text-purple-600" size={18} />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Activity</span>
                    </div>
                    <div className="text-[10px] text-gray-600 font-bold uppercase truncate">
                        Latest from: {stats[0]?.city_name || 'N/A'}
                    </div>
                    <div className="text-[9px] text-gray-400">
                        {new Date(stats[0]?.timestamp).toLocaleDateString()}
                    </div>
                </div>
            </div>

            {/* Recent Hotspots List */}
            <div className="mt-8">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Recent Engagement Hotspots</div>
                <div className="flex flex-wrap gap-2">
                    {stats.slice(0, 8).map((hit, idx) => (
                        <div key={idx} className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-[11px] text-gray-700 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-udsm-gold rounded-full" />
                            <span className="font-bold">{hit.city_name}</span>
                            <span className="opacity-40">({hit.country_name})</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
