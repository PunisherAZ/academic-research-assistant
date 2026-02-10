"use client";

import { useState } from "react";
import { FileUp, X, CheckCircle2 } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface PDFUploadProps {
    paperId: string;
    onUploadComplete?: () => void;
    onClose?: () => void;
}

export default function PDFUpload({ paperId, onUploadComplete, onClose }: PDFUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = async (file: File) => {
        if (!file.type.includes('pdf')) {
            setError('Please upload a PDF file');
            return;
        }

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            await axios.post(
                `${API_URL}/api/papers/${paperId}/upload-pdf`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );

            setUploadSuccess(true);
            setTimeout(() => {
                onUploadComplete?.();
                onClose?.();
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        if (file) handleUpload(file);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Upload PDF</h3>
                {onClose && (
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                )}
            </div>

            {uploadSuccess ? (
                <div className="text-center py-8">
                    <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500" />
                    <p className="text-lg font-medium text-green-600">Upload successful!</p>
                </div>
            ) : (
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                >
                    <FileUp size={48} className="mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">Drop PDF here</p>
                    <p className="text-sm text-muted-foreground mb-4">or click to browse</p>

                    <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileInput}
                        className="hidden"
                        id={`pdf-upload-${paperId}`}
                        disabled={uploading}
                    />

                    <label
                        htmlFor={`pdf-upload-${paperId}`}
                        className={`px-6 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer 
                            hover:bg-primary/90 transition inline-block ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {uploading ? 'Uploading...' : 'Choose File'}
                    </label>

                    {error && (
                        <p className="mt-4 text-sm text-red-500">{error}</p>
                    )}
                </div>
            )}
        </div>
    );
}
