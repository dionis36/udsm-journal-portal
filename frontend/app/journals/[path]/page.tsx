"use client";

import dynamic from "next/dynamic";
import { useJournal, useCurrentIssue, useHeatmap } from "@/lib/api";
import { Navbar } from "@/components/Navbar";

const HeatmapView = dynamic(() => import("@/components/HeatmapView").then(mod => mod.HeatmapView), {
    ssr: false,
    loading: () => (
        <div className="h-64 w-full bg-gray-950 rounded-lg flex items-center justify-center border border-gray-100">
            <div className="w-8 h-8 border-2 border-udsm-gold border-t-transparent rounded-full animate-spin" />
        </div>
    )
});
import { FileText, ArrowRight, BookOpen, Download, Info, Mail, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";

export default function JournalPage({ params }: { params: Promise<{ path: string }> }) {
    const { path } = use(params);
    const [page, setPage] = useState(1);
    const limit = 10;

    const { journal, isLoading: journalLoading } = useJournal(path);
    const { data: issueData, isLoading: articlesLoading } = useCurrentIssue(path, page, limit);

    const journalId = journal?.journal_id;
    const { data: heatmapData, isLoading: heatmapLoading } = useHeatmap(journalId);

    const articles = issueData?.articles || [];
    const pagination = issueData?.pagination || { page: 1, limit: 10, total: 0 };
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    if (!journalLoading && !journal) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-20 text-center">
                    <h1 className="text-4xl font-bold text-gray-800">Journal Not Found</h1>
                    <p className="mt-4 text-gray-600">The journal you are looking for does not exist.</p>
                    <Link href="/" className="mt-8 inline-block text-udsm-blue hover:underline">Return to Portal</Link>
                </div>
            </div>
        )
    }

    const { name, metadata } = journal || {};
    const {
        description, printIssn, onlineIssn, publisher, contactEmail, coverImage,
        editorialTeam, authorInformation, librarianInformation, readerInformation, focusScopeDesc
    } = metadata || {};

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <Navbar />

            {/* HEADER / HERO SECTION */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Cover Image Placeholder / Actual */}
                        <div className="w-full md:w-48 flex-shrink-0">
                            <div className="aspect-[3/4] bg-gray-200 rounded-lg shadow-md overflow-hidden flex items-center justify-center text-gray-400">
                                {coverImage ? (
                                    // In a real migration, we'd map this to the actual static file location
                                    // For now, using a placeholder or the filename if valid URL
                                    <div className="p-4 text-center text-xs">
                                        <FileText size={48} className="mx-auto mb-2 opacity-50" />
                                        {coverImage}
                                    </div>
                                ) : (
                                    <span className="font-serif text-4xl font-bold opacity-20">VOL 1</span>
                                )}
                            </div>
                        </div>

                        {/* Journal Info */}
                        <div className="flex-1">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="bg-udsm-blue text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    Open Access
                                </span>
                                {printIssn && <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">ISSN (P): {printIssn}</span>}
                                {onlineIssn && <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">ISSN (O): {onlineIssn}</span>}
                            </div>

                            <h1 className="text-3xl md:text-5xl font-extrabold text-udsm-blue mb-4 leading-tight font-serif">
                                {name}
                            </h1>

                            {/* Publisher Info */}
                            {publisher && (
                                <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
                                    <Globe size={14} /> Published by <span className="font-semibold">{publisher}</span>
                                </p>
                            )}

                            {/* Description (Truncated or Full) */}
                            <div
                                className="prose prose-sm text-gray-600 max-w-3xl mb-8"
                                dangerouslySetInnerHTML={{ __html: description || "Advancing research and knowledge dissemination." }}
                            />

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-4">
                                <button className="bg-udsm-gold text-udsm-blue font-bold px-6 py-2.5 rounded hover:bg-yellow-400 transition-colors flex items-center gap-2 shadow-sm">
                                    <BookOpen size={18} />
                                    Current Issue
                                </button>
                                <button className="border border-udsm-blue text-udsm-blue font-bold px-6 py-2.5 rounded hover:bg-blue-50 transition-colors flex items-center gap-2">
                                    <Download size={18} />
                                    Submit Article
                                </button>
                                {contactEmail && (
                                    <a href={`mailto:${contactEmail}`} className="text-gray-500 hover:text-udsm-blue px-4 py-2.5 flex items-center gap-2 text-sm font-medium">
                                        <Mail size={16} /> Contact Editor
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* KEY METRICS / INFO BAR */}
            <div className="bg-udsm-blue text-white py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-8 text-sm opacity-90">
                    <div><span className="font-bold">Frequency:</span> Biannual</div>
                    <div><span className="font-bold">Review:</span> Double-blind Peer Review</div>
                    <div><span className="font-bold">License:</span> CC BY 4.0</div>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* LEFT COLUMN: LATEST ARTICLES (8 cols) */}
                <div className="lg:col-span-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-200 pb-2">
                        <FileText className="text-udsm-gold" />
                        Current Issue
                    </h2>

                    <div className="space-y-6">
                        {articlesLoading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-lg shadow-sm animate-pulse" />)
                        ) : articles && articles.length > 0 ? (
                            articles.map((article: any) => (
                                <div key={article.item_id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="inline-block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                                Research Article
                                            </span>
                                            <h3 className="text-xl font-bold text-udsm-blue group-hover:underline mb-2">
                                                <Link href={`/articles/${article.item_id}`}>{article.title}</Link>
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-3 italic">
                                                {Array.isArray(article.authors) ? article.authors.join(", ") : article.authors || "Unknown"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
                                        <a
                                            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/articles/${article.item_id}/pdf`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-bold text-white bg-udsm-blue px-3 py-1.5 rounded hover:bg-blue-800 transition-colors flex items-center gap-1"
                                        >
                                            <Download size={12} /> PDF
                                        </a>
                                        <Link href={`/articles/${article.item_id}`} className="text-xs font-bold text-gray-600 hover:text-udsm-blue flex items-center gap-1">
                                            View Abstract <ArrowRight size={12} />
                                        </Link>
                                        <span className="text-xs text-gray-400 ml-auto">
                                            pp. {article.pages || "1-10"}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center bg-white rounded-lg border border-gray-200 text-gray-500">
                                No articles found in the current issue.
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {pagination.total > limit && (
                            <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                                <div className="text-sm text-gray-500">
                                    Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{" "}
                                    <span className="font-medium">{Math.min(page * limit, pagination.total)}</span> of{" "}
                                    <span className="font-medium">{pagination.total}</span> articles
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft size={16} /> Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: SIDEBAR (4 cols) */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Editorial Board Widget */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Editorial Team</h3>
                        {editorialTeam ? (
                            <div className="relative max-h-[300px] overflow-hidden">
                                <div
                                    className="prose prose-sm text-gray-600 max-w-none editorial-content whitespace-pre-line"
                                    dangerouslySetInnerHTML={{ __html: editorialTeam }}
                                />
                                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                            </div>
                        ) : (
                            <ul className="space-y-3 text-sm">
                                <li>
                                    <strong className="block text-gray-800">Chief Editor</strong>
                                    <span className="text-gray-600">Dr. Jane Doe, UDSM</span>
                                </li>
                                <li>
                                    <strong className="block text-gray-800">Managing Editor</strong>
                                    <span className="text-gray-600">Prof. John Smith, UDSM</span>
                                </li>
                            </ul>
                        )}
                        <Link href={`/journals/${path}/editorial-board`} className="block mt-4 text-udsm-blue text-sm font-medium hover:underline">
                            View Full Board &rarr;
                        </Link>
                    </div>

                    {/* Information Widget */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Info size={16} /> Information
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><Link href={`/journals/${path}/about#authors`} className="hover:text-udsm-blue">For Authors</Link></li>
                            <li><Link href={`/journals/${path}/about#librarians`} className="hover:text-udsm-blue">For Librarians</Link></li>
                            <li><Link href={`/journals/${path}/about#readers`} className="hover:text-udsm-blue">For Readers</Link></li>
                        </ul>
                        {(authorInformation || librarianInformation || readerInformation) && (
                            <div className="mt-4 pt-4 border-t border-gray-200 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                                Archival Metadata Active
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* FULL WIDTH IMPACT SECTION */}
            <section className="bg-white border-t border-gray-200 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-3xl font-extrabold text-udsm-blue flex items-center gap-3">
                                <Globe className="text-udsm-gold animate-pulse" />
                                Global Readership & Impact
                            </h2>
                            <p className="text-gray-500 mt-2">Real-time tracking of research dissemination for <span className="font-semibold text-gray-700">{name}</span></p>
                        </div>
                        <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 hidden md:block">
                            <div className="text-[10px] uppercase tracking-widest font-black text-udsm-blue mb-1">Live Status</div>
                            <div className="flex items-center gap-2 text-sm font-bold text-blue-800">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                Network Active
                            </div>
                        </div>
                    </div>

                    <div className="aspect-[21/9] w-full min-h-[500px] shadow-2xl rounded-2xl overflow-hidden ring-1 ring-gray-200">
                        <HeatmapView data={heatmapData} isLoading={heatmapLoading} />
                    </div>

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Geographic Scope</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Our readership spans across multiple continents, with significant concentration in Sub-Saharan Africa and growing visibility in global research hubs.
                            </p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Real-time Pulse</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                The ripples on the map indicate live archival access. Each pulse represents a global researcher engaging with {name} content.
                            </p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <h1 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Metric Accuracy</h1>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Powered by UDSM's high-performance geospatial infrastructure, ensuring sub-10ms response times for global traffic monitoring.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-gray-900 text-gray-400 py-12 text-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h4 className="text-white font-bold mb-4">Contact</h4>
                        <p>{publisher}</p>
                        <p>Dar es Salaam, Tanzania</p>
                        {contactEmail && <p className="mt-2"><a href={`mailto:${contactEmail}`} className="hover:text-white">{contactEmail}</a></p>}
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">ISSN</h4>
                        {printIssn && <p>Print: {printIssn}</p>}
                        {onlineIssn && <p>Online: {onlineIssn}</p>}
                    </div>
                    <div>
                        <p>&copy; {new Date().getFullYear()} {publisher || "University of Dar es Salaam"}.</p>
                        <p className="mt-2 text-xs">Powered by UDSM Journal Portal</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
