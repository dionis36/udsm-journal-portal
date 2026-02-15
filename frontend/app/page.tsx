"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { OJSHeader } from "@/components/OJSHeader";
import { OJSSidebar } from "@/components/OJSSidebar";
import { ArticleSummary } from "@/components/ArticleSummary";
import { useJournals, useHeatmap, useActivityFeed } from "@/lib/api";

const HeatmapView = dynamic(() => import("@/components/HeatmapView").then(mod => mod.HeatmapView), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-slate-50 rounded-sm flex items-center justify-center border border-slate-200">
      <div className="w-12 h-12 border-4 border-[#16669E] border-t-transparent rounded-full animate-spin" />
    </div>
  )
});
import { MapPin, Activity, ChevronRight, Play, Pause, SkipForward, SkipBack, RefreshCw } from "lucide-react";

export default function Home() {
  const [viewMode, setViewMode] = useState<'readership' | 'traffic'>('readership');
  // PERFORMANCE FIX: Disabled heatmap fetch as per user request to remove density blobs.
  const heatmapData = null;
  const heatmapLoading = false;
  // const { data: heatmapData, isLoading: heatmapLoading } = useHeatmap(undefined, viewMode);
  const [summary, setSummary] = useState<any>(null);

  // Feed State
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualSelection, setManualSelection] = useState<any>(null);

  const { events: discoveries, mutate: mutateFeed } = useActivityFeed();

  // Derived active item (either from feed or manual click)
  const activeItem = manualSelection || (discoveries && discoveries.length > 0 ? discoveries[activeIndex % discoveries.length] : null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && !manualSelection && discoveries && discoveries.length > 0) {
      timer = setInterval(() => {
        setActiveIndex(prev => (prev + 1) % discoveries.length);
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, manualSelection, discoveries?.length]);

  useEffect(() => {
    fetch('http://localhost:4000/api/metrics/impact-summary')
      .then(r => r.json())
      .then(data => setSummary(data))
      .catch(err => console.error('Failed to fetch summary:', err));
  }, []);

  const handleMapInteraction = (location: any) => {
    if (location) {
      setIsPlaying(false);
      setManualSelection({
        city: location.city || 'Selected Location',
        country: location.country || 'Unknown Region',
        country_code: location.country_code || 'TZ',
        lat: location.lat,
        lng: location.lng,
        time: "Interacting...",
        article: "User Exploring Location"
      });
    } else {
      setManualSelection(null);
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    setManualSelection(null);
    setActiveIndex(prev => (prev + 1) % discoveries.length);
    setIsPlaying(false);
  };

  const handlePrev = () => {
    setManualSelection(null);
    setActiveIndex(prev => (prev - 1 + discoveries.length) % discoveries.length);
    setIsPlaying(false);
  };

  const renderActiveItem = () => activeItem || (discoveries && discoveries.length > 0 ? discoveries[0] : null);

  const MOCK_ARTICLES = [
    { title: "Fertility Transitions and reproductive health among adolescent girls in urban Tanzania", authors: ["John Mashaka", "Mariam Juma"] },
    { title: "Climate change and internal migration: Evidence from the Southern Highlands", authors: ["David Mbah", "Sarah Peterson"] },
    { title: "The impact of COVID-19 on maternal health service utilization in Dar es Salaam", authors: ["Grace Temu", "Robert Kavishe"] },
    { title: "Spatial distribution of primary schools and its impact on enrollment rates", authors: ["Lucas Malima"] },
    { title: "Analyzing 50 years of population growth: A longitudinal study of UDSM records", authors: ["Benson Kikwete", "Anna Mkapa"] },
  ];

  const currentActive = renderActiveItem();

  return (
    <div className="min-h-screen bg-[#F7F8F9] font-sans text-slate-900">
      <OJSHeader />

      {/* Main Content Area */}
      <main className="max-w-[1160px] mx-auto px-4 py-8 flex gap-12">

        {/* Main Column */}
        <div className="flex-1 w-[860px]">

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8">
            <a href="#" className="hover:text-[#16669E]">Home</a>
            <ChevronRight size={10} />
            <a href="#" className="hover:text-[#16669E]">Archives</a>
            <ChevronRight size={10} />
            <span className="text-slate-600">Vol. 32 No. 2 (2025)</span>
          </nav>

          {/* Issue Header */}
          <section className="mb-12">
            <span className="text-[10px] font-black text-udsm-gold uppercase tracking-[0.3em] mb-2 block">Current Issue</span>
            <h2 className="text-[28px] font-black text-slate-900 leading-tight tracking-tighter mb-2 font-montserrat">
              Vol. 32 No. 2 (2025): Tanzania Journal of Population Studies and Development
            </h2>
            <div className="flex items-center gap-4 text-[13px] text-slate-500 font-medium">
              <span>Published: 2025-02-14</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span className="text-[#16669E] font-bold uppercase tracking-wider text-[11px]">Primary Research</span>
            </div>
          </section>

          {/* PREMIUM IMPACT DASHBOARD */}
          <section className="mb-12 rounded-sm border border-slate-200 overflow-hidden shadow-sm bg-white">
            {/* 1. Real-time Readership Header (High Detail & Controls) */}
            <div className="border-b border-slate-100 flex items-stretch">
              <div className="bg-slate-50 px-6 py-6 border-r border-slate-100 flex flex-col justify-center min-w-[200px]">
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">Real-time Impact</span>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-[#16669E] leading-none">{(summary?.total_hits || 0).toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Total Hits</span>
                </div>
                {isPlaying ? (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    <span className="text-[9px] font-black text-green-600 uppercase tracking-widest leading-none">Live Feed Active</span>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest leading-none">Feed Paused</span>
                  </div>
                )}
              </div>

              {/* Active Content & Controls */}
              <div className="flex-1 p-0 flex flex-col relative group">
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button onClick={handlePrev} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-[#16669E] transition-colors"><SkipBack size={14} /></button>
                  <button onClick={() => setIsPlaying(!isPlaying)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-[#16669E] transition-colors">
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button onClick={handleNext} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-[#16669E] transition-colors"><SkipForward size={14} /></button>
                  {manualSelection && (
                    <button onClick={() => setManualSelection(null)} className="p-1.5 hover:bg-red-50 rounded text-red-400 hover:text-red-600 transition-colors ml-2" title="Reset to Live Feed">
                      <RefreshCw size={14} />
                    </button>
                  )}
                </div>

                <div className="flex-1 p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-black text-[#16669E] uppercase tracking-widest">
                      {manualSelection ? 'User Inspecting:' : (currentActive ? 'Active Reader From:' : 'Syncing Feed...')}
                    </span>
                    {currentActive && (
                      <div className={`flex items-center gap-2 px-2 py-0.5 rounded text-[10px] font-bold transition-all ${manualSelection ? 'bg-udsm-gold text-udsm-blue shadow-sm' : 'bg-slate-100 text-slate-600'}`}>
                        {currentActive.country_code && (
                          <img
                            src={`https://flagcdn.com/w20/${currentActive.country_code.toLowerCase()}.png`}
                            className="w-4 h-auto rounded-sm"
                            alt=""
                          />
                        )}
                        {currentActive.city}, {currentActive.country}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-black text-slate-900 leading-tight font-noto-serif italic transition-all duration-300">
                    "{currentActive?.article || 'Waiting for activity records...'}"
                  </p>
                </div>

                {/* Progress Bar for Auto-Feed */}
                {isPlaying && discoveries && discoveries.length > 0 && <div className="h-0.5 w-full bg-slate-100 overflow-hidden"><div className="h-full bg-udsm-gold animate-[progress_5s_linear_infinite]" /></div>}
              </div>
            </div>

            {/* 2. Clean Map Container (Minimal) */}
            <div className="h-[480px] relative bg-slate-50">
              <HeatmapView
                data={heatmapData}
                isLoading={heatmapLoading}
                viewMode={viewMode}
                onModeChange={setViewMode}
                activeLocation={activeItem ? { lat: activeItem.lat, lng: activeItem.lng } : null}
                onLocationSelect={handleMapInteraction}
              />
            </div>

            {/* 3. Performance Metrics Footer (The "Win" Stats) */}
            <div className="px-8 py-6 bg-white border-t border-slate-200 grid grid-cols-3 gap-12 divide-x divide-slate-100">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-slate-900">{summary?.total_papers || 156}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Total Papers</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-[#16669E]">{summary?.total_downloads || 3281}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 text-center">Total Downloads</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-udsm-gold">{summary?.total_downloads_past_year || 1240}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 text-center">Past Year Yield</span>
              </div>
            </div>
          </section>

          {/* Articles Section */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight font-montserrat leading-none">
                Articles
              </h3>
              <div className="h-[2px] bg-udsm-gold w-12 rounded-full" />
            </div>

            <div className="flex flex-col">
              {MOCK_ARTICLES.map((article, idx) => (
                <ArticleSummary
                  key={idx}
                  title={article.title}
                  authors={article.authors}
                />
              ))}
            </div>
          </section>

        </div>

        {/* Sidebar Column */}
        <OJSSidebar />

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-20">
        <div className="max-w-[1160px] mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8 opacity-60">
          <div className="flex items-center gap-6">
            <div className="w-8 h-8 bg-[#16669E] rounded flex items-center justify-center text-white font-black text-xs">U</div>
            <p className="text-[13px] font-medium text-slate-600">
              © 2026 University of Dar es Salaam. All rights reserved.
            </p>
          </div>
          <div className="flex gap-8 text-[11px] font-bold text-[#16669E] uppercase tracking-widest">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Contact US</a>
            <a href="#" className="hover:underline">OJS Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
