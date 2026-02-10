import type { SavedPaper } from "../hooks/useSavedPapers";
import type { Tag } from "../hooks/useTags";
import type { PaperNote } from "../hooks/useNotes";

// Export to BibTeX format
export function exportToBibTeX(papers: SavedPaper[], paperTags?: Map<string, Tag[]>, paperNotes?: Map<string, PaperNote>): string {
    let bibtex = "";

    papers.forEach((paper) => {
        // Generate citation key from first author and year
        const firstAuthor = paper.authors[0] || "unknown";
        const lastName = firstAuthor.split(" ").pop()?.toLowerCase() || "unknown";
        const key = `${lastName}${paper.year}${paper.title.split(" ")[0].toLowerCase()}`;

        bibtex += `@article{${key},\n`;
        bibtex += `  title={${paper.title}},\n`;

        // Authors
        if (paper.authors && paper.authors.length > 0) {
            bibtex += `  author={${paper.authors.join(" and ")}},\n`;
        }

        // Journal info
        if (paper.journal) {
            bibtex += `  journal={${paper.journal}},\n`;
        }
        if (paper.volume) {
            bibtex += `  volume={${paper.volume}},\n`;
        }
        if (paper.issue) {
            bibtex += `  number={${paper.issue}},\n`;
        }
        if (paper.pages) {
            bibtex += `  pages={${paper.pages.replace("-", "--")}},\n`;
        }

        bibtex += `  year={${paper.year}},\n`;

        if (paper.url) {
            bibtex += `  url={${paper.url}},\n`;
        }

        // Add note as annotation if exists
        if (paperNotes) {
            const note = paperNotes.get(paper.id);
            if (note && note.content) {
                bibtex += `  note={${note.content.replace(/\n/g, " ").substring(0, 200)}},\n`;
            }
        }

        bibtex += `}\n\n`;
    });

    return bibtex;
}

// Export to CSV format
export function exportToCSV(papers: SavedPaper[], paperTags?: Map<string, Tag[]>, paperNotes?: Map<string, PaperNote>): string {
    const headers = ["Title", "Authors", "Year", "Journal", "Volume", "Issue", "URL", "Tags", "Note"];
    let csv = headers.join(",") + "\n";

    papers.forEach((paper) => {
        const row = [
            escapeCSV(paper.title),
            escapeCSV(paper.authors.join("; ")),
            paper.year.toString(),
            escapeCSV(paper.journal || ""),
            escapeCSV(paper.volume || ""),
            escapeCSV(paper.issue || ""),
            escapeCSV(paper.url),
            paperTags ? escapeCSV(paperTags.get(paper.id)?.map(t => t.name).join("; ") || "") : "",
            paperNotes ? escapeCSV(paperNotes.get(paper.id)?.content || "") : "",
        ];
        csv += row.join(",") + "\n";
    });

    return csv;
}

// Export to JSON format
export function exportToJSON(papers: SavedPaper[], paperTags?: Map<string, Tag[]>, paperNotes?: Map<string, PaperNote>): string {
    const exportData = papers.map((paper) => ({
        id: paper.id,
        title: paper.title,
        authors: paper.authors,
        year: paper.year,
        journal: paper.journal,
        volume: paper.volume,
        issue: paper.issue,
        pages: paper.pages,
        url: paper.url,
        abstract: paper.abstract,
        tags: paperTags?.get(paper.id)?.map(t => t.name) || [],
        note: paperNotes?.get(paper.id)?.content || "",
        createdAt: paper.created_at,
    }));

    return JSON.stringify(exportData, null, 2);
}

// Export citation list in specified format
export function exportCitationList(papers: SavedPaper[], format: "apa" | "mla" | "chicago"): string {
    // Note: This would ideally call the backend citation generators
    // For now, we'll create a simplified version
    let citations = `Citations (${format.toUpperCase()})\n`;
    citations += "=".repeat(50) + "\n\n";

    papers.forEach((paper, index) => {
        citations += `${index + 1}. `;

        if (format === "apa") {
            // Simplified APA
            const authors = paper.authors.length > 0 ? paper.authors[0].split(" ").pop() : "Unknown";
            citations += `${authors} (${paper.year}). ${paper.title}. `;
            if (paper.journal) {
                citations += `${paper.journal}`;
                if (paper.volume) citations += `, ${paper.volume}`;
                if (paper.issue) citations += `(${paper.issue})`;
                citations += ".";
            }
        } else if (format === "mla") {
            // Simplified MLA
            citations += `${paper.authors[0] || "Unknown"}. "${paper.title}." `;
            if (paper.journal) {
                citations += `${paper.journal}`;
                if (paper.volume) citations += `, vol. ${paper.volume}`;
                if (paper.issue) citations += `, no. ${paper.issue}`;
                citations += `, ${paper.year}.`;
            }
        } else {
            // Chicago
            citations += `${paper.authors[0] || "Unknown"}. "${paper.title}." `;
            if (paper.journal) {
                citations += `${paper.journal} ${paper.volume || ""}`;
                if (paper.issue) citations += `, no. ${paper.issue}`;
                citations += ` (${paper.year}).`;
            }
        }

        citations += "\n\n";
    });

    return citations;
}

// Helper function to escape CSV values
function escapeCSV(value: string): string {
    if (!value) return '""';
    const needsEscaping = value.includes('"') || value.includes(',') || value.includes('\n');
    if (needsEscaping) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return `"${value}"`;
}

// Trigger download in browser
export function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
