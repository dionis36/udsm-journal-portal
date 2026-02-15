"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { OJSHeader } from "@/components/OJSHeader";
import { OJSSidebar } from "@/components/OJSSidebar";
import { ArticleSummary } from "@/components/ArticleSummary";
import { useJournal, useCurrentIssue, useHeatmap, useActivityFeed } from "@/lib/api";

const HeatmapView = dynamic(() => import("@/components/HeatmapView").then(mod => mod.HeatmapView), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-slate-50 rounded-sm flex items-center justify-center border border-slate-200">
      <div className="w-12 h-12 border-4 border-[#16669E] border-t-transparent rounded-full animate-spin" />
    </div>
  )
});
import { MapPin, Activity, ChevronRight, Play, Pause, SkipForward, SkipBack, RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function JournalPage() {
  const { path } = useParams();
  const [viewMode, setViewMode] = useState<'readership' | 'traffic'>('readership');

  // Fetch real journal metadata
  const { journal, isLoading: journalLoading } = useJournal(path as string);
  const { data: issueData, isLoading: articlesLoading } = useCurrentIssue(path as string);
  const articles = issueData?.articles || [];

  // PERFORMANCE FIX: Disabled heatmap fetch as per user request to remove density blobs.
  const heatmapData = null;
  const heatmapLoading = false;

  const [summary, setSummary] = useState<any>(null);
  const [geoData, setGeoData] = useState<any[]>([]);

  // Feed State
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualSelection, setManualSelection] = useState<any>(null);
  const [cameraFocusMode, setCameraFocusMode] = useState(false); // Default: OFF (Indicator only)

  const { events: discoveries, mutate: mutateFeed } = useActivityFeed();

  // Derived active item (either from feed or manual click)
  const activeItem = manualSelection || (discoveries && discoveries.length > 0 ? discoveries[activeIndex % discoveries.length] : null);

  // Auto-play timer for feed rotation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && !manualSelection && discoveries && discoveries.length > 0) {
      timer = setInterval(() => {
        setActiveIndex(prev => (prev + 1) % discoveries.length);
      }, 8000); // 4s Travel + 4s Dwell
    }
    return () => clearInterval(timer);
  }, [isPlaying, manualSelection, discoveries?.length]);

  // Auto-resume timer: Reset to live feed after 30 seconds of manual selection
  useEffect(() => {
    if (manualSelection) {
      const timeout = setTimeout(() => {
        setManualSelection(null);
        setIsPlaying(true);
      }, 30000); // 30 seconds
      return () => clearTimeout(timeout);
    }
  }, [manualSelection]);

  useEffect(() => {
    // Fetch only data needed for minimal footer
    Promise.all([
      fetch('http://localhost:4000/api/metrics/impact-summary').then(r => r.json()),
      fetch('http://localhost:4000/api/metrics/geographic-breakdown').then(r => r.json())
    ]).then(([summaryData, geo]) => {
      setSummary(summaryData);
      setGeoData(geo);
    }).catch(err => console.error('Failed to fetch data:', err));
  }, []);

  const handleMapInteraction = async (location: any) => {
    if (location) {
      setIsPlaying(false);

      const isCluster = location.weight && location.weight > 1;
      let clusterArticles = [];
      let topArticleTitle = location.article_title;

      // Logic: If it's a cluster, fetch the top articles locally
      if (isCluster) {
        try {
          const res = await fetch(`http://localhost:4000/api/metrics/location-events?lng=${location.lng}&lat=${location.lat}`);
          const events = await res.json();
          if (events && events.length > 0) {
            clusterArticles = events;
            // Use the most recent article title as the "Top" one for the summary
            topArticleTitle = events[0].article_title;
          }
        } catch (e) {
          console.error("Failed to fetch cluster details", e);
        }
      }

      setManualSelection({
        city: location.city || 'Selected Location',
        country: location.country,
        country_code: location.country_code || 'TZ',
        lat: location.lat,
        lng: location.lng,
        time: "Interacting...",
        weight: location.weight,
        articles: clusterArticles, // Store the list
        // Formatted for Top Bar "Compact View"
        article: topArticleTitle || (isCluster ? `Aggregated Readership: ${location.weight} Interactions` : "User Exploring Location")
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

  const currentActive = renderActiveItem();

  // Helper to fallback country name
  const getDisplayCountry = (item: any) => {
    if (!item) return '';
    const { country, country_code } = item;
    if ((!country || country === 'Unknown' || country === 'Unknown Region' || country === 'Global Access') && country_code) {
      try {
        return new Intl.DisplayNames(['en'], { type: 'region' }).of(country_code);
      } catch {
        return country_code;
      }
    }
    return country;
  };

  const displayCountry = getDisplayCountry(currentActive);

  return (
    <div className="min-h-screen bg-[#F7F8F9] font-sans text-slate-900">
      <OJSHeader />

      {/* Main Content Area */}
      <main className="max-w-[1160px] mx-auto px-4 py-8 flex gap-12">

        {/* Main Column */}
        <div className="flex-1 w-[860px]">

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8">
            <a href="/" className="hover:text-[#16669E]">Home</a>
            <ChevronRight size={10} />
            <a href={`/${path}`} className="hover:text-[#16669E]">{journal?.name || path}</a>
            <ChevronRight size={10} />
            <span className="text-slate-600">Current Issue</span>
          </nav>

          {/* Issue Header */}
          <section className="mb-12">
            <span className="text-[10px] font-black text-udsm-gold uppercase tracking-[0.3em] mb-2 block">Current Issue</span>
            <h2 className="text-[28px] font-black text-slate-900 leading-tight tracking-tighter mb-2 font-montserrat">
              {journal?.name}
            </h2>
            <div className="flex items-center gap-4 text-[13px] text-slate-500 font-medium">
              <span>Published: 2025-02-14</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span className="text-[#16669E] font-bold uppercase tracking-wider text-[11px]">Primary Research</span>
            </div>
          </section>

          {/* PREMIUM IMPACT DASHBOARD */}
          <section className="mb-12 rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
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
                <div className="absolute top-4 right-4 flex gap-1 transition-opacity duration-200">
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
                        {currentActive.city}, {displayCountry}
                      </div>
                    )}
                  </div>
                  <Link href={`/articles/${currentActive?.item_id || currentActive?.id}`}>
                    <p className="text-sm font-black text-slate-900 leading-tight font-noto-serif italic transition-all duration-300 hover:text-[#16669E] hover:underline cursor-pointer">
                      "{currentActive?.article || 'Waiting for activity records...'}"
                    </p>
                  </Link>
                </div>

                {/* Progress Bar for Auto-Feed */}
                {isPlaying && discoveries && discoveries.length > 0 && <div className="h-0.5 w-full bg-slate-100 overflow-hidden"><div className="h-full bg-udsm-gold animate-[progress_8s_linear_infinite]" /></div>}
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
                activeLocationDetails={activeItem}
                onLocationSelect={handleMapInteraction}
                cameraFocusMode={cameraFocusMode}
                onToggleCameraFocus={() => setCameraFocusMode(!cameraFocusMode)}
                feedControls={{
                  isPlaying,
                  onPlayPause: () => setIsPlaying(!isPlaying),
                  onNext: handleNext,
                  onPrev: handlePrev,
                  onReset: () => setManualSelection(null),
                  hasManualSelection: !!manualSelection
                }}
              />
            </div>

            {/* Minimal OJS-Style Stats Footer */}
            <div className="px-8 py-6 bg-white border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-bold">{summary?.total_papers || 0}</span>
                    <span className="text-slate-500">articles</span>
                  </div>
                  <div className="w-px h-4 bg-slate-300"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-bold">{summary?.total_downloads || 0}</span>
                    <span className="text-slate-500">total reads</span>
                  </div>
                  <div className="w-px h-4 bg-slate-300"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-bold">{geoData?.length || 0}</span>
                    <span className="text-slate-500">countries</span>
                  </div>
                </div>

                <a
                  href="/stats"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#16669E] hover:bg-[#16669E]/5 rounded-lg transition-colors"
                >
                  <span>📊</span>
                  <span>View Detailed Analytics</span>
                  <ChevronRight size={16} />
                </a>
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
              {articles.map((article: any, idx: number) => (
                <ArticleSummary
                  key={article.item_id || idx}
                  title={article.title}
                  authors={article.authors}
                />
              ))}
              {articles.length === 0 && !articlesLoading && (
                <p className="text-sm text-slate-400 italic py-8">No articles found for this issue.</p>
              )}
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
