"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";

// Import analytics components
import { TrendChart } from "@/components/analytics/TrendChart";
import { TopArticlesPanel } from "@/components/analytics/TopArticlesPanel";
import { GeographicBreakdown } from "@/components/analytics/GeographicBreakdown";
import { ImpactMetrics } from "@/components/analytics/ImpactMetrics";
import { LiveImpactFactor } from "@/components/analytics/LiveImpactFactor";
import { TopThisWeek } from "@/components/analytics/TopThisWeek";
import { CorrelationChart } from "@/components/analytics/CorrelationChart";
import { FieldNormalizedImpact } from "@/components/analytics/FieldNormalizedImpact";

export default function StatsPage() {
    const [trendsData, setTrendsData] = useState<any[]>([]);
    const [topArticles, setTopArticles] = useState<any[]>([]);
    const [geoData, setGeoData] = useState<any[]>([]);
    const [impactMetrics, setImpactMetrics] = useState<any>(null);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);

        // Fetch all analytics data
        Promise.all([
            fetch('http://localhost:4000/api/metrics/impact-summary').then(r => r.json()),
            fetch('http://localhost:4000/api/metrics/monthly-trends?months=6').then(r => r.json()),
            fetch('http://localhost:4000/api/metrics/top-articles?days=30&limit=10').then(r => r.json()),
            fetch('http://localhost:4000/api/metrics/geographic-breakdown').then(r => r.json()),
            fetch('http://localhost:4000/api/metrics/journal-impact').then(r => r.json())
        ]).then(([summaryData, trends, articles, geo, impact]) => {
            setSummary(summaryData);
            setTrendsData(trends);
            setTopArticles(articles);
            setGeoData(geo);
            // Only set impact metrics if they're not the hardcoded demo values
            if (impact && impact.jif !== 1.42) {
                setImpactMetrics(impact);
            }
            setLoading(false);
        }).catch(err => {
            console.error('Failed to fetch analytics data:', err);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F7F8F9] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#16669E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-600">Loading Analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F8F9]">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/"
                                className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#16669E] transition-colors"
                            >
                                <ArrowLeft size={16} />
                                Back to Dashboard
                            </Link>
                            <div className="w-px h-6 bg-slate-300"></div>
                            <h1 className="text-2xl font-black text-slate-900">Analytics Overview</h1>
                        </div>

                        <button className="flex items-center gap-2 px-4 py-2 bg-[#16669E] text-white rounded-lg hover:bg-[#16669E]/90 transition-colors text-sm font-semibold">
                            <Download size={16} />
                            Export Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="text-3xl font-black text-slate-900 mb-1">
                            {summary?.total_articles || 0}
                        </div>
                        <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                            Total Articles
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="text-3xl font-black text-[#16669E] mb-1">
                            {summary?.total_reads || 0}
                        </div>
                        <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                            Total Reads
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="text-3xl font-black text-slate-900 mb-1">
                            {summary?.total_reads_past_year || 0}
                        </div>
                        <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                            Past Year
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="text-3xl font-black text-slate-900 mb-1">
                            {geoData?.length || 0}
                        </div>
                        <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                            Countries
                        </div>
                    </div>
                </div>

                {/* Impact Metrics (only if real data available) */}
                {impactMetrics && (
                    <div className="mb-8">
                        <ImpactMetrics metrics={impactMetrics} />
                    </div>
                )}

                {/* Live Impact Factor (Tier 3) */}
                <div className="mb-8">
                    <LiveImpactFactor />
                </div>

                {/* Trend Chart & Geographic Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <TrendChart data={trendsData} />
                    <GeographicBreakdown data={geoData} />
                </div>

                {/* Top Articles Panel & Redis Rankings */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <TopArticlesPanel articles={topArticles} />
                    <TopThisWeek scope="week" limit={5} refreshInterval={3000} />
                </div>

                {/* Tier 3: Correlation & Field Normalization */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2">
                        <CorrelationChart />
                    </div>
                    <div className="lg:col-span-1">
                        <FieldNormalizedImpact />
                        {/* Placeholder for future specific widget */}
                        <div className="mt-6 bg-slate-50 border border-slate-200 border-dashed rounded-xl p-6 text-center">
                            <p className="text-sm text-slate-400">Additional Metric Slot</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-slate-500 mt-12">
                    <p>Data updated in real-time from OJS platform activity</p>
                </div>
            </div>
        </div>
    );
}
