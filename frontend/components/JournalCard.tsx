"use client";

import React from 'react';
import { ChevronRight, BookOpen, Users, Globe } from 'lucide-react';
import Link from 'next/link';

interface JournalCardProps {
    name: string;
    path: string;
    description: string;
    stats: {
        articles: number;
        readers: number;
        countries: number;
    };
}

export function JournalCard({ name, path, description, stats }: JournalCardProps) {
    return (
        <Link
            href={`/${path}`}
            className="group flex flex-col md:flex-row gap-6 p-6 bg-white border border-slate-200 rounded-xl hover:border-udsm-gold hover:shadow-xl transition-all duration-300"
        >
            {/* Logo Placeholder / Brand Block */}
            <div className="w-full md:w-32 h-32 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 group-hover:bg-slate-100 transition-colors shrink-0">
                <div className="w-12 h-12 bg-[#16669E] rounded flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:scale-110 transition-transform">
                    {name.charAt(0)}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-black text-slate-900 leading-tight font-montserrat group-hover:text-[#16669E] transition-colors">
                        {name}
                    </h3>
                    <div className="p-2 rounded-full bg-slate-50 group-hover:bg-udsm-gold group-hover:text-udsm-blue transition-colors">
                        <ChevronRight size={18} />
                    </div>
                </div>

                <p className="text-sm text-slate-500 line-clamp-2 mb-6 font-medium leading-relaxed">
                    {description || "Access the latest research, volumes, and issues from this peer-reviewed publication."}
                </p>

                {/* Stats Row */}
                <div className="mt-auto grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-blue-50 text-[#16669E]">
                            <BookOpen size={14} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900 leading-none">{stats.articles}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Papers</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-green-50 text-green-600">
                            <Users size={14} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900 leading-none">{stats.readers}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Readers</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-amber-50 text-amber-600">
                            <Globe size={14} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900 leading-none">{stats.countries}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Nations</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
