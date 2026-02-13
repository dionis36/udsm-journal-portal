"use client";

import { useEffect, useRef } from 'react';
import useSWR from 'swr';

const API_BASE = 'http://localhost:3001/api';

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

export function useHeatmap(journalId?: number) {
    const url = journalId
        ? `${API_BASE}/metrics/heatmap?journal_id=${journalId}`
        : `${API_BASE}/metrics/heatmap`;

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
    const WS_URL = 'ws://localhost:3001/api/activity/pulse';
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        const connect = () => {
            ws.current = new WebSocket(WS_URL);

            ws.current.onmessage = (e: MessageEvent) => {
                try {
                    const data = JSON.parse(e.data);
                    if (data.type === 'READERSHIP_HIT') {
                        onEvent(data.payload);
                    }
                } catch (err) {
                    console.error('WS Parse Error:', err);
                }
            };

            ws.current.onclose = () => {
                setTimeout(connect, 5000); // Reconnect after 5s
            };
        };

        connect();
        return () => ws.current?.close();
    }, [onEvent]);

    return ws.current;
}
