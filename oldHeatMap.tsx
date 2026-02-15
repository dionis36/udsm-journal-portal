"use client";

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Map, { NavigationControl } from 'react-map-gl/maplibre';
import DeckGL, { HeatmapLayer, ScatterplotLayer, MVTLayer } from 'deck.gl';
import { Maximize2, Minimize2, AlertTriangle } from 'lucide-react';
import { usePulse } from '../lib/api';
import 'maplibre-gl/dist/maplibre-gl.css';

interface HeatmapData {
    type: string;
    features: Array<{
        geometry: {
            coordinates: [number, number];
        };
        properties: {
            weight: number;
        };
    }>;
}

interface HeatmapViewProps {
    data: HeatmapData | null;
    isLoading: boolean;
}

interface Ripple {
    id: string;
    coordinates: [number, number];
    timestamp: number;
}

const INITIAL_VIEW_STATE = {
    longitude: 34.8,
    latitude: -6.3,
    zoom: 4,
    pitch: 0,
    bearing: 0
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export const HeatmapView: React.FC<HeatmapViewProps> = ({ data, isLoading }) => {
    const [mounted, setMounted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [gpuError, setGpuError] = useState<string | null>(null);
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [topRegions, setTopRegions] = useState<any[]>([]);
    const [currentAutoPilotIndex, setCurrentAutoPilotIndex] = useState(0);
    const [isAutoPilot, setIsAutoPilot] = useState(false);
    const [lastInteraction, setLastInteraction] = useState(Date.now());
    const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

    // 1. Fetch Analytics Data
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [summaryRes, regionsRes] = await Promise.all([
                    fetch('http://localhost:3001/api/metrics/impact-summary').then(r => r.json()),
                    fetch('http://localhost:3001/api/metrics/top-regions').then(r => r.json())
                ]);
                setSummary(summaryRes);
                setTopRegions(regionsRes);
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);

    // 2. Auto-Pilot Logic: Find hotspots and focus
    useEffect(() => {
        if (!isAutoPilot || !topRegions.length) return;

        const interval = setInterval(() => {
            const nextIndex = (currentAutoPilotIndex + 1) % topRegions.length;
            setCurrentAutoPilotIndex(nextIndex);

            const region = topRegions[nextIndex];
            if (region.lat && region.lng) {
                setViewState(prev => ({
                    ...prev,
                    longitude: parseFloat(region.lng),
                    latitude: parseFloat(region.lat),
                    zoom: 6,
                    transitionDuration: 3000
                }));
            }
        }, 15000);

        return () => clearInterval(interval);
    }, [isAutoPilot, topRegions, currentAutoPilotIndex]);

    // 3. Detect Inactivity for Auto-Pilot
    useEffect(() => {
        const handleInteraction = () => {
            setLastInteraction(Date.now());
            if (isAutoPilot) {
                setIsAutoPilot(false);
                setViewState(prev => ({
                    ...prev,
                    ...INITIAL_VIEW_STATE,
                    transitionDuration: 2000
                }));
            }
        };
        window.addEventListener('mousedown', handleInteraction);
        window.addEventListener('keydown', handleInteraction);

        const checkInactivity = setInterval(() => {
            if (Date.now() - lastInteraction > 20000 && !isAutoPilot) {
                setIsAutoPilot(true);
            }
        }, 5000);

        return () => {
            window.removeEventListener('mousedown', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            clearInterval(checkInactivity);
        };
    }, [lastInteraction, isAutoPilot]);

    // 4. Initial Setup & WebGL Check
    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
                if (!gl) setGpuError("WebGL2 access blocked or unsupported.");
            } catch (e) {
                setGpuError("Hardware security policy blocking WebGL.");
            }
        }, 200);
        return () => clearTimeout(timer);
    }, []);

    // 5. Throttling & Device Check
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    }, []);

    // 6. Pulse/Ripple Logic
    const handlePulse = useCallback((event: any) => {
        const newRipple: Ripple = {
            id: `${Date.now()}-${Math.random()}`,
            coordinates: [event.lng, event.lat],
            timestamp: Date.now()
        };
        setRipples(prev => [...prev.slice(-10), newRipple]);
    }, []);

    usePulse(handlePulse);

    useEffect(() => {
        if (!mounted) return;
        const interval = setInterval(() => {
            const now = Date.now();
            setRipples(prev => prev.filter(r => now - r.timestamp < 3000));
        }, 100);
        return () => clearInterval(interval);
    }, [mounted]);

    const toggleFullscreen = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFullscreen(prev => !prev);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    // 7. Layer Definitions
    const layers = useMemo(() => {
        if (!mounted || gpuError) return [];

        return [
            new HeatmapLayer({
                id: 'heatmap-layer-' + (isFullscreen ? 'fs' : 'normal'),
                data: data?.features || [],
                getPosition: (d: any) => d.geometry.coordinates,
                getWeight: (d: any) => d.properties.weight,
                radiusPixels: isMobile ? (isFullscreen ? 40 : 30) : (isFullscreen ? 60 : 40),
                intensity: 1,
                threshold: 0.05,
                colorRange: [
                    [1, 22, 39], [0, 102, 204], [102, 178, 255], [255, 204, 0], [255, 255, 102], [255, 255, 255]
                ]
            }),
            new MVTLayer({
                id: 'mvt-layer',
                data: 'http://localhost:3001/api/tiles/{z}/{x}/{y}.mvt',
                minZoom: 0,
                maxZoom: 14,
                getFillColor: [255, 204, 0, 150],
                getRadius: 5,
                pointType: 'circle',
                pointRadiusUnits: 'pixels',
                radiusMinPixels: 2,
                radiusMaxPixels: 10,
                visible: true,
                pickable: true
            }),
            new ScatterplotLayer({
                id: 'ripple-layer-' + (isFullscreen ? 'fs' : 'normal'),
                data: ripples,
                getPosition: (d: Ripple) => d.coordinates,
                getRadius: (d: Ripple) => {
                    const age = Date.now() - d.timestamp;
                    return Math.min(1000000, age * 500);
                },
                getFillColor: (d: Ripple) => {
                    const age = Date.now() - d.timestamp;
                    const opacity = Math.max(0, 255 * (1 - age / 3000));
                    return [255, 204, 0, opacity];
                },
                radiusMinPixels: isMobile ? 2 : 1,
                radiusMaxPixels: isMobile ? 80 : 100,
                stroked: true,
                lineWidthMinPixels: 2,
                getLineColor: (d: Ripple) => {
                    const age = Date.now() - d.timestamp;
                    const opacity = Math.max(0, 255 * (1 - age / 3000));
                    return [255, 255, 255, opacity];
                },
                antialiasing: !isMobile
            })
        ];
    }, [data, ripples, mounted, isFullscreen, gpuError, isMobile]);

    const renderMapContent = () => {
        if (gpuError) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-900 min-h-[400px]">
                    <AlertTriangle className="text-udsm-gold mb-4" size={48} />
                    <h4 className="text-white font-bold text-lg mb-2 tracking-tight">System Initialization Error</h4>
                    <p className="text-gray-400 text-sm max-w-sm">Geospatial engine exceeded browser limits. Please enable Hardware Acceleration.</p>
                </div>
            );
        }

        return (
            <>
                <DeckGL
                    viewState={viewState}
                    onViewStateChange={({ viewState }: any) => setViewState(viewState)}
                    controller={true}
                    layers={layers}
                    deviceProps={{ type: 'webgl' }}
                    parameters={{ clearColor: [0.02, 0.02, 0.04, 1], preserveDrawingBuffer: true, antialias: !isMobile } as any}
                >
                    <Map mapStyle={MAP_STYLE} style={{ width: '100%', height: '100%' }} attributionControl={false}>
                        <NavigationControl position="bottom-right" />
                    </Map>
                </DeckGL>

                {/* --- HUD OVERLAYS --- */}
                <div className="absolute top-6 left-6 right-24 z-40 flex flex-col gap-4 pointer-events-none">
                    <div className="flex items-start gap-4">
                        <div className={`px-3 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2 transition-all duration-500
                            ${isAutoPilot ? 'bg-udsm-gold/20 border-udsm-gold text-udsm-gold' : 'bg-white/5 border-white/10 text-gray-400 opacity-60'}`}>
                            <div className={`w-2 h-2 rounded-full ${isAutoPilot ? 'bg-udsm-gold animate-pulse' : 'bg-gray-500'}`} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                {isAutoPilot ? `Focus: ${topRegions[currentAutoPilotIndex]?.city_name}` : 'Autonomous Mode Idle'}
                            </span>
                        </div>

                        <div className="p-4 bg-gray-950/60 backdrop-blur-xl rounded-xl border border-white/10 text-white min-w-[280px] pointer-events-auto shadow-2xl">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-lg font-bold font-serif flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                                        Impact Pulse
                                    </h3>
                                    <p className="text-gray-400 text-[9px] uppercase tracking-[0.2em] font-bold opacity-70">Global Readership Stream</p>
                                </div>
                                <button onClick={toggleFullscreen} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-udsm-gold cursor-pointer">
                                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute top-24 left-6 z-40 hidden lg:block w-48 pointer-events-none">
                    <div className="space-y-2">
                        {topRegions.slice(0, 5).map((region, idx) => (
                            <div key={idx} className="p-2.5 bg-gray-950/40 backdrop-blur-md rounded-lg border border-white/5 flex items-center justify-between pointer-events-auto cursor-help hover:border-udsm-gold/30 transition-all duration-300">
                                <div className="flex flex-col">
                                    <span className="text-white text-[11px] font-bold truncate max-w-[100px]">{region.city_name}</span>
                                    <span className="text-gray-500 text-[9px] uppercase font-bold tracking-tighter">{region.country_name}</span>
                                </div>
                                <div className="text-right flex flex-col">
                                    <span className="text-udsm-gold text-xs font-mono font-bold leading-none">{region.hits}</span>
                                    <span className="text-[8px] text-gray-600 font-bold uppercase">Impact</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="absolute bottom-10 left-6 right-24 z-40 flex items-center gap-3">
                    <div className="flex-1 p-4 bg-gray-950/80 backdrop-blur-md rounded-xl border border-white/10 grid grid-cols-4 gap-6 text-white overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-udsm-gold/10 animate-scanline" />
                        <div className="flex flex-col border-r border-white/5 pr-4">
                            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Archival Reach</span>
                            <span className="text-xl font-mono font-bold text-udsm-gold">{summary?.total_hits || '1,000'}+</span>
                        </div>
                        <div className="flex flex-col border-r border-white/5 pr-4">
                            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Diversity</span>
                            <span className="text-xl font-mono font-bold text-udsm-gold">{summary?.total_countries || '14'} Nations</span>
                        </div>
                        <div className="flex flex-col border-r border-white/5 pr-4">
                            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Knowledge Yield</span>
                            <span className="text-xl font-mono font-bold text-udsm-gold">{summary?.total_downloads || '300'}+ <span className="text-[8px] opacity-40">DLs</span></span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Engagement</span>
                            <span className="text-xl font-mono font-bold text-udsm-gold">
                                {summary?.avg_duration ? Math.floor(summary.avg_duration / 60) : '4'}m {summary?.avg_duration ? Math.floor(summary.avg_duration % 60) : '12'}s
                            </span>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    if (!mounted) return (
        <div className="w-full h-full min-h-[400px] rounded-xl bg-gray-950 flex flex-col items-center justify-center border border-gray-800">
            <div className="w-10 h-10 border-2 border-udsm-gold border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const mapContainer = (
        <div className={`transition-all duration-500 bg-gray-950 shadow-2xl overflow-hidden
            ${isFullscreen ? 'fixed inset-0 z-[9999]' : 'relative w-full h-[600px] rounded-xl border border-gray-800'}`}>
            {isLoading && !gpuError && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/60 backdrop-blur-sm">
                    <div className="w-12 h-12 border-4 border-udsm-gold border-t-transparent rounded-full animate-spin" />
                </div>
            )}
            {renderMapContent()}
        </div>
    );

    if (isFullscreen && typeof document !== 'undefined') return createPortal(mapContainer, document.body);
    return mapContainer;
};