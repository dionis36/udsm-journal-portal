"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { OJSHeader } from "@/components/OJSHeader";
import { OJSSidebar } from "@/components/OJSSidebar";
import { JournalCard } from "@/components/JournalCard";
import { useJournals, useActivityFeed, useHeatmap } from "@/lib/api";

const HeatmapView = dynamic(() => import("@/components/HeatmapView").then(mod => mod.HeatmapView), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-slate-50 rounded-sm flex items-center justify-center border border-slate-200">
      <div className="w-12 h-12 border-4 border-[#16669E] border-t-transparent rounded-full animate-spin" />
    </div>
  )
});

import { MapPin, Activity, ChevronRight, Play, Pause, SkipForward, SkipBack, RefreshCw, Globe, BookOpen, Users } from "lucide-react";
import Link from 'next/link';

export default function Dashboard() {
  const { journals, isLoading: journalsLoading } = useJournals();
  const [viewMode, setViewMode] = useState<'readership' | 'traffic'>('readership');

  // Overall Portal Stats
  const [summary, setSummary] = useState<any>(null);
  const [geoData, setGeoData] = useState<any[]>([]);

  // Feed & Map State
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualSelection, setManualSelection] = useState<any>(null);
  const [cameraFocusMode, setCameraFocusMode] = useState(false);

  const { events: discoveries, mutate: mutateFeed } = useActivityFeed();
  const activeItem = manualSelection || (discoveries && discoveries.length > 0 ? discoveries[activeIndex % discoveries.length] : null);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:4000/api/metrics/impact-summary').then(r => r.json()),
      fetch('http://localhost:4000/api/metrics/geographic-breakdown').then(r => r.json())
    ]).then(([summaryData, geo]) => {
      setSummary(summaryData);
      setGeoData(geo);
    }).catch(err => console.error('Failed to fetch global stats:', err));
  }, []);

  // Auto-play timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && !manualSelection && discoveries && discoveries.length > 0) {
      timer = setInterval(() => {
        setActiveIndex(prev => (prev + 1) % discoveries.length);
      }, 8000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, manualSelection, discoveries?.length]);

  const handleMapInteraction = (location: any) => {
    if (location) {
      setIsPlaying(false);
      setManualSelection({
        ...location,
        article: location.article_title || "Global Entry Point"
      });
    } else {
      setManualSelection(null);
      setIsPlaying(true);
    }
  };

  const currentActive = activeItem;
  const getDisplayCountry = (item: any) => {
    if (!item) return '';
    const { country, country_code } = item;
    if ((!country || country === 'Unknown') && country_code) {
      try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(country_code); } catch { return country_code; }
    }
    return country;
  };

  return (
    <div className="min-h-screen bg-[#F7F8F9] font-sans text-slate-900">
      <OJSHeader />

      <main className="max-w-[1160px] mx-auto px-4 py-8 flex flex-col md:flex-row gap-12">

        {/* Main Column */}
        <div className="flex-1 w-full md:w-[860px]">

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8">
            <span className="text-slate-600">Home</span>
            <ChevronRight size={10} />
            <span className="text-slate-400">Discovery Dashboard</span>
          </nav>

          {/* Portal Header */}
          <header className="mb-12">
            <span className="text-[10px] font-black text-udsm-gold uppercase tracking-[0.3em] mb-2 block">Global Research Impact</span>
            <h1 className="text-[32px] font-black text-slate-900 leading-tight tracking-tighter font-montserrat">
              Discovery Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-500 font-medium max-w-2xl">
              Monitoring the global footprint of University of Dar es Salaam research journals through real-time visitation and download analytics.
            </p>
          </header>

          {/* IMPACT DASHBOARD SECTION */}
          <section className="mb-12 rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
            <div className="border-b border-slate-100 flex items-stretch">
              <div className="bg-slate-50 px-6 py-6 border-r border-slate-100 flex flex-col justify-center min-w-[200px]">
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">Global Impact</span>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-[#16669E] leading-none">{(summary?.total_hits || 0).toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Visits</span>
                </div>
              </div>

              {/* Active Item Bar */}
              <div className="flex-1 p-0 flex flex-col relative">
                <div className="absolute top-4 right-4 flex gap-1">
                  <button onClick={() => { setActiveIndex(i => (i - 1 + discoveries.length) % discoveries.length); setIsPlaying(false); }} className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><SkipBack size={14} /></button>
                  <button onClick={() => setIsPlaying(!isPlaying)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400">
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button onClick={() => { setActiveIndex(i => (i + 1) % discoveries.length); setIsPlaying(false); }} className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><SkipForward size={14} /></button>
                </div>

                <div className="flex-1 p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-[#16669E] uppercase tracking-widest leading-none">
                      Live Readership: {currentActive?.city}, {getDisplayCountry(currentActive)}
                    </span>
                  </div>
                  <p className="text-sm font-black text-slate-900 leading-tight font-noto-serif italic line-clamp-1">
                    "{currentActive?.article || 'Exploring Global Trends...'}"
                  </p>
                </div>
              </div>
            </div>

            <div className="h-[440px] relative bg-slate-900/5">
              <HeatmapView
                data={null}
                isLoading={false}
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
                  onNext: () => setActiveIndex(i => (i + 1) % discoveries.length),
                  onPrev: () => setActiveIndex(i => (i - 1 + discoveries.length) % discoveries.length),
                  onReset: () => setManualSelection(null),
                  hasManualSelection: !!manualSelection
                }}
              />
            </div>

            {/* Global Stats Footer */}
            <div className="px-8 py-6 bg-white border-t border-slate-200">
              <div className="grid grid-cols-3 gap-8">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Publications</span>
                  <span className="text-xl font-black text-slate-900">{journals?.length || 0}</span>
                </div>
                <div className="flex flex-col border-l border-slate-100 pl-8">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Downloads</span>
                  <span className="text-xl font-black text-slate-900">{(summary?.total_downloads || 0).toLocaleString()}</span>
                </div>
                <div className="flex flex-col border-l border-slate-100 pl-8">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impact Nations</span>
                  <span className="text-xl font-black text-slate-900">{geoData?.length || 0}</span>
                </div>
              </div>
            </div>
          </section>

          {/* JOURNALS DIRECTORY SECTION */}
          <section className="mb-20">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight font-montserrat leading-none">
                Register of Journals
              </h2>
              <div className="h-[2px] bg-udsm-gold w-12 rounded-full" />
            </div>

            <div className="grid grid-cols-1 gap-6">
              {journals?.map((j: any) => (
                <JournalCard
                  key={j.journal_id}
                  name={j.name}
                  path={j.path}
                  description={j.metadata?.description}
                  stats={{
                    articles: summary?.total_papers || 0,
                    readers: summary?.total_downloads || 0,
                    countries: geoData?.length || 0
                  }}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <OJSSidebar />

      </main>

      {/* Basic Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-[1160px] mx-auto px-4 flex justify-between items-center opacity-40">
          <span className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">© University of Dar es Salaam 2026</span>
          <div className="flex gap-6 text-[10px] font-black text-[#16669E] uppercase tracking-tighter">
            <a href="#">Privacy</a>
            <a href="#">Ethics</a>
            <a href="#">Archives</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
