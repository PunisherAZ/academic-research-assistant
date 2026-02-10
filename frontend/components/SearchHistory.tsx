"use client";

import { Clock, X } from "lucide-react";

interface SearchHistoryProps {
    history: string[];
    onSelect: (query: string) => void;
    onRemove: (query: string) => void;
    onClear: () => void;
}

export default function SearchHistory({
    history,
    onSelect,
    onRemove,
    onClear,
}: SearchHistoryProps) {
    if (history.length === 0) return null;

    return (
        <div className="mt-4 p-4 bg-muted/50 rounded-xl border border-border">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={16} />
                    Recent Searches
                </div>
                <button
                    onClick={onClear}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    Clear All
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {history.map((query, index) => (
                    <div
                        key={index}
                        className="group flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-lg hover:border-primary/30 transition-colors"
                    >
                        <button
                            onClick={() => onSelect(query)}
                            className="text-sm text-foreground hover:text-primary transition-colors"
                        >
                            {query}
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(query);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
