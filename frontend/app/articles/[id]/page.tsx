"use client";

import React from "react";
import { useParams } from "next/navigation";
import { OJSHeader } from "@/components/OJSHeader";
import { OJSSidebar } from "@/components/OJSSidebar";
import { useArticle } from "@/lib/api";
import { ChevronRight, FileDown, Globe, ExternalLink, Calendar, Book, Activity } from "lucide-react";

export default function ArticleDetail() {
    const { id } = useParams();
    const { data: article, isLoading } = useArticle(id as string);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F7F8F9] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#16669E] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!article) {
        return (
            <div className="min-h-screen bg-[#F7F8F9] flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-black text-slate-900 mb-4">Article Not Found</h1>
                <a href="/" className="text-[#16669E] font-bold hover:underline">Back to Dashboard</a>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F8F9] font-sans text-slate-900 pb-20">
            <OJSHeader />

            <main className="max-w-[1160px] mx-auto px-4 py-8 flex flex-col md:flex-row gap-12">

                {/* Main Article Content */}
                <div className="flex-1">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8">
                        <a href="/" className="hover:text-[#16669E]">Home</a>
                        <ChevronRight size={10} />
                        <span className="text-slate-600">Article Detail</span>
                    </nav>

                    {/* Article Header */}
                    <header className="mb-12">
                        <h1 className="text-[32px] font-black text-slate-900 leading-[1.1] tracking-tight font-montserrat mb-6">
                            {article.title}
                        </h1>

                        <div className="flex flex-wrap gap-y-4 gap-x-8">
                            {article.authors?.map((author: string, idx: number) => (
                                <div key={idx} className="flex flex-col">
                                    <span className="text-sm font-black text-[#16669E]">{author}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">University of Dar es Salaam</span>
                                </div>
                            ))}
                        </div>
                    </header>

                    {/* DOI & Quick Info */}
                    <div className="flex items-center gap-6 p-4 bg-white border border-slate-200 rounded-xl mb-12 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                            <Globe size={16} className="text-[#16669E]" />
                            <span>DOI: <span className="text-slate-900 font-bold">{article.doi || `10.4314/tjpsd.v32i2.${id}`}</span></span>
                        </div>
                        <div className="w-px h-4 bg-slate-200" />
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                            <Calendar size={16} className="text-[#16669E]" />
                            <span>Published: <span className="text-slate-900 font-bold">{new Date(article.publication_date).toLocaleDateString()}</span></span>
                        </div>
                    </div>

                    {/* Abstract Section */}
                    <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-12">
                        <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                            <span className="w-8 h-[2px] bg-udsm-gold rounded-full" />
                            Abstract
                        </h2>
                        <div className="text-[15px] text-slate-700 leading-relaxed font-noto-serif space-y-4">
                            {article.abstract ? (
                                <div dangerouslySetInnerHTML={{ __html: article.abstract }} />
                            ) : (
                                <p className="italic text-slate-400">No abstract available for this submission.</p>
                            )}
                        </div>
                    </section>

                    {/* How to Cite */}
                    <section className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">How to Cite</h3>
                        <p className="text-[13px] text-slate-600 font-medium leading-normal">
                            {article.authors?.join(", ")} ({new Date(article.publication_date).getFullYear()}). {article.title}. Tanzania Journal of Population Studies and Development.
                        </p>
                        <button className="mt-4 text-[10px] font-black text-[#16669E] uppercase tracking-widest hover:underline flex items-center gap-1">
                            More Citation Formats <ExternalLink size={10} />
                        </button>
                    </section>
                </div>

                {/* Article Sidebar */}
                <aside className="w-full md:w-[280px] shrink-0">
                    <div className="sticky top-8 space-y-6">

                        {/* Primary Action: PDF */}
                        <div className="bg-white p-6 rounded-2xl border border-[#16669E]/20 shadow-lg shadow-blue-900/5">
                            <button className="w-full bg-[#16669E] hover:bg-udsm-blue text-white py-4 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98] shadow-md">
                                <FileDown size={24} className="text-udsm-gold" />
                                <span className="font-black text-xs uppercase tracking-widest mt-1">Download PDF</span>
                                <span className="text-[10px] text-white/60 font-medium italic underline">English (1.2 MB)</span>
                            </button>
                            <p className="mt-4 text-[11px] text-center text-slate-400 font-bold uppercase tracking-tighter">
                                CC BY-NC-ND 4.0 License
                            </p>
                        </div>

                        {/* Issue Context */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200">
                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Book size={14} className="text-udsm-gold" />
                                Issue
                            </h3>
                            <p className="text-xs font-black text-[#16669E] hover:underline cursor-pointer leading-snug">
                                Tanzania Journal of Population Studies and Development, Vol. 32 No. 2 (2025)
                            </p>
                            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Section</span>
                                <span className="text-xs font-bold text-slate-600">Articles (Primary Research)</span>
                            </div>
                        </div>

                        {/* Impact Stat */}
                        <div className="bg-[#16669E] p-6 rounded-2xl text-white shadow-xl shadow-[#16669E]/20">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity size={16} className="text-udsm-gold" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Article Impact</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black">243</span>
                                <span className="text-[10px] font-bold uppercase text-white/50">Downloads</span>
                            </div>
                        </div>

                    </div>
                </aside>

            </main>
        </div>
    );
}
