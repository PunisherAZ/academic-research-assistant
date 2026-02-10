'use server';

import { revalidatePath } from 'next/cache';

export async function uploadPdf(formData: FormData) {
    console.log("[Server Action] Starting uploadPdf");

    try {
        const file = formData.get('file');
        const paperId = formData.get('paperId') as string;

        console.log(`[Server Action] Params: paperId=${paperId}, file=${file ? 'present' : 'missing'}`);

        if (!file || !paperId) {
            console.error("[Server Action] Missing file or paperId");
            throw new Error('Missing file or paperId');
        }

        const backendUrl = process.env.BACKEND_URL || 'http://academic-backend:8000';
        const uploadUrl = `${backendUrl}/api/upload-pdf`;

        console.log(`[Server Action] Uploading to ${uploadUrl}`);

        const backendFormData = new FormData();
        if (file) backendFormData.append('file', file);
        if (paperId) backendFormData.append('paper_id', paperId);

        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: backendFormData,
        });

        console.log(`[Server Action] Response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Server Action] Backend error: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`Backend failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`[Server Action] Success:`, data);

        revalidatePath('/');
        return { success: true, data };

    } catch (error: any) {
        console.error(`[Server Action] CRITICAL ERROR:`, error);
        // Throwing a simple error message to avoid serialization issues
        throw new Error(error.message || 'An unexpected error occurred during upload');
    }
}
