"use client";

import { useJournal } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Info, ChevronLeft, UserCircle, Users, BookOpen, Target } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

export default function JournalAboutPage({ params }: { params: Promise<{ path: string }> }) {
    const { path } = use(params);
    const { journal, isLoading } = useJournal(path);
    const [activeTab, setActiveTab] = useState("scope");

    useEffect(() => {
        // Handle hash navigation
        const hash = window.location.hash.replace("#", "");
        if (["scope", "authors", "readers", "librarians"].includes(hash)) {
            setActiveTab(hash);
        }
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-5xl mx-auto px-4 py-20">
                    <div className="h-64 bg-gray-200 rounded animate-pulse" />
                </div>
            </div>
        );
    }

    const { name, metadata } = journal || {};
    const { focusScopeDesc, authorInformation, readerInformation, librarianInformation } = metadata || {};

    const tabs = [
        { id: "scope", label: "Aims & Scope", icon: Target, content: focusScopeDesc },
        { id: "authors", label: "For Authors", icon: UserCircle, content: authorInformation },
        { id: "readers", label: "For Readers", icon: BookOpen, content: readerInformation },
        { id: "librarians", label: "For Librarians", icon: Users, content: librarianInformation },
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 py-12">
                <Link
                    href={`/journals/${path}`}
                    className="inline-flex items-center gap-2 text-udsm-blue hover:underline mb-8 font-medium"
                >
                    <ChevronLeft size={20} /> Back to Journal Home
                </Link>

                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="bg-udsm-blue p-8 md:p-12 text-white">
                        <h1 className="text-3xl md:text-4xl font-bold font-serif mb-2">About the Journal</h1>
                        <p className="text-blue-100 opacity-80">{name}</p>
                    </div>

                    <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${activeTab === tab.id
                                        ? "border-udsm-gold text-udsm-blue bg-gray-50"
                                        : "border-transparent text-gray-500 hover:text-udsm-blue hover:bg-gray-50"
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-8 md:p-12 min-h-[400px]">
                        {tabs.find(t => t.id === activeTab)?.content ? (
                            <div
                                className="prose prose-lg max-w-none text-gray-700 whitespace-pre-line"
                                dangerouslySetInnerHTML={{ __html: tabs.find(t => t.id === activeTab)?.content || "" }}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <Info size={48} className="mb-4 opacity-20" />
                                <p className="italic">Archival information for this section is not available in the legacy database.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <footer className="py-12 text-center text-gray-400 text-sm">
                <p>&copy; {new Date().getFullYear()} University of Dar es Salaam. Institutional Repository Migration Phase 6.</p>
            </footer>
        </div>
    );
}
