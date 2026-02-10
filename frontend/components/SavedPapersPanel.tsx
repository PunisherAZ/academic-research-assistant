"use client";

import { useState } from "react";
import { X, BookMarked, Quote, Trash2, Tag as TagIcon, Plus, StickyNote, Download, ChevronDown, FileText, Upload } from "lucide-react";
import type { SavedPaper } from "../hooks/useSavedPapers";
import type { Tag } from "../hooks/useTags";
import type { PaperNote } from "../hooks/useNotes";
import NoteEditor from "./NoteEditor";
import PDFUpload from "./PDFUpload";
import { exportToBibTeX, exportToCSV, exportToJSON, downloadFile } from "../utils/exportFormats";

interface SavedPapersPanelProps {
    savedPapers: SavedPaper[];
    onClose: () => void;
    onUnsave: (paperId: string) => void;
    onClearAll: () => void;
    onCite: (paper: SavedPaper, format: string) => void;
    tags: Tag[];
    onCreateTag: (name: string, color?: string) => Promise<Tag | void>;
    onDeleteTag: (tagId: string) => void;
    onAddTagToPaper: (paperId: string, tagId: string) => void;
    onRemoveTagFromPaper: (paperId: string, tagId: string) => void;
    getTagsForPaper: (paper: any) => Tag[];
    getPapersWithTag: (tagId: string) => Promise<string[]>;
    getNote: (paperId: string) => Promise<PaperNote | null>;
    saveNote: (paperId: string, content: string) => void;
    hasNote: (paperId: string) => boolean;
    presetColors: string[];
    refreshPapers: () => void;
}

