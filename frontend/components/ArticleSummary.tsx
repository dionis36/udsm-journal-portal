"use client";

import React from 'react';
import { FileDown } from 'lucide-react';

interface ArticleSummaryProps {
    title: string;
    authors: string[];
}

export function ArticleSummary({ title, authors }: ArticleSummaryProps) {
    return (
        <div className="group py-6 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors px-4 -mx-4 rounded-xl">
            <h3 className="text-sm font-bold text-[#16669E] leading-snug tracking-tight font-montserrat hover:underline cursor-pointer mb-2">
                {title}
            </h3>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <p className="text-[13px] text-slate-500 font-medium font-noto-serif italic">
                    {authors.join(', ')}
                </p>

                <button className="bg-[#16669E] hover:bg-[#1b7dbf] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-sm flex items-center gap-2 transition-all shadow-sm active:scale-95 shrink-0 w-fit">
                    <FileDown size={14} className="text-udsm-gold" />
                    PDF (English)
                </button>
            </div>
        </div>
    );
}
