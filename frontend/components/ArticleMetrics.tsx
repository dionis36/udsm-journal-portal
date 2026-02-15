"use client";

import { TrendingUp, Award, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

interface ArticleMetricsProps {
    articleId: string | number;
}

interface MetricsData {
    citations: {
        citations: number;
        source: string;
    } | null;
    altmetric: {
        score: number;
        source: string;
    } | null;
    doi: string;
}

export function ArticleMetrics({ articleId }: ArticleMetricsProps) {
    const [metrics, setMetrics] = useState<MetricsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/articles/${articleId}/metrics`
                );

                if (!response.ok) {
                    setError(true);
                    setLoading(false);
                    return;
                }

                const data = await response.json();
                setMetrics(data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch metrics:', err);
                setError(true);
                setLoading(false);
            }
        }

        fetchMetrics();
    }, [articleId]);

    if (loading) {
        return (
            <div className="flex gap-4">
                <div className="h-16 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="h-16 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
        );
    }

    if (error || !metrics) {
        return null; // Graceful degradation - hide metrics if unavailable
    }

    const { citations, altmetric, doi } = metrics;

    return (
        <div className="flex flex-wrap gap-4">
            {/* Citation Count Badge */}
            {citations && citations.citations !== undefined && (
                <div className="bg-white border-2 border-udsm-blue rounded-lg p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                    <div className="bg-udsm-blue/10 p-2 rounded">
                        <TrendingUp className="text-udsm-blue" size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-udsm-blue">{citations.citations}</div>
                        <div className="text-xs text-gray-600 uppercase font-medium">Citations</div>
                        <div className="text-[10px] text-gray-400">via Crossref</div>
                    </div>
                </div>
            )}

            {/* Altmetric Score Badge */}
            {altmetric && altmetric.score > 0 && (
                <div className="bg-white border-2 border-udsm-gold rounded-lg p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                    <div className="bg-udsm-gold/10 p-2 rounded">
                        <Award className="text-udsm-gold" size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-udsm-gold">{altmetric.score.toFixed(1)}</div>
                        <div className="text-xs text-gray-600 uppercase font-medium">Altmetric</div>
                        <div className="text-[10px] text-gray-400">Attention Score</div>
                    </div>
                </div>
            )}

            {/* DOI Link */}
            {doi && (
                <a
                    href={`https://doi.org/${doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-3 hover:bg-gray-100 transition-colors"
                >
                    <ExternalLink className="text-gray-600" size={20} />
                    <div>
                        <div className="text-sm font-bold text-gray-800">View on Crossref</div>
                        <div className="text-xs text-gray-500 font-mono">{doi}</div>
                    </div>
                </a>
            )}
        </div>
    );
}
