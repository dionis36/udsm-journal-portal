"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import Map, { NavigationControl } from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import { MVTLayer } from '@deck.gl/geo-layers';
import { FlyToInterpolator } from '@deck.gl/core';
import { Maximize2, Minimize2, Activity, Globe, Zap, MousePointer2, MapPin, X, Sun, Moon } from 'lucide-react';
import { usePulse } from '../lib/api';
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
}

interface Ripple {
    id: string;
    coordinates: [number, number];
    timestamp: number;
}

const INITIAL_VIEW_STATE = {
    longitude: 34.8,
    latitude: -6.3,
    zoom: 3,
    pitch: 0,
    bearing: 0,
    transitionDuration: 0
};

const DARK_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const LIGHT_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export function HeatmapView({ data, isLoading, viewMode, onModeChange }: HeatmapViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('dark');
    const [viewState, setViewState] = useState<any>(INITIAL_VIEW_STATE);
    const [hoverInfo, setHoverInfo] = useState<any>(null);
    const [clickedInfo, setClickedInfo] = useState<any>(null);
    const [locationEvents, setLocationEvents] = useState<any[]>([]);
    const [isEventLoading, setIsEventLoading] = useState(false);
    const [isStable, setIsStable] = useState(false);
    const [glContext, setGlContext] = useState<WebGLRenderingContext | WebGL2RenderingContext | null>(null);

    useEffect(() => {
        setMounted(true);
        // Delay stability to allow context to provision
        const timer = setTimeout(() => setIsStable(true), 1000);
        return () => clearTimeout(timer);
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

    const fetchLocationEvents = useCallback(async (info: any) => {
        setIsEventLoading(true);
        try {
            const { lng, lat } = info.geometry.coordinates;
            // Removed city/country fallback to ensure high-precision coordinate matching
            const res = await fetch(`http://localhost:3001/api/metrics/location-events?lng=${lng}&lat=${lat}`);
            const data = await res.json();
            setLocationEvents(data);
        } catch (err) {
            console.error('Failed to fetch events:', err);
        } finally {
            setIsEventLoading(false);
        }
    }, []);

    const onPointClick = useCallback((info: any) => {
        if (info.object) {
            setClickedInfo(info.object);
            fetchLocationEvents(info.object);
            setViewState((prev: any) => ({
                ...prev,
                longitude: info.object.geometry.coordinates[0],
                latitude: info.object.geometry.coordinates[1],
                zoom: 8,
                transitionDuration: 2000,
                transitionInterpolator: new FlyToInterpolator()
            }));
        } else {
            setClickedInfo(null);
            setLocationEvents([]);
        }
    }, [fetchLocationEvents]);

    const onMapLoad = useCallback((event: any) => {
        const gl = event.target.getCanvas().getContext('webgl2') || event.target.getCanvas().getContext('webgl');
        if (gl) {
            console.log('[Heatmap] WebGL Context Captured');
            setGlContext(gl);
        }
    }, []);

    const COLOR_RANGES = useMemo(() => {
        if (mapTheme === 'dark') {
            return {
                readership: [[1, 22, 39], [0, 102, 204], [102, 178, 255], [255, 204, 0], [255, 255, 102], [255, 255, 255]],
                traffic: [[1, 22, 39], [0, 204, 204], [102, 255, 255], [0, 255, 153], [153, 255, 204], [255, 255, 255]]
            };
        }
        // High contrast for Light Theme (No white hits)
        return {
            readership: [[214, 219, 223], [174, 182, 191], [22, 102, 158], [11, 82, 131], [2, 62, 101]],
            traffic: [[212, 239, 252], [129, 212, 250], [1, 135, 204], [1, 87, 155], [1, 71, 128]]
        };
    }, [mapTheme]);

    const layers = useMemo(() => {
        if (!mounted || !isStable) return [];

        // Intensity decay: 3.0 at zoom 3, down to ~0.5 at zoom 8
        const dynamicIntensity = Math.max(0.4, 3 * Math.pow(0.75, Math.max(0, viewState.zoom - 3)));

        // Radius scale: 60/80 at zoom 3, down to ~12/16 at zoom 8
        const dynamicRadius = Math.max(10, (isFullscreen ? 80 : 60) * Math.pow(0.7, Math.max(0, viewState.zoom - 3)));

        return [
            new HeatmapLayer({
                id: 'heatmap-layer-' + viewMode,
                data: data?.features || [],
                getPosition: (d: any) => d.geometry.coordinates,
                getWeight: (d: any) => d.properties.weight || 1,
                radiusPixels: dynamicRadius,
                intensity: dynamicIntensity,
                threshold: 0.05,
                colorRange: (COLOR_RANGES as any)[viewMode],
                updateTriggers: {
                    colorRange: [viewMode, mapTheme],
                    radiusPixels: [viewState.zoom, isFullscreen],
                    intensity: [viewState.zoom]
                }
            }),
            new MVTLayer({
                id: 'mvt-layer',
                data: 'http://localhost:3001/api/tiles/{z}/{x}/{y}.mvt',
                getFillColor: [22, 102, 158, mapTheme === 'dark' ? 15 : 30], // UDSM Blue
                getLineColor: mapTheme === 'dark' ? [255, 255, 255, 10] : [0, 0, 0, 10],
                lineWidthMinPixels: 0.5,
                loadOptions: {
                    mvt: {
                        shape: 'geojson'
                    }
                },
                updateTriggers: {
                    getFillColor: [mapTheme],
                    getLineColor: [mapTheme]
                }
            } as any),
            new ScatterplotLayer({
                id: 'interaction-layer',
                data: data?.features || [],
                getPosition: (d: any) => d.geometry.coordinates,
                getRadius: (d: any) => 30000,
                getFillColor: [255, 255, 255, 0],
                pickable: true,
                radiusMinPixels: 10,
                radiusMaxPixels: 40,
                onHover: (info: any) => setHoverInfo(info.object ? info : null),
                onClick: onPointClick
            }),
            new ScatterplotLayer({
                id: 'ripple-layer',
                data: ripples,
                getPosition: (d: Ripple) => d.coordinates,
                getRadius: (d: Ripple) => Math.min(1000000, (Date.now() - d.timestamp) * 500),
                getFillColor: (d: Ripple) => [247, 188, 74, Math.max(0, 255 * (1 - (Date.now() - d.timestamp) / 3000))] as [number, number, number, number],
                radiusMinPixels: 1,
                radiusMaxPixels: 100,
                stroked: true,
                lineWidthMinPixels: 2,
                getLineColor: (d: Ripple) => [...(mapTheme === 'dark' ? [255, 255, 255] : [22, 102, 158]), Math.max(0, 255 * (1 - (Date.now() - d.timestamp) / 3000))] as [number, number, number, number]
            })
        ];
    }, [viewMode, isFullscreen, ripples, mounted, data, onPointClick, isStable, viewState.zoom, mapTheme]);

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
                viewState={viewState}
                onViewStateChange={({ viewState }) => setViewState(viewState)}
                controller={true}
                layers={layers}
                getCursor={({ isHovering }) => (isHovering ? 'pointer' : 'grab')}
                onClick={(info) => {
                    if (!info.object) {
                        setClickedInfo(null);
                        setLocationEvents([]);
                    }
                }}
                parameters={{
                    blendColorOperation: 'add',
                    blendColorSrcFactor: 'src-alpha',
                    blendColorDstFactor: 'one',
                    depthTest: false,
                } as any}
            >
                <Map
                    mapStyle={mapTheme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
                    mapLib={maplibregl}
                    onLoad={onMapLoad}
                    reuseMaps
                >
                    <NavigationControl position="bottom-right" />
                </Map>
            </DeckGL>

            {/* HOVER TOOLTIP */}
            {hoverInfo && !clickedInfo && (
                <div
                    className="absolute z-50 pointer-events-none bg-black/80 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl flex flex-col gap-1 min-w-[140px]"
                    style={{ left: hoverInfo.x + 15, top: hoverInfo.y - 40 }}
                >
                    <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-udsm-gold" />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${mapTheme === 'dark' ? 'text-white/40' : 'text-slate-400'} font-montserrat`}>Location Details</span>
                    </div>
                    <div className={`text-sm font-bold tracking-tight flex items-center gap-2 ${mapTheme === 'dark' ? 'text-white' : 'text-slate-900'} font-noto-serif`}>
                        {hoverInfo.object.properties.country_code && (
                            <img
                                src={`https://flagcdn.com/w20/${hoverInfo.object.properties.country_code.toLowerCase()}.png`}
                                alt=""
                                className="w-4 h-3 rounded-sm"
                            />
                        )}
                        {hoverInfo.object.properties.city || 'Regional Center'}, {hoverInfo.object.properties.country}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-black text-udsm-gold bg-udsm-gold/10 px-1.5 py-0.5 rounded border border-udsm-gold/20 uppercase">
                            {hoverInfo.object.properties.weight} {viewMode === 'readership' ? 'Reads' : 'Visits'}
                        </span>
                    </div>
                </div>
            )}

            {/* MINIMAL CONTROLS OVERLAY - Positioned at top-right for cleanliness */}
            <div className="absolute top-4 right-4 z-50 flex gap-2 pointer-events-auto">
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

            {isLoading && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2 animation-pulse">
                        <div className="w-2 h-2 bg-udsm-gold rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest leading-none">Syncing Pulse...</span>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animation-slide-up {
                    animation: slideUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
            `}</style>
        </div>
    );
}
