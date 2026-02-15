"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, BookOpen, BarChart3 } from "lucide-react";

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
                className={`absolute z-50 pointer-events-none rounded-xl shadow-2xl backdrop-blur-xl border p-4 min-w-[240px] max-w-[320px] flex flex-col gap-3
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
                <div className="flex items-start gap-3 border-b border-white/5 pb-3">
                    {country_code && (
                        <img
                            src={`https://flagcdn.com/w40/${country_code.toLowerCase()}.png`}
                            alt={country}
                            className="w-8 h-auto rounded shadow-sm mt-0.5"
                        />
                    )}
                    <div className="flex flex-col leading-tight">
                        <h3 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} font-montserrat`}>
                            {city || 'Regional Cluster'}{region_name ? `, ${region_name}` : ''}
                        </h3>
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                            {country || 'Zoom for Details'}
                        </span>
                    </div>
                </div>

                {/* CONTENT: Article Context */}
                <div className={`p-3 rounded-lg text-xs leading-relaxed font-medium ${isDark ? 'bg-white/5 text-white/80' : 'bg-slate-50 text-slate-600'}`}>
                    {article_title ? (
                        <>
                            <div className="flex items-center gap-1.5 mb-1.5 opacity-50">
                                <BookOpen size={10} />
                                <span className="uppercase tracking-widest text-[9px] font-bold">Most Read Article</span>
                            </div>
                            <span className="font-noto-serif italic">"{article_title}..."</span>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 opacity-60">
                            <BookOpen size={12} />
                            <span className="italic">Zoom in to see specific articles</span>
                        </div>
                    )}
                </div>

                {/* FOOTER: Stats */}
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${isDark ? 'bg-udsm-gold/10 text-udsm-gold' : 'bg-udsm-gold/20 text-udsm-brown'}`}>
                            <BarChart3 size={14} />
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                                {viewMode === 'readership' ? 'Total Reads' : 'Traffic Hits'}
                            </span>
                            <span className={`text-sm font-black font-mono ${isDark ? 'text-udsm-gold' : 'text-slate-900'}`}>
                                {weight.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

            </motion.div>
        </AnimatePresence>
    );
}
