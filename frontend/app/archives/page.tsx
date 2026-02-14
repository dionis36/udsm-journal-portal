"use client";

import { Navbar } from "@/components/Navbar";
import { BookOpen, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";

const MOCK_ARCHIVES = [
    { id: 1, volume: 31, number: 2, year: 2024, title: "Special Issue on Urban Growth", cover: "https://via.placeholder.com/300x400/011627/white?text=Vol+31+No+2" },
    { id: 2, volume: 31, number: 1, year: 2024, title: "Population Dynamics in East Africa", cover: "https://via.placeholder.com/300x400/011627/white?text=Vol+31+No+1" },
    { id: 3, volume: 30, number: 2, year: 2023, title: "Digital Health and Demographics", cover: "https://via.placeholder.com/300x400/011627/white?text=Vol+30+No+2" },
    { id: 4, volume: 30, number: 1, year: 2023, title: "Climate Change and Migration", cover: "https://via.placeholder.com/300x400/011627/white?text=Vol+30+No+1" },
];

export default function ArchivesPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 font-serif mb-4 flex items-center gap-3">
                        <BookOpen className="text-udsm-gold" size={32} />
                        Archives
                    </h1>
                    <p className="text-gray-600 max-w-2xl leading-relaxed">
                        Explore the complete history of the Tanzania Journal for Population Studies and Development.
                        Our archives span over three decades of research excellence.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {MOCK_ARCHIVES.map((issue) => (
                        <div key={issue.id} className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <div className="aspect-[3/4] bg-udsm-blue relative overflow-hidden">
                                <img
                                    src={issue.cover}
                                    alt={`Vol ${issue.volume} No ${issue.number}`}
                                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                    <Link
                                        href={`/journals/tjpsd`}
                                        className="w-full py-2 bg-udsm-gold text-udsm-blue font-bold rounded text-center text-sm"
                                    >
                                        View Full Issue
                                    </Link>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-udsm-gold uppercase tracking-widest mb-2">
                                    <Calendar size={12} />
                                    <span>{issue.year}</span>
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 group-hover:text-udsm-blue transition-colors mb-1">
                                    Vol. {issue.volume} No. {issue.number}
                                </h3>
                                <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed italic">
                                    {issue.title}
                                </p>
                                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-xs font-bold text-gray-400 group-hover:text-udsm-blue transition-colors">
                                    <span>Browse Articles</span>
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legacy Link Info */}
                <div className="mt-16 p-8 bg-udsm-blue/5 rounded-2xl border border-udsm-blue/10 text-center">
                    <h2 className="text-xl font-bold text-udsm-blue mb-2">Looking for older metadata?</h2>
                    <p className="text-sm text-gray-600 mb-6">We are currently migrating our deep historical catalog from the legacy platform.</p>
                    <a
                        href="https://journals.udsm.ac.tz/index.php/orsea/issue/archive"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-udsm-blue/20 text-udsm-blue rounded-full text-sm font-bold hover:bg-white shadow-sm transition-all"
                    >
                        Visit Legacy Archive
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                </div>
            </main>

            <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-sm text-gray-400">© {new Date().getFullYear()} University of Dar es Salaam. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
