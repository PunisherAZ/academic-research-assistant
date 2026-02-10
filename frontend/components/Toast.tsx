"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastProps {
    toast: Toast;
    onDismiss: (id: string) => void;
}

const Toast = ({ toast, onDismiss }: ToastProps) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(toast.id);
        }, 4000);

        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    const iconMap = {
        success: CheckCircle,
        error: AlertCircle,
        info: Info,
    };

    const colorMap = {
        success: "bg-green-50 border-green-200 text-green-800",
        error: "bg-red-50 border-red-200 text-red-800",
        info: "bg-blue-50 border-blue-200 text-blue-800",
    };

    const Icon = iconMap[toast.type];

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-slide-in ${colorMap[toast.type]}`}
            role="alert"
        >
            <Icon size={20} className="flex-shrink-0" />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={() => onDismiss(toast.id)}
                className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
