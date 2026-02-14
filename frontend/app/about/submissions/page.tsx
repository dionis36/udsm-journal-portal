"use client";

import { Navbar } from "@/components/Navbar";
import { FileText, Send, CheckCircle, ShieldCheck, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function SubmissionsPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold text-gray-900 font-serif mb-6 leading-tight">
                        Contribute to the <br />
                        <span className="text-udsm-blue">Archival Pipeline</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Join 300+ researchers in disseminating transformative population and development studies globally.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-lg">
                        <div className="bg-udsm-blue/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                            <FileText className="text-udsm-blue" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 font-serif">Prepare</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">Ensure your manuscript follows the APA 7th edition formatting and UDSM ethics guidelines.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-lg">
                        <div className="bg-udsm-gold/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                            <ShieldCheck className="text-udsm-gold" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 font-serif">Review</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">Our double-blind peer review process typically takes 8-12 weeks for a final decision.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-lg">
                        <div className="bg-green-50 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 font-serif">Publish</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">Upon acceptance, your research is indexed globally via Crossref and our high-impact map.</p>
                    </div>
                </div>

                <div className="bg-udsm-blue rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl mb-16">
                    <div className="relative z-10 max-w-xl">
                        <h2 className="text-3xl font-bold font-serif mb-4">Ready to Submit?</h2>
                        <p className="text-udsm-blue/20 mb-8 leading-relaxed opacity-80">
                            Our submission system facilitates seamless archival tracking and ensures your work reaches the global academic community.
                        </p>
                        <button className="flex items-center gap-3 px-8 py-4 bg-udsm-gold text-udsm-blue rounded-full font-black uppercase tracking-wider hover:scale-105 transition-transform shadow-lg">
                            <Send size={20} />
                            Go to Submission Portal
                        </button>
                    </div>
                    <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-white/5 rounded-full blur-3xl" />
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 font-serif flex items-center gap-2">
                        <HelpCircle className="text-gray-300" />
                        Submission Checklist
                    </h2>
                    <div className="space-y-4">
                        {[
                            "Originality statement accompanying the manuscript.",
                            "Abstract (max 250 words) and 5 keywords.",
                            "Anonymized manuscript file for blind review.",
                            "Conflict of interest disclosure form.",
                            "Ethical clearance certificate (where applicable)."
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100">
                                <CheckCircle className="text-udsm-gold mt-1 shrink-0" size={18} />
                                <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
