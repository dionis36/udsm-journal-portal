"use client";

import { Navbar } from "@/components/Navbar";
import { Shield, Lock, Eye, FileCheck } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-udsm-blue p-12 text-white relative">
                        <Shield className="absolute top-10 right-10 opacity-10" size={120} />
                        <h1 className="text-4xl font-bold font-serif mb-4 relative z-10">Privacy Statement</h1>
                        <p className="text-udsm-gold font-bold opacity-80 uppercase tracking-[0.3em] text-[10px] relative z-10">Compliance & Ethical Standards</p>
                    </div>

                    <div className="p-12 prose prose-blue max-w-none">
                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-6">
                                <Lock className="text-udsm-gold" size={24} />
                                Data Collection
                            </h2>
                            <p className="text-gray-600 leading-relaxed italic border-l-4 border-udsm-gold/20 pl-6 mb-8">
                                The names and email addresses entered in this journal site will be used exclusively for the stated purposes of this journal and will not be made available for any other purpose or to any other party.
                            </p>
                            <p className="text-gray-700 leading-relaxed mb-6">
                                The University of Dar es Salaam (UDSM) Journal Portal is committed to protecting the privacy of its users. This policy outlines our practices regarding the collection, use, and disclosure of personal information provided by authors, reviewers, and readers.
                            </p>
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                            <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100">
                                <Eye className="text-udsm-blue mb-4" size={32} />
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Usage Metrics</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    We collect anonymized readership data (including approximate location via GeoIP and session duration) to generate impact metrics for institutional reporting.
                                </p>
                            </div>
                            <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100">
                                <FileCheck className="text-udsm-blue mb-4" size={32} />
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Cookies</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    The portal uses essential session cookies to manage user authentication and ensure a secure browsing experience across the archival history.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 font-serif">GDPR Compliance</h2>
                            <p className="text-gray-700 leading-relaxed mb-6">
                                Under GDPR, users have the right to access, rectify, or request the deletion of their personal information. For any privacy-related inquiries, please contact our Data Protection Officer at <strong>privacy@udsm.ac.tz</strong>.
                            </p>
                        </section>
                    </div>
                </div>

                <div className="mt-12 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Last Updated: February 14, 2026
                </div>
            </main>
        </div>
    );
}
