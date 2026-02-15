"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3 } from "lucide-react";

interface MapTooltipProps {
    info: any;
    mapTheme: 'light' | 'dark';
    viewMode: 'readership' | 'traffic';
}

export function MapTooltip({ info, mapTheme, viewMode }: MapTooltipProps) {
    if (!info || !info.object) return null;

    const { properties } = info.object;
    const { city, country, country_code, region_name, weight, article_title } = properties;

    const isDark = mapTheme === 'dark';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`absolute z-50 pointer-events-none rounded-xl shadow-2xl backdrop-blur-xl border p-3 min-w-[220px] max-w-[280px] flex flex-col gap-2
                    ${isDark
                        ? 'bg-slate-900/90 border-white/10 text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
                        : 'bg-white/90 border-slate-200 text-slate-900 shadow-[0_8px_32px_rgba(0,0,0,0.1)]'
                    }`}
                style={{
                    left: info.x + 20,
                    top: info.y - 20
                }}
            >
                {/* HEADER: Location */}
                <div className="flex items-start gap-2.5">
                    {country_code && (
                        <img
                            src={`https://flagcdn.com/w40/${country_code.toLowerCase()}.png`}
                            alt={country}
                            className="w-7 h-auto rounded shadow-sm mt-0.5"
                        />
                    )}
                    <div className="flex flex-col leading-tight">
                        <h3 className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} font-montserrat`}>
                            {city || 'Regional Cluster'}{region_name ? `, ${region_name}` : ''}
                        </h3>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                            {country || 'Zoom for Details'}
                        </span>
                    </div>
                </div>

                {/* CONTENT: Article (only if available) */}
                {article_title && (
                    <p className={`text-xs leading-relaxed font-medium italic font-noto-serif line-clamp-2 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                        "{article_title}..."
                    </p>
                )}

                {/* FOOTER: Inline Stats */}
                <div className={`flex items-center gap-2 pt-1 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    <BarChart3 size={14} className={isDark ? 'text-udsm-gold' : 'text-slate-600'} />
                    <span className={`text-sm font-black font-mono ${isDark ? 'text-udsm-gold' : 'text-slate-900'}`}>
                        {weight.toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                        {viewMode === 'readership' ? (weight === 1 ? 'Read' : 'Reads') : (weight === 1 ? 'Hit' : 'Hits')}
                    </span>
                </div>

            </motion.div>
        </AnimatePresence>
    );
}
