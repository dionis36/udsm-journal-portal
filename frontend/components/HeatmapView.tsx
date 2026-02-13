"use client";

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Map, { NavigationControl } from 'react-map-gl/maplibre';
import DeckGL, { HeatmapLayer, ScatterplotLayer } from 'deck.gl';
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

    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
            // Pre-flight check for WebGL2
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
                if (!gl) {
                    setGpuError("WebGL2 access is blocked or unsupported by your graphics drivers.");
                }
            } catch (e) {
                setGpuError("Hardware security policy is blocking WebGL initialization.");
            }
        }, 200);
        return () => clearTimeout(timer);
    }, []);

    const toggleFullscreen = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFullscreen(prev => !prev);
    }, []);

    // Handle Escape key to exit fullscreen
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    // Handle pulse events
    const handlePulse = useCallback((event: any) => {
        const newRipple: Ripple = {
            id: `${Date.now()}-${Math.random()}`,
            coordinates: [event.lng, event.lat],
            timestamp: Date.now()
        };
        setRipples(prev => [...prev.slice(-10), newRipple]);
    }, []);

    usePulse(handlePulse);

    // Clean up expired ripples
    useEffect(() => {
        if (!mounted) return;
        const interval = setInterval(() => {
            const now = Date.now();
            setRipples(prev => prev.filter(r => now - r.timestamp < 3000));
        }, 100);
        return () => clearInterval(interval);
    }, [mounted]);

    // Adaptive throttling based on device
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    }, []);

    const layers = useMemo(() => {
        if (!mounted || gpuError) return [];

        return [
            new HeatmapLayer({
                id: 'heatmap-layer-' + (isFullscreen ? 'fs' : 'normal'), // Use stable ID
                data: data?.features || [],
                getPosition: (d: any) => d.geometry.coordinates,
                getWeight: (d: any) => d.properties.weight,
                radiusPixels: isMobile ? (isFullscreen ? 40 : 30) : (isFullscreen ? 60 : 40),
                intensity: 1,
                threshold: 0.05,
                colorRange: [
                    [1, 22, 39],
                    [0, 102, 204],
                    [102, 178, 255],
                    [255, 204, 0],
                    [255, 255, 102],
                    [255, 255, 255]
                ]
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
                radiusMinPixels: isMobile ? 2 : 1, // Larger dots for easier touch
                radiusMaxPixels: isMobile ? 80 : 100,
                stroked: true,
                lineWidthMinPixels: 2,
                getLineColor: (d: Ripple) => {
                    const age = Date.now() - d.timestamp;
                    const opacity = Math.max(0, 255 * (1 - age / 3000));
                    return [255, 255, 255, opacity];
                },
                antialiasing: !isMobile // Performance boost on low-end
            })
        ];
    }, [data, ripples, mounted, isFullscreen, gpuError, isMobile]);

    const renderMapContent = () => {
        if (gpuError) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-900 min-h-[400px]">
                    <AlertTriangle className="text-udsm-gold mb-4" size={48} />
                    <h4 className="text-white font-bold text-lg mb-2 tracking-tight">System Initialization Error</h4>
                    <p className="text-gray-400 text-sm max-w-sm">
                        Geospatial engine exceeded browser limits. Please ensure "Hardware Acceleration" is enabled in browser settings.
                    </p>
                    <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10 w-full max-w-sm text-left">
                        <div className="text-[10px] uppercase text-gray-500 font-bold mb-2">Driver Response</div>
                        <div className="text-udsm-gold font-mono text-[10px] break-all opacity-80">{gpuError}</div>
                    </div>
                </div>
            );
        }

        return (
            <>
                <DeckGL
                    initialViewState={INITIAL_VIEW_STATE}
                    controller={true}
                    layers={layers}
                    pickingRadius={5}
                    // Forcing WebGL device at the correct level for Deck.gl v9
                    deviceProps={{
                        type: 'webgl'
                    }}
                    parameters={{
                        clearColor: [0.02, 0.02, 0.04, 1],
                        preserveDrawingBuffer: true,
                        antialias: !isMobile
                    } as any}
                    onError={(error: any) => {
                        console.error('DeckGL Error:', error);
                        if (!gpuError) setGpuError(error?.message || String(error));
                    }}
                >
                    <Map
                        mapStyle={MAP_STYLE}
                        style={{ width: '100%', height: '100%' }}
                        attributionControl={false}
                    >
                        <NavigationControl position="bottom-right" />
                    </Map>
                </DeckGL>

                {/* Glassmorphism Controls Overlay */}
                <div className="absolute top-6 left-6 z-40 p-5 bg-gray-950/40 backdrop-blur-md rounded-xl border border-white/10 text-white min-w-[240px]">
                    <div className="flex justify-between items-start mb-1">
                        <div>
                            <h3 className="text-lg font-bold font-serif flex items-center gap-2">
                                <span className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                                Live Pulse
                            </h3>
                            <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">UDSM Archival Network</p>
                        </div>
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-udsm-gold cursor-pointer pointer-events-auto"
                            title={isFullscreen ? "Minimize" : "Fullscreen"}
                        >
                            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                        </button>
                    </div>

                    <div className="space-y-4 mt-4">
                        <div className="flex justify-between items-end border-b border-white/5 pb-3">
                            <span className="text-gray-400 text-xs">Total Hits</span>
                            <span className="text-2xl font-mono font-bold text-udsm-gold tracking-tight">
                                {data?.features.reduce((acc, f) => acc + f.properties.weight, 0).toLocaleString() || '0'}
                            </span>
                        </div>
                    </div>
                </div>

                {isFullscreen && (
                    <div className="absolute bottom-6 left-6 z-40 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white text-[10px] tracking-widest uppercase font-bold">
                        ESC or Click Icon to Exit Fullscreen
                    </div>
                )}
            </>
        );
    };

    if (!mounted) {
        return (
            <div className="relative w-full h-full min-h-[400px] rounded-xl bg-gray-950 flex flex-col items-center justify-center border border-gray-800">
                <div className="w-12 h-12 border-4 border-udsm-gold border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 text-xs font-mono tracking-widest uppercase opacity-50">Pulse Core Loading...</p>
            </div>
        );
    }

    const mapContainer = (
        <div className={`transition-all duration-500 ease-in-out bg-gray-950 shadow-2xl overflow-hidden
            ${isFullscreen ? 'fixed inset-0 z-[9999]' : 'relative w-full h-full rounded-xl border border-gray-800'}`}>

            {isLoading && !gpuError && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/60 backdrop-blur-sm">
                    <div className="w-12 h-12 border-4 border-udsm-gold border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-blue-100 font-medium animate-pulse">Synchronizing Global Pulse...</p>
                </div>
            )}

            {renderMapContent()}
        </div>
    );

    if (isFullscreen && typeof document !== 'undefined') {
        return createPortal(mapContainer, document.body);
    }

    return mapContainer;
};
