"use client";

import { useState } from "react";
import axios from "axios";
import { Search, BookOpen, Quote, Loader2, AlertCircle, FileSearch, Bookmark, BookmarkCheck, ChevronDown, Sparkles } from "lucide-react";
import { useSavedPapers } from "../hooks/useSavedPapers";
import { useSearchHistory } from "../hooks/useSearchHistory";
import { useTags } from "../hooks/useTags";
import { useNotes } from "../hooks/useNotes";
import SavedPapersPanel from "../components/SavedPapersPanel";
import SearchFilters, { type FilterState } from "../components/SearchFilters";
import SearchHistory from "../components/SearchHistory";
import AdvancedSearchModal, { type AdvancedQuery } from "../components/AdvancedSearchModal";

export default function Home() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [filteredResults, setFilteredResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "success" | "error" }>>([]);
    const [showSavedPanel, setShowSavedPanel] = useState(false);
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [openCiteDropdown, setOpenCiteDropdown] = useState<string | null>(null);

    const { savedPapers, savePaper, unsavePaper, isSaved, clearAll, count, refresh } = useSavedPapers();
    const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();
    const { tags, createTag, deleteTag, addTagToPaper, removeTagFromPaper, getTagsForPaper, getPapersWithTag, presetColors } = useTags();
    const { getNote, saveNote, deleteNote, hasNote } = useNotes();

    const showToast = (message: string, type: "success" | "error" = "success") => {
        const id = Math.random().toString(36).substring(7);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const handleSearch = async (e?: React.FormEvent, searchQuery?: string) => {
        if (e) e.preventDefault();
        const queryToSearch = searchQuery || query;
        if (!queryToSearch.trim()) return;

        setLoading(true);
        setError(null);
        addToHistory(queryToSearch);

        try {
            const res = await axios.post(`${API_URL}/search/openalex`, { query: queryToSearch });
            setResults(res.data);
            setFilteredResults(res.data);
            if (res.data.length === 0) {
                setError("no-results");
            }
        } catch (err) {
            console.error("Search failed:", err);
            setError("network");
            showToast("Unable to connect to the server. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAdvancedSearch = async (advancedQuery: AdvancedQuery) => {
        setLoading(true);
        setError(null);

        // Build query string from advanced criteria
        let searchQuery = advancedQuery.keywords || "";

        // Add to history and set query input
        if (searchQuery) {
            setQuery(searchQuery);
            addToHistory(searchQuery);
        }

        try {
            // For now, we'll just use the keywords field for the search
            // In a more advanced implementation, we would pass all fields to the backend
            const res = await axios.post(`${API_URL}/search/openalex`, {
                query: searchQuery || "research"
            });

            // Apply client-side filtering for other criteria
            let filtered = res.data;

            if (advancedQuery.author) {
                filtered = filtered.filter((p: any) =>
                    p.authors.some((a: string) =>
                        a.toLowerCase().includes(advancedQuery.author!.toLowerCase())
                    )
                );
            }

            if (advancedQuery.journal) {
                filtered = filtered.filter((p: any) =>
                    p.journal?.toLowerCase().includes(advancedQuery.journal!.toLowerCase())
                );
            }

            if (advancedQuery.yearFrom) {
                filtered = filtered.filter((p: any) => p.year >= advancedQuery.yearFrom!);
            }

            if (advancedQuery.yearTo) {
                filtered = filtered.filter((p: any) => p.year <= advancedQuery.yearTo!);
            }

            setResults(filtered);
            setFilteredResults(filtered);

            if (filtered.length === 0) {
                setError("no-results");
            }
        } catch (err) {
            console.error("Advanced search failed:", err);
            setError("network");
            setResults([]);
            setFilteredResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCite = async (paper: any, format: "apa" | "mla" | "chicago" = "apa") => {
        const formatMap = {
            apa: { endpoint: "/cite/apa", name: "APA 7th" },
            mla: { endpoint: "/cite/mla", name: "MLA 9th" },
            chicago: { endpoint: "/cite/chicago", name: "Chicago 17th" }
        };

        try {
            const res = await axios.post(`${API_URL}${formatMap[format].endpoint}`, paper);
            await navigator.clipboard.writeText(res.data);
            showToast(`${formatMap[format].name} citation copied!`, "success");
            setOpenCiteDropdown(null);
        } catch (error) {
            console.error("Citation failed:", error);
            showToast("Failed to copy citation. Please try again.", "error");
        }
    };

    const applyFilters = (filters: FilterState) => {
        let filtered = [...results];

        // Year filter
        filtered = filtered.filter(p => p.year >= filters.yearMin && p.year <= filters.yearMax);

        // Sort
        if (filters.sortBy === "date-desc") {
            filtered.sort((a, b) => b.year - a.year);
        } else if (filters.sortBy === "date-asc") {
            filtered.sort((a, b) => a.year - b.year);
        }

        setFilteredResults(filtered);
    };

    const formatAuthors = (authors: string[]) => {
        if (!authors || authors.length === 0) return "Unknown Authors";
        if (authors.length === 1) return authors[0];
        if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
        if (authors.length === 3) return `${authors[0]}, ${authors[1]}, & ${authors[2]}`;
        return `${authors[0]}, ${authors[1]}, ${authors[2]}, et al.`;
    };

    return (
        <main className="flex min-h-screen flex-col items-center px-4 py-12 md:p-24 max-w-6xl mx-auto">
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-slide-in ${toast.type === "success"
                            ? "bg-green-50 border-green-200 text-green-800"
                            : "bg-red-50 border-red-200 text-red-800"
                            }`}
                    >
                        <p className="text-sm font-medium">{toast.message}</p>
                    </div>
                ))}
            </div>

            {/* Saved Papers Panel */}
            {showSavedPanel && (
                <SavedPapersPanel
                    savedPapers={savedPapers}
                    onClose={() => setShowSavedPanel(false)}
                    onUnsave={unsavePaper}
                    onClearAll={clearAll}
                    onCite={handleCite}
                    tags={tags}
                    onCreateTag={createTag}
                    onDeleteTag={deleteTag}
                    onAddTagToPaper={addTagToPaper}
                    onRemoveTagFromPaper={removeTagFromPaper}
                    getTagsForPaper={getTagsForPaper}
                    getPapersWithTag={getPapersWithTag}
                    getNote={getNote}
                    saveNote={saveNote}
                    hasNote={hasNote}
                    presetColors={presetColors}
                    refreshPapers={refresh}
                />
            )}

            {/* Advanced Search Modal */}
            {showAdvancedSearch && (
                <AdvancedSearchModal
                    onClose={() => setShowAdvancedSearch(false)}
                    onSearch={handleAdvancedSearch}
                />
            )}

            {/* Header */}
            <div className="w-full mb-12 flex items-center justify-between">
                <div className="flex items-center gap-3 text-foreground/80">
                    <BookOpen className="text-primary" size={24} />
                    <span className="font-sans text-sm tracking-wide uppercase">The Counselor's Office</span>
                </div>
                {count > 0 && (
                    <button
                        onClick={() => setShowSavedPanel(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                    >
                        <BookmarkCheck size={18} />
                        <span className="text-sm font-medium">{count} Saved</span>
                    </button>
                )}
            </div>

            {/* Hero Section */}
            <div className="relative flex flex-col items-center text-center mb-16 w-full">
                <h1 className="text-5xl md:text-6xl font-bold text-primary mb-6 tracking-tight">
                    Academic Pursuit
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl mb-12 max-w-2xl leading-relaxed font-sans">
                    Search reputable sources. Synthesize with depth. Cite with precision.
                </p>

                {/* Search Bar */}
                <div className="w-full max-w-2xl mb-2">
                    <form onSubmit={handleSearch} className="w-full relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search topic (e.g. 'Trauma-informed CBT')..."
                            className="w-full px-8 py-5 rounded-2xl border-2 border-input focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 shadow-sm hover:shadow-md transition-all text-base md:text-lg font-sans bg-card placeholder:text-muted-foreground/60"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    <span className="hidden sm:inline">Searching...</span>
                                </>
                            ) : (
                                <>
                                    <Search size={20} />
                                    <span className="hidden sm:inline">Search</span>
                                </>
                            )}
                        </button>
                    </form>
                    {/* Advanced Search Link */}
                    <button
                        onClick={() => setShowAdvancedSearch(true)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mt-3 mx-auto"
                    >
                        <Sparkles size={16} />
                        Advanced Search
                    </button>
                </div>

                {/* Search History */}
                {history.length > 0 && !loading && results.length === 0 && (
                    <SearchHistory
                        history={history}
                        onSelect={(q) => {
                            setQuery(q);
                            handleSearch(undefined, q);
                        }}
                        onRemove={removeFromHistory}
                        onClear={clearHistory}
                    />
                )}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="mt-8 text-primary/80 font-sans text-lg flex items-center gap-3">
                    <Loader2 className="animate-spin" size={24} />
                    Searching academic databases...
                </div>
            )}

            {/* Error States */}
            {error === "network" && !loading && (
                <div className="mt-8 w-full max-w-2xl">
                    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
                        <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
                        <h3 className="text-xl font-semibold text-red-900 mb-2">Connection Issue</h3>
                        <p className="text-red-700 mb-4">
                            We're having trouble connecting to the server. Please check your connection and try again.
                        </p>
                        <button
                            onClick={() => setError(null)}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {error === "no-results" && !loading && (
                <div className="mt-8 w-full max-w-2xl">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8 text-center">
                        <FileSearch className="mx-auto mb-4 text-blue-600" size={48} />
                        <h3 className="text-xl font-semibold text-blue-900 mb-2">No Papers Found</h3>
                        <p className="text-blue-700">
                            Try using broader keywords, checking spelling, or exploring related topics.
                        </p>
                    </div>
                </div>
            )}

            {/* Results Section */}
            {!loading && filteredResults.length > 0 && (
                <>
                    {/* Results Count & Filters */}
                    <div className="w-full mb-4 flex items-center justify-between">
                        <p className="text-muted-foreground font-sans">
                            Found <span className="font-semibold text-foreground">{filteredResults.length}</span> {filteredResults.length === 1 ? 'paper' : 'papers'}
                        </p>
                        <SearchFilters onFilterChange={applyFilters} />
                    </div>

                    {/* Results Grid */}
                    <div className="w-full grid gap-6">
                        {filteredResults.map((paper) => (
                            <div
                                key={paper.id}
                                className="group rounded-2xl border border-border bg-card px-6 py-6 md:px-8 md:py-7 transition-all hover:border-primary/30 hover:shadow-lg hover:scale-[1.01]"
                            >
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <h2 className="flex-1 text-xl md:text-2xl font-semibold text-secondary leading-snug">
                                        {paper.title}
                                        <span className="inline-block ml-3 text-sm font-medium text-muted-foreground bg-accent px-3 py-1 rounded-full">
                                            {paper.year}
                                        </span>
                                    </h2>
                                    <button
                                        onClick={() => isSaved(paper.id) ? unsavePaper(paper.id) : savePaper(paper)}
                                        className={`p-2 rounded-lg transition-colors ${isSaved(paper.id)
                                            ? "text-primary bg-primary/10 hover:bg-primary/20"
                                            : "text-muted-foreground hover:text-primary hover:bg-muted"
                                            }`}
                                        title={isSaved(paper.id) ? "Remove from saved" : "Save paper"}
                                    >
                                        {isSaved(paper.id) ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                                    </button>
                                </div>

                                {/* Authors */}
                                <p className="text-sm text-foreground/60 mb-1 font-sans">
                                    {formatAuthors(paper.authors)}
                                </p>

                                {/* Journal Info */}
                                {paper.journal && (
                                    <p className="text-sm text-foreground/50 mb-4 font-sans italic">
                                        {paper.journal}
                                        {paper.volume && ` • Vol. ${paper.volume}`}
                                        {paper.issue && `(${paper.issue})`}
                                    </p>
                                )}

                                <p className="mb-5 text-sm md:text-base text-foreground/70 font-sans leading-relaxed line-clamp-3">
                                    {paper.abstract || "No abstract available."}
                                </p>

                                <div className="flex flex-wrap gap-4">
                                    {/* Citation Dropdown */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenCiteDropdown(openCiteDropdown === paper.id ? null : paper.id)}
                                            className="text-sm flex items-center gap-2 text-primary hover:text-primary/80 font-sans font-medium transition-colors px-4 py-2 rounded-lg hover:bg-primary/5"
                                        >
                                            <Quote size={16} /> Cite <ChevronDown size={14} />
                                        </button>
                                        {openCiteDropdown === paper.id && (
                                            <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg py-1 z-10 min-w-[150px]">
                                                <button
                                                    onClick={() => handleCite(paper, "apa")}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                                                >
                                                    APA 7th
                                                </button>
                                                <button
                                                    onClick={() => handleCite(paper, "mla")}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                                                >
                                                    MLA 9th
                                                </button>
                                                <button
                                                    onClick={() => handleCite(paper, "chicago")}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                                                >
                                                    Chicago 17th
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <a
                                        href={paper.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-sans px-4 py-2 rounded-lg hover:bg-muted"
                                    >
                                        View Source ↗
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Welcome State */}
            {!loading && results.length === 0 && !error && (
                <div className="mt-8 w-full max-w-2xl text-center">
                    <div className="bg-muted/50 rounded-2xl p-12">
                        <BookOpen className="mx-auto mb-4 text-primary" size={64} />
                        <h3 className="text-2xl font-semibold text-foreground mb-3">Ready to Research</h3>
                        <p className="text-muted-foreground font-sans leading-relaxed">
                            Enter a research topic above to search thousands of peer-reviewed academic papers.
                            Save papers, export citations in multiple formats, and build your research library.
                        </p>
                    </div>
                </div>
            )}
        </main>
    );
}
