"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Import analytics components
import { TrendChart } from "./analytics/TrendChart";
import { TopArticlesPanel } from "./analytics/TopArticlesPanel";
import { GeographicBreakdown } from "./analytics/GeographicBreakdown";
import { ImpactMetrics } from "./analytics/ImpactMetrics";

const HeatmapView = dynamic(() => import("./HeatmapView").then(mod => mod.HeatmapView), {
    ssr: false,
    loading: () => (
        <div className="h-[400px] w-full bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200">
            <div className="w-12 h-12 border-4 border-[#16669E] border-t-transparent rounded-full animate-spin" />
        </div>
    )
});

interface EmbeddedAnalyticsProps {
    journalId?: string;
    scope?: 'single' | 'all';
    theme?: 'light' | 'dark';
    apiBaseUrl?: string;
    height?: number;
}

export function EmbeddedAnalytics({
    journalId = 'tjpsd',
    scope = 'single',
    theme = 'light',
    apiBaseUrl = 'http://localhost:4000',
    height = 800
}: EmbeddedAnalyticsProps) {
    const [trendsData, setTrendsData] = useState<any[]>([]);
    const [topArticles, setTopArticles] = useState<any[]>([]);
    const [geoData, setGeoData] = useState<any[]>([]);
    const [impactMetrics, setImpactMetrics] = useState<any>({});
    const [heatmapData, setHeatmapData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const isDark = theme === 'dark';

    useEffect(() => {
        setLoading(true);

        // Fetch all widget data
        const queryParam = scope === 'all' ? '' : `?journal=${journalId}`;

        Promise.all([
            fetch(`${apiBaseUrl}/api/metrics/monthly-trends${queryParam}`).then(r => r.json()),
            fetch(`${apiBaseUrl}/api/metrics/top-articles?days=30&limit=5${scope === 'single' ? `&journal=${journalId}` : ''}`).then(r => r.json()),
            fetch(`${apiBaseUrl}/api/metrics/geographic-breakdown${queryParam}`).then(r => r.json()),
            fetch(`${apiBaseUrl}/api/metrics/journal-impact?journal=${journalId}`).then(r => r.json()),
        ]).then(([trends, articles, geo, impact]) => {
            setTrendsData(trends);
            setTopArticles(articles);
            setGeoData(geo);
            setImpactMetrics(impact);
            setLoading(false);
        }).catch(err => {
            console.error('Failed to load widget data:', err);
            setLoading(false);
        });
    }, [journalId, scope, apiBaseUrl]);

    if (loading) {
        return (
            <div className={`w-full flex items-center justify-center p-12 ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                style={{ height: `${height}px` }}
            >
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#16669E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-bold">Loading Analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`udsm-analytics-widget w-full ${isDark ? 'bg-slate-900' : 'bg-[#F7F8F9]'}`}
            style={{ minHeight: `${height}px` }}
        >
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {scope === 'all' ? 'Global Readership Analytics' : `${journalId.toUpperCase()} Journal Analytics`}
                    </h2>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Real-time readership insights powered by UDSM Analytics
                    </p>
                </div>

                {/* Impact Metrics Cards */}
                <ImpactMetrics metrics={impactMetrics} isDark={isDark} />

                {/* Trend Chart & Geographic Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TrendChart data={trendsData} isDark={isDark} />
                    <GeographicBreakdown data={geoData} isDark={isDark} />
                </div>

                {/* Top Articles Panel */}
                <TopArticlesPanel articles={topArticles} isDark={isDark} />

                {/* Footer branding */}
                <div className="text-center pt-4 border-t border-slate-200/10">
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Powered by <span className="font-bold text-[#16669E]">UDSM Analytics</span> | University of Dar es Salaam
                    </p>
                </div>
            </div>
        </div>
    );
}
