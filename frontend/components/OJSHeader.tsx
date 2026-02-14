"use client";

import React from 'react';
import Link from 'next/link';
import { Search, User } from 'lucide-react';

export function OJSHeader() {
    return (
        <header className="w-full bg-[#16669E] text-white">
            {/* Top Utility Bar */}
            <div className="max-w-[1160px] mx-auto px-4 h-10 flex justify-end items-center gap-6 text-[11px] font-bold uppercase tracking-wider border-b border-white/10">
                <Link href="#" className="hover:text-udsm-gold transition-colors flex items-center gap-1.5">
                    <User size={12} /> Register
                </Link>
                <Link href="#" className="hover:text-udsm-gold transition-colors">Login</Link>
            </div>

            {/* Main Header Area */}
            <div className="max-w-[1160px] mx-auto px-4 py-8 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-[#16669E] font-black text-2xl shadow-lg group-hover:scale-105 transition-transform">
                        U
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black tracking-tight leading-none font-montserrat uppercase">
                            University of Dar es Salaam
                        </h1>
                        <span className="text-sm font-bold text-white/60 tracking-widest uppercase mt-1">
                            Journals Portal
                        </span>
                    </div>
                </Link>
            </div>

            {/* Primary Navigation Bar */}
            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-[1160px] mx-auto px-4 flex justify-between items-center h-14">
                    <nav className="flex gap-8 text-[13px] font-bold text-slate-600 uppercase tracking-wide font-montserrat h-full">
                        <Link href="#" className="flex items-center hover:text-[#16669E] border-b-2 border-transparent hover:border-[#16669E] transition-all">Current</Link>
                        <Link href="#" className="flex items-center text-[#16669E] border-b-2 border-[#16669E] transition-all">Archives</Link>
                        <Link href="#" className="flex items-center hover:text-[#16669E] border-b-2 border-transparent hover:border-[#16669E] transition-all">About</Link>
                        <Link href="#" className="flex items-center hover:text-[#16669E] border-b-2 border-transparent hover:border-[#16669E] transition-all">Announcements</Link>
                    </nav>
                    <button className="text-slate-400 hover:text-[#16669E] transition-colors p-2">
                        <Search size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
}
