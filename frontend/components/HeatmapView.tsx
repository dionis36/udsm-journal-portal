"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import Map, { NavigationControl } from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import { MVTLayer } from '@deck.gl/geo-layers';
import { FlyToInterpolator } from '@deck.gl/core';
import { Maximize2, Minimize2, Activity, Globe, Zap, MousePointer2, MapPin, X, Sun, Moon, Play, Pause, SkipForward, SkipBack, RefreshCw } from 'lucide-react';
import { usePulse } from '../lib/api';
import { MapTooltip } from './MapTooltip';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface HeatmapData {
    type: string;
    features: Array<{
        geometry: {
            coordinates: [number, number];
        };
        properties: {
            weight: number;
            country?: string;
            city?: string;
        };
    }>;
}

interface HeatmapViewProps {
    data?: HeatmapData | null;
    isLoading?: boolean;
    viewMode: 'readership' | 'traffic';
    onModeChange: (mode: 'readership' | 'traffic') => void;
    activeLocation?: { lat: number; lng: number } | null;
    activeLocationDetails?: any;
    onLocationSelect?: (location: any) => void;
    cameraFocusMode?: boolean;
    onToggleCameraFocus?: () => void;
    feedControls?: {
        isPlaying: boolean;
        onPlayPause: () => void;
        onNext: () => void;
        onPrev: () => void;
        onReset: () => void;
        hasManualSelection: boolean;
    };
}

interface Ripple {
    id: string;
    coordinates: [number, number];
    timestamp: number;
}

const INITIAL_VIEW_STATE = {
    longitude: 15.0,
    latitude: 10.0,
    zoom: 0.8,
    pitch: 0,
    bearing: 0,
    transitionDuration: 0
};

