"use client";

import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "";

export interface SavedPaper {
    id: string;
    title: string;
    authors: string[];
    year: number;
    abstract?: string;
    url: string;
    journal?: string;
    volume?: string;
    issue?: string;
    pages?: string;
    pdf_path?: string;  // NEW: path to uploaded PDF
    created_at?: string;
}

export function useSavedPapers() {
    const [savedPapers, setSavedPapers] = useState<SavedPaper[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch papers from database on mount
    const fetchPapers = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/papers`);
            setSavedPapers(response.data);
        } catch (error) {
            console.error("Error fetching papers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPapers();
    }, []);

    const savePaper = async (paper: any) => {
        try {
            const savedPaper: SavedPaper = {
                id: paper.id,
                title: paper.title,
                authors: paper.authors || [],
                year: paper.year,
                abstract: paper.abstract,
                url: paper.url,
                journal: paper.journal,
                volume: paper.volume,
                issue: paper.issue,
                pages: paper.pages,
            };

            await axios.post(`${API_URL}/api/papers`, savedPaper);
            await fetchPapers(); // Refresh list
        } catch (error) {
            console.error("Error saving paper:", error);
            throw error;
        }
    };

    const unsavePaper = async (paperId: string) => {
        try {
            await axios.delete(`${API_URL}/api/papers/${paperId}`);
            setSavedPapers((prev) => prev.filter((p) => p.id !== paperId));
        } catch (error) {
            console.error("Error unsaving paper:", error);
            throw error;
        }
    };

    const isSaved = (paperId: string) => {
        return savedPapers.some((p) => p.id === paperId);
    };

    const clearAll = async () => {
        try {
            // Delete all papers one by one
            await Promise.all(
                savedPapers.map((paper) => axios.delete(`${API_URL}/api/papers/${paper.id}`))
            );
            setSavedPapers([]);
        } catch (error) {
            console.error("Error clearing papers:", error);
            throw error;
        }
    };

    return {
        savedPapers,
        savePaper,
        unsavePaper,
        isSaved,
        clearAll,
        count: savedPapers.length,
        loading,
        refresh: fetchPapers,  // NEW: manual refresh
    };
}
