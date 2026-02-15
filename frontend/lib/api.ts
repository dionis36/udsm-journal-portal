"use client";

import { useEffect, useRef } from 'react';
import useSWR from 'swr';

const API_BASE = 'http://localhost:4000/api';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useJournal(path: string) {
    const { data, error, isLoading } = useSWR(`${API_BASE}/journals/${path}`, fetcher);
    return {
        journal: data,
        isLoading,
        isError: error
    };
}

export function useJournals() {
    const { data, error, isLoading } = useSWR(`${API_BASE}/journals`, fetcher);
    return {
        journals: data,
        isLoading,
        isError: error
    };
}

export function useCurrentIssue(path: string, page: number = 1, limit: number = 10) {
    const { data, error, isLoading } = useSWR(`${API_BASE}/journals/${path}/issues/current?page=${page}&limit=${limit}`, fetcher);
    return {
        data,
        isLoading,
        isError: error
    };
}

export function useArticle(id: string) {
    const { data, error, isLoading } = useSWR(`${API_BASE}/articles/${id}`, fetcher);
    return {
        data,
        isLoading,
        isError: error
    };
}

export function useHeatmap(journalId?: number, scope: 'readership' | 'traffic' = 'readership') {
    let url = `${API_BASE}/metrics/heatmap?scope=${scope}`;
    if (journalId) url += `&journal_id=${journalId}`;

    const { data, error, isLoading } = useSWR(url, fetcher, {
        refreshInterval: 30000 // Refresh every 30 seconds
    });
    return {
        data,
        isLoading,
        isError: error
    };
}

export function usePulse(onEvent: (event: any) => void) {
    const WS_URL = 'ws://localhost:4000/api/activity/pulse';
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        let isMounted = true;

        const connect = () => {
            if (!isMounted) return;

            // Avoid overlapping connections
            if (ws.current) {
                if (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING) {
                    return;
                }
            }

            try {
                console.log(`[Pulse] Connecting to ${WS_URL}...`);
                ws.current = new WebSocket(WS_URL);

                ws.current.onopen = () => {
                    if (isMounted) console.log('[Pulse] Connection established.');
                };

                ws.current.onmessage = (e: MessageEvent) => {
                    if (!isMounted) return;
                    try {
                        const data = JSON.parse(e.data);
                        if (data.type === 'READERSHIP_HIT') {
                            onEvent(data.payload);
                        }
                    } catch (err) {
                        console.error('[Pulse] Parse Error:', err);
                    }
                };

                ws.current.onclose = (event) => {
                    if (isMounted) {
                        console.warn(`[Pulse] Connection closed (${event.code}). Reconnecting in 5s...`);
                        reconnectTimer.current = setTimeout(connect, 5000);
                    }
                };

                ws.current.onerror = (err) => {
                    // Log the full event for diagnostics
                    console.error('[Pulse] Connection Error details:', {
                        timestamp: new Date().toISOString(),
                        url: WS_URL,
                        readyState: ws.current?.readyState
                    });
                    ws.current?.close();
                };
            } catch (err) {
                console.error('[Pulse] Critical Setup Error:', err);
                if (isMounted) {
                    reconnectTimer.current = setTimeout(connect, 5000);
                }
            }
        };

        connect();

        return () => {
            isMounted = false;
            console.log('[Pulse] Cleaning up connection...');
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            if (ws.current) {
                ws.current.onclose = null;
                ws.current.onerror = null;
                ws.current.onopen = null;
                ws.current.close();
            }
        };
    }, [onEvent]);

    return undefined; // We don't need to return the socket for current use cases
}

export function useActivityFeed() {
    // Use random mode to prevent looping on same 10 items
    const { data, error, isLoading, mutate } = useSWR(`${API_BASE}/activity/feed?mode=random`, fetcher, {
        refreshInterval: 15000, // Refresh every 15 seconds (slower rotation)
        revalidateOnFocus: false, // Don't revalidate on window focus to avoid jarring jumps
    });
    return {
        events: data || [],
        isLoading,
        isError: error,
        mutate
    };
}
