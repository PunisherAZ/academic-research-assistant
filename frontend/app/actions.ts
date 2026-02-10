'use server';

import { revalidatePath } from 'next/cache';

export async function uploadPdf(formData: FormData) {
    const file = formData.get('file') as File;
    const paperId = formData.get('paperId') as string;

    if (!file || !paperId) {
        throw new Error('Missing file or paperId');
    }

    const backendUrl = process.env.BACKEND_URL || 'http://academic-backend:8000';
    const uploadUrl = `${backendUrl}/api/papers/${paperId}/upload-pdf`;

    console.log(`[Server Action] Uploading PDF to ${uploadUrl}`);

    try {
        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData, // Next.js server actions handle FormData automatically
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Server Action] Upload failed: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`[Server Action] Upload successful:`, data);

        revalidatePath('/'); // Refresh valid paths if needed
        return { success: true, data };

    } catch (error: any) {
        console.error(`[Server Action] Error uploading PDF:`, error);
        throw new Error(error.message || 'Failed to upload PDF');
    }
}
