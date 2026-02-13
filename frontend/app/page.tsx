"use client";

import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { useJournals, useHeatmap } from "@/lib/api";

const HeatmapView = dynamic(() => import("@/components/HeatmapView").then(mod => mod.HeatmapView), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-gray-950 rounded-xl flex items-center justify-center border border-gray-800">
      <div className="w-12 h-12 border-4 border-udsm-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )
});
import { Map, ArrowRight, Globe, Book } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { journals, isLoading: journalsLoading } = useJournals();
  const { data: heatmapData, isLoading: heatmapLoading } = useHeatmap();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      {/* Portal Hero */}
      <section className="bg-udsm-blue text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-blue-900 via-transparent to-udsm-blue"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
            UDSM Journal Visibility Portal
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-10">
            A centralized platform for tracking the real-time global impact and readership of University of Dar es Salaam research.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <div className="text-udsm-gold font-bold text-3xl mb-1">12+</div>
              <div className="text-sm text-blue-100">Active Journals</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <div className="text-udsm-gold font-bold text-3xl mb-1">120+</div>
              <div className="text-sm text-blue-100">Countries Reached</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <div className="text-udsm-gold font-bold text-3xl mb-1">5K+</div>
              <div className="text-sm text-blue-100">Monthly Downloads</div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Heatmap Preview */}
      <section className="py-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-udsm-blue flex items-center gap-2">
              <Globe className="text-udsm-gold" />
              Global Readership Pulse
            </h2>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live Archive Tracked
              </span>
            </div>
          </div>

          <div className="aspect-[21/9] w-full min-h-[400px]">
            <HeatmapView data={heatmapData} isLoading={heatmapLoading} />
          </div>

          <div className="mt-6 flex flex-wrap gap-4 items-center justify-center text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[rgb(0,51,102)]" /> Low Density
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[rgb(102,178,255)]" /> Moderate
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-udsm-gold" /> Concentrated Readership
            </div>
            <div className="ml-auto flex items-center gap-1 opacity-50">
              <span className="text-[10px] font-mono">RenderEngine: Deck.gl + MapLibre</span>
            </div>
          </div>
        </div>
      </section>

      {/* Journal Directory */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-udsm-blue mb-10 text-center">
            Explore Our Journals
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {journalsLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-white p-8 rounded-xl shadow-sm animate-pulse h-64"></div>
              ))
            ) : (
              journals?.map((j: any) => (
                <Link href={`/journals/${j.path}`} key={j.journal_id} className="group block bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                  <div className="h-3 bg-udsm-gold w-full group-hover:h-4 transition-all"></div>
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-50 p-2 rounded-lg text-udsm-blue">
                        <Book size={24} />
                      </div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Open Access</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-udsm-blue transition-colors">
                      {j.name}
                    </h3>
                    <div className="flex items-center text-udsm-blue font-medium mt-6 group-hover:translate-x-2 transition-transform">
                      View Journal <ArrowRight size={16} className="ml-2" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-udsm-blue text-white py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="opacity-60">© 2026 University of Dar es Salaam. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
