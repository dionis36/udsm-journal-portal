'use client';

import { useEffect, useState } from 'react';
import { Network, ArrowRight } from 'lucide-react';

interface SNIPData {
    field: string;
    raw_impact: number;
    field_baseline: number;
    snip_score: number;
    percentile_in_field: number;
}

export function FieldNormalizedImpact() {
    const [data, setData] = useState<SNIPData | null>(null);

    useEffect(() => {
        fetch('http://localhost:4000/api/metrics/field-normalized-impact')
            .then(res => res.json())
            .then(setData)
            .catch(console.error);
    }, []);

    if (!data) return null;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Network size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">Field-Normalized Impact</h3>
                    <p className="text-xs text-slate-500">Source Normalized Impact per Paper (Simulated SNIP)</p>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="text-center flex-1">
                    <div className="text-xs text-slate-500 mb-1">Raw Impact</div>
                    <div className="font-mono font-bold text-slate-700">{data.raw_impact.toFixed(2)}</div>
                </div>

                <ArrowRight size={16} className="text-slate-300" />

                <div className="text-center flex-1">
                    <div className="text-xs text-slate-500 mb-1">Field Baseline</div>
                    <div className="font-mono text-slate-500">{data.field_baseline}</div>
                </div>

                <div className="w-px h-8 bg-slate-200"></div>

                <div className="text-center flex-1">
                    <div className="text-xs font-bold text-indigo-600 mb-1">SNIP Score</div>
                    <div className="text-2xl font-black text-indigo-600">{data.snip_score.toFixed(2)}</div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Field: <strong>{data.field}</strong></span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-bold">
                        Top {100 - data.percentile_in_field}%
                    </span>
                </div>
            </div>
        </div>
    );
}