export default function SavedPapersPanel({
    savedPapers,
    onClose,
    onUnsave,
    onClearAll,
    onCite,
    tags,
    onCreateTag,
    onDeleteTag,
    onAddTagToPaper,
    onRemoveTagFromPaper,
    getTagsForPaper,
    getPapersWithTag,
    getNote,
    saveNote,
    hasNote,
    presetColors,
    refreshPapers,
}: SavedPapersPanelProps) {
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [showNewTagInput, setShowNewTagInput] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [openedNote, setOpenedNote] = useState<string | null>(null);
    const [noteContent, setNoteContent] = useState<string>("");
    const [openTagDropdown, setOpenTagDropdown] = useState<string | null>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [uploadingPaperId, setUploadingPaperId] = useState<string | null>(null);

    const formatAuthors = (authors: string[]) => {
        if (!authors || authors.length === 0) return "Unknown Authors";
        if (authors.length === 1) return authors[0];
        if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
        if (authors.length === 3) return `${authors[0]}, ${authors[1]}, & ${authors[2]}`;
        return `${authors[0]}, ${authors[1]}, ${authors[2]}, et al.`;
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        await onCreateTag(newTagName);
        setNewTagName("");
        setShowNewTagInput(false);
    };

    // Note: This filtering is now client-side on the fetched papers
    // Ideally we would filter in the DB, but for now this works with the list we have
    const filteredPapers = selectedTag
        ? savedPapers.filter((p) => {
            const pTags = getTagsForPaper(p);
            return pTags.some(t => t.id === selectedTag);
        })
        : savedPapers;

    const handleExport = (format: "bibtex" | "csv" | "json") => {
        const paperTagsMap = new Map();
        const paperNotesMap = new Map();

        // We need to fetch all notes potentially, currently we only fetch on demand
        // For export, we might strictly need to fetch them all or just export what we have loaded
        // Tier 4 limitation: client-side export might miss notes not yet loaded
        // For now, we'll export what is available in the cache (if we cache them)
        // or we could trigger a bulk fetch. Let's assume for now we export paper metadata mostly.

        savedPapers.forEach((paper) => {
            paperTagsMap.set(paper.id, getTagsForPaper(paper));
            // Notes handling would require async fetching, skipping for now in client export
        });

        const date = new Date().toISOString().split("T")[0];
        let content = "";
        let filename = "";
        let mimeType = "";

        if (format === "bibtex") {
            content = exportToBibTeX(savedPapers, paperTagsMap, paperNotesMap);
            filename = `research-library-${date}.bib`;
            mimeType = "application/x-bibtex";
        } else if (format === "csv") {
            content = exportToCSV(savedPapers, paperTagsMap, paperNotesMap);
            filename = `research-library-${date}.csv`;
            mimeType = "text/csv";
        } else if (format === "json") {
            content = exportToJSON(savedPapers, paperTagsMap, paperNotesMap);
            filename = `research-library-${date}.json`;
            mimeType = "application/json";
        }

        downloadFile(content, filename, mimeType);
        setShowExportMenu(false);
    };

    const handleViewPDF = (paperId: string) => {
        const API_URL = "";
        window.open(`${API_URL}/api/pdfs/${paperId}`, '_blank');
    };

    const handleEditNote = async (paperId: string) => {
        if (openedNote === paperId) {
            setOpenedNote(null);
            return;
        }

        // Fetch note content before opening
        const note = await getNote(paperId);
        setNoteContent(note?.content || "");
        setOpenedNote(paperId);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <BookMarked className="text-primary" size={24} />
                        <h2 className="text-2xl font-bold text-foreground">
                            Saved Papers ({filteredPapers.length})
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Export Dropdown */}
                        {savedPapers.length > 0 && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    className="text-sm flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-foreground"
                                >
                                    <Download size={16} />
                                    Export
                                    <ChevronDown size={14} />
                                </button>
                                {showExportMenu && (
                                    <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-lg shadow-lg py-1 z-10 min-w-[150px]">
                                        <button
                                            onClick={() => handleExport("bibtex")}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                                        >
                                            BibTeX (.bib)
                                        </button>
                                        <button
                                            onClick={() => handleExport("csv")}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                                        >
                                            CSV
                                        </button>
                                        <button
                                            onClick={() => handleExport("json")}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                                        >
                                            JSON
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        {savedPapers.length > 0 && (
                            <button
                                onClick={onClearAll}
                                className="text-sm text-destructive hover:text-destructive/80 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-destructive/10 transition-colors"
                            >
                                <Trash2 size={16} />
                                Clear All
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Tag Filter Bar */}
                {(tags.length > 0 || showNewTagInput) && (
                    <div className="px-6 py-4 border-b border-border">
                        <div className="flex items-center gap-2 flex-wrap">
                            <TagIcon size={16} className="text-muted-foreground" />
                            <button
                                onClick={() => setSelectedTag(null)}
                                className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedTag === null
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground hover:bg-muted/80"
                                    }`}
                            >
                                All
                            </button>
                            {tags.map((tag) => (
                                <button
                                    key={tag.id}
                                    onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                                    className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedTag === tag.id ? "ring-2 ring-offset-2" : ""
                                        }`}
                                    style={{
                                        backgroundColor: selectedTag === tag.id ? tag.color : `${tag.color}40`,
                                        color: selectedTag === tag.id ? "#fff" : tag.color,
                                    }}
                                >
                                    {tag.name}
                                </button>
                            ))}
                            {showNewTagInput ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newTagName}
                                        onChange={(e) => setNewTagName(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                                        placeholder="Tag name..."
                                        className="px-3 py-1 text-sm rounded-lg border border-input focus:border-primary focus:outline-none"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleCreateTag}
                                        className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowNewTagInput(false);
                                            setNewTagName("");
                                        }}
                                        className="px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowNewTagInput(true)}
                                    className="px-3 py-1 rounded-full text-sm bg-muted text-foreground hover:bg-muted/80 flex items-center gap-1"
                                >
                                    <Plus size={14} /> New Tag
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {filteredPapers.length === 0 ? (
                        <div className="text-center py-16">
                            <BookMarked className="mx-auto mb-4 text-muted-foreground" size={64} />
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                {selectedTag ? "No Papers with This Tag" : "No Saved Papers Yet"}
                            </h3>
                            <p className="text-muted-foreground">
                                {selectedTag
                                    ? "Try selecting a different tag or clear the filter."
                                    : "Click the bookmark icon on any paper to save it here."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredPapers.map((paper) => {
                                const paperTags = getTagsForPaper(paper);
                                const isNoteOpen = openedNote === paper.id;
                                const isUploading = uploadingPaperId === paper.id;

                                return (
                                    <div
                                        key={paper.id}
                                        className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-secondary mb-1">
                                                    {paper.title}
                                                    <span className="ml-2 text-sm font-medium text-muted-foreground bg-accent px-2 py-1 rounded-full">
                                                        {paper.year}
                                                    </span>
                                                </h3>
                                                <p className="text-sm text-foreground/60 mb-1 font-sans">
                                                    {formatAuthors(paper.authors)}
                                                </p>
                                                {paper.journal && (
                                                    <p className="text-sm text-foreground/50 mb-2 font-sans italic">
                                                        {paper.journal}
                                                    </p>
                                                )}

                                                {/* Tags */}
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {paperTags.slice(0, 3).map((tag) => (
                                                        <span
                                                            key={tag.id}
                                                            className="px-2 py-1 rounded-full text-xs text-white"
                                                            style={{ backgroundColor: tag.color }}
                                                        >
                                                            {tag.name}
                                                        </span>
                                                    ))}
                                                    {paperTags.length > 3 && (
                                                        <span className="px-2 py-1 rounded-full text-xs bg-muted text-foreground">
                                                            +{paperTags.length - 3} more
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex flex-wrap gap-2">
                                                    {/* Tag Dropdown */}
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setOpenTagDropdown(openTagDropdown === paper.id ? null : paper.id)}
                                                            className="text-xs flex items-center gap-1 text-foreground hover:text-primary font-sans px-3 py-1 rounded-lg hover:bg-muted transition-colors"
                                                        >
                                                            <TagIcon size={14} /> Tag
                                                        </button>
                                                        {openTagDropdown === paper.id && tags.length > 0 && (
                                                            <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg py-1 z-10 min-w-[150px] max-h-[200px] overflow-y-auto">
                                                                {tags.map((tag) => {
                                                                    const isTagged = paperTags.some((t) => t.id === tag.id);
                                                                    return (
                                                                        <button
                                                                            key={tag.id}
                                                                            onClick={() => {
                                                                                if (isTagged) {
                                                                                    onRemoveTagFromPaper(paper.id, tag.id);
                                                                                } else {
                                                                                    onAddTagToPaper(paper.id, tag.id);
                                                                                }
                                                                            }}
                                                                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                                                                        >
                                                                            <span
                                                                                className="w-3 h-3 rounded-full"
                                                                                style={{ backgroundColor: tag.color }}
                                                                            />
                                                                            {tag.name}
                                                                            {isTagged && <span className="ml-auto text-primary">✓</span>}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Note Button */}
                                                    <button
                                                        onClick={() => handleEditNote(paper.id)}
                                                        className={`text-xs flex items-center gap-1 font-sans px-3 py-1 rounded-lg transition-colors ${hasNote(paper.id)
                                                            ? "text-yellow-600 bg-yellow-50 hover:bg-yellow-100"
                                                            : "text-foreground hover:text-primary hover:bg-muted"
                                                            }`}
                                                    >
                                                        <StickyNote size={14} /> {hasNote(paper.id) ? "Edit Note" : "Add Note"}
                                                    </button>

                                                    {/* PDF Button */}
                                                    {paper.pdf_path ? (
                                                        <button
                                                            onClick={() => handleViewPDF(paper.id)}
                                                            className="text-xs flex items-center gap-1 text-red-600 bg-red-50 hover:bg-red-100 font-sans px-3 py-1 rounded-lg transition-colors"
                                                        >
                                                            <FileText size={14} /> View PDF
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => setUploadingPaperId(paper.id)}
                                                            className="text-xs flex items-center gap-1 text-foreground hover:text-primary font-sans px-3 py-1 rounded-lg hover:bg-muted transition-colors"
                                                        >
                                                            <Upload size={14} /> Upload PDF
                                                        </button>
                                                    )}

                                                    {/* Citation Buttons */}
                                                    <button
                                                        onClick={() => onCite(paper, "apa")}
                                                        className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 font-sans px-3 py-1 rounded-lg hover:bg-primary/5 transition-colors"
                                                    >
                                                        <Quote size={14} /> APA
                                                    </button>
                                                    <a
                                                        href={paper.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-muted-foreground hover:text-primary transition-colors font-sans px-3 py-1 rounded-lg hover:bg-muted"
                                                    >
                                                        Link ↗
                                                    </a>
                                                </div>

                                                {/* Note Editor */}
                                                {isNoteOpen && (
                                                    <NoteEditor
                                                        paperId={paper.id}
                                                        initialContent={noteContent}
                                                        onSave={(content) => {
                                                            saveNote(paper.id, content);
                                                        }}
                                                        onClose={() => setOpenedNote(null)}
                                                    />
                                                )}

                                                {/* PDF Upload */}
                                                {isUploading && (
                                                    <PDFUpload
                                                        paperId={paper.id}
                                                        onUploadComplete={() => {
                                                            refreshPapers();
                                                            setUploadingPaperId(null);
                                                        }}
                                                        onClose={() => setUploadingPaperId(null)}
                                                    />
                                                )}
                                            </div>

                                            {/* Remove Button */}
                                            <button
                                                onClick={() => onUnsave(paper.id)}
                                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                title="Remove from saved"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
