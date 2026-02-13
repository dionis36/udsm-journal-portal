"use client";

import { Navbar } from "@/components/Navbar";
import { Search, Filter, BookOpen, User, Tag } from "lucide-react";
import { useState } from "react";

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Navbar />

            {/* Search Hero */}
            <section className="bg-udsm-blue text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold mb-6">Search UDSM Research</h1>

                    <div className="bg-white rounded-lg p-2 flex items-center shadow-lg max-w-3xl">
                        <Search className="h-6 w-6 text-gray-400 ml-3" />
                        <input
                            type="text"
                            placeholder="Search for articles, authors, or topics..."
                            className="flex-1 p-3 text-gray-900 outline-none"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button className="bg-udsm-gold text-udsm-blue font-bold px-8 py-3 rounded-md hover:bg-yellow-400 transition-colors">
                            Search
                        </button>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-8">

                {/* Sidebar Filters */}
                <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
                    <div>
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <Filter size={18} /> Filters
                        </h3>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" className="rounded text-udsm-blue" /> Full Text Available
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" className="rounded text-udsm-blue" /> Peer Reviewed
                            </label>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">Publication Year</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="year" /> 2026</label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="year" /> 2025</label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="year" /> 2024</label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="year" /> Older</label>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">Discipline</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center justify-between"><span>Zoology</span> <span className="text-xs bg-gray-200 px-2 rounded-full">120</span></div>
                            <div className="flex items-center justify-between"><span>Marine Biology</span> <span className="text-xs bg-gray-200 px-2 rounded-full">85</span></div>
                            <div className="flex items-center justify-between"><span>Ecology</span> <span className="text-xs bg-gray-200 px-2 rounded-full">64</span></div>
                        </div>
                    </div>
                </aside>

                {/* Results Area */}
                <main className="flex-1">
                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-6 flex gap-6">
                        {['all', 'articles', 'authors', 'collections'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-udsm-blue text-udsm-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Placeholder Results */}
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-50 p-3 rounded text-udsm-blue">
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-udsm-blue mb-1 hover:underline cursor-pointer">
                                            Impact of Climate Change on Coastal Fisheries in Tanzania
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2">
                                            <span className="font-semibold">Authors:</span> J. Uma, M. Kweka • <span className="italic">Zoology Journal</span> • 2025
                                        </p>
                                        <p className="text-gray-600 line-clamp-2 text-sm">
                                            This study investigates the correlation between rising sea surface temperatures and the migration patterns of key commercial fish species along the Tanga coast...
                                        </p>
                                        <div className="mt-4 flex gap-2">
                                            <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                <Tag size={12} /> Marine Biology
                                            </span>
                                            <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                <Tag size={12} /> Climate Change
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>

            </div>
        </div>
    );
}
