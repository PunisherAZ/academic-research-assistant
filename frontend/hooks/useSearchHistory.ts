"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "ara_search_history";
const MAX_HISTORY = 10;

export function useSearchHistory() {
    const [history, setHistory] = useState<string[]>([]);

    // Load from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch (e) {
                console.error("Error loading search history:", e);
            }
        }
    }, []);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }, [history]);

    const addToHistory = (query: string) => {
        if (!query.trim()) return;

        setHistory((prev) => {
            // Remove duplicates
            const filtered = prev.filter((q) => q !== query);
            // Add to front, limit to MAX_HISTORY
            return [query, ...filtered].slice(0, MAX_HISTORY);
        });
    };

    const removeFromHistory = (query: string) => {
        setHistory((prev) => prev.filter((q) => q !== query));
    };

    const clearHistory = () => {
        setHistory([]);
    };

    return {
        history,
        addToHistory,
        removeFromHistory,
        clearHistory,
    };
}
