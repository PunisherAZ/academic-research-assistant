"use client";

import { useState, useEffect } from "react";
import { Save, X } from "lucide-react";

interface NoteEditorProps {
    paperId: string;
    initialContent: string;
    onSave: (content: string) => void;
    onClose: () => void;
}

export default function NoteEditor({ paperId, initialContent, onSave, onClose }: NoteEditorProps) {
    const [content, setContent] = useState(initialContent);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setContent(initialContent);
        setHasChanges(false);
    }, [paperId, initialContent]);

    const handleSave = () => {
        onSave(content);
        setHasChanges(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        setHasChanges(true);
    };

    const characterCount = content.length;
    const maxChars = 10000;

    return (
        <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    📝 Notes
                    {hasChanges && <span className="text-xs text-yellow-600">(unsaved changes)</span>}
                </h4>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-yellow-100 rounded transition-colors"
                    title="Close note editor"
                >
                    <X size={16} />
                </button>
            </div>

            <textarea
                value={content}
                onChange={handleChange}
                placeholder="Add your notes, thoughts, or key takeaways from this paper..."
                className="w-full h-32 px-3 py-2 rounded-lg border border-yellow-300 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-200 resize-none font-sans text-sm bg-white"
                maxLength={maxChars}
            />

            <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                    {characterCount} / {maxChars} characters
                </span>
                <button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    <Save size={16} />
                    Save Note
                </button>
            </div>
        </div>
    );
}
