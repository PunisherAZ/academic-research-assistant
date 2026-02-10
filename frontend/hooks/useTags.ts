"use client";

import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Tag {
    id: string;
    name: string;
    color: string;
    created_at?: string;
}

const PRESET_COLORS = [
    "#3B82F6", // blue
    "#10B981", // green
    "#F59E0B", // amber
    "#EF4444", // red
    "#8B5CF6", // purple
    "#F97316", // orange
    "#EC4899", // pink
];

export function useTags() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch tags from database
    const fetchTags = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/tags`);
            setTags(response.data);
        } catch (error) {
            console.error("Error fetching tags:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const createTag = async (name: string, color?: string) => {
        try {
            const newTag: Partial<Tag> = {
                id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: name.trim(),
                color: color || PRESET_COLORS[tags.length % PRESET_COLORS.length],
            };

            const response = await axios.post(`${API_URL}/api/tags`, newTag);
            setTags((prev) => [...prev, response.data]);
            return response.data;
        } catch (error) {
            console.error("Error creating tag:", error);
            throw error;
        }
    };

    const deleteTag = async (tagId: string) => {
        try {
            await axios.delete(`${API_URL}/api/tags/${tagId}`);
            setTags((prev) => prev.filter((t) => t.id !== tagId));
        } catch (error) {
            console.error("Error deleting tag:", error);
            throw error;
        }
    };

    const addTagToPaper = async (paperId: string, tagId: string) => {
        try {
            await axios.post(`${API_URL}/api/papers/${paperId}/tags/${tagId}`);
        } catch (error) {
            console.error("Error adding tag to paper:", error);
            throw error;
        }
    };

    const removeTagFromPaper = async (paperId: string, tagId: string) => {
        try {
            await axios.delete(`${API_URL}/api/papers/${paperId}/tags/${tagId}`);
        } catch (error) {
            console.error("Error removing tag from paper:", error);
            throw error;
        }
    };

    // Get tags for a specific paper (from paper object)
    const getTagsForPaper = (paper: any): Tag[] => {
        if (!paper.tags) return [];
        return paper.tags;
    };

    // Get paper IDs that have a specific tag (requires fetching papers)
    const getPapersWithTag = async (tagId: string): Promise<string[]> => {
        try {
            const response = await axios.get(`${API_URL}/api/papers`);
            const papers = response.data;
            return papers
                .filter((paper: any) =>
                    paper.tags && paper.tags.some((t: Tag) => t.id === tagId)
                )
                .map((paper: any) => paper.id);
        } catch (error) {
            console.error("Error getting papers with tag:", error);
            return [];
        }
    };

    return {
        tags,
        createTag,
        deleteTag,
        addTagToPaper,
        removeTagFromPaper,
        getTagsForPaper,
        getPapersWithTag,
        presetColors: PRESET_COLORS,
        loading,
        refresh: fetchTags,
    };
}
