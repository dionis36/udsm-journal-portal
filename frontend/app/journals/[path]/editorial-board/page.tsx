"use client";

import { useJournal } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Users, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";

export default function EditorialBoardPage({ params }: { params: Promise<{ path: string }> }) {
    const { path } = use(params);
    const { journal, isLoading } = useJournal(path);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 py-20 animate-pulse">
                    <div className="h-10 bg-gray-200 rounded w-1/3 mb-8" />
                    <div className="h-64 bg-gray-200 rounded" />
                </div>
            </div>
        );
    }

    const { name, metadata } = journal || {};
    const { editorialTeam } = metadata || {};

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 py-12">
                <Link
                    href={`/journals/${path}`}
                    className="inline-flex items-center gap-2 text-udsm-blue hover:underline mb-8 font-medium"
                >
                    <ChevronLeft size={20} /> Back to Journal Home
                </Link>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-udsm-blue p-8 text-white">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-white/10 rounded-lg">
                                <Users size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold font-serif">Editorial Board</h1>
                                <p className="text-blue-100 opacity-80">{name}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 md:p-12">
                        {editorialTeam ? (
                            <div
                                className="prose prose-lg max-w-none text-gray-700 whitespace-pre-line editorial-board-full"
                                dangerouslySetInnerHTML={{ __html: editorialTeam }}
                            />
                        ) : (
                            <div className="text-center py-20 text-gray-500 italic border-2 border-dashed border-gray-100 rounded-lg">
                                <p>The full editorial board listing is currently being updated for this archival record.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 text-center text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} University of Dar es Salaam. Archival Metadata System.</p>
                </div>
            </div>
        </div>
    );
}