const DARK_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const LIGHT_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export function HeatmapView({ data, isLoading, viewMode, onModeChange, activeLocation, activeLocationDetails, onLocationSelect, feedControls, cameraFocusMode, onToggleCameraFocus }: HeatmapViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [rippleState, setRipples] = useState<Ripple[]>([]);
    const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('light');
    const [showFullscreenBar, setShowFullscreenBar] = useState(false);

    // PERFORMANCE FIX: Use useRef for viewState to avoid React re-renders on every pan/zoom
    const viewStateRef = useRef<any>(INITIAL_VIEW_STATE);
    const [, forceUpdate] = useState({}); // Minimal triggger for deliberate UI syncs

    const [hoverInfo, setHoverInfo] = useState<any>(null);
    const [localClickedInfo, setLocalClickedInfo] = useState<any>(null);
    const [isDeviceReady, setIsDeviceReady] = useState(false);
    const hideBarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const displayCountryName = useMemo(() => {
        if (!activeLocationDetails) return '';
        const { country, country_code } = activeLocationDetails;
        if ((!country || country === 'Unknown' || country === 'Unknown Region' || country === 'Global Access') && country_code) {
            try {
                return new Intl.DisplayNames(['en'], { type: 'region' }).of(country_code);
            } catch {
                return country_code;
            }
        }
        return country;
    }, [activeLocationDetails]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handlePulse = useCallback((event: any) => {
        const newRipple: Ripple = {
            id: `${Date.now()}-${Math.random()}`,
            coordinates: [event.lng, event.lat],
            timestamp: Date.now()
        };
        setRipples(prev => [...prev.slice(-10), newRipple]);
    }, []);

    usePulse(handlePulse);

    const onPointClick = useCallback((info: any) => {
        if (info.object) {
            setLocalClickedInfo(info.object);
            if (onLocationSelect) {
                onLocationSelect({
                    lat: info.object.geometry?.coordinates[1] || info.object.coordinates?.[1],
                    lng: info.object.geometry?.coordinates[0] || info.object.coordinates?.[0],
                    ...info.object.properties
                });
            }
        }
    }, [onLocationSelect]);

    const onViewStateChange = useCallback(({ viewState }: any) => {
        viewStateRef.current = viewState;
        // PERFORMANCE FIX: Prevent "Cannot update during render" warning by scheduling update
        requestAnimationFrame(() => {
            forceUpdate({});
        });
    }, []);

    const onDeviceInitialized = useCallback((device: any) => {
        console.log('[Heatmap] WebGL Device Ready');
        setGpuDevice(device);
        setIsDeviceReady(true);
    }, []);

    const COLOR_RANGES = useMemo(() => {
        // Theme-aware colors
        if (mapTheme === 'dark') {
            return {
                readership: [[247, 188, 74], [255, 120, 0], [255, 60, 0]],
                traffic: [[0, 204, 204], [102, 255, 255], [0, 255, 153]]
            };
        }
        return {
            readership: [[245, 124, 0], [211, 47, 47], [194, 24, 91]],
            traffic: [[0, 150, 136], [0, 121, 107], [0, 77, 64]]
        };
    }, [mapTheme]);

    const [gpuDevice, setGpuDevice] = useState<any>(null);

    // Initial ViewState setup: Full World Overview (Refining to Zoom 0.8)
    const initialViewState = useMemo(() => ({
        longitude: 15.0,
        latitude: 10.0,
        zoom: 0.8, // Whole World View
        pitch: 0,
        bearing: 0
    }), []);

    const [tileVersion] = useState(Date.now());

    // RESET TO GLOBAL: Zoom out when Camera Focus is toggled OFF
    useEffect(() => {
        if (!cameraFocusMode && mounted) {
            viewStateRef.current = {
                ...viewStateRef.current,
                ...initialViewState,
                transitionDuration: 3000,
                transitionInterpolator: new FlyToInterpolator({ speed: 0.8, curve: 1.0 })
            };
            forceUpdate({});
        }
    }, [cameraFocusMode, initialViewState, mounted]);

    // Sync Map to Active Location with Smooth FlyTo (Only if Camera Focus Mode is ON)
    useEffect(() => {
        if (activeLocation && cameraFocusMode && (feedControls?.isPlaying || feedControls?.hasManualSelection)) {
            viewStateRef.current = {
                ...viewStateRef.current,
                longitude: activeLocation.lng,
                latitude: activeLocation.lat,
                zoom: 3.0, // MUCH more subtle focus (keeping global context)
                transitionDuration: 4000,
                transitionInterpolator: new FlyToInterpolator({ speed: 0.6, curve: 1.0 })
            };
            forceUpdate({});
        }
    }, [activeLocation, cameraFocusMode, feedControls?.isPlaying, feedControls?.hasManualSelection]);

    // Layers memoization
    const layers = useMemo(() => {
        // CRITICAL BUG FIX: Never render layers until GPU Device is ready
        // This prevents the "Cannot read properties of undefined (reading 'maxTextureDimension2D')" error
        if (!mounted || !isDeviceReady || !gpuDevice) return [];

        const activeModeColor = (COLOR_RANGES as any)[viewMode][1];

        return [
            // MVT Point Layer (Large Datasets)
            new MVTLayer({
                id: 'mvt-heatmap',
                data: `http://localhost:4000/api/tiles/{z}/{x}/{y}.mvt?v=${tileVersion}`, // Stable Cache Bust
                binary: false, // Force GeoJSON format for safe accessors
                pickable: true,
                onHover: (info: any) => setHoverInfo(info.object ? info : null),
                onClick: onPointClick,
                autoHighlight: false,
                renderSubLayers: (props: any) => {
                    return new ScatterplotLayer({
                        ...props,
                        getPosition: (d: any) => d.geometry.coordinates,
                        getFillColor: (d: any) => {
                            const weight = Number(d.properties.weight) || 1;
                            const intensity = Math.min(255, 150 + Math.log(weight) * 40);
                            return [...activeModeColor, intensity];
                        },
                        getRadius: (d: any) => {
                            const weight = Number(d.properties.weight) || 1;
                            return Math.min(60, 6 + Math.log2(weight) * 4); // Even larger for visibility
                        },
                        radiusMinPixels: 5,
                        radiusMaxPixels: 60,
                        pointRadiusUnits: 'pixels',
                        stroked: true,
                        lineWidthMinPixels: 1.5,
                        getLineColor: [255, 255, 255, 200] // Strong white halo
                    });
                },
                updateTriggers: {
                    getFillColor: [mapTheme, viewMode],
                    getRadius: [viewMode] // Trigger redraw if radius logic changes
                }
            } as any),

            // LIVE FEED RIPILES
            new ScatterplotLayer({
                id: 'ripple-layer',
                data: rippleState,
                getPosition: (d: Ripple) => d.coordinates,
                getRadius: (d: Ripple) => Math.min(1000000, (Date.now() - d.timestamp) * 500),
                getFillColor: (d: Ripple) => [247, 188, 74, Math.max(0, 255 * (1 - (Date.now() - d.timestamp) / 3000))] as [number, number, number, number],
                radiusMinPixels: 1,
                radiusMaxPixels: 100,
                stroked: true,
                lineWidthMinPixels: 2,
                getLineColor: (d: Ripple) => [...(mapTheme === 'dark' ? [255, 255, 255] : [22, 102, 158]), Math.max(0, 255 * (1 - (Date.now() - d.timestamp) / 3000))] as [number, number, number, number]
            }),

            // ACTIVE SELECTION HIGHLIGHT
            activeLocation ? new ScatterplotLayer({
                id: 'active-pin-highlight',
                data: [{ position: [activeLocation.lng, activeLocation.lat] }],
                getPosition: (d: any) => d.position,
                getRadius: 5000,
                radiusMinPixels: 10,
                radiusMaxPixels: 40,
                getFillColor: [247, 188, 74, 100],
                stroked: true,
                lineWidthMinPixels: 2,
                getLineColor: [255, 255, 255, 255]
            }) : null
        ].filter(Boolean);
    }, [viewMode, rippleState, mounted, onPointClick, isDeviceReady, gpuDevice, mapTheme, COLOR_RANGES, activeLocation, tileVersion]);

    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(() => setIsFullscreen(true));
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    useEffect(() => {
        const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFSChange);
        return () => document.removeEventListener('fullscreenchange', handleFSChange);
    }, []);

    // Fullscreen bar auto-hide logic
    useEffect(() => {
        if (isFullscreen) {
            setShowFullscreenBar(true);
            // Auto-hide after 3 seconds
            if (hideBarTimeoutRef.current) clearTimeout(hideBarTimeoutRef.current);
            hideBarTimeoutRef.current = setTimeout(() => {
                setShowFullscreenBar(false);
            }, 3000);
        } else {
            setShowFullscreenBar(false);
        }
        return () => {
            if (hideBarTimeoutRef.current) clearTimeout(hideBarTimeoutRef.current);
        };
    }, [isFullscreen, activeLocationDetails]);

    // Show bar on mouse movement in fullscreen
    const handleMouseMove = useCallback(() => {
        if (isFullscreen) {
            setShowFullscreenBar(true);
            if (hideBarTimeoutRef.current) clearTimeout(hideBarTimeoutRef.current);
            hideBarTimeoutRef.current = setTimeout(() => {
                setShowFullscreenBar(false);
            }, 3000);
        }
    }, [isFullscreen]);

    if (!mounted) return (
        <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center border border-white/5">
            <div className="w-12 h-12 border-4 border-udsm-gold border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full ${mapTheme === 'dark' ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'} rounded-2xl overflow-hidden group shadow-2xl border ${mapTheme === 'dark' ? 'border-white/5' : 'border-slate-200'} transition-all duration-700 font-sans`}
        >
            <DeckGL
                initialViewState={viewStateRef.current}
                onViewStateChange={onViewStateChange}
                controller={true}
                layers={isDeviceReady ? layers : []}
                onDeviceInitialized={onDeviceInitialized}
                getCursor={({ isHovering }) => (isHovering ? 'pointer' : 'grab')}
                onHover={handleMouseMove}
                parameters={{
                    blendColorOperation: 'add',
                    blendColorSrcFactor: 'src-alpha',
                    blendColorDstFactor: mapTheme === 'dark' ? 'one' : 'one-minus-src-alpha',
                    depthTest: false,
                } as any}
            >
                <Map
                    mapStyle={mapTheme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
                    mapLib={maplibregl}
                    reuseMaps
                >
                    <NavigationControl position="bottom-right" />
                </Map>
            </DeckGL>

            {/* HOVER TOOLTIP */}
            {(() => {
                // Smart Tooltip Blocking: Only hide tooltip if hovering the EXACT same point that's selected
                if (!hoverInfo) return null;

                if (localClickedInfo) {
                    const hoverCoords = hoverInfo.object?.geometry?.coordinates;
                    const selectedCoords = localClickedInfo.geometry?.coordinates;

                    // If both have coordinates, compare them
                    if (hoverCoords && selectedCoords) {
                        const isSamePoint =
                            Math.abs(hoverCoords[0] - selectedCoords[0]) < 0.0001 &&
                            Math.abs(hoverCoords[1] - selectedCoords[1]) < 0.0001;

                        // Don't show tooltip on the selected point (avoid redundancy)
                        if (isSamePoint) return null;
                    }
                }

                // Show tooltip for all other points
                return (
                    <MapTooltip
                        info={hoverInfo}
                        mapTheme={mapTheme}
                        viewMode={viewMode}
                    />
                );
            })()}

            {/* FULLSCREEN TOP BAR (Auto-hide) */}
            {isFullscreen && activeLocationDetails && (
                <div
                    className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${showFullscreenBar ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
                        }`}
                    onMouseEnter={() => {
                        setShowFullscreenBar(true);
                        if (hideBarTimeoutRef.current) clearTimeout(hideBarTimeoutRef.current);
                    }}
                    onMouseLeave={() => {
                        hideBarTimeoutRef.current = setTimeout(() => setShowFullscreenBar(false), 3000);
                    }}
                >
                    <div className={`backdrop-blur-xl rounded-xl shadow-2xl border px-6 py-4 max-w-[600px] ${mapTheme === 'dark'
                        ? 'bg-slate-900/80 border-white/10 text-white'
                        : 'bg-white/90 border-slate-200 text-slate-900'
                        }`}>
                        <div className="flex items-center gap-4">
                            {activeLocationDetails.country_code && (
                                <img
                                    src={`https://flagcdn.com/w40/${activeLocationDetails.country_code.toLowerCase()}.png`}
                                    alt={displayCountryName}
                                    className="w-8 h-auto rounded shadow-sm"
                                />
                            )}
                            <div className="flex-1">
                                <h3 className={`text-base font-black tracking-tight font-montserrat ${mapTheme === 'dark' ? 'text-white' : 'text-slate-900'
                                    }`}>
                                    {activeLocationDetails.city}, {displayCountryName}
                                </h3>
                            </div>
                            {activeLocationDetails.article && (
                                <p className={`text-sm font-medium italic font-noto-serif line-clamp-1 ${mapTheme === 'dark' ? 'text-white/70' : 'text-slate-600'
                                    }`}>
                                    "{activeLocationDetails.article}"
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MINIMAL CONTROLS OVERLAY - Positioned at top-right for cleanliness */}
            <div className="absolute top-4 right-4 z-50 flex gap-2 pointer-events-auto">
                {/* Feed Controls (Fullscreen Only) */}
                {isFullscreen && feedControls && (
                    <>
                        <button
                            onClick={feedControls.onPrev}
                            className={`p-2 backdrop-blur-md border rounded-lg transition-all shadow-sm ${mapTheme === 'dark' ? 'bg-black/40 border-white/10 text-white/60 hover:text-white' : 'bg-white/80 border-slate-200 text-slate-500 hover:text-slate-900'}`}
                            title="Previous"
                        >
                            <SkipBack size={14} />
                        </button>
                        <button
                            onClick={feedControls.onPlayPause}
                            className={`p-2 backdrop-blur-md border rounded-lg transition-all shadow-sm ${mapTheme === 'dark' ? 'bg-black/40 border-white/10 text-white/60 hover:text-white' : 'bg-white/80 border-slate-200 text-slate-500 hover:text-slate-900'}`}
                            title={feedControls.isPlaying ? 'Pause' : 'Play'}
                        >
                            {feedControls.isPlaying ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <button
                            onClick={feedControls.onNext}
                            className={`p-2 backdrop-blur-md border rounded-lg transition-all shadow-sm ${mapTheme === 'dark' ? 'bg-black/40 border-white/10 text-white/60 hover:text-white' : 'bg-white/80 border-slate-200 text-slate-500 hover:text-slate-900'}`}
                            title="Next"
                        >
                            <SkipForward size={14} />
                        </button>
                        {feedControls.hasManualSelection && (
                            <button
                                onClick={feedControls.onReset}
                                className={`p-2 backdrop-blur-md border rounded-lg transition-all shadow-sm ${mapTheme === 'dark' ? 'bg-black/40 border-white/10 text-red-400 hover:text-red-300' : 'bg-white/80 border-slate-200 text-red-400 hover:text-red-600'}`}
                                title="Reset to Live Feed"
                            >
                                <RefreshCw size={14} />
                            </button>
                        )}
                    </>
                )}
                <button
                    onClick={onToggleCameraFocus}
                    className={`p-2 backdrop-blur-md border rounded-lg transition-all shadow-sm ${cameraFocusMode
                        ? 'bg-udsm-gold border-udsm-gold text-udsm-blue shadow-[0_0_12px_rgba(247,188,74,0.4)]'
                        : (mapTheme === 'dark' ? 'bg-black/40 border-white/10 text-white/40 hover:text-white' : 'bg-white/80 border-slate-200 text-slate-400 hover:text-slate-900')
                        }`}
                    title={cameraFocusMode ? 'Disable Camera Focus' : 'Enable Camera Focus'}
                >
                    <Zap size={14} className={cameraFocusMode ? 'fill-current' : ''} />
                </button>
                <button
                    onClick={() => setMapTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                    className={`p-2 backdrop-blur-md border rounded-lg transition-all shadow-sm ${mapTheme === 'dark' ? 'bg-black/40 border-white/10 text-white/60 hover:text-white' : 'bg-white/80 border-slate-200 text-slate-500 hover:text-slate-900'}`}
                    title={mapTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                >
                    {mapTheme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                </button>
                <button
                    onClick={toggleFullscreen}
                    className={`p-2 backdrop-blur-md border rounded-lg transition-all shadow-sm ${mapTheme === 'dark' ? 'bg-black/40 border-white/10 text-white/60 hover:text-white' : 'bg-white/80 border-slate-200 text-slate-500 hover:text-slate-900'}`}
                >
                    {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
            </div>

            {/* MODE SWITCHER (Bottom-Left) */}
            <div className="absolute bottom-6 left-6 z-50 flex gap-1 pointer-events-auto bg-black/20 p-1 rounded-xl backdrop-blur-sm border border-white/5">
                <button
                    onClick={() => onModeChange('readership')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all text-[10px] font-black uppercase tracking-widest ${viewMode === 'readership' ? 'bg-udsm-gold text-udsm-blue shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                    Readership
                </button>
                <button
                    onClick={() => onModeChange('traffic')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all text-[10px] font-black uppercase tracking-widest ${viewMode === 'traffic' ? 'bg-cyan-500 text-slate-900 shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                    Traffic
                </button>
            </div>

            {
                isLoading && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
                        <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2 animation-pulse">
                            <div className="w-2 h-2 bg-udsm-gold rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest leading-none">Syncing Pulse...</span>
                        </div>
                    </div>
                )
            }

            <style jsx global>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animation-slide-up {
                    animation: slideUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
            `}</style>
        </div >
    );
}
