"use client";

import { useState } from "react";
import { X, Search } from "lucide-react";

interface AdvancedSearchModalProps {
    onClose: () => void;
    onSearch: (query: AdvancedQuery) => void;
}

export interface AdvancedQuery {
    keywords?: string;
    author?: string;
    journal?: string;
    yearFrom?: number;
    yearTo?: number;
}

export default function AdvancedSearchModal({ onClose, onSearch }: AdvancedSearchModalProps) {
    const currentYear = new Date().getFullYear();
    const [keywords, setKeywords] = useState("");
    const [author, setAuthor] = useState("");
    const [journal, setJournal] = useState("");
    const [yearFrom, setYearFrom] = useState<number>(1980);
    const [yearTo, setYearTo] = useState<number>(currentYear);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        const query: AdvancedQuery = {};
        if (keywords.trim()) query.keywords = keywords.trim();
        if (author.trim()) query.author = author.trim();
        if (journal.trim()) query.journal = journal.trim();
        if (yearFrom) query.yearFrom = yearFrom;
        if (yearTo) query.yearTo = yearTo;

        onSearch(query);
        onClose();
    };

    const handleReset = () => {
        setKeywords("");
        setAuthor("");
        setJournal("");
        setYearFrom(1980);
        setYearTo(currentYear);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-2xl font-bold text-foreground">Advanced Search</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSearch} className="p-6 space-y-5">
                    {/* Keywords */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Keywords
                        </label>
                        <input
                            type="text"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            placeholder="e.g., trauma therapy, CBT"
                            className="w-full px-4 py-3 rounded-lg border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 bg-background"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Search across titles and abstracts
                        </p>
                    </div>

                    {/* Author */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Author Name
                        </label>
                        <input
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="e.g., Smith, J."
                            className="w-full px-4 py-3 rounded-lg border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 bg-background"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Search for papers by specific author
                        </p>
                    </div>

                    {/* Journal */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Journal Name
                        </label>
                        <input
                            type="text"
                            value={journal}
                            onChange={(e) => setJournal(e.target.value)}
                            placeholder="e.g., Journal of Clinical Psychology"
                            className="w-full px-4 py-3 rounded-lg border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 bg-background"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Limit results to specific journal
                        </p>
                    </div>

                    {/* Year Range */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Publication Year Range
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                min="1900"
                                max={currentYear}
                                value={yearFrom}
                                onChange={(e) => setYearFrom(parseInt(e.target.value) || 1980)}
                                className="w-32 px-4 py-3 rounded-lg border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 bg-background"
                            />
                            <span className="text-muted-foreground">to</span>
                            <input
                                type="number"
                                min={yearFrom}
                                max={currentYear}
                                value={yearTo}
                                onChange={(e) => setYearTo(parseInt(e.target.value) || currentYear)}
                                className="w-32 px-4 py-3 rounded-lg border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 bg-background"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4">
                        <button
                            type="submit"
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                        >
                            <Search size={20} />
                            Search
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-6 py-3 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
