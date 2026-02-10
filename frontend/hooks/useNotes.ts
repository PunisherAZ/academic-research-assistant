"use client";

import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface PaperNote {
    paper_id: string;
    content: string;
    updated_at: string;
}

export function useNotes() {
    const [notes, setNotes] = useState<Map<string, PaperNote>>(new Map());
    const [loading, setLoading] = useState(false);

    const getNote = async (paperId: string): Promise<PaperNote | null> => {
        try {
            const response = await axios.get(`${API_URL}/api/notes/${paperId}`);
            const note = response.data;

            if (note && note.content) {
                setNotes((prev) => new Map(prev).set(paperId, note));
                return note;
            }
            return null;
        } catch (error) {
            console.error("Error fetching note:", error);
            return null;
        }
    };

    const saveNote = async (paperId: string, content: string) => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/notes/${paperId}`, {
                content
            });

            const note = response.data;
            setNotes((prev) => new Map(prev).set(paperId, note));
            return note;
        } catch (error) {
            console.error("Error saving note:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const deleteNote = async (paperId: string) => {
        try {
            await axios.delete(`${API_URL}/api/notes/${paperId}`);
            setNotes((prev) => {
                const newMap = new Map(prev);
                newMap.delete(paperId);
                return newMap;
            });
        } catch (error) {
            console.error("Error deleting note:", error);
            throw error;
        }
    };

    const hasNote = (paperId: string): boolean => {
        const note = notes.get(paperId);
        return !!(note && note.content);
    };

    return {
        getNote,
        saveNote,
        deleteNote,
        hasNote,
        loading,
        notes,
    };
}
