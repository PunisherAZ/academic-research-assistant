"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

interface SearchFiltersProps {
    onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
    yearMin: number;
    yearMax: number;
    sortBy: "relevance" | "date-desc" | "date-asc";
}

export default function SearchFilters({ onFilterChange }: SearchFiltersProps) {
    const currentYear = new Date().getFullYear();
    const [isOpen, setIsOpen] = useState(false);
    const [yearMin, setYearMin] = useState(1980);
    const [yearMax, setYearMax] = useState(currentYear);
    const [sortBy, setSortBy] = useState<"relevance" | "date-desc" | "date-asc">("relevance");

    const applyFilters = () => {
        onFilterChange({ yearMin, yearMax, sortBy });
    };

    const resetFilters = () => {
        setYearMin(1980);
        setYearMax(currentYear);
        setSortBy("relevance");
        onFilterChange({ yearMin: 1980, yearMax: currentYear, sortBy: "relevance" });
    };

    const activeFilterCount = () => {
        let count = 0;
        if (yearMin !== 1980 || yearMax !== currentYear) count++;
        if (sortBy !== "relevance") count++;
        return count;
    };

    return (
        <div className="w-full">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-muted"
            >
                <SlidersHorizontal size={16} />
                Filters
                {activeFilterCount() > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                        {activeFilterCount()}
                    </span>
                )}
            </button>

            {/* Filter Panel */}
            {isOpen && (
                <div className="mt-4 p-6 bg-card border border-border rounded-xl">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Year Range */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-3">
                                Publication Year
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    min="1900"
                                    max={currentYear}
                                    value={yearMin}
                                    onChange={(e) => setYearMin(parseInt(e.target.value))}
                                    className="w-24 px-3 py-2 rounded-lg border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                                />
                                <span className="text-muted-foreground">to</span>
                                <input
                                    type="number"
                                    min={yearMin}
                                    max={currentYear}
                                    value={yearMax}
                                    onChange={(e) => setYearMax(parseInt(e.target.value))}
                                    className="w-24 px-3 py-2 rounded-lg border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                                />
                            </div>
                        </div>

                        {/* Sort By */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-3">
                                Sort By
                            </label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="w-full px-3 py-2 rounded-lg border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 bg-background"
                            >
                                <option value="relevance">Relevance</option>
                                <option value="date-desc">Newest First</option>
                                <option value="date-asc">Oldest First</option>
                            </select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 mt-6">
                        <button
                            onClick={applyFilters}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                        >
                            Apply Filters
                        </button>
                        <button
                            onClick={resetFilters}
                            className="px-6 py-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
