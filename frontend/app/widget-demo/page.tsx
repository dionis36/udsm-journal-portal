import React from 'react';
import { EmbeddedAnalytics } from '@/components/EmbeddedAnalytics';

export default function WidgetDemo() {
    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-slate-900 mb-2">
                        UDSM Analytics Widget Demo
                    </h1>
                    <p className="text-slate-600">
                        Standalone widget demonstration for OJS integration
                    </p>
                </div>

                {/* Widget Container */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-[#16669E]">
                    <div className="bg-gradient-to-r from-[#1e3a8a] to-[#16669E] text-white px-6 py-4">
                        <h2 className="text-lg font-bold">Embedded Analytics Widget</h2>
                        <p className="text-sm opacity-90">Journal: TJPSD | Scope: Single</p>
                    </div>

                    <EmbeddedAnalytics
                        journalId="tjpsd"
                        scope="single"
                        theme="light"
                        height={900}
                    />
                </div>

                {/* Integration Code Example */}
                <div className="mt-8 bg-slate-900 text-white rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4">Integration Code</h3>
                    <pre className="text-sm overflow-x-auto">
                        <code>{`<!-- OJS Template Integration -->
<div 
  id="udsm-analytics-widget" 
  data-journal="tjpsd"
  data-scope="single"
  data-theme="light"
  data-height="900"
></div>
<script src="https://analytics.udsm.ac.tz/widget.js"></script>`}</code>
                    </pre>
                </div>
            </div>
        </div>
    );
}
