"use client";

import React from 'react';
import { FileText, ChevronRight } from 'lucide-react';

export function OJSSidebar() {
    return (
        <aside className="w-[300px] flex flex-col gap-8">
            {/* Issue Cover */}
            <div className="bg-white p-2 border border-slate-200 shadow-sm rounded-sm">
                <div className="aspect-[3/4] bg-slate-100 flex items-center justify-center text-slate-300 relative overflow-hidden group">
                    <img
                        src="https://journals.udsm.ac.tz/public/journals/1/journalThumbnail_en_US.png"
                        alt="Issue Cover"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-black/5" />
                </div>
                <div className="mt-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Latest Issue</span>
                </div>
            </div>

            {/* Submission Button */}
            <button className="w-full bg-[#16669E] hover:bg-[#1b7dbf] text-white py-4 px-6 rounded-sm shadow-md transition-all flex items-center justify-between group">
                <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-wide font-montserrat">
                    <FileText size={18} className="text-udsm-gold" />
                    Make a Submission
                </div>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Information Block */}
            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#16669E] font-montserrat leading-none">Information</h4>
                </div>
                <div className="p-4 flex flex-col gap-3 text-[13px] font-medium text-slate-600 font-sans">
                    <a href="#" className="hover:text-[#16669E] transition-colors leading-tight">For Readers</a>
                    <a href="#" className="hover:text-[#16669E] transition-colors leading-tight">For Authors</a>
                    <a href="#" className="hover:text-[#16669E] transition-colors leading-tight">For Librarians</a>
                </div>
            </div>
        </aside>
    );
}
