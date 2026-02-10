"use client";

import { useState, useCallback } from "react";
import Toast, { Toast as ToastType, ToastType as ToastTypeEnum } from "./Toast";

export default function ToastContainer() {
    const [toasts, setToasts] = useState<ToastType[]>([]);

    const addToast = useCallback((message: string, type: ToastTypeEnum = "info") => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <>
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
                ))}
            </div>
        </>
    );
}

// Export the hook for use in other components
export const useToast = () => {
    // This will be enhanced in the next step
    return {
        showToast: (message: string, type: ToastTypeEnum = "info") => {
            // Placeholder - will be implemented via context
            console.log(`Toast: ${type} - ${message}`);
        },
    };
};
